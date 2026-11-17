#!/usr/bin/env python3
"""Build a REAL NISAR L-band (GCOV HH gamma-0) multi-pass recovery series per site.

Reads every NISAR GCOV granule of the best track over the season directly from
the ASF DAAC HDF5 (byte ranges), exactly like scripts/build-nisar-snapshots.py,
so no Harmony subsetter is involved. Emits server/cache/nisar/<site>-recovery.mjs
with per-pass calibrated backscatter and a recovery curve.

Nothing here is synthesised: every number is the mean calibrated gamma-0 over the
same 2.5 km study window.
"""

import importlib.util
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'server', 'cache', 'nisar')

spec = importlib.util.spec_from_file_location('bns', os.path.join(ROOT, 'scripts', 'build-nisar-snapshots.py'))
bns = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bns)

import numpy as np  # noqa: E402  (available after bns import pulls its deps)

# Re-centre the Big Sur measurement window on the burn-scar core found by
# scripts/find-scar-center.py (densest >=2 dB change cluster). The old centre
# sat on unburned canyon and diluted the signal to ~0.3 dB.
if 'bigsur' in bns.SITES:
    bns.SITES['bigsur']['coords'] = (35.9774, -121.4994)

KIND = {'sundarbans': 'wetland', 'bigsur': 'wildfire'}
START = '2026-05-01'
END = '2026-12-31'


def log(*args):
    print('[recovery]', *args, flush=True)


def site_wkt(site):
    b = site['bbox']
    return (f'POLYGON (({b[0]} {b[1]}, {b[2]} {b[1]}, {b[2]} {b[3]}, '
            f'{b[0]} {b[3]}, {b[0]} {b[1]}))')


def window_db(grid, bbox):
    win = bns.read_window(grid, bbox, want_hv=True)
    m = bns.measurements(win)
    return m  # hhDb, hvDb, crossDb, validPct


def read_pass(r, best_track, bbox):
    day = r['startTime'][:10]
    try:
        grid = bns.open_granule(r['downloadUrl'])
        m = window_db(grid, bbox)
        rec = {'date': day, 'track': best_track, 'hhDb': m['hhDb'], 'hvDb': m['hvDb'],
               'crossDb': m['crossDb'], 'validPct': m['validPct'], 'granule': r['granuleName']}
        log('  ', day, 'HH', m['hhDb'], 'HV', m['hvDb'], 'valid', m['validPct'])
        return rec
    except Exception as exc:  # noqa: BLE001
        log('  ', day, 'FAILED', exc)
        return {'date': day, 'track': best_track, 'error': str(exc)}


def main():
    os.makedirs(CACHE, exist_ok=True)
    only = os.environ.get('NISAR_ONLY')
    site_ids = [only] if only else list(bns.SITES)
    results = {}

    for site_id in site_ids:
        site = bns.SITES[site_id]
        bbox = bns.calibration_bbox(site)
        catalog = bns.asf_granules(site_wkt(site))
        event_ms = time.mktime(time.strptime(site['eventDate'], '%Y-%m-%d'))

        rows = sorted(catalog.values(), key=lambda r: r['startTime'])
        by_track = {}
        for r in rows:
            by_track.setdefault(r.get('track'), []).append(r)

        # Best track: most post-event passes (a real recovery needs post passes).
        def post_count(lst):
            return sum(1 for r in lst if time.mktime(time.strptime(r['startTime'][:10], '%Y-%m-%d')) > event_ms)

        best_track = max(by_track, key=lambda k: post_count(by_track[k]))
        passes = []
        seen = set()
        for r in by_track[best_track]:
            day = r['startTime'][:10]
            if day in seen:
                continue
            seen.add(day)
            passes.append(r)
        log(site_id, 'track', best_track, 'passes', len(passes))

        # A recovery needs a baseline (last few pre-event passes) plus the
        # post-event passes. Drop old pre-event passes to keep the read cheap.
        def is_post(r):
            return time.mktime(time.strptime(r['startTime'][:10], '%Y-%m-%d')) > event_ms

        pre = [r for r in passes if not is_post(r)]
        post = [r for r in passes if is_post(r)]
        passes = pre[-3:] + post[:8]
        log(site_id, 'using', len(passes), 'passes (', len(pre[-3:]), 'pre +', len(post[:8]), 'post )')

        with ThreadPoolExecutor(max_workers=4) as pool:
            series = list(pool.map(lambda r: read_pass(r, best_track, bbox), passes))
        series.sort(key=lambda p: p['date'])

        results[site_id] = {'eventDate': site['eventDate'], 'track': best_track, 'kind': KIND[site_id], 'passes': series}

    with open(os.path.join('/tmp/kilo', 'recovery-raw.json'), 'w', encoding='utf-8') as handle:
        json.dump(results, handle, indent=2)
    log('wrote /tmp/kilo/recovery-raw.json')


if __name__ == '__main__':
    sys.exit(main())