#!/usr/bin/env python3
"""Locate the Big Sur burn-scar core inside the site bbox.

Reads the calibrated NISAR GCOV HH rasters for the before/after pair directly
from the ASF DAAC HDF5 (same path as build-nisar-snapshots.py), computes the
per-pixel HH change, and reports:
  - the |delta|-weighted centroid of changed pixels
  - the densest changed cluster (peak of a box-smoothed density map)
  - for each candidate centre: mean HH before/after over the 5.5 km window and
    the resulting drop, so the strongest-signal centre can be chosen.
"""

import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('bns', os.path.join(ROOT, 'scripts', 'build-nisar-snapshots.py'))
bns = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bns)

import numpy as np  # noqa: E402
from pyproj import Transformer  # noqa: E402

SITE = bns.SITES['bigsur']
BBOX = SITE['bbox']
BEFORE = 'NISAR_L2_PR_GCOV_028_042_D_070_4005_DHDH_A_20260816T025639_20260816T025713_P05023_N_F_J_001'
AFTER = 'NISAR_L2_PR_GCOV_030_042_D_070_4005_DHDH_A_20260909T025638_20260909T025713_P05023_N_F_J_001'
THRESH = 2.0


def log(*a):
    print('[scar]', *a, flush=True)


def load_pair():
    catalog = bns.asf_granules(
        f'POLYGON (({BBOX[0]} {BBOX[1]}, {BBOX[2]} {BBOX[1]}, {BBOX[2]} {BBOX[3]}, '
        f'{BBOX[0]} {BBOX[3]}, {BBOX[0]} {BBOX[1]}))'
    )
    g0 = bns.open_granule(catalog[BEFORE]['downloadUrl'])
    g1 = bns.open_granule(catalog[AFTER]['downloadUrl'])
    w0 = bns.read_window(g0, BBOX, want_hv=False)
    w1 = bns.read_window(g1, BBOX, want_hv=False)
    return g0, w0, w1


def window_mean(db, mask, lon, lat, clon, clat, half_deg):
    sel = mask & (np.abs(lon - clon) <= half_deg) & (np.abs(lat - clat) <= half_deg)
    if not sel.any():
        return None, 0
    return float(db[sel].mean()), int(sel.sum())


def main():
    g0, w0, w1 = load_pair()
    hh0 = bns.db(w0['hh'])
    hh1 = bns.db(w1['hh'])
    valid = w0['mask'] & w1['mask'] & (w0['hh'] > 0) & (w1['hh'] > 0) & np.isfinite(hh0) & np.isfinite(hh1)
    delta = hh1 - hh0
    changed = valid & (np.abs(delta) >= THRESH)
    log('valid', int(valid.sum()), 'changed', int(changed.sum()),
        'changedPct', round(changed.sum() / valid.sum() * 100, 1))

    proj = int(w0['proj'])
    xs = g0['xCoordinates'][:]
    ys = g0['yCoordinates'][:]
    i0, i1, j0, j1 = bns.window_indices(xs, ys, proj, BBOX)
    xsw = xs[i0:i1]
    ysw = ys[j0:j1]
    to_ll = Transformer.from_crs(proj, 4326, always_xy=True)
    lon, lat = to_ll.transform(*np.meshgrid(xsw, ysw))
    log('window shape', hh0.shape, 'lon', round(float(lon.min()), 3), round(float(lon.max()), 3),
        'lat', round(float(lat.min()), 3), round(float(lat.max()), 3))

    w = np.where(changed, np.abs(delta), 0.0)
    tot = w.sum()
    clon = float((w * lon).sum() / tot)
    clat = float((w * lat).sum() / tot)
    log('weighted centroid', round(clat, 4), round(clon, 4))

    # Density peak: box-filter the changed mask, find the hottest cell.
    dens = changed.astype(np.float64)
    k = 61  # ~1.5 km box at ~25 m/px
    pad = k // 2
    padded = np.pad(dens, pad, mode='constant')
    windows = np.lib.stride_tricks.sliding_window_view(padded, (k, k))
    box = windows.sum(axis=(-2, -1))
    py, px = np.unravel_index(int(np.argmax(box)), box.shape)
    # map box index back to window pixel index (box index == window index here)
    peak_lon = float(lon[py, px])
    peak_lat = float(lat[py, px])
    log('density peak', round(peak_lat, 4), round(peak_lon, 4), 'count', int(box[py, px]))

    half = 0.025  # half-width of the calibration window in degrees
    candidates = {
        'weighted_centroid': (clat, clon),
        'density_peak': (peak_lat, peak_lon),
        'current_site': (SITE['coords'][0], SITE['coords'][1]),
    }
    out = {}
    for name, (la, lo) in candidates.items():
        b, nb = window_mean(hh0, valid, lon, lat, lo, la, half)
        a, na = window_mean(hh1, valid, lon, lat, lo, la, half)
        drop = None if (b is None or a is None) else round(b - a, 2)
        out[name] = {'lat': round(la, 4), 'lng': round(lo, 4),
                     'before': None if b is None else round(b, 2),
                     'after': None if a is None else round(a, 2),
                     'drop': drop, 'pixels': min(nb, na)}
        log(name, out[name])

    with open('/tmp/kilo/scar-center.json', 'w', encoding='utf-8') as fh:
        json.dump(out, fh, indent=2)
    log('wrote /tmp/kilo/scar-center.json')


if __name__ == '__main__':
    sys.exit(main())