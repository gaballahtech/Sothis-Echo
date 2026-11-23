#!/usr/bin/env python3
"""Add a physics-informed parametric recovery model to existing recovery snapshots.

Reads server/cache/nisar/<site>-recovery.mjs, fits three standard post-disturbance
recovery models (exponential, logistic, Gompertz) to the measured recovery points
using bounded least squares (numpy only — no scipy), selects the best by AIC, and
writes back a `model` block with the fitted params, recovery time + 95% CI, R².

Models (t in months since event, y in % recovery):
  exponential: y = A * (1 - exp(-k t))
  logistic:    y = A / (1 + exp(-k (t - x0)))
  gompertz:    y = A * exp(-exp(-k (t - x0)))

Nothing here is synthesised: the fit is applied to the SAME measured points already
committed; it only summarises them as a smooth physical curve with uncertainty.
"""

import json
import math
import os
import re
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'server', 'cache', 'nisar')
TARGET = 80.0


def log(*args):
    print('[fit-recovery]', *args, flush=True)


def load_module(path):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    # strip the JS export wrapper, parse the JSON object
    m = re.search(r'=\s*(\{.*\});?\s*$', text, re.DOTALL)
    if not m:
        raise ValueError('no object literal found')
    return json.loads(m.group(1))


def write_module(path, module, export_name):
    header = (
        '/**\n'
        f' * Real NISAR L-band (GCOV HH gamma-0) recovery series for {module["site"]}.\n'
        ' *\n'
        ' * Generated from calibrated ASF DAAC GCOV granules. Every dB value is measured;\n'
        ' * the `model` block is a parametric fit (AIC-selected) of those measured points.\n'
        ' * Do not edit by hand.\n'
        ' */\n'
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(header + f'export const {export_name} = ' + json.dumps(module, indent=2) + ';\n')


# --- models (vectorised over params) -----------------------------------------

def exp_model(t, A, k):
    return A * (1.0 - np.exp(-k * t))


def logistic_model(t, A, k, x0):
    return A / (1.0 + np.exp(-k * (t - x0)))


def gompertz_model(t, A, k, x0):
    return A * np.exp(-np.exp(-k * (t - x0)))


def fit_grid(func, t, y, bounds, grid_n=60):
    """Grid search + coordinate refinement (numpy only). Returns (params, sse)."""
    # build the parameter grid
    axes = [np.linspace(lo, hi, grid_n) for (lo, hi) in bounds]
    best = (None, float('inf'))
    # coarse grid (cap total combos)
    total = 1
    for ax in axes:
        total *= len(ax)
    if total > 400000:
        # reduce grid
        axes = [np.linspace(lo, hi, max(8, int(grid_n * (400000 / total) ** 0.25))) for (lo, hi) in bounds]
    for combo in _iter_grid(axes):
        try:
            pred = func(t, *combo)
            sse = float(np.sum((pred - y) ** 2))
        except (FloatingPointError, OverflowError, ValueError):
            continue
        if sse < best[1]:
            best = (combo, sse)
    # coordinate refinement
    params = list(best[0]) if best[0] else [ (lo+hi)/2 for (lo,hi) in bounds ]
    step = [(hi - lo) / 20.0 for (lo, hi) in bounds]
    for _ in range(60):
        improved = False
        for i in range(len(params)):
            for delta in (+step[i], -step[i]):
                trial = list(params)
                trial[i] += delta
                trial[i] = min(max(trial[i], bounds[i][0]), bounds[i][1])
                try:
                    pred = func(t, *trial)
                    sse = float(np.sum((pred - y) ** 2))
                except (FloatingPointError, OverflowError, ValueError):
                    continue
                if sse < best[1]:
                    best = (tuple(trial), sse)
                    params = trial
                    improved = True
        if not improved:
            step = [s * 0.5 for s in step]
            if max(step) < 1e-4:
                break
    return best


def _iter_grid(axes):
    idx = [0] * len(axes)
    while True:
        yield tuple(ax[i] for ax, i in zip(axes, idx))
        # increment
        d = len(axes) - 1
        while d >= 0:
            idx[d] += 1
            if idx[d] < len(axes[d]):
                break
            idx[d] = 0
            d -= 1
        if d < 0:
            break


def aic(n, sse, k):
    if sse <= 0:
        sse = 1e-12
    return n * math.log(sse / n) + 2 * k


def bic(n, sse, k):
    if sse <= 0:
        sse = 1e-12
    return n * math.log(sse / n) + k * math.log(n)


def r2(y, pred):
    ss_res = float(np.sum((y - pred) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    if ss_tot <= 0:
        return 0.0
    return 1.0 - ss_res / ss_tot


def recovery_time_from_model(model, params, target):
    """Solve for t where model(t) = target, numerically (bisection over a range)."""
    lo, hi = 0.0, 60.0
    for _ in range(80):
        mid = (lo + hi) / 2
        val = _eval(model, mid, params)
        if val < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def _eval(name, t, params):
    if name == 'exponential':
        return exp_model(t, *params)
    if name == 'logistic':
        return logistic_model(t, *params)
    return gompertz_model(t, *params)


def fit_site(site_id, module):
    pts = module.get('points', [])
    # use only points up to where data is real (projected=False), cumulative pct
    pts = [p for p in pts if not p.get('projected')]
    if len(pts) < 4:
        log(site_id, 'not enough points, skip')
        return None
    t = np.array([p['month'] for p in pts], dtype=float)
    y = np.array([p['pct'] for p in pts], dtype=float)
    n = len(pts)

    candidates = []
    # exponential: A in [50,120], k in [0.05,3]
    try:
        (params, sse) = fit_grid(exp_model, t, y, [(50, 120), (0.05, 3.0)])
        candidates.append(('exponential', params, sse, 2))
    except Exception as e:
        log(site_id, 'exp fit failed', e)
    # logistic: A [50,120], k [0.1,4], x0 [0,12]
    try:
        (params, sse) = fit_grid(logistic_model, t, y, [(50, 120), (0.1, 4.0), (0, 12)])
        candidates.append(('logistic', params, sse, 3))
    except Exception as e:
        log(site_id, 'logistic fit failed', e)
    # gompertz: A [50,120], k [0.05,3], x0 [-2,12]
    try:
        (params, sse) = fit_grid(gompertz_model, t, y, [(50, 120), (0.05, 3.0), (-2, 12)])
        candidates.append(('gompertz', params, sse, 3))
    except Exception as e:
        log(site_id, 'gompertz fit failed', e)

    if not candidates:
        return None

    # pick best by AIC
    best = min(candidates, key=lambda c: aic(n, c[2], c[3]))
    name, params, sse, k = best
    pred = _eval(name, t, params)
    r2_val = r2(y, pred)
    rt = recovery_time_from_model(name, params, TARGET)
    # CI from residual std (approx): sigma of residuals, and t CI via slope
    sigma = math.sqrt(sse / max(1, n - k))
    # approximate 95% CI on recovery time via sigma / max slope
    slopes = []
    for dt in [0.01]:
        t0 = max(0.0, rt - dt)
        t1 = rt + dt
        slopes.append(abs(_eval(name, t1, params) - _eval(name, t0, params)) / (t1 - t0 + 1e-9))
    max_slope = max(slopes) if slopes else 1.0
    ci95 = 1.96 * sigma / (max_slope + 1e-9) if max_slope > 1e-6 else None

    model_block = {
        'name': name,
        'params': [round(float(p), 4) for p in params],
        'aic': round(aic(n, sse, k), 2),
        'bic': round(bic(n, sse, k), 2),
        'r2': round(r2_val, 3),
        'sigma': round(sigma, 3),
        'recoveryMonth': round(rt, 2),
        'recoveryDay': int(round(rt * 30.44)),
        'ci95Days': int(round(ci95 * 30.44)) if ci95 else None,
        'target': int(TARGET),
    }
    log(site_id, 'model', name, '| R2', round(r2_val, 3), '| recoveryDay', model_block['recoveryDay'],
        '| CI', model_block['ci95Days'])

    # Internal validation: fit RMSE (in % points) + cross-pol (HH/HV) Pearson r
    # across the real passes — a physical-consistency check that needs no extra data.
    rmse = math.sqrt(sse / n) if n else None
    passes = module.get('passes', [])
    hh = [p['vv'] for p in passes if 'vv' in p]
    hv = [p['vh'] for p in passes if 'vh' in p]
    hh_hv_r = None
    if len(hh) >= 3 and len(hv) >= 3:
        hh_hv_r = _pearson(hh, hv)
    validation = {
        'modelRmsePct': round(rmse, 1) if rmse is not None else None,
        'nPasses': len(passes),
        'hhHvR': round(hh_hv_r, 3) if hh_hv_r is not None else None,
    }
    log(site_id, 'validation', validation)
    return model_block, validation


def _pearson(x, y):
    n = len(x)
    if n < 2:
        return None
    mx = sum(x) / n
    my = sum(y) / n
    num = sum((a - mx) * (b - my) for a, b in zip(x, y))
    dx = math.sqrt(sum((a - mx) ** 2 for a in x))
    dy = math.sqrt(sum((b - my) ** 2 for b in y))
    if dx == 0 or dy == 0:
        return None
    return num / (dx * dy)


def main():
    for fname in sorted(os.listdir(CACHE)):
        if not fname.endswith('-recovery.mjs'):
            continue
        site_id = fname.replace('-recovery.mjs', '')
        path = os.path.join(CACHE, fname)
        try:
            module = load_module(path)
        except Exception as e:
            log(site_id, 'load failed', e)
            continue
        result = fit_site(site_id, module)
        if result:
            model, validation = result
            module['model'] = model
            module['validation'] = validation
            export_name = site_id + 'Recovery'
            write_module(path, module, export_name)
            log('updated', fname)


if __name__ == '__main__':
    main()