/**
 * Verified NISAR GCOV telemetry for the Sundarbans / Vietnam site.
 *
 * Produced once by the calibrated pipeline in server/nisar.mjs after a
 * successful Harmony subset of the two DHDH granules around the September 2026
 * event (HHHH/HVHV, 10·log10 gamma-0). It is bundled so the public endpoints
 * answer instantly instead of waiting on the Harmony queue inside a serverless
 * request. Live Harmony is still attempted first when NISAR_GCOV=1.
 *
 * Do not edit these numbers by hand: regenerate with a successful
 * buildNisarSite() / computeNisarChangeStats() run and bump `computedAt`.
 */
export const sundarbansSnapshot = {
  site: 'sundarbans',
  computedAt: '2026-11-16',
  source: 'nisar-gcov-harmony-db',
  calibrated: true,
  thresholdDb: 3,
  changeStats: {
    site: 'sundarbans',
    source: 'nisar-gcov-harmony-db',
    calibrated: true,
    thresholdDb: 3,
    changedPct: 37.5,
    meanDeltaDb: 0,
    meanAbsDeltaDb: 2.78,
    changedAreaKm2: 215.89,
    validPixels: 5912275,
    validPct: 97.5,
    grid: { width: 2697, height: 2248, aligned: true },
    before: {
      date: '2026-09-09',
      granule:
        'NISAR_L2_PR_GCOV_030_054_A_010_4005_DHDH_A_20260909T222101_20260909T222140_P05023_N_F_J_001',
    },
    after: {
      date: '2026-09-21',
      granule:
        'NISAR_L2_PR_GCOV_031_054_A_010_4005_DHDH_A_20260921T222101_20260921T222140_P05023_N_F_J_001',
    },
    note:
      'Signed HH change, 3 dB absolute threshold, same track/frame, NISAR L-band gamma-0. Computed over the granule footprint subset available at calibration time.',
  },
  measurements: {
    hhDb: { before: -6.1, after: -6.1 },
    hvDb: { before: -14.3, after: -14.5 },
    crossDb: { before: -8.2, after: -8.4 },
    validPct: 97.5,
  },
  rgb: {
    before: {
      date: '2026-09-09',
      granule:
        'NISAR_L2_PR_GCOV_030_054_A_010_4005_DHDH_A_20260909T222101_20260909T222140_P05023_N_F_J_001',
      width: 560,
      height: 370,
    },
    after: {
      date: '2026-09-21',
      granule:
        'NISAR_L2_PR_GCOV_031_054_A_010_4005_DHDH_A_20260921T222101_20260921T222140_P05023_N_F_J_001',
      width: 560,
      height: 370,
    },
  },
};
