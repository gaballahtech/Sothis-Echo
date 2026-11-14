# Sothis Echo — Complete Site Guide

> An interactive NISAR story: "Earth is always dancing." Built for the NASA Space
> Apps Challenge (NISAR track). Frontend-only educational prototype with an
> API-ready data layer.

---

## 1. Project identity

- **Name:** Sothis Echo / صدى الأرض (rebranded from "Dancing with SAR").
- **Stack:** Vite 8 + React 19 + Blueprint.js 6 + i18next.
- **Node:** 26. **Dev server:** http://localhost:3000 (binds localhost).
- **Repo:** https://github.com/gaballahtech/Sothis-Echo (branch `main`).
- **RAM budget:** < 100 MB. Terrain canvas: 18×16 mesh, dpr cap 1.5, idle
  throttle ~30 fps, IntersectionObserver pause.

## 2. Run & build

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (~2-4s)
npm run preview  # preview build
npx playwright test   # e2e (9 tests)
```

No API key required for the demo. To connect a backend:

```bash
cp .env.example .env.local
# set VITE_API_BASE_URL=http://localhost:3001/api
```

With no base URL, the app performs **zero** network requests (apart from web
fonts) and shows the labelled local dataset.

## 3. Directory structure

```
src/
  main.jsx              entry
  index.css             global styles (square system, fonts, themes)
  data/
    sites.js            study areas, contrast rows, series, recovery
    quiz.js             detective rounds + evidence builder
    navigation.js       nav items
    localized.js        localized() helper
    observations.js     observation ledger rows
  services/
    sceneRenderer.js    procedural radar scene canvas painter
    sonifier.js         Web Audio sonification
    recovery.js         recovery curve maths + Arabic plural
    sarApi.js           backend adapter (all endpoints)
  context/
    LanguageContext.jsx locale + RTL
    SiteDataContext.jsx data source of truth (merges API over local)
    TourContext.jsx     guided tour state
  components/
    Hero.jsx            landing + mission status (LIVE/LOCAL)
    Mission.jsx         NISAR 101 + details
    SeeThrough.jsx      optical vs radar slider
    StudyAreas.jsx      sites, scenes, observations table, researcher docs
    Sound.jsx           sonification UI
    Recovery.jsx        recovery clock
    Detective.jsx       radar detective game
    Method.jsx          data docs + downloads
    Team.jsx            team
    Footer.jsx          footer
    Navbar.jsx          nav + language toggle
    ui.jsx              shared primitives (Panel, SectionHead, Meter, ...)
    SceneCanvas.jsx     canvas/img scene renderer wrapper
    ErrorBoundary.jsx
  i18n/index.js         EN + AR strings
tests/e2e/              Playwright tests
BACKEND_API_SPEC.md     API contract
AUDIT.md                audit + readiness review
```

## 4. Features (sections)

1. **Hero** — title "Earth is always dancing.", subtitle, CTAs, hero video,
   mission status chip (LIVE/LOCAL + last acquisition when backend configured).
2. **Mission (NISAR 101)** — cards (radar not camera, two bands, 12-day
   heartbeat, free & open), mission card facts, timeline, details (collapsible).
3. **See-through (Camera vs radar)** — draggable divider, keyboard-operable,
   captions, legend, callout.
4. **Study areas** — site picker tabs, before/after scene pair, "what
   happened / why radar saw it / read the polarization" boxes, side-by-side
   comparison, observation ledger table, researcher docs (acquisition,
   interpretation, limits, methods, sources), CSV download.
5. **Sonification** — stable vs changing surface, play/stop, pass counter,
   mapping legend, no-support fallback.
6. **Recovery** — target slider, estimated time, normalized recovery chart,
   method explanation, caveat.
7. **Detective** — 4 rounds, before/after scenes, options (shuffled per round),
   evidence after answer, score, streak, timer, progress dots, confetti/shake.
8. **Method / Data** — data source status, endpoints, limits, sources,
   downloads, version, disclosure, no-backend note.
9. **Team** — members + links.
10. **Footer** — links, disclosure.

## 5. Theming & styling

- Square-dominant: `border-radius: 0` on Blueprint primitives via overrides.
- Fonts: Newsreader, Instrument Sans, JetBrains Mono, Alexandria, IBM Plex Sans Arabic.
- Section hues via CSS variables (`--te-*`).
- RTL: table inner `dir=ltr` with reversed columns in Arabic.
- RTL floating elements handled.
- Tour spotlight card, sound boot.

## 6. Internationalization

- `src/i18n/index.js` holds `en` and `ar` dictionaries.
- Storage key: `sothis-echo-language` (legacy fallback `dancing-with-sar-language`).
- Language toggle button shows the *other* language, min-height 32px.
- Dates use `numberingSystem: 'latn'` (Western digits) in Arabic.
- Arabic plural: recovery months → 1 "شهر واحد", 2 "شهرين", 3–10 "أشهر", ≥11 "شهرًا".
- Comparison bar labels split `t('seeThrough.optical').split(' · ')[0]`.

## 7. Data layer & backend readiness

- `SiteDataContext` is the source of truth; merges API over local narrative.
- `sarApi.js` adapters: `loadStudyAreas`, `loadMissionStatus`, `loadSite`,
  `loadSeries`, `loadRecovery`, `loadSonification`, `loadSceneMeta`,
  `loadAttribution`, `loadHealth`, `buildSiteCsv`.
- Merge rules: numeric fields validated & clamped; malformed payloads fall back
  silently; UI shows `[LOCAL]`/`[LIVE]`.
- Scene states merge `imageUrl`, `opticalUrl`, `attribution`, `acquiredAt`,
  `product`, `notSimulated`; `SceneCanvas` renders `<img>` when `imageUrl`
  present, else procedural canvas.
- Data honesty: narrative stays in bundle; backend owns numbers/images/provenance.
  No "simulated/illustrative/real" wording leaks; scenes labelled appropriately.

See `BACKEND_API_SPEC.md` and `AUDIT.md` for contract gaps.

## 8. Tests

- `tests/e2e/app.spec.js` — comparison slider, sonification, detective game,
  guided tour, advanced docs.
- `tests/e2e/blueprint.spec.js` — theme/contrast, Arabic ledger columns.
- Tests rely on testids: `#see-through`, tour step titles, `sound-status`,
  `detective-*`, `tour-help`, `recovery-info`, Deep Dive Data tabs,
  `منطقة الدراسة` column.

## 9. Key decisions (from audit)

- Unified navigation (rail desktop + drawer mobile); removed Explore column,
  floating Help, ModeContext.
- Fonts updated; square system; terrain perf.
- Guided tour: Dialog → anchored spotlight card.
- Recovery plural + comparison bar + dates fixed.
- GitHub description/topics updated; og-cover.png created.

## 10. Manual steps remaining

- Upload `public/og-cover.png` (1280×640) to GitHub Social preview (no API).

## 11. Contacts / team

Frontend & project lead: gaballahtech · Backend: Mohamed Khider · Research:
Jana Ayman · Visual identity: Ahd Fayez.
EOF
echo created