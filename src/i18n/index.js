import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const en = {
  app: {
    tagline: 'Radar stories of a changing Earth',
  },
  navbar: {
    brand: 'Sothis Echo',
    mission: 'Mission',
    seeThrough: 'Camera vs radar',
    sites: 'Study areas',
    sound: 'Hear the dance',
    recovery: 'Recovery',
    game: 'Detective',
    data: 'The data',
    menu: 'Toggle navigation menu',
    home: 'Overview',
    team: 'Team',
    switchLanguage: 'Switch to Arabic',
    toDark: 'Switch to night mode',
    toLight: 'Switch to day mode',
    night: 'Night',
    day: 'Day',
  },
  hero: {
    title: 'Earth is always dancing.',
    subtitle:
      'Radar sees through cloud, smoke and darkness. Meet NISAR and learn to read what it finds.',
    ctaSee: 'See what the camera misses',
    ctaListen: 'Hear the surface',
    liveData: 'Sentinel-1 record · NISAR browse',
    lastPass: 'Last real pass',
    panel: {
      orbit: 'Orbit',
      orbitValue: '747 km, polar',
      repeat: 'Full coverage',
      repeatValue: 'every 12 days',
      resolution: 'Detail',
      resolutionValue: '3–10 m per pixel',
    },
    factsLabel: 'Mission facts',
  },
  mission: {
    title: 'Meet NISAR',
    subtitle: 'One satellite. Two radars. A new way to watch the planet change.',
    detailsTitle: 'Mission Details',
    detailsSubtitle: 'Launch, orbit, products and the mission timeline',
    lead:
      'NISAR — the NASA–ISRO radar satellite — launched on 30 July 2025. Every 12 days it maps nearly all of Earth’s land and ice, day or night, and the data is free.',
    cards: {
      radar: {
        title: 'Radar, not a camera',
        body:
          'A camera records sunlight. Radar sends its own pulse and times the echo, so it records shape and roughness — not colour — and works at night through cloud.',
      },
      bands: {
        title: 'Two bands, two jobs',
        body:
          'NASA’s L-band (24 cm) reaches trunks and soil. ISRO’s S-band (9.4 cm) sees finer canopy detail. Together they separate what one sensor would blur.',
      },
      heartbeat: {
        title: 'A 12-day heartbeat',
        body:
          'The orbit repeats almost exactly, so the same patch is imaged from the same angle every 12 days. The difference between passes is the signal.',
      },
      open: {
        title: 'Free and open',
        body:
          'L-band data is distributed by NASA’s Alaska Satellite Facility, S-band data by ISRO’s Bhoonidhi. Anyone can download and use them.',
      },
    },
    facts: {
      title: 'Mission card',
      launch: 'Launch',
      launchValue: '30 Jul 2025 · GSLV-F16',
      orbit: 'Orbit',
      orbitValue: '747 km · 98.4° inclination',
      repeat: 'Repeat',
      repeatValue: '12 days exact · ~6-day revisit',
      bands: 'Radar bands',
      bandsValue: 'L-band 24 cm · S-band 9.4 cm',
      swath: 'Swath',
      swathValue: '> 240 km',
      resolution: 'Resolution',
      resolutionValue: '3–10 m, mode dependent',
      baseline: 'Baseline',
      baselineValue: '3 years L-band · 5 years S-band',
    },
    timeline: {
      title: 'From launch to rhythm',
      launch: '30 Jul 2025 — NISAR reaches orbit on GSLV-F16.',
      commission: 'First 90 days — commissioning and calibration.',
      ops: 'Science operations — global L-band coverage every 12 days.',
      mission: 'Three-year L-band baseline; five-year S-band operations.',
    },
    sourceNote:
      'Mission facts: NASA NISAR Quick Facts and the NISAR Science Users’ Handbook (2nd ed., 2025).',
  },
  seeThrough: {
    title: 'Why the camera misses the story',
    subtitle:
      'Drag the line. Two views of the same study area: the clearest optical pass available, and the radar window cut to match it.',
    optical: 'OPTICAL · CLOUDED',
    radar: 'RADAR · L-BAND',
    radarC: 'RADAR · C-BAND',
    dragHint: 'DRAG THE DIVIDER',
    dividerAt: 'Divider at {{value}}% of the frame width',
    keyboardHint: 'or use arrow keys',
    opticalCaption:
      'A real Sentinel-2 optical quicklook. Clouds, smoke and darkness still hide the surface.',
    radarCaption:
      'A real NASA NISAR L-band (HH) browse image. Smooth water is dark; trunks standing in water can return a bright double bounce.',
    radarCaptionSentinel:
      'A real Sentinel-1 C-band scene over the same window. Smooth water is dark; rough canopy and built surfaces return more energy.',
    nisarSwath:
      'Both sides show the same window, cropped with the product’s own geolocation file (KML), north-up. The radar layer is NASA’s colourised quicklook, not a calibrated image; its tilted orbit and wider swath mean fine detail differs — the ground area does not.',
    noImage: 'Live imagery unavailable — start the backend to load the real scene.',
    calloutTitle: 'What the radar is telling you',
    calloutBody:
      'Brightness is returned energy, not colour. Open water scatters the pulse away and looks black; rough canopy looks textured; a trunk standing in water can act like a corner reflector and glow.',
    legendWater: 'Open water — dark',
    legendCanopy: 'Canopy — textured mid-tone',
    legendTrunk: 'Flooded trunks — specular, bright',
  },
  sites: {
    title: 'One change, two rhythms',
    subtitle:
      'The same event looks different in a flooded river plain and on a burned Mediterranean hillside. Pick a site, compare before and after, then read why.',
    event: 'Event',
    readPol: 'Read the polarization',
    signalTab: 'Reading the signal',
    deepDive: 'Deep Dive Data',
    measurements: 'Signal measurements',
    localData:
      'Bundled fallback figures: the live backend is unreachable, so the numbers below are illustrative, not measurements.',
    observations: {
      title: 'Radar observation ledger',
      subtitle: 'Every pass in the current series, in one auditable table.',
      columnSite: 'Study area',
      columnDate: 'Pass date',
      columnVv: 'VV (dB)',
      columnVh: 'VH (dB)',
      columnCross: 'VH−VV (dB)',
      columnWater: 'Dark share',
      columnChange: 'Change',
      columnRecovery: 'Recovery',
      columnStatus: 'Status',
      projectedShort: 'proj.',
      status: {
        baseline: 'Baseline',
        stable: 'Stable',
        recovery: 'Recovering',
        change: 'Changed',
      },
      note:
        'Cross-pol is VH minus VV. Recovery is interpolated from the recovery curve. Change is |ΔVV| against the pre-event pass, scaled so 1.00 = 12 dB.',
    },
    dbNote:
      'Lower dB means less energy returned — a darker pixel. VH−VV is the cross-pol ratio. Before/after cards and the change map are {{cards}}; the dB panel and the time series are {{numbers}}.',
    provCardsNisar: 'real NASA NISAR L-band ({{polarizations}}) browse images',
    provCardsSentinel: 'real Sentinel-1 C-band ({{polarizations}}) quicklooks',
    provNumbersSentinel:
      'real Sentinel-1 C-band GRD ({{polarizations}}) at relative amplitude — not calibrated σ⁰',
    provNumbersNisar: 'calibrated NISAR L-band gamma-0 ({{polarizations}})',
    degraded: 'The live rebuild failed for this site, so the labelled fallback record is shown — not new measurements.',
    dbNoteFallback:
      'Lower dB means less energy returned — a darker pixel. VH−VV is the cross-pol ratio. The backend is unreachable, so these values and scenes are the labelled offline fallback — not measurements.',
    forResearchers: 'For Researchers',
    acquisition: 'Acquisition & products',
    acquisitionFallback:
      'The backend is unreachable, so these scenes are the labelled offline fallback — no satellite acquisition is claimed.',
    interpretation: 'Interpretation',
    limits: 'Limits & failure modes',
    methods: 'Method',
    sources: 'Sources',
    contrastTitle: 'Same physics, different fingerprint',
    contrastSubtitle: 'Why a river flood and a wildfire do not look alike in the same radar channel.',
    downloadCsv: 'Download series (CSV)',
    impactUsers: 'Who reads this',
    impactDecision: 'Decision it informs',
    comparison: {
      sundarbans: 'Vietnam flood',
      caldor: 'Greece fire',
      label: 'Field',
    },
    metric: 'Channel',
    beforePass: 'Before (dB)',
    afterPass: 'After (dB)',
    crossDb: 'HH − HV',
    ariaScene: '{{site}} {{state}} radar scene',
    changeTitle: 'CHANGE · {{date}}',
    changeCaption:
      'The difference the eye cannot catch: |after − before| per pixel, on the same window. Bright means the surface gave back a different amount of radar energy. Scale: black 0 dB, white 8 dB and above.',
    changeAria: '{{site}} change map between the two passes',
    changeNote: 'Rain and tide move pixels too — bright is change, not automatically damage.',
    seriesSourceNote: 'Time series and dB measurements: {{numbers}}. Visual cards: {{cards}}.',
    cardViewAria: 'Radar view',
    cardViewHh: 'HH browse',
    cardViewRgb: 'HH·HV composite',
    cardViewRgbNote:
      'Dual-pol intensity composite of each pass (R = HH, G = HV, B = HH−HV, 2nd–98th percentile). Not true optical colour, and with no phase there is no Pauli decomposition.',
    changeStatsLabel: 'Calibrated change',
    changeStatsValue: '{{changed}}% of valid pixels changed · mean ΔHH {{mean}} dB',
    changeStatsCaveat:
      '|ΔdB| ≥ {{threshold}} dB on aligned HHHH grids, same track/frame · {{valid}}% valid pixels',
    changeStatsUnavailable: 'Calibrated change statistics are not available for this site right now.',
    changeStatsSnapshot:
      'Precomputed from a verified NISAR GCOV run on {{date}}; Harmony is not queried on this page load.',
  },
  sound: {
    title: 'See and hear the surface dance',
    subtitle:
      'The record of satellite passes becomes both a wave and a pulse. Watch the trace and listen for the change when a flood or fire hits.',
    stableTitle: 'A stable surface',
    stableSub: 'A reference series with almost no change. Same low pitch, slow steady pulse.',
    changeTitle: 'A changing surface',
    changeSub: 'The study-area series. The event is audible before you read the label.',
    play: 'Play',
    stop: 'Stop',
    sourceLine: 'Real data: {{passes}} Sentinel-1 passes, resampled to 16 steps.',
    scaleNote: 'Bars and pitch are scaled to this record’s peak change ({{peak}}%).',
    mappingTitle: 'How the data becomes sound',
    map1: 'One pulse = one step of the 16-step series',
    map2: 'Pitch = amount of change',
    map3: 'Rhythm = speed of change',
    map4: 'Static texture = rough, fragmented change',
    nowPlaying: 'Playing · step {{current}} / {{total}}',
    noSupport: 'This browser does not support the Web Audio API. The visual series still shows the same pattern.',
  },
  recovery: {
    title: 'When does it come back?',
    subtitle:
      'How long does the radar signal take to return to its pre-event level? Move the target and watch the estimate change.',
    target: 'Target recovery',
    targetHint: 'Share of the pre-event radar signal',
    estimateLabel: 'Estimated time to target',
    notReached: 'Not reached in the projection window',
    notMeasured: 'Not measurable in this record',
    sourceLine: 'Fitted to {{passes}} real post-event passes.',
    chartTitle: 'Normalized radar-structure recovery',
    chartY: 'Signal vs baseline (%)',
    chartX: 'Time since event',
    caveat:
      'This is a structural proxy, not full ecological recovery. Radar brightness can return while carbon, species and soil are still rebuilding.',
    methodLabel: 'How this estimate is made',
    methodBody:
      'Each point is one post-event satellite pass over {{site}}. The percentage is the share of the study window that has returned to its pre-event VV level, measured block by block on same-satellite, same-orbit passes; 100% means the changed area has faded into the window\'s own pass-to-pass noise. The estimate is the first time the curve meets your target. It is a structural proxy, not full ecological recovery.',
    fallbackNotice:
      'Illustrative curve: the live record does not hold enough post-event passes to fit one, so these points are not measurements. The real passes are in the observation ledger.',
    insufficientNotice:
      'Finding, not a gap: the event pass changed {{change}}% of this ~5 km window by at least 5 dB, while the same window moves by {{noise}}% between two pre-event passes. That is not enough separation to fit a recovery curve, and plotting one would be noise wearing a trend line.',
    noPeakPassNotice:
      'No Sentinel-1 pass sampled the flood peak: the first post-event pass came {{gap}} days after the event, and it changed {{change}}% of the window against {{noise}}% pre-event noise. With no peak observation, a recovery curve would be an extrapolation, so it is not drawn.',
    signalToday: 'Signal at the end of the record',
  },
  game: {
    title: 'Radar detective',
    subtitle:
      'Two real post-launch cases plus one judgment round on a bright change map. Read the signal, not the caption. Evidence is revealed only after you answer.',
    round: 'ROUND {{current}} / {{total}}',
    score: 'SCORE {{score}}',
    question: 'What changed here?',
    select: 'Choose a cause',
    revealed: 'Evidence unlocked',
    correct: 'Correct — you read the signature.',
    wrong: 'Not quite. Look at the two channels.',
    evidence: 'Evidence',
    next: 'Next scene',
    finish: 'See result',
    restart: 'Play again',
    finishedTitle: 'Case file closed',
    scoreLine: 'You read {{score}} of {{total}} signatures correctly.',
    tierHigh: 'Field-ready analyst. You are reading structure, not colour.',
    tierMedium: 'Solid read. The polarization channels are starting to speak.',
    tierLow: 'Good start. Remember: VH loves 3-D canopy, water is dark and smooth, and flooded trunks can glow.',
    answerWas: 'The answer was: {{answer}}',
    hint: 'VH is the canopy channel. Open water is dark. Flooded trunks can brighten VV.',
    progress: 'Case progress',
    before: 'THEN',
    after: 'NOW',
    start: 'Start the case',
    startTitle: 'Two scenes, then one judgment round',
    startBody:
      'The clock starts when you press start. You get {{seconds}} seconds per round, {{total}} rounds in total. Reading the signal matters more than speed.',
    startHint: 'The timer pauses while the evidence is open.',
    timeLeft: 'TIME',
    changeTitle: 'Change map · |after − before|',
    changeStatus: 'NISAR L-band · HH',
    changeMeta: 'NISAR L-band (HH) · same Vietnam change map, no new acquisition',
  },
  method: {
    title: 'Data we can defend',
    subtitle:
      'Know what is measured and what is assumed.',
    docsTitle: 'Developer & Data Documentation',
    docsSubtitle: 'API contract, limits, sources and downloads',
    statusLabel: 'Data source',
    endpointsLabel: 'Contract',
    limitsTitle: 'Known limits',
    limits1: 'Speckle, layover and shadow are part of radar geometry. A single image is not a measurement of extent.',
    limits2: 'A radar signal is not a species count. Recovery of brightness is a structural proxy, not biodiversity.',
    limits3:
      'Values are only as good as the product behind them: relative amplitude is not calibrated σ⁰, and terrain correction is mandatory before comparing dates.',
    refsTitle: 'Sources & further reading',
    downloadJson: 'Download this dataset (JSON)',
    downloadCsv: 'Download time series (CSV)',
    versionLabel: 'Dataset version',
    disclosure:
      'Built for the NASA Space Apps Challenge. NISAR is a partnership between NASA and ISRO. This is an independent, open-source educational prototype.',
    noBackend: 'No VITE_API_BASE_URL configured — all requests are skipped, by design.',
    liveNote: 'The API is tried first; a failed request falls back to the labelled local dataset without breaking the page.',
  },
  tour: {
    badge: '60-SECOND TOUR',
    promptTitle: 'New here? Take the short tour',
    promptBody: 'Five short stops. No jargon, no sign-up. See the radar trick, hear the data, then test yourself.',
    start: 'Start tour',
    dismiss: 'Not now',
    help: 'Open guided tour',
    stepLabel: 'GUIDED TOUR {{current}} / {{total}}',
    stepOf: 'STOP {{current}} OF {{total}}',
    back: 'Back',
    next: 'Next stop',
    finish: 'Finish tour',
    steps: {
      mission: {
        title: 'One satellite, two radars',
        body: 'NISAR launched in 2025 and maps land and ice every 12 days. It sends its own radar pulse, so it works at night and through cloud. The data is free and open.',
      },
      seeThrough: {
        title: 'Clouds vs radar',
        body: 'Drag the divider. The camera sees a wall of cloud; the radar still sees the flood. Smooth water is dark, and flooded trunks can glow.',
      },
      sites: {
        title: 'Two places, two rhythms',
        body: 'A river flood and a wildfire do not look alike in radar. Open the boxes beside each image for the plain-language why.',
      },
      sound: {
        title: 'Hear the change',
        body: 'The series of passes becomes a sequence of pulses. A calm surface keeps a steady beat; a flood or fire changes pitch and rhythm.',
      },
      game: {
        title: 'Test your eye',
        body: 'Two real Sentinel-1 pairs from 2026: a Vietnam flood and a Greek wildfire. Choose an answer, then read the evidence.',
      },
    },
  },
  team: {
    title: 'The team',
    subtitle: 'The people behind Sothis Echo',
    roles: {
      frontendLead: 'Frontend lead · project lead',
      backendDev: 'Backend developer',
      researcher: 'Researcher',
      designer: 'Logo & visual identity',
    },
    links: {
      portfolio: 'Portfolio',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
  },
  footer: {
    brand: 'Sothis Echo',
    tagline: 'Reading the rhythm of Earth’s surface with NISAR.',
    challenge: 'NASA Space Apps Challenge · NISAR',
    columns: {
      resources: 'Data',
      community: 'Project',
    },
    resourceLinks: {
      nisar: 'NISAR mission',
      handbook: 'Science handbook',
      asf: 'ASF DAAC',
      bhoonidhi: 'ISRO Bhoonidhi',
      spaceApps: 'Space Apps Challenge',
    },
    communityLinks: {
      github: 'GitHub repository',
      issues: 'Report an issue',
      contribute: 'Contribute',
    },
    copyright: '© {{year}} Sothis Echo',
    disclosure: 'Independent educational prototype for the NASA Space Apps Challenge. Mission facts: NASA / ISRO.',
  },
  errorBoundary: {
    title: 'Signal lost',
    message: 'Something failed while rendering the receiver. Refresh the page or try again.',
    refresh: 'Refresh page',
    details: 'Error details',
  },
  common: {
    loading: 'Loading',
    retry: 'Retry',
    checkingLive: 'Reading live Sentinel-1 record…',
    sitePicker: 'Study area',
    skipToContent: 'Skip to main content',
    demoBanner:
      'Demo mode — the backend is not connected, so the values below are illustrative. Start `npm run api` for real Sentinel-1 data.',
  },
};

const ar = {
  app: {
    tagline: 'حكايات الأرض المتغيّرة بالرادار',
  },
  navbar: {
    brand: 'صدى الأرض',
    mission: 'المهمة',
    seeThrough: 'كاميرا أم رادار',
    sites: 'مناطق الدراسة',
    sound: 'اسمع الرقصة',
    recovery: 'التعافي',
    game: 'المحقق',
    data: 'البيانات',
    menu: 'تبديل قائمة التنقل',
    home: 'نظرة عامة',
    team: 'الفريق',
    switchLanguage: 'التبديل إلى الإنجليزية',
    toDark: 'التبديل إلى الوضع الليلي',
    toLight: 'التبديل إلى الوضع النهاري',
    night: 'ليل',
    day: 'نهار',
  },
  hero: {
    title: 'الأرض ترقص دائمًا.',
    subtitle:
      'الرادار يرى عبر الغيوم والدخان والظلام. تعرّف على نيسار وتعلّم قراءة ما يجده.',
    ctaSee: 'شاهد ما تفوته الكاميرا',
    ctaListen: 'اسمع سطح الأرض',
    liveData: 'سجل Sentinel-1 · صورة NISAR',
    lastPass: 'آخر مرور حقيقي',
    panel: {
      orbit: 'المدار',
      orbitValue: '747 كم، قطبي',
      repeat: 'تغطية الأرض',
      repeatValue: 'كل 12 يومًا',
      resolution: 'التفاصيل',
      resolutionValue: '3–10 أمتار للبكسل',
    },
    factsLabel: 'أرقام المهمة',
  },
  mission: {
    title: 'تعرّف على نيسار',
    subtitle: 'قمر واحد. رادارَان. طريقة جديدة لمراقبة تغيّر الكوكب.',
    detailsTitle: 'تفاصيل المهمة',
    detailsSubtitle: 'الإطلاق والمدار والمنتجات والجدول الزمني',
    lead:
      'نيسار — قمر الرادار المشترك بين ناسا وإيسرو — انطلق في 30 يوليو 2025. كل 12 يومًا يرسم خرائط لمعظم يابسة الأرض وجليدها، ليلًا ونهارًا، وبياناته مجانية.',
    cards: {
      radar: {
        title: 'رادار، لا كاميرا',
        body:
          'الكاميرا تسجّل ضوء الشمس، والرادار يرسل نبضته ويقيس الصدى، فيسجّل الشكل والخشونة لا اللون، ويعمل ليلًا وعبر الغيوم.',
      },
      bands: {
        title: 'نطاقان، مهمتان',
        body:
          'نطاق L من ناسا (24 سم) يصل إلى الجذوع والتربة، ونطاق S من إيسرو (9.4 سم) يرى تفاصيل أدق في المظلة. معًا يفصلان ما يختلط في مستشعر واحد.',
      },
      heartbeat: {
        title: 'نبض كل 12 يومًا',
        body:
          'يتكرر المدار بدقة شبه تامة، فتُصوَّر البقعة نفسها من الزاوية نفسها كل 12 يومًا. الفرق بين المرورات هو الإشارة.',
      },
      open: {
        title: 'مجاني ومفتوح',
        body:
          'تُوزَّع بيانات نطاق L عبر مرفق ألاسكا التابع لناسا، ونطاق S عبر «بهونيدهي» التابعة لإيسرو. يمكن لأي شخص تنزيلها واستخدامها.',
      },
    },
    facts: {
      title: 'بطاقة المهمة',
      launch: 'الإطلاق',
      launchValue: '30 يوليو 2025 · GSLV-F16',
      orbit: 'المدار',
      orbitValue: '747 كم · ميل 98.4°',
      repeat: 'التكرار',
      repeatValue: '12 يومًا بالضبط · زيارة كل 6 أيام تقريبًا',
      bands: 'نطاقات الرادار',
      bandsValue: 'L 24 سم · S 9.4 سم',
      swath: 'عرض التصوير',
      swathValue: 'أكثر من 240 كم',
      resolution: 'الدقة',
      resolutionValue: '3–10 م حسب النمط',
      baseline: 'المدة الأساسية',
      baselineValue: '3 سنوات لنطاق L · 5 سنوات لنطاق S',
    },
    timeline: {
      title: 'من الإطلاق إلى الإيقاع',
      launch: '30 يوليو 2025 — نيسار يصل إلى مداره على GSLV-F16.',
      commission: 'أول 90 يومًا — تشغيل ومعايرة.',
      ops: 'العمليات العلمية — تغطية عالمية لنطاق L كل 12 يومًا.',
      mission: 'أساس 3 سنوات لنطاق L؛ وعمليات 5 سنوات لنطاق S.',
    },
    sourceNote: 'حقائق المهمة: بطاقة ناسا السريعة لنيسار ودليل مستخدمي نيسار العلمي (الطبعة الثانية، 2025).',
  },
  seeThrough: {
    title: 'لماذا تفوت الكاميرا القصة',
    subtitle:
      'اسحب الخط. منظوران للمنطقة نفسها: أوضح مرور بصري متاح، ونافذة الرادار المقصوصة لتطابقها.',
    optical: 'بصري · تحت الغيوم',
    radar: 'رادار · نطاق L',
    radarC: 'رادار · نطاق C',
    dragHint: 'اسحب الفاصل',
    dividerAt: 'الفاصل عند {{value}}% من عرض الإطار',
    keyboardHint: 'أو استخدم مفاتيح الأسهم',
    opticalCaption:
      'صورة بصرية حقيقية من Sentinel-2. الغيوم والدخان والظلام ما زالت تحجب السطح.',
    radarCaption:
      'صورة حقيقية من NISAR L-band (HH). الماء الأملس داكن، والجذوع الواقفة في الماء قد تعيد ارتدادًا مزدوجًا لامعًا.',
    radarCaptionSentinel:
      'مشهد حقيقي من Sentinel-1 (نطاق C) على النافذة نفسها. الماء الأملس داكن، والمظلة الخشنة والأسطح المبنية تعيد طاقة أكبر.',
    nisarSwath:
      'الجانبان يعرضان النافذة نفسها، مقصوصة بملف الإسناد الجغرافي الرسمي للمنتج (KML)، والشمال لأعلى. طبقة الرادار صورة سريعة ملوّنة من ناسا وليست صورة معايرة؛ ومدارها المائل ونطاقها الأوسع يجعلان التفاصيل الدقيقة تختلف — أما مساحة الأرض فهي نفسها.',
    noImage: 'الصورة الحية غير متاحة — شغّل الباك اند لتحميل المشهد الحقيقي.',
    calloutTitle: 'ما يقوله لك الرادار',
    calloutBody:
      'السطوع طاقة عائدة لا لون. الماء المكشوف يصرف النبضة فيبدو أسود، والمظلة الخشنة تبدو ذات نسيج، والجذع الواقف في الماء قد يعمل كعاكس زاوي فيلمع.',
    legendWater: 'ماء مكشوف — داكن',
    legendCanopy: 'مظلة — نسيج متوسط',
    legendTrunk: 'جذوع مغمورة — لامعة (عاكس زاوي)',
  },
  sites: {
    title: 'تغيّر واحد، إيقاعان',
    subtitle:
      'الحدث نفسه يبدو مختلفًا في سهل نهري غارق وعلى منحدر متوسطي محترق. اختر موقعًا، قارن قبل وبعد، ثم اقرأ السبب.',
    event: 'الحدث',
    readPol: 'اقرأ الاستقطاب',
    signalTab: 'قراءة الإشارة',
    deepDive: 'بيانات الباحثين',
    localData:
      'أرقام احتياطية مرفقة مع الموقع: الباك اند غير متاح، فالقيم أدناه توضيحية وليست قياسات.',
    measurements: 'قياسات الإشارة',
    observations: {
      title: 'سجل ملاحظات الرادار',
      subtitle: 'كل مرور في السلسلة الحالية في جدول واحد قابل للتدقيق.',
      columnSite: 'منطقة الدراسة',
      columnDate: 'تاريخ المرور',
      columnVv: 'VV (ديسيبل)',
      columnVh: 'VH (ديسيبل)',
      columnCross: 'VH−VV (ديسيبل)',
      columnWater: 'النسبة الداكنة',
      columnChange: 'التغير',
      columnRecovery: 'التعافي',
      columnStatus: 'الحالة',
      projectedShort: 'متوقع',
      status: {
        baseline: 'خط الأساس',
        stable: 'مستقر',
        recovery: 'يتعافى',
        change: 'متغير',
      },
      note:
        'الاستقطاب المتقاطع هو VH ناقص VV. والتعافي مستوفى من منحنى التعافي. والتغير هو |ΔVV| مقابل مرور ما قبل الحدث، مُعيّر بحيث 1.00 = 12 ديسيبل.',
    },
    dbNote:
      'ديسيبل أقل يعني طاقة عائدة أقل — بكسل أغمق. VH−VV هو نسبة الاستقطاب المتقاطع. بطاقات قبل/بعد وخريطة الاختلاف {{cards}}؛ أما لوحة الديسيبل والسلسلة الزمنية فمن {{numbers}}.',
    provCardsNisar: 'صور حقيقية من NISAR L-band ({{polarizations}})',
    provCardsSentinel: 'صور حقيقية من Sentinel-1 C-band ({{polarizations}})',
    provNumbersSentinel:
      'Sentinel-1 C-band GRD الحقيقي ({{polarizations}}) بسعة نسبية — وليست σ⁰ مُعايَرة',
    provNumbersNisar: 'NISAR L-band gamma-0 مُعايَرة ({{polarizations}})',
    degraded: 'فشل البناء الحيّ لهذا الموقع، لذا تُعرض السجلات الاحتياطية الموسومة — وليست قياسات جديدة.',
    dbNoteFallback:
      'ديسيبل أقل يعني طاقة عائدة أقل — بكسل أغمق. VH−VV هو نسبة الاستقطاب المتقاطع. الخادم غير متاح، لذا هذه القيم والمشاهد احتياطية موسومة وليست قياسات.',
    forResearchers: 'للباحثين',
    acquisition: 'الاقتناء والمنتجات',
    acquisitionFallback:
      'الخادم غير متاح، لذا هذه المشاهد احتياطية موسومة — ولا تُنسب إلى التقاط قمر صناعي.',
    interpretation: 'التفسير',
    limits: 'الحدود وأنماط الفشل',
    methods: 'المنهج',
    sources: 'المصادر',
    contrastTitle: 'الفيزياء نفسها، البصمة مختلفة',
    contrastSubtitle: 'لماذا لا يبدو فيضان نهري وحريق غابة بالشكل نفسه في القناة الرادارية ذاتها.',
    downloadCsv: 'تنزيل السلسلة (CSV)',
    impactUsers: 'من يقرأ هذا',
    impactDecision: 'القرار الذي تخدمه',
    comparison: {
      sundarbans: 'فيضان فيتنام',
      caldor: 'حريق اليونان',
      label: 'الحقل',
    },
    metric: 'القناة',
    beforePass: 'قبل (ديسيبل)',
    afterPass: 'بعد (ديسيبل)',
    crossDb: 'HH − HV',
    ariaScene: 'مشهد رادار لـ{{site}} — {{state}}',
    changeTitle: 'الاختلاف · {{date}}',
    changeCaption:
      'الاختلاف اللي العين مش بتشوفه: |بعد − قبل| لكل بكسل على النافذة نفسها. الأبيض معناه إن السطح رجّع كمية طاقة رادار مختلفة. المقياس: أسود = ٠ ديسيبل، أبيض = ٨ ديسيبل أو أكتر.',
    changeAria: 'خريطة الاختلاف لـ{{site}} بين المرورين',
    changeNote: 'المطر والمد بيحركوا البكسلات كمان — الأبيض تغيّر، مش بالضرورة ضرر.',
    seriesSourceNote: 'السلسلة الزمنية وقياسات الديسيبل: {{numbers}}. أما البطاقات المصوّرة: {{cards}}.',
    cardViewAria: 'طريقة العرض الراداري',
    cardViewHh: 'صورة HH',
    cardViewRgb: 'تركيب HH·HV',
    cardViewRgbNote:
      'تركيب شدة ثنائي الاستقطاب لكل مرور (أحمر = HH، أخضر = HV، أزرق = HH−HV، تمدد ٢–٩٨٪). ليس لونًا بصريًا حقيقيًا، وبدون الطور لا يوجد تحليل باولي.',
    changeStatsLabel: 'تغيّر مُعايَر',
    changeStatsValue: 'تغيّر {{changed}}% من البكسلات الصالحة · متوسط ΔHH {{mean}} ديسيبل',
    changeStatsCaveat:
      '|ΔdB| ≥ {{threshold}} ديسيبل على شبكات HHHH المتوائمة، المسار والإطار نفسيهما · {{valid}}% بكسلات صالحة',
    changeStatsUnavailable: 'إحصاءات التغيّر المُعايَرة غير متاحة لهذا الموقع الآن.',
    changeStatsSnapshot:
      'محسوبة مسبقًا من تشغيل NISAR GCOV موثّق بتاريخ {{date}}؛ ولا يُستعلم Harmony عند تحميل الصفحة.',
  },
  sound: {
    title: 'شاهد واسمع سطح الأرض يرقص',
    subtitle:
      'سجل مرورات القمر يصبح موجة ونبضة. شاهد الأثر واسمع التغيّر عندما يضرب الفيضان أو الحريق.',
    stableTitle: 'سطح مستقر',
    stableSub: 'سلسلة مرجعية بلا تغيّر تقريبًا. النغمة المنخفضة نفسها والنبض البطيء الثابت.',
    changeTitle: 'سطح متغيّر',
    changeSub: 'سلسلة منطقة الدراسة. الحدث مسموع قبل أن تقرأ العنوان.',
    play: 'تشغيل',
    stop: 'إيقاف',
    sourceLine: 'بيانات حقيقية: {{passes}} مرورًا لـ Sentinel-1، أُعيد تشكيلها إلى 16 خطوة.',
    scaleNote: 'الأعمدة والنغمة مُعيّرة على أقوى تغيّر في هذا السجل ({{peak}}%).',
    mappingTitle: 'كيف تتحول البيانات إلى صوت',
    map1: 'نبضة واحدة = خطوة من 16 خطوة في السلسلة',
    map2: 'النغمة = مقدار التغير',
    map3: 'الإيقاع = سرعة التغير',
    map4: 'النسيج المشوّش = تغيّر خشن ومتقطع',
    nowPlaying: 'قيد التشغيل · الخطوة {{current}} / {{total}}',
    noSupport: 'هذا المتصفح لا يدعم واجهة الصوت. السلسلة المرئية تُظهر النمط نفسه.',
  },
  recovery: {
    title: 'متى يعود؟',
    subtitle:
      'كم تستغرق إشارة الرادار لتعود إلى مستواها قبل الحدث؟ حرّك الهدف وراقب تغيّر التقدير.',
    target: 'هدف التعافي',
    targetHint: 'نسبة من إشارة الرادار قبل الحدث',
    estimateLabel: 'الزمن المقدر للوصول إلى الهدف',
    notReached: 'لم يتحقق داخل نافذة الإسقاط',
    notMeasured: 'غير قابل للقياس في هذا السجل',
    sourceLine: 'مُطابَق على {{passes}} مرورًا حقيقيًا بعد الحدث.',
    chartTitle: 'تعافي البنية الرادارية المُعيَّر',
    chartY: 'الإشارة مقابل الأساس (%)',
    chartX: 'الزمن منذ الحدث',
    caveat:
      'هذا مؤشر بنيوي بديل، وليس تعافيًا بيئيًا كاملًا. قد يعود سطوع الرادار بينما الكربون والأنواع والتربة ما زالت تتعافى.',
    methodLabel: 'كيف حُسب هذا التقدير',
    methodBody:
      'كل نقطة هي مرور واحد للقمر بعد الحدث فوق {{site}}. النسبة هي حصة نافذة الدراسة التي عادت إلى مستوى VV قبل الحدث، مقاسة كتلةً كتلة على مرورات من القمر نفسه والمدار نفسه؛ و100% تعني أن مساحة التغيّر ذابت في حدود ضوضاء المرورات. والتقدير هو أول زمن يبلغ فيه المنحنى هدفك. هذا مؤشر بنيوي بديل، وليس تعافيًا بيئيًا كاملًا.',
    fallbackNotice:
      'منحنى توضيحي: السجل الحيّ لا يحتوي بعد على مرورات كافية بعد الحدث لبناء منحنى، فهذه النقاط ليست قياسات. المرورات الحقيقية في سجل الملاحظات.',
    insufficientNotice:
      'نتيجة، وليست فجوة: غيّر مرور الحدث {{change}}% من نافذة ٥ كم تقريبًا بمقدار ٥ ديسيبل على الأقل، بينما تتحرك النافذة نفسها بنسبة {{noise}}% بين مرورين قبل الحدث. الفصل غير كافٍ لبناء منحنى تعافٍ، ورسمه سيكون تشويشًا بثوب خط اتجاه.',
    noPeakPassNotice:
      'لم يرصد أي مرور Sentinel-1 ذروة الفيضان: جاء أول مرور بعد الحدث بعد {{gap}} أيام، وغيّر {{change}}% من النافذة مقابل ضوضاء قبل الحدث {{noise}}%. بدون رصد الذروة سيكون منحنى التعافي استقراءً، لذلك لا يُرسم.',
    signalToday: 'الإشارة عند نهاية السجل',
  },
  game: {
    title: 'محقق الرادار',
    subtitle: 'حالتان حقيقيتان بعد إطلاق نيسار، وجولة حكم على خريطة تغيّر ساطعة. اقرأ الإشارة لا العنوان. تُكشف الأدلة بعد إجابتك فقط.',
    round: 'الجولة {{current}} / {{total}}',
    score: 'النقاط {{score}}',
    question: 'ماذا تغيّر هنا؟',
    select: 'اختر السبب',
    revealed: 'تم فتح الأدلة',
    correct: 'صحيح — قرأت البصمة.',
    wrong: 'ليس تمامًا. انظر إلى القناتين.',
    evidence: 'الأدلة',
    next: 'المشهد التالي',
    finish: 'عرض النتيجة',
    restart: 'العب مجددًا',
    finishedTitle: 'أُغلق ملف القضية',
    scoreLine: 'قرأت {{score}} من {{total}} بصمات بشكل صحيح.',
    tierHigh: 'محلل ميداني جاهز. أنت تقرأ البنية لا اللون.',
    tierMedium: 'قراءة جيدة. قنوات الاستقطاب بدأت تتكلم.',
    tierLow: 'بداية جيدة. تذكّر: VH يحب المظلة المجسّمة، والماء داكن أملس، والجذوع المغمورة قد تلمع.',
    answerWas: 'الإجابة كانت: {{answer}}',
    hint: 'VH قناة المظلة. الماء المكشوف داكن. الجذوع المغمورة قد تلمع في VV.',
    progress: 'تقدم القضية',
    before: 'سابقًا',
    after: 'الآن',
    start: 'ابدأ القضية',
    startTitle: 'مشهدان، ثم جولة حكم',
    startBody:
      'العدّاد يبدأ عند ضغطك على «ابدأ». عندك {{seconds}} ثانية لكل جولة، و{{total}} جولات إجمالًا. قراءة الإشارة أهم من السرعة.',
    startHint: 'المؤقت يتوقف أثناء عرض الأدلة.',
    timeLeft: 'الوقت',
    changeTitle: 'خريطة التغيّر · |بعد − قبل|',
    changeStatus: 'NISAR L-band · HH',
    changeMeta: 'NISAR L-band (HH) · نفس خريطة التغيّر، دون التقاط جديد',
  },
  method: {
    title: 'بيانات قابلة للدفاع',
    subtitle: 'اعرف ما هو مقاس وما هو مفترض.',
    docsTitle: 'توثيق المطورين والبيانات',
    docsSubtitle: 'عقد الواجهة والحدود والمصادر والتنزيلات',
    statusLabel: 'مصدر البيانات',
    endpointsLabel: 'العقد',
    limitsTitle: 'حدود معروفة',
    limits1: 'التشويش والتراكب والظل جزء من هندسة الرادار. صورة واحدة ليست قياسًا للمدى.',
    limits2: 'إشارة الرادار ليست إحصاءً للأنواع. عودة السطوع مؤشر بنيوي بديل، لا تنوع حيوي.',
    limits3:
      'جودة القيم مرتبطة بالمنتج الذي يقف خلفها: السعة النسبية ليست σ⁰ مُعايَرة، والتصحيح التضاريسي إلزامي قبل مقارنة التواريخ.',
    refsTitle: 'المصادر وقراءات إضافية',
    downloadJson: 'تنزيل هذه المجموعة (JSON)',
    downloadCsv: 'تنزيل السلسلة الزمنية (CSV)',
    versionLabel: 'نسخة البيانات',
    disclosure:
      'بُني لتحدي ناسا لتطبيقات الفضاء. نيسار شراكة بين ناسا وإيسرو. هذا نموذج تعليمي مستقل ومفتوح المصدر.',
    noBackend: 'لم يُضبط VITE_API_BASE_URL — تُتخطى كل الطلبات عمدًا.',
    liveNote: 'تُجرَّب الواجهة البرمجية أولًا؛ وعند فشل الطلب تُستخدم المجموعة المحلية المعلّمة دون تعطيل الصفحة.',
  },
  tour: {
    badge: 'جولة 60 ثانية',
    promptTitle: 'أول مرة هنا؟ خذ الجولة القصيرة',
    promptBody: 'خمس محطات قصيرة بلا مصطلحات معقدة أو تسجيل. شاهد حيلة الرادار، اسمع البيانات، ثم اختبر نفسك.',
    start: 'ابدأ الجولة',
    dismiss: 'ليس الآن',
    help: 'افتح الجولة الإرشادية',
    stepLabel: 'جولة إرشادية {{current}} / {{total}}',
    stepOf: 'المحطة {{current}} من {{total}}',
    back: 'رجوع',
    next: 'المحطة التالية',
    finish: 'إنهاء الجولة',
    steps: {
      mission: {
        title: 'قمر واحد، رادارَان',
        body: 'انطلق نيسار عام 2025 ويرسم اليابسة والجليد كل 12 يومًا. يرسل نبضته الرادارية بنفسه، فيعمل ليلًا وعبر الغيوم. والبيانات مجانية ومفتوحة.',
      },
      seeThrough: {
        title: 'الغيوم أم الرادار',
        body: 'اسحب الفاصل. الكاميرا ترى جدارًا من الغيوم، والرادار يرى الفيضان. الماء الأملس داكن، والجذوع المغمورة قد تلمع.',
      },
      sites: {
        title: 'مكانان، إيقاعان',
        body: 'الفيضان النهري وحريق الغابة لا يبدوان متشابهين في الرادار. افتح الصناديق بجانب كل صورة لتعرف السبب بلغة بسيطة.',
      },
      sound: {
        title: 'اسمع التغيّر',
        body: 'سلسلة المرورات تتحول إلى نبضات. السطح الهادئ يحافظ على إيقاع ثابت، والفيضان أو الحريق يغيّر النغمة والإيقاع.',
      },
      game: {
        title: 'اختبر عينك',
        body: 'زوجان حقيقيان من Sentinel-1 عام 2026: فيضان فيتنام وحريق اليونان. اختر ثم اقرأ الأدلة.',
      },
    },
  },
  team: {
    title: 'الفريق',
    subtitle: 'الأشخاص خلف «صدى الأرض»',
    roles: {
      frontendLead: 'قائد الواجهة الأمامية وقائد المشروع',
      backendDev: 'مطور الخلفية',
      researcher: 'الباحثة',
      designer: 'الشعار والهوية البصرية',
    },
    links: {
      portfolio: 'الموقع الشخصي',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
  },
  footer: {
    brand: 'صدى الأرض',
    tagline: 'قراءة إيقاع سطح الأرض مع نيسار.',
    challenge: 'تحدي ناسا لتطبيقات الفضاء · نيسار',
    columns: {
      resources: 'البيانات',
      community: 'المشروع',
    },
    resourceLinks: {
      nisar: 'مهمة نيسار',
      handbook: 'الدليل العلمي',
      asf: 'مرفق ألاسكا ASF',
      bhoonidhi: 'إيسرو بهونيدهي',
      spaceApps: 'تحدي تطبيقات الفضاء',
    },
    communityLinks: {
      github: 'مستودع GitHub',
      issues: 'الإبلاغ عن مشكلة',
      contribute: 'المساهمة',
    },
    copyright: '© {{year}} صدى الأرض',
    disclosure: 'نموذج تعليمي مستقل لتحدي ناسا لتطبيقات الفضاء. حقائق المهمة: ناسا / إيسرو.',
  },
  errorBoundary: {
    title: 'فُقدت الإشارة',
    message: 'حدث خطأ أثناء عرض المستقبل. حدّث الصفحة أو حاول مجددًا.',
    refresh: 'تحديث الصفحة',
    details: 'تفاصيل الخطأ',
  },
  common: {
    loading: 'جارٍ التحميل',
    retry: 'إعادة المحاولة',
    checkingLive: 'جارٍ قراءة سجل Sentinel-1 الحيّ…',
    sitePicker: 'منطقة الدراسة',
    skipToContent: 'تخطَّ إلى المحتوى الرئيسي',
    demoBanner:
      'وضع تجريبي — الباك اند غير متصل، والقيم أدناه توضيحية. شغّل `npm run api` لبيانات Sentinel-1 الحقيقية.',
  },
};

const savedLanguage =
  typeof window !== 'undefined'
    ? (() => {
        try {
          return localStorage.getItem('sothis-echo-language') || localStorage.getItem('dancing-with-sar-language');
        } catch {
          return null;
        }
      })()
    : null;

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: savedLanguage === 'ar' ? 'ar' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
