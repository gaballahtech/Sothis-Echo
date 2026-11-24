#!/usr/bin/env python3
"""Build the "Three Lenses" snapshot for a site (robust, GCOV-based).

Lenses (all real, calibrated NISAR data):
  A. Amplitude change   — gamma-0 (HH, HV) from GCOV, before vs after.
  B. Dual-pol scattering — HH/HV classes (surface / volume / low) before vs after.
  C. Fused change mechanism — amplitude drop combined with the scattering-class shift.

Optional InSAR coherence from GSLC is computed only when LENS_GSLC=1 (the GSLC
complex grid is large and slow to stream). When absent, the UI shows an honest
"not available" state — no pixel is ever faked.

Outputs (committed, bundled with the serverless function):
  server/cache/nisar/<site>-lenses.mjs   { images, stats, meta }
  server/cache/nisar/<site>-<layer>.png

Run:  .venv-nisar/bin/python scripts/build-lenses.py [site]
"""

import base64
import io
import json
import math
import os
import subprocess
import sys
import time
from urllib.parse import urlencode

import fsspec
import h5py
import numpy as np
from PIL import Image
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'server', 'cache', 'nisar')
ASF = 'https://api.daac.asf.alaska.edu/services/search/param'
FETCH_TIMEOUT = 40
OUT_W, OUT_H = 560, 370
GSLC_STRIDE = 2
ENABLE_GSLC = os.environ.get('LENS_GSLC', '1') == '1'

# Dual-pol class thresholds (dB). Heuristic, documented in the UI:
#   low     : co-pol HH <= -20 dB            (specular water / shadow)
#   volume  : HV-HH > -6 dB and HH > -20 dB  (canopy volume)
#   surface : otherwise                       (surface / double-bounce)
LOW_DB = -20.0
VOL_RATIO_DB = -6.0

LENS_SITES = {
    'bigsur': {
        'bbox': (-121.58, 35.97, -121.46, 36.07),
        'gcov': {
            'before': 'NISAR_L2_PR_GCOV_028_042_D_070_4005_DHDH_A_20260816T025639_20260816T025713_P05023_N_F_J_001',
            'after': 'NISAR_L2_PR_GCOV_029_042_D_070_4005_DHDH_A_20260828T025638_20260828T025713_P05023_N_F_J_001',
        },
        'gslc': {
            'before': 'NISAR_L2_PR_GSLC_028_042_D_070_4005_DHDH_A_20260816T025639_20260816T025713_P05023_N_F_J_001',
            'after': 'NISAR_L2_PR_GSLC_029_042_D_070_4005_DHDH_A_20260828T025638_20260828T025713_P05023_N_F_J_001',
        },
        'label': 'Big Sur megafire',
    },
    'sundarbans': {
        'bbox': (107.45, 16.45, 107.70, 16.65),
        'coords': (16.55, 107.575),
        'gcov': {
            'before': 'NISAR_L2_PR_GCOV_030_054_A_010_4005_DHDH_A_20260909T222101_20260909T222140_P05023_N_F_J_001',
            'after': 'NISAR_L2_PR_GCOV_031_054_A_010_4005_DHDH_A_20260921T222101_20260921T222140_P05023_N_F_J_001',
        },
        'gslc': {
            'before': 'NISAR_L2_PR_GSLC_030_054_A_010_4005_DHDH_A_20260909T222101_20260909T222140_P05023_N_F_J_001',
            'after': 'NISAR_L2_PR_GSLC_031_054_A_010_4005_DHDH_A_20260921T222101_20260921T222140_P05023_N_F_J_001',
        },
        'label': 'Central Vietnam flood',
    },
    'greece': {
        # Attica/Viotia megafire (W of Athens). Track 158 ascending, frame 021:
        # the only swath truly covering the burn scar; pre/post pair
        # (2026-07-19 -> 2026-08-12), both DHDH (HH+HV).
        'bbox': (23.15, 37.96, 23.42, 38.15),
        'coords': (38.05, 23.31),
        'd_lat': 0.014,
        'gcov': {
            'before': 'NISAR_L2_PR_GCOV_025_158_A_021_2005_DHDH_A_20260719T033512_20260719T033547_P05023_N_F_J_001',
            'after': 'NISAR_L2_PR_GCOV_027_158_A_021_2005_DHDH_A_20260812T033511_20260812T033546_P05023_N_F_J_001',
        },
        'gslc': {
            'before': 'NISAR_L2_PR_GSLC_025_158_A_021_2005_DHDH_A_20260719T033512_20260719T033547_P05023_N_F_J_001',
            'after': 'NISAR_L2_PR_GSLC_027_158_A_021_2005_DHDH_A_20260812T033511_20260812T033546_P05023_N_F_J_001',
        },
        'label': 'Attica megafire',
    },
}


def log(*a):
    print('[lenses]', *a, flush=True)


def token():
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if line.startswith('EARTHDATA_TOKEN='):
            return line.split('=', 1)[1].strip()
    raise SystemExit('EARTHDATA_TOKEN missing from .env.local')


def search(level, wkt, start='2026-01-01T00:00:00Z', end='2026-12-31T23:59:59Z'):
    q = urlencode({
        'dataset': 'NISAR', 'processingLevel': level, 'intersectsWith': wkt,
        'start': start, 'end': end, 'output': 'json', 'maxResults': 100,
    })
    out = subprocess.run(['curl', '-sS', '-m', str(FETCH_TIMEOUT), f'{ASF}?{q}'],
                         capture_output=True, text=True, timeout=FETCH_TIMEOUT + 10)
    data = json.loads(out.stdout or '[]')
    if isinstance(data, list) and data and isinstance(data[0], list):
        data = data[0]
    if isinstance(data, dict):
        data = [data]
    return {r['granuleName']: r for r in data if isinstance(r, dict) and r.get('granuleName')}


def signed_url(download_url):
    out = subprocess.run(
        ['curl', '-s', '-D', '-', '-o', '/dev/null', '-m', str(FETCH_TIMEOUT),
         '-H', f'Authorization: Bearer {token()}', '-r', '0-0', download_url],
        capture_output=True, text=True, timeout=FETCH_TIMEOUT + 5,
    ).stdout
    for line in out.splitlines():
        if line.lower().startswith('location:'):
            return line.split(':', 1)[1].strip()
    raise RuntimeError(f'no signed redirect for {download_url}')


def open_h5(url):
    return h5py.File(fsspec.filesystem('http', block_size=2 ** 22).open(signed_url(url), 'rb'), 'r')


def lonlat_to_xy(proj, lng, lat):
    return Transformer.from_crs(4326, proj, always_xy=True).transform(lng, lat)


def calibration_bbox(coords, d_lat=0.025):
    """The same window the gray HH snapshots use (build-nisar-snapshots.py)."""
    lat, lng = coords
    d_lng = d_lat / max(0.2, math.cos(math.radians(lat)))
    return (lng - d_lng, lat - d_lat, lng + d_lng, lat + d_lat)


def window_indices(xs, ys, proj, bbox):
    x0, y0 = lonlat_to_xy(proj, bbox[0], bbox[1])
    x1, y1 = lonlat_to_xy(proj, bbox[2], bbox[3])
    i0, i1 = np.searchsorted(xs, [min(x0, x1), max(x0, x1)])
    if ys[0] < ys[-1]:
        j0, j1 = np.searchsorted(ys, [min(y0, y1), max(y0, y1)])
    else:
        j0, j1 = sorted(len(ys) - np.searchsorted(ys[::-1], [min(y0, y1), max(y0, y1)]))
    return int(i0), int(i1), int(j0), int(j1)


def db(power):
    return 10.0 * np.log10(np.maximum(power, 1e-7))


def read_gcov_window(file_url, bbox):
    f = open_h5(file_url)
    g = f['science/LSAR/GCOV/grids/frequencyA']
    proj = int(g['projection'][()])
    xs, ys = g['xCoordinates'][:], g['yCoordinates'][:]
    i0, i1, j0, j1 = window_indices(xs, ys, proj, bbox)
    return {
        'hh': g['HHHH'][j0:j1, i0:i1].astype(np.float64),
        'hv': g['HVHV'][j0:j1, i0:i1].astype(np.float64),
        'mask': g['mask'][j0:j1, i0:i1].astype(bool),
    }


def read_gslc_window(file_url, bbox):
    f = open_h5(file_url)
    g = f['science/LSAR/GSLC/grids/frequencyA']
    proj = int(g['projection'][()])
    xs, ys = g['xCoordinates'][:], g['yCoordinates'][:]
    i0, i1, j0, j1 = window_indices(xs, ys, proj, bbox)
    s = GSLC_STRIDE
    return {
        'hh': np.asarray(g['HH'][j0:j1:s, i0:i1:s]),
        'mask': g['mask'][j0:j1:s, i0:i1:s].astype(bool),
    }


def box_sum(arr, size):
    pad = size // 2
    p = np.pad(arr, pad, mode='constant')
    c = np.pad(p.cumsum(axis=0).cumsum(axis=1), ((1, 0), (1, 0)), mode='constant')
    h, w = arr.shape
    return c[size:size + h, size:size + w] - c[0:h, size:size + w] - c[size:size + h, 0:w] + c[0:h, 0:w]


def coherence(g1, g2, valid, size=9):
    g1 = np.where(valid, g1, 0)
    g2 = np.where(valid, g2, 0)
    num = np.abs(box_sum(g1 * np.conj(g2), size))
    den = np.sqrt(np.maximum(box_sum(np.abs(g1) ** 2, size) * box_sum(np.abs(g2) ** 2, size), 1e-12))
    return np.clip(np.nan_to_num(np.where(den > 0, num / den, 0.0), nan=0.0), 0.0, 1.0)


def downsample(arr, out_w=OUT_W, out_h=OUT_H):
    h, w = arr.shape[:2]
    ys = np.minimum(h - 1, ((np.arange(out_h) + 0.5) / out_h * h).astype(int))
    xs = np.minimum(w - 1, ((np.arange(out_w) + 0.5) / out_w * w).astype(int))
    return arr[ys[:, None], xs[None, :]]


def save_png(name, rgb):
    buffer = io.BytesIO()
    Image.fromarray(rgb, 'RGB').save(buffer, format='PNG', optimize=True)
    data = buffer.getvalue()
    with open(os.path.join(CACHE, name), 'wb') as h:
        h.write(data)
    log('wrote', name, len(data), 'bytes')
    return base64.b64encode(data).decode('ascii')


CLASS_RGB = {'surface': (220, 60, 60), 'volume': (60, 200, 90), 'low': (40, 70, 200)}


def classify(hh, hv, mask):
    hh_db = db(np.where(mask & (hh > 0), hh, np.nan))
    hv_db = db(np.where(mask & (hv > 0), hv, np.nan))
    ratio = hv_db - hh_db
    valid = mask & np.isfinite(hh_db) & np.isfinite(hv_db)
    surface = valid & (hh_db > LOW_DB) & (ratio <= VOL_RATIO_DB)
    volume = valid & (hh_db > LOW_DB) & (ratio > VOL_RATIO_DB)
    low = valid & (hh_db <= LOW_DB)
    return surface, volume, low, valid


def render_classes(surface, volume, low, valid):
    rgb = np.zeros((*surface.shape, 3), dtype=np.uint8)
    rgb[surface] = CLASS_RGB['surface']
    rgb[volume] = CLASS_RGB['volume']
    rgb[low] = CLASS_RGB['low']
    rgb[~valid] = (8, 8, 8)
    return downsample(rgb)


def render_change(s0, v0, l0, ok0, s1, v1, l1, ok1):
    """Highlight pixels whose scattering class changed between the two dates."""
    both = ok0 & ok1
    changed = both & ((s0 != s1) | (v0 != v1) | (l0 != l1))
    rgb = np.full((*s0.shape, 3), 30, dtype=np.uint8)
    rgb[changed] = (255, 220, 60)  # amber = mechanism change
    return downsample(rgb), changed


def fractions(surface, volume, low, valid):
    n = max(1, int(valid.sum()))
    return {
        'surface': round(float(surface.sum()) / n, 4),
        'volume': round(float(volume.sum()) / n, 4),
        'low': round(float(low.sum()) / n, 4),
        'validPct': round(100.0 * float(valid.mean()), 1),
    }


def main():
    os.makedirs(CACHE, exist_ok=True)
    site_id = sys.argv[1] if len(sys.argv) > 1 else (os.environ.get('LENS_SITE') or 'bigsur')
    if site_id not in LENS_SITES:
        raise SystemExit(f'unknown site {site_id}; have {list(LENS_SITES)}')
    site = LENS_SITES[site_id]
    # Match the gray HH window (calibration_bbox) so the lenses align with the
    # site image; fall back to the full site bbox when no coords are given.
    bbox = calibration_bbox(site['coords'], site.get('d_lat', 0.025)) if site.get('coords') else site['bbox']
    started = time.time()
    log('site', site_id, site.get('label', ''))

    gcov = search('GCOV', _wkt(bbox))  # Aug–Sep window holds the 028/029 fire pair
    before = read_gcov_window(gcov[site['gcov']['before']]['downloadUrl'], bbox)
    after = read_gcov_window(gcov[site['gcov']['after']]['downloadUrl'], bbox)
    H = min(before['hh'].shape[0], after['hh'].shape[0])
    W = min(before['hh'].shape[1], after['hh'].shape[1])
    hh0, hv0, m0 = before['hh'][:H, :W], before['hv'][:H, :W], before['mask'][:H, :W]
    hh1, hv1, m1 = after['hh'][:H, :W], after['hv'][:H, :W], after['mask'][:H, :W]
    log('gcov windows', hh0.shape)

    # Lens A: amplitude
    v0 = m0 & (hh0 > 0) & (hv0 > 0)
    v1 = m1 & (hh1 > 0) & (hv1 > 0)
    amp = {
        'hhBeforeDb': round(float(db(hh0[v0]).mean()), 1),
        'hhAfterDb': round(float(db(hh1[v1]).mean()), 1),
        'hvBeforeDb': round(float(db(hv0[v0]).mean()), 1),
        'hvAfterDb': round(float(db(hv1[v1]).mean()), 1),
    }
    amp['dHH'] = round(amp['hhAfterDb'] - amp['hhBeforeDb'], 1)
    amp['dHV'] = round(amp['hvAfterDb'] - amp['hvBeforeDb'], 1)

    # Lens B: dual-pol mechanism
    s0, v0c, l0, ok0 = classify(hh0, hv0, m0)
    s1, v1c, l1, ok1 = classify(hh1, hv1, m1)
    mech = {'before': fractions(s0, v0c, l0, ok0), 'after': fractions(s1, v1c, l1, ok1)}

    # Lens C: fused change
    change_rgb, changed = render_change(s0, v0c, l0, ok0, s1, v1c, l1, ok1)
    both = ok0 & ok1
    mech['changedPct'] = round(100.0 * float(changed.sum()) / max(1, int(both.sum())), 1)

    # Lens B (optional): InSAR coherence from GSLC
    coh_meta = {'mean': None, 'lowCoherencePct': None}
    coh_note = 'InSAR coherence not included in this snapshot.'
    if ENABLE_GSLC:
        try:
            log('searching GSLC ...')
            gslc = search('GSLC', _wkt(bbox))
            log('GSLC granules:', len(gslc))
            log('reading GSLC before ...')
            g1 = read_gslc_window(gslc[site['gslc']['before']]['downloadUrl'], bbox)
            log('reading GSLC after ...')
            g2 = read_gslc_window(gslc[site['gslc']['after']]['downloadUrl'], bbox)
            h = min(g1['hh'].shape[0], g2['hh'].shape[0])
            w = min(g1['hh'].shape[1], g2['hh'].shape[1])
            valid = g1['mask'][:h, :w] & g2['mask'][:h, :w]
            coh = coherence(g1['hh'][:h, :w], g2['hh'][:h, :w], valid)
            coh_meta = {
                'mean': round(float(coh[valid].mean()), 3),
                'lowCoherencePct': round(100.0 * float((coh[valid] < 0.4).mean()), 1),
            }
            coh_note = 'Coherence from the real GSLC HH pair.'
            _coh_b64 = _render_coherence(coh, site_id)
            log('coherence mean', coh_meta['mean'])
        except Exception as exc:  # noqa: BLE001
            _coh_b64 = None
            log('coherence failed:', type(exc).__name__, exc)
            coh_note = 'InSAR coherence not available for this site.'
    else:
        _coh_b64 = None

    images = {
        'mechanismBefore': save_png(f'{site_id}-mechanism-before.png', render_classes(s0, v0c, l0, ok0)),
        'mechanismAfter': save_png(f'{site_id}-mechanism-after.png', render_classes(s1, v1c, l1, ok1)),
        'mechanismChange': save_png(f'{site_id}-mechanism-change.png', change_rgb),
        'coherence': _coh_b64,
    }

    module = {
        'site': site_id,
        'label': site.get('label', site_id),
        'computedAt': time.strftime('%Y-%m-%d', time.gmtime()),
        'pair': {'before': site['gcov']['before'], 'after': site['gcov']['after']},
        'amplitude': amp,
        'coherence': coh_meta,
        'coherenceNote': coh_note,
        'mechanism': mech,
        'thresholds': {'lowDb': LOW_DB, 'volumeRatioDb': VOL_RATIO_DB},
        'images': images,
    }
    header = (
        '/**\n'
        f' * Three Lenses for {site_id} — real NISAR GCOV (gamma-0) + GSLC (coherence).\n'
        ' * Generated by scripts/build-lenses.py. Do not edit by hand.\n'
        ' */\n'
    )
    path = os.path.join(CACHE, f'{site_id}-lenses.mjs')
    with open(path, 'w', encoding='utf-8') as h:
        h.write(header + 'export const lensesSnapshot = ' + json.dumps(module, indent=2) + ';\n')
    log('wrote', os.path.relpath(path, ROOT), '| done in', round(time.time() - started, 1), 's')


def _render_coherence(coh, site_id='coherence'):
    v = (np.clip(coh, 0, 1) * 255).astype(np.uint8)
    d = downsample(v)
    rgb = np.zeros((*d.shape, 3), dtype=np.uint8)
    rgb[..., 0] = d
    rgb[..., 1] = (d * 0.5).astype(np.uint8)
    rgb[..., 2] = (255 - d).astype(np.uint8)
    return save_png(f'{site_id}-coherence.png', rgb)


def _wkt(bbox):
    return (f'POLYGON (({bbox[0]} {bbox[1]}, {bbox[2]} {bbox[1]}, '
            f'{bbox[2]} {bbox[3]}, {bbox[0]} {bbox[3]}, {bbox[0]} {bbox[1]}))')


if __name__ == '__main__':
    sys.exit(main())