# Sothis Echo — Backend

A complete, dependency-free Node backend for the Sothis Echo demo. It implements
both the **live SAR workflow** from the frontend guide and the **UI contract**
used by the app.

```bash
npm run api
# [SOTHIS API] http://0.0.0.0:3001
```

Then point the frontend at it:

```bash
# .env.local
VITE_API_BASE_URL=http://127.0.0.1:3001/api
```

With no `VITE_API_BASE_URL`, the frontend still runs entirely offline.

## Real Sentinel-1 data (default)

The `/api/study-areas` response is built from **real Sentinel-1 GRD** scenes:

- [Earth Search STAC](https://earth-search.aws.element84.com/v1) finds scenes
  around each study area's event date.
- Public **AWS Open Data COGs** (`sentinel-s1-l1c`) are read with HTTP range
  requests: only a **512×512 window** around each site is downloaded.
- Real **quicklook PNGs** become the scene images (`imageUrl`).
- Measurements/series/recovery are derived from the real GRD digital numbers.

Values are **relative amplitude dB** (`20·log10(DN / 1000)`), not calibrated σ⁰.
The UI labels them as live and uncalibrated. No Earthdata login and no multi-GB
download are required.

The first request takes ~30–40 s (12 COG windows); results are cached for 6 h.
Use `POST /api/live/refresh` to clear the cache, or set `REAL_DATA=0` to serve
the labelled fixtures instead.

## Live SAR workflow

```
POST /api/search/   →   GET /api/scenes/   →   POST /api/scenes/:id/geotiff/   →   POST /api/scenes/:id/analyze/
```

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health/` | Health check |
| POST | `/api/search/` | Search scenes by WKT (`wkt` required, `start_date`, `end_date`, `platform` optional) |
| GET | `/api/scenes/` | All saved scenes |
| GET | `/api/scenes/:id/` | One scene |
| POST | `/api/scenes/:id/geotiff/` | multipart `vv_file` (required), `vh_file`, `max_bytes` |
| POST | `/api/scenes/:id/analyze/` | JSON `prompt` (required), `requested_model`, `point` or `box` |

`/analyze/` requires `/geotiff/` first for the same scene. Models:
`auto`, `gemini_only`, `prithvi`, `sam_hq`.

### GeoAI

When `GEOAI_BASE_URL` is set (default: the Hugging Face Space), the backend
uploads the GeoTIFF, calls the Gradio `/analyze` endpoint, reads the SSE result,
and stores `analysis_report = { route, report }` on the scene. If GeoAI is
unreachable it returns **502**. With `GEOAI_BASE_URL=''` it returns a
deterministic demo report so the UI works offline.

### Errors

- `400` — bad `wkt`, missing `prompt`, both `point` + `box`, invalid model.
- `404` — unknown scene/site.
- `413` — payload too large.
- `422` — GeoTIFF over the byte budget.
- `502` — GeoAI/ASF failure.

## UI contract (used by the React app)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/nisar/status` | Hero `LIVE` status |
| GET | `/api/study-areas` | Whole-page study-area catalogue |
| GET | `/api/study-areas/:id` | One site |
| GET | `/api/sites/:id/series` | Backscatter series |
| GET | `/api/sites/:id/recovery` | Recovery curve |
| GET | `/api/sonification/:id` | 16-pass pulse arrays |
| GET | `/api/scenes/:siteId/:state` | Scene image metadata |
| GET | `/api/attribution/:id` | Provenance block |

The UI merges only numeric fields over its bundled narrative. Missing/partial
payloads fall back to the labelled local dataset.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_PORT` | `3001` | Port |
| `API_HOST` | `0.0.0.0` | Bind host |
| `CORS_ORIGIN` | `*` | Allowed origin |
| `MAX_GEOTIFF_BYTES` | `104857600` | 100 MB budget |
| `GEOAI_BASE_URL` | Hugging Face Space | Set empty to use demo report |
| `GEOAI_TIMEOUT` | `120000` | GeoAI timeout (ms) |

> The seeded scenes are fixtures. They are clearly labelled and are **not**
> official NISAR products.
