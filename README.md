# Sothis Echo

An interactive NISAR story about the changes a camera misses: the 2026 Central
Vietnam flood and the 2026 Big Sur (California) megafire, read through radar.

**Live demo:** https://sothisecho.vercel.app

Built for the NASA Space Apps Challenge. NISAR is a partnership between NASA and
ISRO; this is an independent, open-source educational prototype.

## What is inside

- **NISAR 101** — the mission, the two radar bands, the 12-day repeat, and why
  radar sees structure and moisture instead of colour.
- **Camera vs radar slider** — drag a divider between a cloud-blinded optical
  scene and the same place in radar.
- **Two post-launch study areas** — the September 2026 Central Vietnam flood and
  the August 2026 Big Sur (California) megafire. Both happened after NISAR began
  returning data. Each has before/after scenes, “what happened / why radar saw
  it / read the polarization” boxes, and a side-by-side comparison.
- **Three lenses (J1)** — the same pair read three ways: L-band **amplitude**
  (HH/HV and the change in each), **InSAR coherence** (where the ground stayed
  the same vs broke up), and a **dual-pol scattering mechanism** decomposition
  (surface / volume / low-return). Every number is computed from real NISAR
  granules; where a lens is unavailable it says so instead of faking a value.
- **Global atlas (J2)** — a curated inline-SVG world map with 11 change sites
  across six continents, coloured by change type (flood, wildfire, glacier,
  volcano, deforestation, subsidence, oil spill, crop, earthquake). Sites with
  real lens data are marked *measured*; the rest are honest stories awaiting
  their first granule. Honest on-demand *explore* covers featured regions only.
- **Explain the echo (J3)** — a grounded, numbers-first physical hypothesis for
  the selected site, plus an **Ask the radar** box. Every claim names the
  measurement behind it; out-of-scope questions are refused, never invented.
- **Rapid response (J4)** — an actionable situation report from real change
  stats: extent (km²), population exposed (WorldPop, labelled an estimate),
  dominant mechanism, and a one-page shareable PNG drawn client-side.
- **Sonification** — “hear the dance”: the satellite-pass series resampled to 16
  steps, with pitch and rhythm driven by change, scaled to the record’s peak.
- **Recovery clock** — choose a target percentage of the pre-event signal and get
  an interpolated recovery time, marked measured or projected.
- **Radar detective** — two real post-launch cases with evidence revealed after
  answering.
- **Public / Researcher modes** — the same story at two depths. Researcher mode
  adds acquisition notes, dB tables, methods, failure modes, sources, and the API
  contract.
- **Bilingual** — English and Arabic (RTL), with a persisted language choice.

## Data honesty

Narrative, mission facts, event dates and scattering physics are real or
literature-informed. With the backend running (`npm run api` or the deployed
API), the production study areas combine two real sources:

- **NISAR L-band cards** — the `before`, `after`, and `change` cards render
  geo-referenced **NASA NISAR L2 GCOV browse imagery** from the NASA ASF DAAC,
  cropped server-side to the study window. Each card shows the official
  **Granule ID** and acquisition time. The `change` card is a pixel-level
  `|After − Before|` difference map built from the two browse images.
- **Sentinel-1 GRD time series** — acquisition dates and backscatter statistics
  come from Earth Search + AWS Open Data, read from a 512×512 COG window around
  each site. Values are **relative dB** (from GRD digital numbers), not
  calibrated σ⁰.

The NISAR browse cards are visual evidence, not calibrated radiometry; the
quantitative series remains Sentinel-1 GRD. If no NISAR granule covers a site,
the cards fall back to the Sentinel-1 quicklook and say so. Without the backend,
the bundled illustrative dataset is used and labelled as such.

### Coherence and scattering mechanism

The **Three Lenses** panel computes all three lenses from real NISAR granules
and caches them in `server/cache/nisar/bigsur-lenses.mjs` (built by
`scripts/build-lenses.py`):

- **Amplitude** — mean HH/HV in dB from the before/after GCOV pair, plus the
  per-pol change. Big Sur 16→28 Aug 2026: HH −11.6 → −11.9 dB (−0.3), HV
  −17.2 → −17.1 dB (+0.1) — brightness held, so the surface did not simply go
  dark.
- **InSAR coherence** — mean coherence and the share of low-coherence pixels
  from a curated GUNW/GSLC pair on the same track/frame. Big Sur: mean 0.546,
  32.7 % of pixels below the low-coherence threshold — a collapse consistent
  with physical disturbance (the burn scar), even where HH stayed bright.
- **Dual-pol mechanism** — a surface / volume / low-return decomposition from
  the HH–HV pair (the only pol available; no quad-pol GCOV exists over these
  sites). Big Sur 16→28 Aug 2026: low-return rose 4.5 % → 11.6 % and surface
  scattering fell 43.4 % → 37.0 %, the expected signature of canopy loss.

Where a lens is genuinely unavailable (e.g. no curated coherence pair), the UI
says **unavailable** rather than substituting a synthetic value.

### Population (Rapid Response)

Population exposed is an **estimate**: the site's changed area (km²) multiplied
by the **WorldPop Global2 R2025A 100 m** population density for the site's
bounding box, queried live from the WorldPop API. Totals are rounded and clearly
labelled; if WorldPop is unreachable the field reads **unavailable**, never a
guessed number.

See [`BACKEND_API_SPEC.md`](./BACKEND_API_SPEC.md) for the full API contract.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

No API key is required for the demo. A complete local backend ships in
[`server/`](./server/README.md):

```bash
npm run api     # http://127.0.0.1:3001
# then set VITE_API_BASE_URL=http://127.0.0.1:3001/api in .env.local
```

On a host that mounts `server/api.mjs` on its own origin (the Vercel function),
the app probes `/api/health` and uses `/api` automatically, so deployments and
previews work without the variable. Locally — and anywhere else with no base
URL — it performs **zero API requests** (the hero video and web fonts still
load) and shows the labelled local dataset.

## Structure

```
src/
  data/            study areas, global atlas, quiz rounds, localization helper
  services/        scene renderer, sonifier, recovery maths, API adapter
  context/         language, public/researcher mode, site data
  components/      one section per idea + shared terminal UI primitives
  i18n/            English + Arabic UI strings
server/
  api.mjs          HTTP router (study areas, lenses, explain, rapid-response, explore)
  nisar.mjs        NISAR snapshot/lens access
  explain.mjs      grounded, numbers-first explanation engine
  rapid.mjs        rapid-response stats + WorldPop population
  cache/nisar/     committed real-granule snapshots (amplitude, coherence, mechanism)
scripts/
  build-lenses.py  GCOV/GSLC lens builder (writes cache/nisar/<site>-lenses.mjs)
```

The visual system is a terminal / phosphor monitor aesthetic: monospace,
zero-radius panes, bracket buttons, ASCII dividers, blinking cursors, and a
subtle CRT overlay. Motion respects `prefers-reduced-motion`; the scene slider is
keyboard-operable, and all interactive controls are real buttons/inputs.

## NISAR facts used

Launched 30 July 2025 on GSLV-F16 · 747 km sun-synchronous orbit · 12-day exact
repeat (~6-day revisit with ascending + descending) · L-band 24 cm (NASA) +
S-band 9.4 cm (ISRO) · >240 km swath · 3–10 m resolution · free and open data.

Sources: [NASA NISAR](https://nisar.jpl.nasa.gov/mission/quick-facts),
[NISAR Science Users’ Handbook](https://dataverse.jpl.nasa.gov/api/access/datafile/97405?gbrecs=true),
[ASF DAAC](https://asf.alaska.edu/),
[ISRO Bhoonidhi](https://bhoonidhi.nrsc.gov.in/NISAR/NisarProducts.html).

## Team

Frontend & project lead: Abdelrahman Gaballah - Backend: Mohamed Khider 
Research: Jana Ayman & Nouran Ahmed 
Visual identity: Ahd Fayez & Mariam Emad
## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup, end-to-end testing,
and pull request guidelines. By participating you agree to the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## License

Released under the [MIT License](./LICENSE).
