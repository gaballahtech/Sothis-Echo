<div align="center">

# Sothis Echo

### Radar stories of a changing Earth — an interactive NISAR mission explorer

> **Note on scope:** This project evolved after the initial submission to process **real NISAR L-band data** for two measured study areas — **Big Sur** (wildfire) and **Sundarbans / Central Vietnam** (flood) — using the highest-quality scenes available.
>
> Two major updates since: **Sothis AI — Data Guide** (a RAG-grounded, context-aware chat assistant) and **Parametric Recovery Models with Uncertainty** (physics-informed recovery curves with confidence intervals and internal validation).

[![Live demo](https://img.shields.io/badge/Live%20Demo-sothisecho.vercel.app-brightgreen?style=for-the-badge)](https://sothisecho.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![English + العربية](https://img.shields.io/badge/i18n-English%20%7C%20العربية-blue)](https://sothisecho.vercel.app)

</div>

---

**Sothis Echo** is an interactive, bilingual (English / العربية) story about the
changes a camera misses — told through radar. It follows two real 2026 events, the
**Central Vietnam flood** and the **Big Sur (California) megafire**, using real
**NASA NISAR L-band** data to show how Synthetic Aperture Radar sees through cloud,
smoke and darkness.

> **Live:** <https://sothisecho.vercel.app> · Built for the **NASA Space Apps Challenge**.

<details open>
<summary><strong>Table of contents</strong></summary>

- [Why this project](#why-this-project)
- [Highlights](#highlights)
- [What's inside](#whats-inside)
- [Quick start](#quick-start)
- [Data honesty](#data-honesty)
- [Architecture](#architecture)
- [Testing](#testing)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)
- [Acknowledgments](#acknowledgments)

</details>

## Why this project

- **A camera stops at cloud.** NISAR's radar sees shape, roughness and moisture
  day or night — the story a camera physically cannot tell.
- **NISAR returns data no one is reading.** Launched in 2025, it maps nearly all of
  Earth's land and ice every 12 days, free and open, but the data is hard to parse.
- **Radar is learnable.** Most people meet radar through satellite images with no
  bridge to *why* they look the way they do. Sothis Echo is that bridge.
- **Honest by design.** Every number is computed from a real granule and names its
  source; where a measurement is unavailable, the site says so instead of inventing one.

## Highlights

| | |
|---|---|
| 🛰️ **Real NISAR L-band data** | GCOV browse cards + a calibrated HH/HV backscatter series |
| 🔬 **Three independent lenses** | Amplitude · InSAR coherence · dual-pol scattering mechanism |
| 🌍 **Global field guide** | Change sites across six continents, two fully measured |
| 🤖 **Sothis AI** | Grounded chat assistant about NISAR, radar and the data |
| 🔊 **Sonification** | Hear the satellite-pass series as sound |
| 🗣️ **Fully bilingual** | English + Arabic with full RTL, persisted choice |

## What's inside

- **NISAR 101** — the mission, the two radar bands, the 12-day repeat, and why
  radar sees structure and moisture instead of colour.
- **Camera vs radar slider** — drag a divider between a cloud-blinded optical
  basemap and the same place in radar, with an honest note on time alignment.
- **Two post-launch study areas** — the September 2026 Central Vietnam flood and
  the August 2026 Big Sur megafire. Each has before/after scenes, "what happened /
  why radar saw it / read the polarization" boxes, and a swipe comparison.
- **Three lenses (J1)** — the same pair read three ways: L-band **amplitude**
  (HH/HV and the change in each), **InSAR coherence** (where the ground stayed the
  same vs broke up), and a **dual-pol scattering mechanism** decomposition
  (surface / volume / low-return). Every number is computed from real NISAR
  granules; unavailable lenses say so instead of faking a value.
- **Global atlas (J2)** — a curated inline-SVG world map with change sites across
  six continents, coloured by change type. Two sites are *fully measured* from real
  NISAR lenses; the rest are **field-guide entries** that explain how NISAR detects
  each hazard type — clearly labelled, never invented.
- **Explain the echo (J3)** — a grounded, numbers-first physical hypothesis for the
  selected site, plus an **Ask the radar** box. Every claim names the measurement
  behind it; out-of-scope questions are refused, never invented.
- **Rapid response (J4)** — an actionable situation report from real change stats:
  extent (km²), population exposed (WorldPop, labelled an estimate), dominant
  mechanism, and a one-page shareable PNG drawn client-side.
- **Sonification** — "hear the dance": the satellite-pass series resampled to 16
  steps, with pitch and rhythm driven by change, scaled to the record's peak.
- **Time series** — every real NISAR pass in order, animated with a playhead; the
  line is calibrated HH backscatter (dB) and the bars are the change metric. It has
  its **own site selector** and stays in sync with the global selection.
- **Recovery clock** — choose a target percentage of the pre-event signal and get an
  interpolated recovery time, marked measured or projected.
- **Radar detective** — a timed reasoning game over real change maps; evidence is
  revealed only after you answer.
- **Sothis AI** — a bilingual chat assistant (English / العربية) that answers
  questions about NISAR, radar physics and the page's data. It is grounded in the
  selected site's context and uses Google Gemini (`gemini-3.1-flash-lite`) with
  retry — no image analysis, just the science.
- **Public / Researcher modes** — the same story at two depths. Researcher mode adds
  acquisition notes, dB tables, methods, failure modes, sources, and the API contract.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run preview
```

No API key is required for the core demo. A complete local backend ships in
[`server/`](./server/README.md):

```bash
npm run api     # http://127.0.0.1:3001
# then set VITE_API_BASE_URL=http://127.0.0.1:3001/api in .env.local
```

To enable the **Sothis AI** chat, set `GEMINI_API_KEY` in the environment
(`.env.local` locally, or the Vercel project env var). Without it, the assistant
shows a graceful "temporarily unavailable" message instead of failing.

On a host that mounts `server/api.mjs` on its own origin (the Vercel function), the
app probes `/api/health` and uses `/api` automatically, so deployments and previews
work without the variable. Locally — and anywhere else with no base URL — it performs
**zero API requests** and shows the labelled local dataset.

## Data honesty

Narrative, mission facts, event dates and scattering physics are real or
literature-informed. With the backend running (`npm run api` or the deployed API),
the production study areas combine two real sources:

- **NISAR L-band cards** — the `before`, `after`, and `change` cards render
  geo-referenced **NASA NISAR L2 GCOV browse imagery** from the NASA ASF DAAC,
  cropped server-side to the study window. Each card shows the official
  **Granule ID** and acquisition time. The `change` card is a pixel-level
  `|After − Before|` difference map built from the two browse images.
- **Sentinel-1 GRD time series** — acquisition dates and backscatter statistics come
  from Earth Search + AWS Open Data, read from a 512×512 COG window around each
  site. Values are **relative dB** (from GRD digital numbers), not calibrated σ⁰.

The NISAR browse cards are visual evidence, not calibrated radiometry; the
quantitative series remains Sentinel-1 GRD. If no NISAR granule covers a site, the
cards fall back to the Sentinel-1 quicklook and say so. Without the backend, the
bundled illustrative dataset is used and labelled as such.

### Coherence and scattering mechanism

The **Three Lenses** panel computes all three lenses from real NISAR granules and
caches them in `server/cache/nisar/bigsur-lenses.mjs` (built by
`scripts/build-lenses.py`):

- **Amplitude** — mean HH/HV in dB from the before/after GCOV pair, plus the per-pol
  change. Big Sur 16→28 Aug 2026: HH −11.6 → −11.9 dB (−0.3), HV −17.2 → −17.1 dB
  (+0.1) — brightness held, so the surface did not simply go dark.
- **InSAR coherence** — mean coherence and the share of low-coherence pixels from a
  curated GUNW/GSLC pair on the same track/frame. Big Sur: mean 0.546, 32.7 % of
  pixels below the low-coherence threshold — a collapse consistent with physical
  disturbance (the burn scar), even where HH stayed bright.
- **Dual-pol mechanism** — a surface / volume / low-return decomposition from the
  HH–HV pair (the only pol available; no quad-pol GCOV exists over these sites).
  Big Sur 16→28 Aug 2026: low-return rose 4.5 % → 11.6 % and surface scattering fell
  43.4 % → 37.0 %, the expected signature of canopy loss.

Where a lens is genuinely unavailable (e.g. no curated coherence pair), the UI says
**unavailable** rather than substituting a synthetic value.

### Population (Rapid Response)

Population exposed is an **estimate**: the site's changed area (km²) multiplied by
the **WorldPop Global2 R2025A 100 m** population density for the site's bounding box,
queried live from the WorldPop API. Totals are rounded and clearly labelled; if
WorldPop is unreachable the field reads **unavailable**, never a guessed number.

See [`BACKEND_API_SPEC.md`](./BACKEND_API_SPEC.md) for the full API contract.

## Architecture

```
src/
  data/            study areas, global atlas, quiz rounds, localization helper
  services/        scene renderer, sonifier, recovery maths, API adapter
  context/         language, public/researcher mode, site data
  components/      one section per idea + shared terminal UI primitives
                   (incl. AIChat, TimeSeries, AtlasSection, Lenses, SeeThrough)
  i18n/            English + Arabic UI strings (379 keys, parity-checked)
server/
  api.mjs          HTTP router (study areas, lenses, explain, rapid-response, ask)
  nisar.mjs        NISAR snapshot/lens access
  sentinel.mjs     Sentinel-1 GRD fallback series
  explain.mjs      grounded, numbers-first explanation engine
  rapid.mjs        rapid-response stats + WorldPop population
  mock-api.mjs     offline mock backend
  cache/nisar/     committed real-granule snapshots (amplitude, coherence, mechanism)
scripts/
  build-lenses.py           GCOV/GSLC lens builder (writes cache/nisar/<site>-lenses.mjs)
  build-nisar-snapshots.py  NISAR GCOV browse/card snapshots
  build-nisar-recovery.py   recovery-curve fit from real passes
  i18n-parity.mjs           EN/AR key-parity check
```

The visual system is a terminal / phosphor-monitor aesthetic: monospace, zero-radius
panes, bracket buttons, ASCII dividers, blinking cursors, and a subtle CRT overlay.
Motion respects `prefers-reduced-motion`; the scene slider is keyboard-operable, and
all interactive controls are real buttons/inputs.

## Testing

```bash
npm run test:e2e                    # Playwright end-to-end suite
node scripts/i18n-parity.mjs        # EN/AR key parity (379 keys)
```

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for
local setup, testing, and pull-request guidelines, and our
[Code of Conduct](./CODE_OF_CONDUCT.md). By participating you agree to abide by it.

## Team

| Role | Member |
|------|--------|
| Frontend & project lead | Abdelrahman Gaballah |
| Backend | Mohamed Khider |
| Research | Jana Ayman · Nouran Ahmed |
| Visual identity | Ahd Fayez · Mariam Emad |

## License

Released under the [MIT License](./LICENSE).

## Acknowledgments

- [NASA NISAR](https://nisar.jpl.nasa.gov/mission/quick-facts) and
  [ISRO](https://bhoonidhi.nrsc.gov.in/NISAR/NisarProducts.html) for the mission and open data.
- [NISAR Science Users' Handbook](https://dataverse.jpl.nasa.gov/api/access/datafile/97405?gbrecs=true).
- [ASF DAAC](https://asf.alaska.edu/) for NISAR GCOV browse imagery.
- [WorldPop](https://www.worldpop.org/) for population estimates.
- Built for the **NASA Space Apps Challenge**.

<div align="center">

**NISAR facts:** Launched 30 July 2025 on GSLV-F16 · 747 km sun-synchronous orbit ·
12-day exact repeat · L-band 24 cm (NASA) + S-band 9.4 cm (ISRO) · >240 km swath ·
3–10 m resolution · free and open data.

</div>