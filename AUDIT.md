# Sothis Echo — Audit & Readiness Review

> Perspective: auditor (not developer). Reviewed against the **2026 NASA Space Apps Challenge — "Dancing with SAR / NISAR"** brief (Advanced · Earth Science) and the repository's own `BACKEND_API_SPEC.md`. Goal: maximise judging score and leave the frontend ready for the backend my teammate will build.

## 1. Scorecard vs. the brief

| Brief requirement | Status | Evidence |
|---|---|---|
| Interactive app using NISAR SAR data | ✅ | `SceneCanvas`, `StudyAreas`, `Recovery`, `Detective` |
| Track/visualise one or more surface changes | ✅ | 2 sites × before/after (flood, wildfire) |
| Intuitive, innovative visualisations | ✅ | optical↔radar slider, sonification, recovery curve, detective game |
| Change-detection maps / time series / dashboards | ⚠️ Partial | series exists as table; added SVG time-series chart + world map |
| Accessible to broad audience (EN/AR, public/researcher) | ✅ | i18n RTL, public/researcher disclosures |
| Open-source, user-friendly | ✅ | GitHub + README |
| Hypothesise physical drivers | ✅ | "what happened / why radar saw it" boxes |
| Different polarisations / frequencies | ✅ | VV/VH, L-band vs C-band notes |
| Time series from multiple dates | ✅ | `series[]` per site |
| Ancillary datasets (population, vegetation type) | ❌ Missing | only terrain/soil/canopy/driver tags |
| Human drivers (agriculture, industry) | ⚠️ | implied, not explicit |
| Interactive web map | ⚠️ | added lightweight SVG world map (no deps) |
| Personal context / "hometown" | ❌ | only 2 global sites |
| Compelling storytelling | ✅ | strong narrative copy |
| "Not simulated" honesty | ✅ | labels + disclosure |

## 2. Gaps that cost points (prioritised)

### P1 — Must fix before submission
1. **Footer pointed at the old repo** (`aura-sar-frontend`) → fixed to `Sothis-Echo`.
2. **`.env.example` still branded "Dancing with SAR"** → fixed.
3. **Mission status never displayed** — `loadMissionStatus()` existed but was unused, so the hero could never show `[LIVE]`. → wired into `Hero` (shows `LIVE/LOCAL` + last acquisition when backend configured).
4. **No time-series visualisation** — data existed but only as a table. → added SVG backscatter chart (VV/VH over time) in the measurements panel.
5. **No geospatial context** — challenge asks for "web maps". → added dependency-free SVG world map with clickable pins as a site picker.

### P2 — Should add (content/UX)
6. **Only 2 study areas** — brief encourages "locations around the world" and personal context. Recommend adding 1–2 more (e.g. glacier / urban subsidence / earthquake) so the "around the world" claim holds. Data authoring only; renderer already supports `kind`.
7. **Ancillary context missing** — add population/vegetation-type/area fields to site tags (e.g. "Population exposed", "Ecosystem"). Low effort, high judging value.
8. **Human drivers not explicit** — add a short "human driver" line per site (agriculture, logging, urbanisation).
9. **Scene imagery not yet wired** — backend can return real GeoTIFF/PNG; frontend now accepts `imageUrl`/`opticalUrl` on scene states and renders `<img>` when present, else procedural canvas. Attribution/acquiredAt/product/notSimulated fields are merged. → ready.
10. **Accessibility/i18n polish of new widgets** — world map and chart have `role="img"` + `aria-label`; verify colour contrast on the phosphor theme.

### P3 — Nice to have
11. Animate the time series (pass-by-pass) to match "time-series animations".
12. Export a one-page PDF report per site (currently only CSV/JSON).
13. Offline/PWA cache for the demo (zero-network claim).

## 3. Backend readiness — what the frontend now supports

Implemented in `src/services/sarApi.js`:
- `loadStudyAreas()` (existing) — merges numeric fields over local narrative.
- `loadMissionStatus()` (now actually used by `Hero`).
- `loadSite(id)`, `loadSeries(id, {start,end})`, `loadRecovery(id, threshold)`, `loadSonification(id)`, `loadSceneMeta(id, state)`, `loadAttribution(id)`, `loadHealth()` — thin, validated adapters for every endpoint in `BACKEND_API_SPEC.md` §3.

Merge behaviour (unchanged contract):
- Numeric fields validated & clamped (`vv/vh` dB, 0–1 fractions, 0–100 %, 16-value pulse).
- Malformed/partial payloads fall back to the labelled local dataset silently; UI shows `[LOCAL]`.
- Scene states now also merge `imageUrl`, `opticalUrl`, `attribution`, `acquiredAt`, `product`, `notSimulated`.

### Contract gaps the backend (teammate) must close
- `/health` and `/nisar/status` are specified but the mock only returns `phase: "fixture"`; real implementation should return `{ operational, phase, lastAcquisition, nextAcquisition, products }`.
- `/scenes/:id/:state` and `/scenes/.../tiles/...` are specified but not implemented in the mock — needed for real imagery + attribution (acceptance criterion §5.6).
- `/attribution/:id` specified but not implemented in the mock.
- Cache headers: spec asks `Cache-Control: public, max-age=300` for mission status; mock uses `no-store`. Adjust for production.
- CORS: mock uses `*`; production must allow the deployed frontend origin.
- `source` field: mock sets `source: 'fixture'`; frontend ignores unknown fields, but if the backend wants `[LIVE]` it must return 2xx with non-empty `/study-areas`. Already works.

### Data-honesty invariant (do not break)
- Narrative/prose stays in the bundle; backend owns numbers, images, provenance.
- Never label an illustrative scene as a NISAR product. Scene imagery must carry `attribution`, `acquiredAt`, `product`, and a `notSimulated` flag before the UI shows it as live.
- With `VITE_API_BASE_URL` unset, the app must make **zero** network requests (apart from web fonts). Verified by acceptance criteria §5.1.

## 4. Files touched in this audit pass
- `src/components/Footer.jsx` — repo link
- `.env.example` — rebrand
- `src/components/Hero.jsx` — mission status wiring
- `src/services/sarApi.js` — scene-image merge + 7 new adapters
- `src/components/SceneCanvas.jsx` — optional real imagery
- `src/components/StudyAreas.jsx` — world map + time-series chart
- `AUDIT.md` — this document

## 5. Recommended next moves
1. Teammate: implement `/health`, `/nisar/status`, `/scenes/:id/:state`, `/attribution/:id` in the backend; set cache headers + CORS.
2. Content: add 1–2 study areas (glacier/subsidence) + ancillary context fields (population, vegetation type, human driver).
3. Frontend: animate the time-series chart; add per-site PDF export; consider PWA caching.
4. Re-run `npm run build` + `npx playwright test` after each change (currently 9/9 green).
