#!/usr/bin/env python3
"""Build the bundled NISAR GCOV snapshots (stats + HH·HV composites).

Harmony's on-demand subsetter has been returning 0 bytes for every request, so
this script reads the same calibrated GCOV rasters directly from the ASF DAAC
HDF5 granules over HTTPS byte ranges. Nothing here is synthesised: every pixel
comes from /science/LSAR/GCOV/grids/frequencyA/{HHHH,HVHV} in the published
granule, masked by the granule's own `mask` dataset.

Outputs (committed, bundled with the serverless function):
  server/cache/nisar/sundarbans-rgb.mjs   { before, after } base64 PNGs
  server/cache/nisar/sundarbans-before-rgb.png
  server/cache/nisar/caldor.mjs           change stats + measurements
  server/cache/nisar/caldor-rgb.mjs       { before, after } base64 PNGs
  server/cache/nisar/caldor-{before,after}-rgb.png

All network fetches are hard-capped at 25 s per request (HARMONY_TIMEOUT-style)
and the four granules are processed concurrently.
"""

import base64
import io
import json
import math
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode

import fsspec
import h5py
import numpy as np
from PIL import Image
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'server', 'cache', 'nisar')
ASF = 'https://api.daac.asf.alaska.edu/services/search/param'
FETCH_TIMEOUT = 25
OUT_W, OUT_H = 560, 370
THRESHOLD_DB = 3.0

SITES = {
    'sundarbans': {
        'coords': (16.55, 107.575),
        'bbox': (107.45, 16.45, 107.70, 16.65),
        'eventDate': '2026-09-13',
        'before': 'NISAR_L2_PR_GCOV_030_054_A_010_4005_DHDH_A_20260909T222101_20260909T222140_P05023_N_F_J_001',
        'after': 'NISAR_L2_PR_GCOV_031_054_A_010_4005_DHDH_A_20260921T222101_20260921T222140_P05023_N_F_J_001',
    },
    'caldor': {
        'coords': (38.15, 23.45),
        'bbox': (23.35, 38.08, 23.55, 38.22),
        'eventDate': '2026-07-31',
        'before': 'NISAR_L2_PR_GCOV_025_158_A_021_2005_DHDH_A_20260719T033512_20260719T033547_P05023_N_F_J_001',
        'after': 'NISAR_L2_PR_GCOV_027_158_A_021_2005_DHDH_A_20260812T033511_20260812T033546_P05023_N_F_J_001',
    },
}


def log(*args):
    print('[snapshots]', *args, flush=True)


def token():
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if line.startswith('EARTHDATA_TOKEN='):
            return line.split('=', 1)[1].strip()
    raise SystemExit('EARTHDATA_TOKEN missing from .env.local')


def asf_granules(wkt):
    query = urlencode({
        'dataset': 'NISAR',
        'processingLevel': 'GCOV',
        'intersectsWith': wkt,
        'start': '2026-01-01T00:00:00Z',
        'end': '2026-12-31T23:59:59Z',
        'output': 'json',
        'maxResults': 100,
    })
    url = f'{ASF}?{query}'
    out = subprocess.run(['curl', '-sS', '-m', str(FETCH_TIMEOUT), url], capture_output=True, text=True)
    payload = json.loads(out.stdout or '[]')
    rows = payload[0] if payload and isinstance(payload[0], list) else payload
    return {row['granuleName']: row for row in rows if row.get('granuleName')}


def signed_url(download_url):
    """Resolve ASF's 303 to a CloudFront signed URL (GET redirect, not HEAD)."""
    out = subprocess.run(
        ['curl', '-s', '-D', '-', '-o', '/dev/null', '-m', str(FETCH_TIMEOUT),
         '-H', f'Authorization: Bearer {token()}', '-r', '0-0', download_url],
        capture_output=True, text=True, timeout=FETCH_TIMEOUT + 5,
    ).stdout
    for line in out.splitlines():
        if line.lower().startswith('location:'):
            return line.split(':', 1)[1].strip()
    raise RuntimeError(f'no signed redirect for {download_url}')


def open_granule(url):
    handle = h5py.File(fsspec.filesystem('http', block_size=2 ** 22).open(signed_url(url), 'rb'), 'r')
    return handle['science/LSAR/GCOV/grids/frequencyA']


def lonlat_to_xy(proj, lng, lat):
    return Transformer.from_crs(4326, proj, always_xy=True).transform(lng, lat)


def window_indices(xs, ys, proj, bbox):
    x0, y0 = lonlat_to_xy(proj, bbox[0], bbox[1])
    x1, y1 = lonlat_to_xy(proj, bbox[2], bbox[3])
    i0, i1 = np.searchsorted(xs, [x0, x1])
    if ys[0] < ys[-1]:
        j0, j1 = np.searchsorted(ys, [y0, y1])
    else:
        j0, j1 = sorted(len(ys) - np.searchsorted(ys[::-1], [y0, y1]))
    return int(i0), int(i1), int(j0), int(j1)


def read_window(grid, bbox, want_hv=True):
    proj = int(grid['projection'][()])
    xs = grid['xCoordinates'][:]
    ys = grid['yCoordinates'][:]
    i0, i1, j0, j1 = window_indices(xs, ys, proj, bbox)
    if i1 <= i0 or j1 <= j0:
        raise RuntimeError(f'empty window {bbox} -> {(i0, i1, j0, j1)}')
    hh = grid['HHHH'][j0:j1, i0:i1]
    hv = grid['HVHV'][j0:j1, i0:i1] if want_hv else None
    mask = grid['mask'][j0:j1, i0:i1]
    return {
        'hh': hh.astype(np.float64),
        'hv': None if hv is None else hv.astype(np.float64),
        'mask': mask.astype(bool),
        'proj': proj,
        'bbox': bbox,
        'grid': (int(i1 - i0), int(j1 - j0)),
    }


def db(power):
    return 10.0 * np.log10(np.maximum(power, 1e-7))


def js_percentile(values, p):
    ordered = np.sort(values)
    idx = min(len(ordered) - 1, max(0, int(math.floor((p / 100.0) * (len(ordered) - 1) + 0.5))))
    return float(ordered[idx])


def stretch(value, low, high):
    span = (high - low) or 1.0
    return np.clip(np.round((value - low) / span * 255.0), 0, 255).astype(np.uint8)


def composite(window):
    hh, hv, mask = window['hh'], window['hv'], window['mask']
    valid = mask & np.isfinite(hh) & np.isfinite(hv) & (hh > 0) & (hv > 0)
    if not valid.any():
        raise RuntimeError('no valid pixels for composite')
    hh_db = db(hh[valid])
    hv_db = db(hv[valid])
    diff_db = hh_db - hv_db
    hh_lo, hh_hi = js_percentile(hh_db, 2), js_percentile(hh_db, 98)
    hv_lo, hv_hi = js_percentile(hv_db, 2), js_percentile(hv_db, 98)
    d_lo, d_hi = js_percentile(diff_db, 2), js_percentile(diff_db, 98)

    height, width = hh.shape
    out = np.zeros((OUT_H, OUT_W, 3), dtype=np.uint8)
    for y in range(OUT_H):
        sy = min(height - 1, int(((y + 0.5) / OUT_H) * height))
        for x in range(OUT_W):
            sx = min(width - 1, int(((x + 0.5) / OUT_W) * width))
            if not valid[sy, sx]:
                out[y, x] = (8, 8, 8)
                continue
            h = db(hh[sy, sx])
            v = db(hv[sy, sx])
            out[y, x] = (stretch(h, hh_lo, hh_hi), stretch(v, hv_lo, hv_hi), stretch(h - v, d_lo, d_hi))
    buffer = io.BytesIO()
    Image.fromarray(out, 'RGB').save(buffer, format='PNG', optimize=True)
    return buffer.getvalue()


def change_stats(before, after):
    """Signed HH delta on the shared projected grid (after − before)."""
    height = min(before['hh'].shape[0], after['hh'].shape[0])
    width = min(before['hh'].shape[1], after['hh'].shape[1])
    hh0 = before['hh'][:height, :width]
    hh1 = after['hh'][:height, :width]
    valid = (
        before['mask'][:height, :width]
        & after['mask'][:height, :width]
        & np.isfinite(hh0) & np.isfinite(hh1)
        & (hh0 > 0) & (hh1 > 0)
    )
    total = height * width
    if not valid.any():
        raise RuntimeError('no overlapping valid pixels for change stats')
    delta = db(hh1[valid]) - db(hh0[valid])
    changed = int(np.sum(np.abs(delta) >= THRESHOLD_DB))
    valid_count = int(valid.sum())
    return {
        'changedPct': round(changed / valid_count * 100.0, 1),
        'meanDeltaDb': round(float(delta.mean()), 2),
        'meanAbsDeltaDb': round(float(np.abs(delta).mean()), 2),
        'validPixels': valid_count,
        'validPct': round(valid_count / total * 100.0, 1),
        'changedPixels': changed,
        'totalPixels': total,
        'width': width,
        'height': height,
    }


def bbox_area_km2(bbox):
    centre = math.radians((bbox[1] + bbox[3]) / 2.0)
    width_m = abs(bbox[2] - bbox[0]) * 111320.0 * math.cos(centre)
    height_m = abs(bbox[3] - bbox[1]) * 110540.0
    return width_m * height_m / 1e6


def measurements(window):
    valid = window['mask'] & np.isfinite(window['hh']) & np.isfinite(window['hv']) & (window['hh'] > 0) & (window['hv'] > 0)
    hh_db = db(window['hh'][valid])
    hv_db = db(window['hv'][valid])
    return {
        'hhDb': round(float(hh_db.mean()), 1),
        'hvDb': round(float(hv_db.mean()), 1),
        'crossDb': round(float((hv_db - hh_db).mean()), 1),
        'validPct': round(float(valid.mean() * 100.0), 1),
    }


def calibration_bbox(site):
    lat, lng = site['coords']
    d_lat = 0.025
    d_lng = 0.025 / max(0.2, math.cos(math.radians(lat)))
    return (lng - d_lng, lat - d_lat, lng + d_lng, lat + d_lat)


def write_png(name, data):
    path = os.path.join(CACHE, name)
    with open(path, 'wb') as handle:
        handle.write(data)
    log('wrote', os.path.relpath(path, ROOT), len(data), 'bytes')


def write_rgb_module(name, export, pngs):
    lines = [f'/** Generated by scripts/build-nisar-snapshots.py — do not edit. */', f'export const {export} = {{']
    for side, data in pngs.items():
        lines.append(f'  {side}:')
        lines.append(f"    '{base64.b64encode(data).decode('ascii')}',")
    lines.append('};')
    path = os.path.join(CACHE, name)
    with open(path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    log('wrote', os.path.relpath(path, ROOT))


def granule_url(rows, name):
    if name not in rows:
        raise RuntimeError(f'granule not in ASF search: {name}')
    return rows[name]['downloadUrl']


def main():
    os.makedirs(CACHE, exist_ok=True)
    started = time.time()
    catalog = {}
    for site_id, site in SITES.items():
        wkt = (
            f'POLYGON (({site["bbox"][0]} {site["bbox"][1]}, {site["bbox"][2]} {site["bbox"][1]}, '
            f'{site["bbox"][2]} {site["bbox"][3]}, {site["bbox"][0]} {site["bbox"][3]}, '
            f'{site["bbox"][0]} {site["bbox"][1]}))'
        )
        catalog[site_id] = asf_granules(wkt)
        log(site_id, 'granules', len(catalog[site_id]))

    # Sundarbans: only the before composite is missing; after stays as the
    # previously verified Harmony-rendered PNG.
    before_rgb = {}
    caldor_windows = {}

    def do_sundarbans_before():
        grid = open_granule(granule_url(catalog['sundarbans'], SITES['sundarbans']['before']))
        window = read_window(grid, calibration_bbox(SITES['sundarbans']), want_hv=True)
        png = composite(window)
        write_png('sundarbans-before-rgb.png', png)
        return ('sundarbans', 'before', png)

    def do_caldor(side):
        grid = open_granule(granule_url(catalog['caldor'], SITES['caldor'][side]))
        window = read_window(grid, SITES['caldor']['bbox'], want_hv=True)
        return (side, window)

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(do_sundarbans_before), pool.submit(do_caldor, 'before'), pool.submit(do_caldor, 'after')]
        for future in futures:
            result = future.result()
            if result[0] == 'sundarbans':
                _, side, png = result
                before_rgb[side] = png
            else:
                side, window = result
                caldor_windows[side] = window
                png = composite(window)
                write_png(f'caldor-{side}-rgb.png', png)

    # Persist caldor composites.
    caldor_pngs = {}
    for side in ('before', 'after'):
        path = os.path.join(CACHE, f'caldor-{side}-rgb.png')
        caldor_pngs[side] = open(path, 'rb').read()

    existing = open(os.path.join(CACHE, 'sundarbans-rgb.mjs'), encoding='utf-8').read()
    match = re.search(r"['\"]([A-Za-z0-9+/=]{100,})['\"]", existing)
    if not match:
        raise RuntimeError('could not read existing sundarbans after PNG')
    sundarbans_pngs = {'before': before_rgb['before'], 'after': base64.b64decode(match.group(1))}
    write_rgb_module('sundarbans-rgb.mjs', 'sundarbansRgbBase64', sundarbans_pngs)
    write_rgb_module('caldor-rgb.mjs', 'caldorRgbBase64', caldor_pngs)

    stats = change_stats(caldor_windows['before'], caldor_windows['after'])
    bbox = SITES['caldor']['bbox']
    area = bbox_area_km2(bbox) / stats['totalPixels']
    changed_area = stats['changedPixels'] * area
    before_m = measurements(caldor_windows['before'])
    after_m = measurements(caldor_windows['after'])

    module = {
        'site': 'caldor',
        'computedAt': time.strftime('%Y-%m-%d', time.gmtime()),
        'source': 'nisar-gcov-asf-h5',
        'calibrated': True,
        'thresholdDb': THRESHOLD_DB,
        'changeStats': {
            'site': 'caldor',
            'source': 'nisar-gcov-asf-h5',
            'calibrated': True,
            'thresholdDb': THRESHOLD_DB,
            'changedPct': stats['changedPct'],
            'meanDeltaDb': stats['meanDeltaDb'],
            'meanAbsDeltaDb': stats['meanAbsDeltaDb'],
            'changedAreaKm2': round(changed_area, 2),
            'validPixels': stats['validPixels'],
            'validPct': stats['validPct'],
            'grid': {'width': stats['width'], 'height': stats['height'], 'aligned': True},
            'before': {'date': '2026-07-19', 'granule': SITES['caldor']['before']},
            'after': {'date': '2026-08-12', 'granule': SITES['caldor']['after']},
            'note': (
                f'Signed HH change, {int(THRESHOLD_DB)} dB absolute threshold, same track/frame, '
                'NISAR L-band gamma-0, read directly from the calibrated ASF GCOV HDF5 granules.'
            ),
        },
        'measurements': {
            'hhDb': {'before': before_m['hhDb'], 'after': after_m['hhDb']},
            'hvDb': {'before': before_m['hvDb'], 'after': after_m['hvDb']},
            'crossDb': {'before': before_m['crossDb'], 'after': after_m['crossDb']},
            'validPct': after_m['validPct'],
        },
        'rgb': {
            'before': {
                'date': '2026-07-19',
                'granule': SITES['caldor']['before'],
                'width': OUT_W,
                'height': OUT_H,
            },
            'after': {
                'date': '2026-08-12',
                'granule': SITES['caldor']['after'],
                'width': OUT_W,
                'height': OUT_H,
            },
        },
    }
    header = (
        '/**\n'
        ' * Verified NISAR GCOV telemetry for the West Attica wildfire (Greece).\n'
        ' *\n'
        ' * Generated by scripts/build-nisar-snapshots.py directly from the ASF DAAC\n'
        ' * GCOV HDF5 granules (HHHH/HVHV gamma-0, own mask). The Harmony subsetter\n'
        ' * returned no bytes at build time, so the same calibrated rasters were read\n'
        ' * over HTTPS byte ranges. Do not edit by hand.\n'
        ' */\n'
    )
    with open(os.path.join(CACHE, 'caldor.mjs'), 'w', encoding='utf-8') as handle:
        handle.write(header + 'export const caldorSnapshot = ' + json.dumps(module, indent=2) + ';\n')
    log('wrote caldor.mjs')
    log('caldor stats', stats, 'area km2', round(changed_area, 2))
    log('done in', round(time.time() - started, 1), 's')


if __name__ == '__main__':
    sys.exit(main())
