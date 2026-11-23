/**
 * Real NISAR L-band (GCOV HH gamma-0) recovery series for sundarbans.
 *
 * Generated from calibrated ASF DAAC GCOV granules. Every dB value is measured;
 * the `model` block is a parametric fit (AIC-selected) of those measured points.
 * Do not edit by hand.
 */
export const sundarbansRecovery = {
  "site": "sundarbans",
  "computedAt": "2026-11-17",
  "source": "nisar-gcov-asf-h5",
  "calibrated": true,
  "kind": "wetland",
  "eventDate": "2026-09-13",
  "track": 47,
  "baseline": {
    "date": "2026-09-09",
    "hhDb": -12.9
  },
  "event": {
    "date": "2026-09-21",
    "hhDb": -13.8
  },
  "thresholdDefault": 80,
  "estimateDays": 18,
  "points": [
    {
      "day": 8,
      "month": 0.26,
      "pct": 0,
      "projected": false
    },
    {
      "day": 20,
      "month": 0.66,
      "pct": 100,
      "projected": false
    },
    {
      "day": 32,
      "month": 1.05,
      "pct": 100,
      "projected": false
    },
    {
      "day": 44,
      "month": 1.45,
      "pct": 100,
      "projected": false
    },
    {
      "day": 56,
      "month": 1.84,
      "pct": 100,
      "projected": false
    }
  ],
  "passes": [
    {
      "date": "2026-08-16",
      "vv": -11.3,
      "vh": -17.9
    },
    {
      "date": "2026-08-28",
      "vv": -12.3,
      "vh": -18.0
    },
    {
      "date": "2026-09-09",
      "vv": -12.9,
      "vh": -18.4
    },
    {
      "date": "2026-09-21",
      "vv": -13.8,
      "vh": -19.0
    },
    {
      "date": "2026-10-03",
      "vv": -12.8,
      "vh": -18.8
    },
    {
      "date": "2026-10-15",
      "vv": -13.0,
      "vh": -18.8
    },
    {
      "date": "2026-10-27",
      "vv": -13.3,
      "vh": -18.9
    },
    {
      "date": "2026-11-08",
      "vv": -13.2,
      "vh": -18.7
    }
  ],
  "series": [
    {
      "date": "2026-08-16",
      "vv": -11.3,
      "vh": -17.9,
      "change": 0.13
    },
    {
      "date": "2026-08-28",
      "vv": -12.3,
      "vh": -18.0,
      "change": 0.05
    },
    {
      "date": "2026-09-09",
      "vv": -12.9,
      "vh": -18.4,
      "change": 0.0
    },
    {
      "date": "2026-09-21",
      "vv": -13.8,
      "vh": -19.0,
      "change": 0.08
    },
    {
      "date": "2026-10-03",
      "vv": -12.8,
      "vh": -18.8,
      "change": 0.01
    },
    {
      "date": "2026-10-15",
      "vv": -13.0,
      "vh": -18.8,
      "change": 0.01
    },
    {
      "date": "2026-10-27",
      "vv": -13.3,
      "vh": -18.9,
      "change": 0.03
    },
    {
      "date": "2026-11-08",
      "vv": -13.2,
      "vh": -18.7,
      "change": 0.02
    }
  ],
  "measurements": {
    "vv": {
      "before": -12.9,
      "after": -13.8
    },
    "vh": {
      "before": -18.4,
      "after": -19.0
    },
    "crossPol": {
      "before": -5.5,
      "after": -5.2
    },
    "dateBefore": "2026-09-09",
    "dateAfter": "2026-09-21",
    "source": "nisar-gcov-asf-h5",
    "bands": "HH/HV",
    "unit": "gamma0_power_db",
    "calibration": "10\u00b7log10(gamma-0 power), calibrated NISAR GCOV",
    "calibrated": true,
    "validPct": 100.0
  },
  "pulse": [
    0.13,
    0.093,
    0.055,
    0.03,
    0.007,
    0.027,
    0.064,
    0.061,
    0.029,
    0.01,
    0.01,
    0.013,
    0.022,
    0.029,
    0.025,
    0.02
  ],
  "stablePulse": [
    0.13,
    0.114,
    0.098,
    0.082,
    0.066,
    0.05,
    0.04,
    0.03,
    0.02,
    0.01,
    0.0,
    0.016,
    0.032,
    0.048,
    0.064,
    0.08
  ],
  "note": {
    "en": "Recovery measured from the calibrated NISAR L-band time series (HH gamma-0, 8 passes on track 47) over the 2.5 km study window. The HH backscatter fell to -13.8 dB on 2026-09-21 (pre-event baseline -12.9 dB on 2026-09-09); the curve is the share of that drop that has returned to baseline (cumulative, so later seasonal drift is not counted as re-flooding).",
    "ar": "\u0627\u0644\u062a\u0639\u0627\u0641\u064a \u0645\u0642\u0627\u0633 \u0645\u0646 \u0633\u0644\u0633\u0644\u0629 NISAR \u0627\u0644\u0632\u0645\u0646\u064a\u0629 \u0644\u0645\u0648\u062c\u0629 L (HH\u060c \u063a\u0627\u0645\u0627-0\u060c 8 \u0645\u0631\u0648\u0631\u0627\u064b \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u0627\u0631 47) \u0641\u0648\u0642 \u0646\u0627\u0641\u0630\u0629 2.5 \u0643\u0645. \u0647\u0628\u0637\u062a \u0627\u0644\u0627\u0633\u062a\u0637\u0627\u0639\u0629 HH \u0625\u0644\u0649 -13.8 \u062f\u064a\u0633\u064a\u0628\u0644 \u0641\u064a 2026-09-21 (\u062e\u0637 \u0627\u0644\u0623\u0633\u0627\u0633 \u0642\u0628\u0644 \u0627\u0644\u062d\u062f\u062b -12.9 \u062f\u064a\u0633\u064a\u0628\u0644 \u0641\u064a 2026-09-09)\u061b \u0648\u0627\u0644\u0645\u0646\u062d\u0646\u0649 \u0647\u0648 \u0646\u0633\u0628\u0629 \u0630\u0644\u0643 \u0627\u0644\u0627\u0646\u062e\u0641\u0627\u0636 \u0627\u0644\u062a\u064a \u0639\u0627\u062f\u062a \u0625\u0644\u0649 \u062e\u0637 \u0627\u0644\u0623\u0633\u0627\u0633 (\u062a\u0631\u0627\u0643\u0645\u064a\u060c \u0641\u0644\u0627 \u064a\u064f\u062d\u0633\u0628 \u0627\u0644\u0627\u0646\u062c\u0631\u0627\u0641 \u0627\u0644\u0645\u0648\u0633\u0645\u064a \u0627\u0644\u0644\u0627\u062d\u0642 \u0641\u064a\u0636\u0627\u0646\u0627\u064b \u062c\u062f\u064a\u062f\u0627\u064b)."
  },
  "model": {
    "name": "exponential",
    "params": [
      115.4765,
      1.5295
    ],
    "aic": 34.62,
    "bic": 33.84,
    "r2": 0.714,
    "sigma": 27.594,
    "recoveryMonth": 0.77,
    "recoveryDay": 23,
    "ci95Days": 30,
    "target": 80
  },
  "validation": {
    "modelRmsePct": 21.4,
    "nPasses": 8,
    "hhHvR": 0.896
  }
};
