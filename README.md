# Sothis Echo

An interactive NISAR story about the changes a camera misses: the 2026 Central
Vietnam flood and the 2026 West Attica wildfire, read through radar.

**Live demo:** https://sothisecho.vercel.app

Built for the NASA Space Apps Challenge. NISAR is a partnership between NASA and
ISRO; this is an independent, open-source educational prototype.

## What is inside

- **NISAR 101** — the mission, the two radar bands, the 12-day repeat, and why
  radar sees structure and moisture instead of colour.
- **Camera vs radar slider** — drag a divider between a cloud-blinded optical
  scene and the same place in radar.
- **Two post-launch study areas** — the September 2026 Central Vietnam flood and
  the July 2026 West Attica (Greece) wildfire. Both happened after NISAR began
  returning data. Each has before/after scenes, “what happened / why radar saw
  it / read the polarization” boxes, and a side-by-side comparison.
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

### Why the wildfire window is inland, not on the shore

The wildfire area was first sampled on the shoreline of the Alkyonides Gulf, which
put roughly half of its 512×512 window (≈5 × 5 km) over open water. Sea
backscatter is wind-driven, so the absolute VV level and the VV−VH gap followed
the wind rather than the fire (30 Jul 2026: VV −15.1 dB, VH −29.2 dB; 5 Aug 2026:
VV −21.5 dB, VH −30.7 dB — a gap that moved by 5 dB for no ground reason).

The sample point now sits inland in the West Attica hills (Mount Pateras /
Dervenochoria), so the window is land only. The polarisation gap is stable across
passes, so the change that remains is the scar itself rather than wind over water.

See [`BACKEND_API_SPEC.md`](./BACKEND_API_SPEC.md).

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
  data/            study areas, quiz rounds, localization helper
  services/        scene renderer, sonifier, recovery maths, API adapter
  context/         language, public/researcher mode, site data
  components/      one section per idea + shared terminal UI primitives
  i18n/            English + Arabic UI strings
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
