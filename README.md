# Sothis Echo

An interactive NISAR story about the changes a camera misses: a cyclone-flooded
mangrove delta and a Sierra Nevada burn scar, read through radar.

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
- **Sonification** — “hear the dance”: one pulse per satellite pass, pitch and
  rhythm driven by the change series, with a stable reference to compare against.
- **Recovery clock** — choose a target percentage of the pre-event signal and get
  an interpolated recovery time, marked measured or projected.
- **Radar detective** — four rounds of before/after radar pairs with evidence
  revealed after answering.
- **Public / Researcher modes** — the same story at two depths. Researcher mode
  adds acquisition notes, dB tables, methods, failure modes, sources, and the API
  contract.
- **Bilingual** — English and Arabic (RTL), with a persisted language choice.

## Data honesty

Narrative, mission facts, event dates and scattering physics are real or
literature-informed. With the local backend running (`npm run api`), the study
areas use **real Sentinel-1 GRD scenes** from Earth Search + AWS Open Data: real
acquisition dates, real quicklook images, and backscatter statistics read from a
512×512 COG window around each site. Values are **relative dB** (from GRD digital
numbers), not calibrated σ⁰. Without the backend, the bundled illustrative
dataset is used and labelled as such.

See [`BACKEND_API_SPEC.md`](./BACKEND_API_SPEC.md).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run preview
```

No API key is required for the demo. A complete local backend ships in
[`server/`](./server/README.md):

```bash
npm run api     # http://127.0.0.1:3001
# then set VITE_API_BASE_URL=http://127.0.0.1:3001/api in .env.local
```

With no base URL, the app performs **zero** network requests (apart from web
fonts) and shows the labelled local dataset.

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

Frontend & project lead: gaballahtech · Backend: Mohamed Khider · Research:
Jana Ayman · Visual identity: Ahd Fayez.
