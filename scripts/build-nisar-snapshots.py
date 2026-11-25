#!/usr/bin/env python3
"""Build the bundled NISAR GCOV snapshots (stats + HH·HV composites).

Harmony's on-demand subsetter has been returning 0 bytes for every request, so
this script reads the same calibrated GCOV rasters directly from the ASF DAAC
HDF5 granules over HTTPS byte ranges. Nothing here is synthesised: every pixel
comes from /science/LSAR/GCOV/grids/frequencyA/{HHHH,HVHV} in the published
granule, masked by the granule's own `mask` dataset.

Outputs (committed, bundled with the serverless function):
  server/cache/nisar/sundarbans-rgb.mjs   { before, after } base64 PNGs
  server/cache/nisar/sundarbans-{before,after}-rgb.png
  server/cache/nisar/bigsur.mjs           change stats + measurements
  server/cache/nisar/bigsur-rgb.mjs       { before, after } base64 PNGs
  server/cache/nisar/bigsur-{before,after}-rgb.png

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
OUT_W, OUT_H = 900, 600
THRESHOLD_DB = 2.0
WATER_MASK_DB = -10.0
CHANGE_FLOOR_DB = 1.5
SPECKLE_WINDOW = 3

SITES = {
    'sundarbans': {
        'kind': 'wetland',
        'label': 'Central Vietnam flood',
        'coords': (16.55, 107.575),
        'bbox': (107.45, 16.45, 107.70, 16.65),
        'window': 'calibration',
        'eventDate': '2026-09-13',
        'before': 'NISAR_L2_PR_GCOV_030_054_A_010_4005_DHDH_A_20260909T222101_20260909T222140_P05023_N_F_J_001',
        'after': 'NISAR_L2_PR_GCOV_031_054_A_010_4005_DHDH_A_20260921T222101_20260921T222140_P05023_N_F_J_001',
    },
    'bigsur': {
        # Timber + Plaskett fire scar on the Santa Lucia Range, Big Sur.
        # Track 42 descending, frame 070: 12-day same-track pair ending on the
        # event pass (2026-08-28) so the cards, change map and recovery agree.
        'kind': 'forest',
        'label': 'Big Sur megafire',
        'coords': (36.02, -121.52),
        'bbox': (-121.58, 35.97, -121.46, 36.07),
        'window': 'bbox',
        'eventDate': '2026-08-25',
        'before': 'NISAR_L2_PR_GCOV_028_042_D_070_4005_DHDH_A_20260816T025639_20260816T025713_P05023_N_F_J_001',
        'after': 'NISAR_L2_PR_GCOV_029_042_D_070_4005_DHDH_A_20260828T025638_20260828T025713_P05023_N_F_J_001',
    },
    'greece': {
        # Attica/Viotia megafire (Psatha / Porto Germeno, W of Athens, Gulf of
        # Corinth). Track 158 ascending, frame 021: the only swath that truly
        # covers the burn scar, same-track pre/post pair bracketing the
        # 2026-07-31 ignition (2026-07-19 -> 2026-08-12). Both granules are
        # DHDH (full HH+HV), so the dual-pol lenses are complete.
        'kind': 'forest',
        'label': 'Attica megafire',
        'coords': (38.05, 23.31),
        'bbox': (23.15, 37.96, 23.42, 38.15),
        'window': 'calibration',
        'd_lat': 0.014,
        'eventDate': '2026-07-31',
        'before': 'NISAR_L2_PR_GCOV_025_158_A_021_2005_DHDH_A_20260719T033512_20260719T033547_P05023_N_F_J_001',
        'after': 'NISAR_L2_PR_GCOV_027_158_A_021_2005_DHDH_A_20260812T033511_20260812T033546_P05023_N_F_J_001',
    },
    'limpopo': {
        # Limpopo River floods (Gaza Province, Mozambique / Limpopo, South Africa),
        # January 2026 (GDACS: ~610k affected). Track 042 ascending, frame 165:
        # same-track pre/post pair bracketing the 19 Jan 2026 flood
        # (2026-01-12 -> 2026-01-24). Both granules are DHDH (full HH+HV).
        'kind': 'wetland',
        'label': 'Limpopo floods',
        'coords': (-25.15, 31.22),
        'bbox': (31.4, -25.6, 33.6, -22.3),
        'window': 'calibration',
        'eventDate': '2026-01-19',
        'before': 'NISAR_L2_PR_GCOV_010_042_A_165_2005_DHDH_A_20260112T035042_20260112T035113_P05023_N_F_J_001',
        'after': 'NISAR_L2_PR_GCOV_011_042_A_165_2005_DHDH_A_20260124T035042_20260124T035114_P05023_N_F_J_001',
    },
}


def log(*args):
    print('[snapshots]', *args, flush=True)


def token():
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if line.startswith('EARTHDATA_TOKEN='):
            return line.split('=', 1)[1].strip()
    raise SystemExit('EARTHDATA_TOKEN missing from .env.local')


def granule_date(name):
    """Calendar date (YYYY-MM-DD) encoded in a NISAR granule name.

    Uses the acquisition datetime token (`_YYYYMMDDThhmmss_`) rather than the
    first `_A_` split: ascending granules carry an extra `_A_<frame>_` segment
    (e.g. `..._158_A_021_2005_DHDH_A_20260719T...`) that breaks a naive split.
    """
    match = re.search(r'_(\d{8})T\d{6}_', name)
    if not match:
        return ''
    dt = match.group(1)
    return f'{dt[0:4]}-{dt[4:6]}-{dt[6:8]}'


def asf_granules(wkt):
    query = urlencode({
        'dataset': 'NISAR',
        'processingLevel': 'GCOV',
        'intersectsWith': wkt,
        'start': '2026-01-01T00:00:00Z',
        'end': '2026-12-31T23:59:59Z',
        'output': 'json',
        'maxResults': 5000,
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


def composite_limits(windows, anchor_first=False):
    """One radiometric stretch shared by every pass of a site.

    With anchor_first the limits come only from the before pass, so a real
    post-event drop in HV is shown, not normalised away by pooling both
    passes (which would hide the wildfire burn scar).
    """
    hh_db, hv_db, diff_db = [], [], []
    for window in (windows[:1] if anchor_first else windows):
        hh, hv, mask = window['hh'], window['hv'], window['mask']
        valid = mask & np.isfinite(hh) & np.isfinite(hv) & (hh > 0) & (hv > 0)
        hh_db.append(db(hh[valid]))
        hv_db.append(db(hv[valid]))
        diff_db.append(hh_db[-1] - hv_db[-1])
    hh_db, hv_db, diff_db = (np.concatenate(part) for part in (hh_db, hv_db, diff_db))
    return {
        'hh': (js_percentile(hh_db, 2), js_percentile(hh_db, 98)),
        'hv': (js_percentile(hv_db, 2), js_percentile(hv_db, 98)),
        'd': (js_percentile(diff_db, 2), js_percentile(diff_db, 98)),
    }


def composite(window, limits=None):
    hh, hv, mask = window['hh'], window['hv'], window['mask']
    valid = mask & np.isfinite(hh) & np.isfinite(hv) & (hh > 0) & (hv > 0)
    if not valid.any():
        raise RuntimeError('no valid pixels for composite')
    if limits is None:
        hh_db = db(hh[valid])
        hv_db = db(hv[valid])
        diff_db = hh_db - hv_db
        hh_lo, hh_hi = js_percentile(hh_db, 2), js_percentile(hh_db, 98)
        hv_lo, hv_hi = js_percentile(hv_db, 2), js_percentile(hv_db, 98)
        d_lo, d_hi = js_percentile(diff_db, 2), js_percentile(diff_db, 98)
    else:
        (hh_lo, hh_hi), (hv_lo, hv_hi), (d_lo, d_hi) = limits['hh'], limits['hv'], limits['d']

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


def composite_hh(window, limits):
    """Grayscale HH rendered from the same aligned array and window as the RGB."""
    hh, mask = window['hh'], window['mask']
    valid = mask & np.isfinite(hh) & (hh > 0)
    if not valid.any():
        raise RuntimeError('no valid pixels for HH composite')
    low, high = limits['hh']
    height, width = hh.shape
    out = np.zeros((OUT_H, OUT_W, 3), dtype=np.uint8)
    for y in range(OUT_H):
        sy = min(height - 1, int(((y + 0.5) / OUT_H) * height))
        for x in range(OUT_W):
            sx = min(width - 1, int(((x + 0.5) / OUT_W) * width))
            value = 8 if not valid[sy, sx] else int(stretch(db(hh[sy, sx]), low, high))
            out[y, x] = (value, value, value)
    buffer = io.BytesIO()
    Image.fromarray(out, 'RGB').save(buffer, format='PNG', optimize=True)
    return buffer.getvalue()


def box_filter(arr, size=SPECKLE_WINDOW):
    """3x3 mean on the dB raster: removes single-look speckle, keeps edges."""
    pad = size // 2
    padded = np.pad(arr, pad, mode='edge')
    windows = np.lib.stride_tricks.sliding_window_view(padded, (size, size))
    return windows.mean(axis=(-2, -1))


def filtered_db(window, key='hh'):
    """One channel in dB, mask-filled, then 3x3 box-smoothed."""
    band, mask = window[key], window['mask']
    valid = mask & np.isfinite(band) & (band > 0)
    if not valid.any():
        raise RuntimeError(f'no valid pixels for change map ({key})')
    values = db(band[valid])
    filled = np.where(valid, db(np.where(valid, band, 1.0)), np.median(values))
    return box_filter(filled), valid


def change_map(before, after, hv_weight=0.0, exclude_water=False):
    """Absolute HH change in dB on the same aligned window as the cards.

    This is the only change image the app serves: it is derived from the two
    calibrated rasters, never from an ASF browse crop, so it cannot drift to a
    different place than the before/after cards. A 3x3 median removes radar
    speckle before differencing, and differences below 2 dB stay black so the
    map shows structure instead of noise. Display scale is 0–8 dB.
    """
    height = min(before['hh'].shape[0], after['hh'].shape[0])
    width = min(before['hh'].shape[1], after['hh'].shape[1])
    db0, valid0 = filtered_db(before, 'hh')
    db1, valid1 = filtered_db(after, 'hh')
    valid = valid0[:height, :width] & valid1[:height, :width]
    db0 = db0[:height, :width]
    db1 = db1[:height, :width]
    if exclude_water:
        # The Big Sur frame includes open Pacific; sea state is not fire change.
        valid = valid & (db0 > WATER_MASK_DB)
    if hv_weight > 0:
        hv0, hv_valid0 = filtered_db(before, 'hv')
        hv1, hv_valid1 = filtered_db(after, 'hv')
        valid = valid & hv_valid0[:height, :width] & hv_valid1[:height, :width]
        hv0 = hv0[:height, :width]
        hv1 = hv1[:height, :width]
    # Sample the aligned rasters to the output grid first, then scale the
    # display to the strongest 2% of real change. A fixed 0-8 dB ramp leaves a
    # tight wildfire window almost black; anchoring to its own p98 keeps the
    # scar contiguous and white without inventing pixels.
    samples = np.zeros((OUT_H, OUT_W), dtype=np.float32)
    mask_out = np.zeros((OUT_H, OUT_W), dtype=bool)
    for y in range(OUT_H):
        sy = min(height - 1, int(((y + 0.5) / OUT_H) * height))
        for x in range(OUT_W):
            sx = min(width - 1, int(((x + 0.5) / OUT_W) * width))
            if not valid[sy, sx]:
                continue
            delta = abs(db1[sy, sx] - db0[sy, sx])
            if hv_weight > 0:
                # Wildfire: amplify the HV canopy drop but never let it mask a
                # strong HH change. Averaging would push either channel below
                # the noise floor when only one of them moves.
                delta = max(delta, abs(hv1[sy, sx] - hv0[sy, sx]) * (1.0 + hv_weight))
            samples[y, x] = delta
            mask_out[y, x] = True
    if not mask_out.any():
        raise RuntimeError('change map has no valid output pixels')
    # A second 3x3 box over the delta ties neighbouring changed pixels into
    # contiguous patches instead of leaving isolated speckle dots.
    pad = SPECKLE_WINDOW // 2
    padded = np.pad(np.where(mask_out, samples, 0.0), pad, mode='constant')
    padded_mask = np.pad(mask_out.astype(np.float32), pad, mode='constant')
    sums = np.lib.stride_tricks.sliding_window_view(padded, (SPECKLE_WINDOW, SPECKLE_WINDOW)).sum(axis=(-2, -1))
    counts = np.lib.stride_tricks.sliding_window_view(padded_mask, (SPECKLE_WINDOW, SPECKLE_WINDOW)).sum(axis=(-2, -1))
    samples = np.where(counts > 0, sums / np.maximum(counts, 1), 0.0).astype(np.float32)
    peak = float(np.percentile(samples[mask_out], 98))
    scale_max = max(CHANGE_FLOOR_DB + 1.0, min(8.0, peak))
    out = np.zeros((OUT_H, OUT_W, 3), dtype=np.uint8)
    span = scale_max - CHANGE_FLOOR_DB
    for y in range(OUT_H):
        for x in range(OUT_W):
            if not mask_out[y, x]:
                out[y, x] = (8, 8, 8)
                continue
            delta = float(samples[y, x])
            if delta < CHANGE_FLOOR_DB:
                continue
            value = int(np.clip((delta - CHANGE_FLOOR_DB) / span, 0.0, 1.0) ** 0.8 * 255)
            out[y, x] = (value, value, value)
    buffer = io.BytesIO()
    Image.fromarray(out, 'RGB').save(buffer, format='PNG', optimize=True)
    return buffer.getvalue()


def change_stats(before, after, exclude_water=False):
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
    if exclude_water:
        valid = valid & (db(hh0) > WATER_MASK_DB)
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
    d_lat = site.get('d_lat', 0.025)
    d_lng = d_lat / max(0.2, math.cos(math.radians(lat)))
    return (lng - d_lng, lat - d_lat, lng + d_lng, lat + d_lat)


def site_window(site):
    """Measurement window shared by both passes of a site.

    'bbox' uses the site's own bbox (Big Sur), 'calibration' uses the ~5.5 km
    window around the site coords (Sundarbans, Greece). Either way the SAME
    window is used for the before pass, the after pass, the change map and the
    recovery, so every panel reads the same ground.
    """
    if site.get('window') == 'bbox':
        return site['bbox']
    return calibration_bbox(site)


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
    only = os.environ.get('NISAR_ONLY')
    site_ids = [only] if only else list(SITES)
    catalog = {}
    for site_id in site_ids:
        site = SITES[site_id]
        wkt = (
            f'POLYGON (({site["bbox"][0]} {site["bbox"][1]}, {site["bbox"][2]} {site["bbox"][1]}, '
            f'{site["bbox"][2]} {site["bbox"][3]}, {site["bbox"][0]} {site["bbox"][3]}, '
            f'{site["bbox"][0]} {site["bbox"][1]}))'
        )
        catalog[site_id] = asf_granules(wkt)
        log(site_id, 'granules', len(catalog[site_id]))

    # Each site's before/after must share the same measurement window so the cards,
    # change map and recovery all read the same ground.
    windows = {site_id: {} for site_id in site_ids}

    def read_side(site_id, side):
        site = SITES[site_id]
        grid = open_granule(granule_url(catalog[site_id], site[side]))
        return site_id, side, read_window(grid, site_window(site), want_hv=True)

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(read_side, site_id, side) for site_id in site_ids for side in ('before', 'after')]
        for future in futures:
            site_id, side, window = future.result()
            windows[site_id][side] = window

    for site_id in site_ids:
        site = SITES[site_id]
        wildfire = site['kind'] != 'wetland'
        pair = windows[site_id]
        limits = composite_limits([pair['before'], pair['after']], anchor_first=wildfire)
        for side in ('before', 'after'):
            write_png(f'{site_id}-{side}-rgb.png', composite(pair[side], limits))
            write_png(f'{site_id}-{side}-hh.png', composite_hh(pair[side], limits))
        write_png(
            f'{site_id}-change.png',
            change_map(pair['before'], pair['after'], hv_weight=0.6 if wildfire else 0.0, exclude_water=wildfire),
        )
        write_rgb_module(f'{site_id}-rgb.mjs', f'{site_id}RgbBase64', {
            side: open(os.path.join(CACHE, f'{site_id}-{side}-rgb.png'), 'rb').read() for side in ('before', 'after')
        })
        write_rgb_module(f'{site_id}-hh.mjs', f'{site_id}HhBase64', {
            side: open(os.path.join(CACHE, f'{site_id}-{side}-hh.png'), 'rb').read() for side in ('before', 'after')
        })
        write_rgb_module(f'{site_id}-change.mjs', f'{site_id}ChangeBase64', {
            'change': open(os.path.join(CACHE, f'{site_id}-change.png'), 'rb').read()
        })

        stats = change_stats(pair['before'], pair['after'], exclude_water=wildfire)
        measure_bbox = site_window(site)
        area = bbox_area_km2(measure_bbox) / stats['totalPixels']
        changed_area = stats['changedPixels'] * area
        before_m = measurements(pair['before'])
        after_m = measurements(pair['after'])
        before_granule = site['before']
        after_granule = site['after']

        module = {
            'site': site_id,
            'computedAt': time.strftime('%Y-%m-%d', time.gmtime()),
            'source': 'nisar-gcov-asf-h5',
            'calibrated': True,
            'thresholdDb': THRESHOLD_DB,
            'changeStats': {
                'site': site_id,
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
                'before': {'date': granule_date(before_granule), 'granule': before_granule},
                'after': {'date': granule_date(after_granule), 'granule': after_granule},
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
                    'date': granule_date(before_granule),
                    'granule': before_granule,
                    'width': OUT_W,
                    'height': OUT_H,
                },
                'after': {
                    'date': granule_date(after_granule),
                    'granule': after_granule,
                    'width': OUT_W,
                    'height': OUT_H,
                },
            },
        }
        header = (
            '/**\n'
            f' * Verified NISAR GCOV telemetry for the {site.get("label", site_id)} site.\n'
            ' *\n'
            ' * Generated by scripts/build-nisar-snapshots.py directly from the ASF DAAC\n'
            ' * GCOV HDF5 granules (HHHH/HVHV gamma-0, own mask). Do not edit by hand.\n'
            ' */\n'
        )
        out_path = os.path.join(CACHE, f'{site_id}.mjs')
        with open(out_path, 'w', encoding='utf-8') as handle:
            handle.write(header + f'export const {site_id}Snapshot = ' + json.dumps(module, indent=2) + ';\n')
        log('wrote', os.path.relpath(out_path, ROOT), '| changedPct', stats['changedPct'], '| area km2', round(changed_area, 2))
    log('done in', round(time.time() - started, 1), 's')


if __name__ == '__main__':
    sys.exit(main())
