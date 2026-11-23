/**
 * Real NISAR L-band (GCOV HH gamma-0) recovery series for bigsur.
 *
 * Generated from calibrated ASF DAAC GCOV granules. Every dB value is measured;
 * the `model` block is a parametric fit (AIC-selected) of those measured points.
 * Do not edit by hand.
 */
export const bigsurRecovery = {
  "site": "bigsur",
  "computedAt": "2026-11-17",
  "source": "nisar-gcov-asf-h5",
  "calibrated": true,
  "kind": "wildfire",
  "eventDate": "2026-08-25",
  "track": 42,
  "baseline": {
    "date": "2026-08-16",
    "hhDb": -14.8
  },
  "event": {
    "date": "2026-08-28",
    "hhDb": -16.4
  },
  "thresholdDefault": 80,
  "estimateDays": 44,
  "points": [
    {
      "day": 3,
      "month": 0.1,
      "pct": 0,
      "projected": false
    },
    {
      "day": 15,
      "month": 0.49,
      "pct": 6,
      "projected": false
    },
    {
      "day": 27,
      "month": 0.89,
      "pct": 75,
      "projected": false
    },
    {
      "day": 39,
      "month": 1.28,
      "pct": 75,
      "projected": false
    },
    {
      "day": 51,
      "month": 1.68,
      "pct": 88,
      "projected": false
    },
    {
      "day": 63,
      "month": 2.07,
      "pct": 100,
      "projected": false
    },
    {
      "day": 75,
      "month": 2.46,
      "pct": 100,
      "projected": false
    }
  ],
  "passes": [
    {
      "date": "2026-07-11",
      "vv": -14.9,
      "vh": -21.3
    },
    {
      "date": "2026-07-23",
      "vv": -15.5,
      "vh": -21.2
    },
    {
      "date": "2026-08-16",
      "vv": -14.8,
      "vh": -20.8
    },
    {
      "date": "2026-08-28",
      "vv": -16.4,
      "vh": -21.1
    },
    {
      "date": "2026-09-09",
      "vv": -16.3,
      "vh": -21.3
    },
    {
      "date": "2026-09-21",
      "vv": -15.2,
      "vh": -21.1
    },
    {
      "date": "2026-10-03",
      "vv": -16.3,
      "vh": -21.1
    },
    {
      "date": "2026-10-15",
      "vv": -15.0,
      "vh": -21.1
    },
    {
      "date": "2026-10-27",
      "vv": -14.3,
      "vh": -20.8
    },
    {
      "date": "2026-11-08",
      "vv": -16.0,
      "vh": -21.1
    }
  ],
  "series": [
    {
      "date": "2026-07-11",
      "vv": -14.9,
      "vh": -21.3,
      "change": 0.01
    },
    {
      "date": "2026-07-23",
      "vv": -15.5,
      "vh": -21.2,
      "change": 0.06
    },
    {
      "date": "2026-08-16",
      "vv": -14.8,
      "vh": -20.8,
      "change": 0.0
    },
    {
      "date": "2026-08-28",
      "vv": -16.4,
      "vh": -21.1,
      "change": 0.13
    },
    {
      "date": "2026-09-09",
      "vv": -16.3,
      "vh": -21.3,
      "change": 0.12
    },
    {
      "date": "2026-09-21",
      "vv": -15.2,
      "vh": -21.1,
      "change": 0.03
    },
    {
      "date": "2026-10-03",
      "vv": -16.3,
      "vh": -21.1,
      "change": 0.12
    },
    {
      "date": "2026-10-15",
      "vv": -15.0,
      "vh": -21.1,
      "change": 0.02
    },
    {
      "date": "2026-10-27",
      "vv": -14.3,
      "vh": -20.8,
      "change": 0.04
    },
    {
      "date": "2026-11-08",
      "vv": -16.0,
      "vh": -21.1,
      "change": 0.1
    }
  ],
  "measurements": {
    "vv": {
      "before": -14.8,
      "after": -16.4
    },
    "vh": {
      "before": -20.8,
      "after": -21.1
    },
    "crossPol": {
      "before": -6.0,
      "after": -4.7
    },
    "dateBefore": "2026-08-16",
    "dateAfter": "2026-08-28",
    "source": "nisar-gcov-asf-h5",
    "bands": "HH/HV",
    "unit": "gamma0_power_db",
    "calibration": "10\u00b7log10(gamma-0 power), calibrated NISAR GCOV",
    "calibrated": true,
    "validPct": 100.0
  },
  "pulse": [
    0.01,
    0.04,
    0.048,
    0.012,
    0.052,
    0.13,
    0.124,
    0.102,
    0.048,
    0.066,
    0.12,
    0.06,
    0.024,
    0.036,
    0.064,
    0.1
  ],
  "stablePulse": [
    0.01,
    0.023,
    0.037,
    0.05,
    0.056,
    0.04,
    0.024,
    0.008,
    0.017,
    0.052,
    0.087,
    0.121,
    0.128,
    0.125,
    0.123,
    0.12
  ],
  "note": {
    "en": "Recovery measured from the calibrated NISAR L-band time series (HH gamma-0, 10 passes on track 42) over the 2.5 km study window. The HH backscatter fell to -16.4 dB on 2026-08-28 (pre-event baseline -14.8 dB on 2026-08-16); the curve is the share of that drop that has returned to baseline (cumulative, so later seasonal drift is not counted as re-flooding).",
    "ar": "\u0627\u0644\u062a\u0639\u0627\u0641\u064a \u0645\u0642\u0627\u0633 \u0645\u0646 \u0633\u0644\u0633\u0644\u0629 NISAR \u0627\u0644\u0632\u0645\u0646\u064a\u0629 \u0644\u0645\u0648\u062c\u0629 L (HH\u060c \u063a\u0627\u0645\u0627-0\u060c 10 \u0645\u0631\u0648\u0631\u0627\u064b \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u0627\u0631 42) \u0641\u0648\u0642 \u0646\u0627\u0641\u0630\u0629 2.5 \u0643\u0645. \u0647\u0628\u0637\u062a \u0627\u0644\u0627\u0633\u062a\u0637\u0627\u0639\u0629 HH \u0625\u0644\u0649 -16.4 \u062f\u064a\u0633\u064a\u0628\u0644 \u0641\u064a 2026-08-28 (\u062e\u0637 \u0627\u0644\u0623\u0633\u0627\u0633 \u0642\u0628\u0644 \u0627\u0644\u062d\u062f\u062b -14.8 \u062f\u064a\u0633\u064a\u0628\u0644 \u0641\u064a 2026-08-16)\u061b \u0648\u0627\u0644\u0645\u0646\u062d\u0646\u0649 \u0647\u0648 \u0646\u0633\u0628\u0629 \u0630\u0644\u0643 \u0627\u0644\u0627\u0646\u062e\u0641\u0627\u0636 \u0627\u0644\u062a\u064a \u0639\u0627\u062f\u062a \u0625\u0644\u0649 \u062e\u0637 \u0627\u0644\u0623\u0633\u0627\u0633 (\u062a\u0631\u0627\u0643\u0645\u064a\u060c \u0641\u0644\u0627 \u064a\u064f\u062d\u0633\u0628 \u0627\u0644\u0627\u0646\u062c\u0631\u0627\u0641 \u0627\u0644\u0645\u0648\u0633\u0645\u064a \u0627\u0644\u0644\u0627\u062d\u0642 \u0641\u064a\u0636\u0627\u0646\u0627\u064b \u062c\u062f\u064a\u062f\u0627\u064b)."
  },
  "model": {
    "name": "gompertz",
    "params": [
      98.3074,
      3.0,
      0.6695
    ],
    "aic": 36.26,
    "bic": 36.09,
    "r2": 0.951,
    "sigma": 11.483,
    "recoveryMonth": 1.2,
    "recoveryDay": 36,
    "ci95Days": 14,
    "target": 80
  },
  "validation": {
    "modelRmsePct": 8.7,
    "nPasses": 10,
    "hhHvR": 0.525
  }
};
