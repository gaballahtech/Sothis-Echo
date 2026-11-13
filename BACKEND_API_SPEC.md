# Dancing with SAR — Backend API Contract

> Frontend status: **backend-ready**. With `VITE_API_BASE_URL` unset the app makes
> **zero network requests** and renders the bundled illustrative dataset
> (`source: "local"`). With a base URL it tries the API first, validates the
> numeric fields, and falls back to the labelled local dataset on any failure.
>
> Default base: `http://localhost:3001/api` · timeout: `VITE_API_TIMEOUT` (ms).

---

## 1. Why a backend is needed

The browser cannot talk to ASF or Bhoonidhi directly (CORS, credentials, large
granules, calibration). The backend is the only place that should:

1. Query ASF `asf_search` / Bhoonidhi for NISAR L-band and Sentinel-1 archive scenes.
2. Terrain-correct, calibrate, and convert GeoTIFF/COG → backscatter dB and
   change products.
3. Compute recovery fits and sonification series.
4. Serve scene imagery (GeoTIFF tiles or pre-rendered PNGs) and attribution.

The frontend owns narrative, teaching copy, mode switching, and rendering. The
backend owns **numbers, images, and provenance**. Prose stays in the bundle until
a CMS endpoint is added.

---

## 2. Envelope

Any endpoint may return the payload directly or wrap it:

```json
{ "data": <payload>, "success": true, "message": "optional", "error": "optional" }
```

Errors should use a 4xx/5xx status. The client treats non-2xx, timeouts, or an
empty `study-areas` payload as "backend unavailable" and falls back silently
(visible as `[ LOCAL ]` in the UI).

CORS must allow the deployed frontend origin. `GET` endpoints should be cacheable
(`Cache-Control: public, max-age=300` for mission status; longer for archive
series). **Never** label illustrative values as live.

---

## 3. Endpoints

| # | Method | Path | Purpose | Returns |
|---|--------|------|---------|---------|
| 1 | GET | `/health` | Health check | `{ status, timestamp, version }` |
| 2 | GET | `/nisar/status` | Hero receiver status (optional) | `NisarStatus` |
| 3 | GET | `/study-areas` | Catalogue used by the whole page | `StudyArea[]` or `{ sites: StudyArea[] }` |
| 4 | GET | `/study-areas/:id` | One site | `StudyArea` |
| 5 | GET | `/sites/:id/series?start=&end=` | Backscatter time series | `SeriesPoint[]` |
| 6 | GET | `/sites/:id/recovery?threshold=80` | Recovery curve + fit | `RecoverySeries` |
| 7 | GET | `/sonification/:id` | 16-pass series for audio | `{ pulse: number[], stablePulse: number[] }` |
| 8 | GET | `/scenes/:id/:state` | Optional scene image metadata | `{ imageUrl, opticalUrl, attribution, acquiredAt, crs, bounds }` |
| 9 | GET | `/scenes/:id/:state/tiles/{z}/{x}/{y}.png` | Optional XYZ tiles | PNG |
| 10 | GET | `/attribution/:id` | Provenance block | `{ sources: [{ label, href }], license, product }` |

### 3.1 `GET /study-areas` — merge contract

The frontend merges only the numeric/visual fields over its local narrative.
Unknown fields are ignored. Return one object per site, keyed by `id`:

```json
[
  {
    "id": "sundarbans",
    "coords": { "lat": 21.94, "lng": 89.18 },
    "wkt": "POLYGON ((89.00 21.72, ...))",
    "updatedAt": "2026-11-10T08:00:00Z",
    "states": {
      "before": { "date": "2026-09-18", "params": { "water": 0.34, "emergent": 0.58, "burn": 0, "cloud": 0.55 } },
      "after":  { "date": "2026-10-12", "params": { "water": 0.82, "emergent": 0.74, "burn": 0, "cloud": 0.9 } }
    },
    "measurements": {
      "vv": { "before": -13.2, "after": -9.8 },
      "vh": { "before": -20.1, "after": -24.6 },
      "crossPol": { "before": -6.9, "after": -14.8 },
      "dateBefore": "2026-09-18",
      "dateAfter": "2026-10-12",
      "source": "nisar"
    },
    "series": [
      { "date": "2026-09-18", "vv": -13.1, "vh": -20.0, "water": 0.31, "change": 0.08 }
    ],
    "pulse": [0.08, 0.07, 0.09, 0.12, 0.18, 0.34, 0.62, 0.94, 0.88, 0.71, 0.49, 0.33, 0.22, 0.18, 0.14, 0.11],
    "stablePulse": [0.06, 0.07, 0.05, 0.08, 0.06, 0.07, 0.05, 0.06, 0.08, 0.06, 0.05, 0.07, 0.06, 0.08, 0.05, 0.06],
    "recovery": {
      "thresholdDefault": 80,
      "points": [
        { "month": 0, "pct": 35, "projected": false },
        { "month": 2, "pct": 52, "projected": false }
      ]
    }
  }
]
```

**Important:** `params` drive the procedural renderer and use normalized 0–1
values. They are not imagery. If the backend supplies real imagery, return
`imageUrl` / `opticalUrl` in `/scenes/:id/:state` and wire the scene component to
them; do not pretend a simulated render is a NISAR product.

### 3.2 Units and validation

| Field | Unit | Range / rule |
|-------|------|--------------|
| `vv`, `vh` | dB (σ⁰) | −35 … +5 |
| `crossPol` | dB | `vh - vv` (verify server-side) |
| `pct` | % of pre-event baseline | 0 … 100 |
| `month` | months since event | ≥ 0, strictly increasing |
| `pulse` | change index | 0 … 1, exactly 16 values |
| `params.water` / `.emergent` / `.burn` / `.cloud` | fraction | 0 … 1 |
| dates | ISO 8601 | `YYYY-MM-DD` or full timestamp |

Reject malformed payloads with a 422 and a clear message. The frontend will use
the local dataset rather than render NaN or an empty chart.

### 3.3 Sonification mapping (keep server and client consistent)

The client maps one pulse per pass:

- pitch → change index (minor pentatonic, root D3)
- rhythm → `620ms - change * 360ms`
- cross-pol / roughness → short filtered noise burst

If the backend computes the 16-value `pulse` array, document the aggregation
window (e.g., 12-day change in VH relative to the local baseline).

### 3.4 Recovery fit (server-side, recommended)

The client interpolates linearly between points and labels points beyond the
measured record as **projected**. A server fit can return:

```json
{
  "thresholdDefault": 80,
  "points": [{ "month": 0, "pct": 12, "projected": false }],
  "fit": { "model": "logistic", "K": 0.91, "r": 0.045, "t0": 22, "rmseDb": 0.9 },
  "note": "Structural proxy only; not biodiversity recovery."
}
```

---

## 4. NISAR / ASF implementation notes

- Prefer **NISAR L-band GSLC/GCOV** (HH/HV, quad-pol where available) for
  vegetation structure; pair with **Sentinel-1 C-band GRD** for the archive
  before NISAR science operations.
- Use the mission's **12-day exact repeat** and same-track ascending/descending
  pairs. Do not mix tracks when computing change.
- Terrain-correct with a DEM; conifer terrain produces layover/shadow.
- Convert to γ⁰ or σ⁰ dB consistently; state which. Water masks should be
  derived from a threshold tuned per site/tide stage, not a global constant.
- Keep the **WKT polygon** in `studyAreas[*].wkt` as the query unit (5-point ring).
- Never call an illustrative scene a NISAR product in `attribution`.

Sources: [NISAR Quick Facts](https://nisar.jpl.nasa.gov/mission/quick-facts) ·
[NISAR Science Users’ Handbook](https://dataverse.jpl.nasa.gov/api/access/datafile/97405?gbrecs=true) ·
[ASF DAAC](https://asf.alaska.edu/) ·
[ISRO Bhoonidhi](https://bhoonidhi.nrsc.gov.in/NISAR/NisarProducts.html)

---

## 5. Acceptance criteria

- [ ] With no `VITE_API_BASE_URL`, the browser network tab shows no API requests.
- [ ] With a valid backend, the hero footer and “The data” panel show `[ LIVE ]`.
- [ ] Every numeric block (measurements, series, recovery, pulse) can be overridden
      without touching prose or components.
- [ ] A bad/partial payload falls back to local data and shows the warning state.
- [ ] `/health` answers in < 200 ms; `/study-areas` is cached for repeat visits.
- [ ] Scene imagery, if added, carries attribution, acquisition date, product level,
      and a “not simulated” flag.
- [ ] No response is presented as official NISAR data unless it is.
