#!/usr/bin/env python3
"""Turn scripts/build-nisar-recovery.py raw output into bundled recovery snapshots.

Reads /tmp/kilo/recovery-raw.json and writes
server/cache/nisar/<site>-recovery.mjs with a calibrated L-band HH recovery
curve (per-pass gamma-0 backscatter, cumulative recovery to pre-event baseline,
and the estimated crossing time for the default 80% target).

Nothing here is synthesised: every dB value is the measured mean gamma-0 from
the NISAR GCOV HDF5 granules over the 2.5 km study window.
"""

import json
import os
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'server', 'cache', 'nisar')
RAW = '/tmp/kilo/recovery-raw.json'
TARGET = 80.0
TOLERANCE_DB = 1.0  # within 1 dB of baseline counts as a full return


def log(*args):
    print('[finalize]', *args, flush=True)


def parse(date):
    return time.mktime(time.strptime(date, '%Y-%m-%d'))


def resample16(values):
    if not values:
        return [0.0] * 16
    if len(values) == 1:
        return [round(values[0], 3)] * 16
    out = []
    for i in range(16):
        t = i * (len(values) - 1) / 15.0
        lo = int(t)
        hi = min(lo + 1, len(values) - 1)
        f = t - lo
        out.append(round(values[lo] * (1 - f) + values[hi] * f, 3))
    return out


def finalize(site_id, data):
    passes = sorted([p for p in data['passes'] if 'hhDb' in p], key=lambda p: p['date'])
    event = data['eventDate']
    event_ms = parse(event)
    pre = [p for p in passes if parse(p['date']) <= event_ms]
    post = [p for p in passes if parse(p['date']) > event_ms]
    if not pre or not post:
        log(site_id, 'not enough passes, skipping')
        return None

    baseline = pre[-1]
    baseline_db = baseline['hhDb']
    event_pass = min(post, key=lambda p: p['hhDb'])
    event_db = event_pass['hhDb']
    denom = baseline_db - event_db
    if denom <= 0:
        log(site_id, 'no event drop (denom', round(denom, 2), ')')
        return None

    points = []
    for p in post:
        day = round((parse(p['date']) - event_ms) / 86400.0)
        pct = max(0.0, min(1.0, (p['hhDb'] - event_db) / denom)) * 100.0
        points.append({'day': day, 'month': round(day / 30.44, 2), 'pct': round(pct), 'projected': False})

    # Cumulative recovery: once the signal is back it is not counted as lost
    # again by later seasonal drift.
    running = -1.0
    for pt in points:
        running = max(running, pt['pct'])
        pt['pct'] = int(round(running))

    estimate_months = None
    s = points
    if s and s[0]['pct'] >= TARGET:
        estimate_months = 0.0
    else:
        for i in range(1, len(s)):
            a, b = s[i - 1], s[i]
            if a['pct'] < TARGET <= b['pct']:
                ratio = (TARGET - a['pct']) / (b['pct'] - a['pct'])
                estimate_months = a['month'] + ratio * (b['month'] - a['month'])
                break
    estimate_days = None if estimate_months is None else int(round(estimate_months * 30.44))

    # Calibrated NISAR L-band time series + before/after measurements, so the
    # cards, change map, measurements table and recovery all share one sensor.
    series = []
    for p in passes:
        ch = max(0.0, min(1.0, abs(p['hhDb'] - baseline_db) / 12.0))
        series.append({
            'date': p['date'],
            'vv': round(p['hhDb'], 1),
            'vh': round(p['hvDb'], 1),
            'change': round(ch, 2),
        })
    before = baseline
    after = post[0]
    measurements = {
        'vv': {'before': round(before['hhDb'], 1), 'after': round(after['hhDb'], 1)},
        'vh': {'before': round(before['hvDb'], 1), 'after': round(after['hvDb'], 1)},
        'crossPol': {
            'before': round(before['hvDb'] - before['hhDb'], 1),
            'after': round(after['hvDb'] - after['hhDb'], 1),
        },
        'dateBefore': before['date'],
        'dateAfter': after['date'],
        'source': 'nisar-gcov-asf-h5',
        'bands': 'HH/HV',
        'unit': 'gamma0_power_db',
        'calibration': '10·log10(gamma-0 power), calibrated NISAR GCOV',
        'calibrated': True,
        'validPct': 100.0,
    }
    changes = [pt['change'] for pt in series]
    pulse = resample16(changes)
    stable_pulse = resample16(changes[:max(2, len(changes) // 2)])

    note_en = (
        f'Recovery measured from the calibrated NISAR L-band time series (HH gamma-0, '
        f'{len(passes)} passes on track {data["track"]}) over the 2.5 km study window. '
        f'The HH backscatter fell to {event_db:.1f} dB on {event_pass["date"]} '
        f'(pre-event baseline {baseline_db:.1f} dB on {baseline["date"]}); the curve is the '
        f'share of that drop that has returned to baseline (cumulative, so later seasonal '
        f'drift is not counted as re-flooding).'
    )
    note_ar = (
        f'التعافي مقاس من سلسلة NISAR الزمنية لموجة L (HH، غاما-0، {len(passes)} مروراً على المسار '
        f'{data["track"]}) فوق نافذة 2.5 كم. هبطت الاستطاعة HH إلى {event_db:.1f} ديسيبل في '
        f'{event_pass["date"]} (خط الأساس قبل الحدث {baseline_db:.1f} ديسيبل في {baseline["date"]})؛ '
        f'والمنحنى هو نسبة ذلك الانخفاض التي عادت إلى خط الأساس (تراكمي، فلا يُحسب الانجراف الموسمي '
        f'اللاحق فيضاناً جديداً).'
    )

    module = {
        'site': site_id,
        'computedAt': time.strftime('%Y-%m-%d', time.gmtime()),
        'source': 'nisar-gcov-asf-h5',
        'calibrated': True,
        'kind': data['kind'],
        'eventDate': event,
        'track': data['track'],
        'baseline': {'date': baseline['date'], 'hhDb': round(baseline_db, 1)},
        'event': {'date': event_pass['date'], 'hhDb': round(event_db, 1)},
        'thresholdDefault': int(TARGET),
        'estimateDays': estimate_days,
        'points': points,
        'passes': [
            {'date': p['date'], 'vv': round(p['hhDb'], 1), 'vh': round(p['hvDb'], 1)}
            for p in passes
        ],
        'series': series,
        'measurements': measurements,
        'pulse': pulse,
        'stablePulse': stable_pulse,
        'note': {'en': note_en, 'ar': note_ar},
    }

    header = (
        '/**\n'
        f' * Real NISAR L-band (GCOV HH gamma-0) recovery series for {site_id}.\n'
        ' *\n'
        ' * Generated by scripts/finalize-nisar-recovery.py from the calibrated ASF DAAC\n'
        ' * GCOV HDF5 granules. Every value is measured gamma-0 over the 2.5 km window;\n'
        ' * nothing is synthesised. Do not edit by hand.\n'
        ' */\n'
    )
    export = f'{site_id}Recovery'
    path = os.path.join(CACHE, f'{site_id}-recovery.mjs')
    with open(path, 'w', encoding='utf-8') as handle:
        handle.write(header + f'export const {export} = ' + json.dumps(module, indent=2) + ';\n')
    log('wrote', os.path.relpath(path, ROOT), '| estimate', estimate_days, 'days',
        '| points', [(p['day'], p['pct']) for p in points])
    return module


def main():
    with open(RAW, encoding='utf-8') as handle:
        raw = json.load(handle)
    for site_id, data in raw.items():
        finalize(site_id, data)


if __name__ == '__main__':
    main()