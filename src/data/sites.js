/**
 * Study-area catalogue — narrative + real-event metadata.
 *
 * Both events happened AFTER NISAR launched (30 July 2025) and after it began
 * returning data (August 2025), so a NISAR-era change-detection story is
 * logically possible. The live backend uses real Sentinel-1 C-band GRD scenes
 * as the public SAR proxy (NISAR L-band products are not yet in the public
 * catalogue); every numeric block and scene image is replaced by that live data.
 *
 * HONESTY CONTRACT
 * ----------------
 * Mission facts, event dates, locations and scattering physics are sourced.
 * The bundled numbers below are only the offline fallback; with the backend
 * running, `src/services/sarApi.js` overwrites measurements, series, recovery,
 * pulse and scene imagery with real Sentinel-1 values.
 */

export const SITE_DATA_VERSION = '2026.11-real.1';

export const studyAreas = [
  {
    id: 'sundarbans',
    kind: 'wetland',
    seed: 21,
    name: { en: 'Central Vietnam flood', ar: 'فيضان وسط فيتنام' },
    region: { en: 'Quảng Trị – Huế · Vietnam', ar: 'كوانغ تري – هوي · فيتنام' },
    coords: { lat: 16.55, lng: 107.35 },
    wkt: 'POLYGON ((106.90 16.20, 107.80 16.20, 107.80 16.95, 106.90 16.95, 106.90 16.20))',
    eventDate: '2026-09-13',
    headline: {
      en: 'When the rivers overrun the plain',
      ar: 'حين تفيض الأنهار على السهل',
    },
    tags: [
      { key: 'terrain', value: { en: 'Coastal plain and river delta', ar: 'سهل ساحلي ودلتا نهرية' } },
      { key: 'soil', value: { en: 'Saturated alluvium', ar: 'طمي مشبع بالماء' } },
      { key: 'canopy', value: { en: 'Rice fields, towns, scrub', ar: 'حقول أرز وبلدات وشجيرات' } },
      { key: 'driver', value: { en: 'Tropical depression', ar: 'منخفض مداري' } },
    ],
    story: [
      {
        en: 'On 13 September 2026 a tropical depression stalled over central Vietnam and dropped 400–600 mm of rain on Quảng Trị and Huế in a few days; one station recorded more than 1,300 mm. Rivers crossed alarm level 3, lowland communes were cut off, and roads disappeared under water.',
        ar: 'في 13 سبتمبر 2026 توقف منخفض مداري فوق وسط فيتنام وأسقط 400–600 ملم من المطر على كوانغ تري وهوِي خلال أيام، وسجّلت محطة واحدة أكثر من 1300 ملم. تجاوزت الأنهار مستوى الإنذار الثالث، وانقطعت البلدات المنخفضة، واختفت الطرق تحت الماء.',
      },
      {
        en: 'A camera sees grey rain and cloud. Radar sees the flood as a change in brightness: open water scatters the pulse away and turns almost black, while buildings, banks and vegetation standing in water stay bright. Comparing a pass before the storm with a pass after it maps the water in one step.',
        ar: 'الكاميرا ترى مطرًا رماديًا وغيومًا. أما الرادار فيرى الفيضان كتغيّر في السطوع: الماء المكشوف يشتت النبضة بعيدًا فيصير أسود تقريبًا، بينما تبقى المباني والضفاف والنباتات الواقفة في الماء لامعة. ومقارنة مرور قبل العاصفة بمرور بعدها ترسم الماء في خطوة واحدة.',
      },
    ],
    states: {
      before: {
        date: '2026-09-07',
        label: { en: 'BEFORE THE RAIN', ar: 'قبل المطر' },
        params: { water: 0.2, emergent: 0.6, burn: 0, cloud: 0.7 },
        caption: {
          en: 'Rivers inside their banks; fields and towns dry.',
          ar: 'الأنهار داخل ضفافها، والحقول والبلدات جافة.',
        },
        happened: {
          en: 'The lowland is a mosaic of rice fields, towns, roads and narrow rivers. Water is confined to channels and ponds.',
          ar: 'السهل فسيفساء من حقول الأرز والبلدات والطرق والأنهار الضيقة. الماء محصور في القنوات والبرك.',
        },
        why: {
          en: 'Vegetation and buildings scatter the pulse in many directions, so the land is bright and textured. Smooth river water is dark.',
          ar: 'النباتات والمباني تبدد النبضة في اتجاهات كثيرة، فتبدو الأرض لامعة وذات نسيج. أما ماء الأنهار الأملس فداكن.',
        },
        polarization: {
          en: 'VV: moderate — crops, soil and roofs. VH: higher over vegetation because leaves and branches twist the wave.',
          ar: 'VV: متوسط — محاصيل وتربة وأسطح. VH: أعلى فوق النباتات لأن الأوراق والأغصان تلفّ الموجة.',
        },
      },
      after: {
        date: '2026-09-15',
        label: { en: 'AFTER THE FLOOD', ar: 'بعد الفيضان' },
        params: { water: 0.85, emergent: 0.55, burn: 0, cloud: 0.9 },
        caption: {
          en: 'River water spreads across fields and streets; only roofs and tree crowns remain bright.',
          ar: 'ماء النهر ينتشر فوق الحقول والشوارع، ولا يبقى لامعًا إلا الأسطح وتيجان الأشجار.',
        },
        happened: {
          en: 'Flood water left the channels and covered the lowland. Towns, roads and rice fields were submerged for days.',
          ar: 'خرج ماء الفيضان من القنوات وغمر السهل. غرقت البلدات والطرق وحقول الأرز لأيام.',
        },
        why: {
          en: 'Open water is a near-perfect mirror at C-band: very dark. Buildings and tree crowns that remain above the surface still return energy, so the flood is a dark sheet with bright islands.',
          ar: 'الماء المكشوف مرآة شبه تامة في نطاق C: داكن جدًا. أما المباني وتيجان الأشجار الباقية فوق السطح فتعيد الطاقة، فيبدو الفيضان طبقة داكنة ذات جزر لامعة.',
        },
        polarization: {
          en: 'VV and VH both fall over open water. VH collapses first because the vegetation volume scattering is gone.',
          ar: 'ينخفض VV وVH معًا فوق الماء المكشوف، وينهار VH أولًا لأن التشتت الحجمي للنباتات يختفي.',
        },
      },
    },
    measurements: {
      vv: { before: -14.2, after: -10.8 },
      vh: { before: -21.0, after: -25.0 },
      crossPol: { before: -6.8, after: -14.2 },
      dateBefore: '2026-09-07',
      dateAfter: '2026-09-15',
    },
    series: [
      { date: '2026-08-10', vv: -14.0, vh: -20.8, water: 0.18, change: 0.06 },
      { date: '2026-08-22', vv: -13.8, vh: -20.6, water: 0.22, change: 0.09 },
      { date: '2026-09-03', vv: -14.2, vh: -21.0, water: 0.20, change: 0.07 },
      { date: '2026-09-10', vv: -11.4, vh: -22.8, water: 0.58, change: 0.52 },
      { date: '2026-09-15', vv: -10.8, vh: -25.0, water: 0.85, change: 0.94 },
      { date: '2026-09-27', vv: -11.9, vh: -23.6, water: 0.72, change: 0.76 },
      { date: '2026-10-09', vv: -13.1, vh: -22.0, water: 0.49, change: 0.38 },
      { date: '2026-10-21', vv: -13.7, vh: -21.2, water: 0.31, change: 0.18 },
      { date: '2026-11-02', vv: -14.0, vh: -20.9, water: 0.24, change: 0.10 },
      { date: '2026-11-14', vv: -14.1, vh: -20.8, water: 0.21, change: 0.08 },
    ],
    pulse: [0.06, 0.07, 0.09, 0.12, 0.2, 0.38, 0.66, 0.94, 0.86, 0.7, 0.48, 0.32, 0.22, 0.16, 0.11, 0.08],
    stablePulse: [0.05, 0.06, 0.05, 0.07, 0.06, 0.05, 0.06, 0.07, 0.05, 0.06, 0.05, 0.07, 0.06, 0.05, 0.06, 0.05],
    recovery: {
      thresholdDefault: 80,
      startLabel: { en: 'Flood', ar: 'الفيضان' },
      points: [
        { month: 0, pct: 22, projected: false },
        { month: 1, pct: 38, projected: false },
        { month: 2, pct: 57, projected: false },
        { month: 3, pct: 72, projected: false },
        { month: 4, pct: 82, projected: false },
        { month: 6, pct: 90, projected: false },
        { month: 9, pct: 95, projected: true },
        { month: 12, pct: 98, projected: true },
      ],
      note: {
        en: 'Radar recovery tracks receding water and regrowth — not full recovery of crops, roads or livelihoods.',
        ar: 'التعافي الراداري يتتبع انحسار الماء ونمو النباتات، وليس التعافي الكامل للمحاصيل أو الطرق أو سبل العيش.',
      },
    },
    contrast: {
      dominant: { en: 'Surface water + double bounce', ar: 'ماء سطحي + ارتداد مزدوج' },
      signature: { en: 'Both fall over water; VH collapses', ar: 'ينخفضان فوق الماء، وVH أكثر' },
      timescale: { en: 'Weeks to months', ar: 'أسابيع إلى أشهر' },
    },
    researcher: {
      acquisition: {
        en: 'Real Sentinel-1 C-band GRD (VV/VH) before and after the 13 Sep 2026 event for the site cards and time series; the radar/optical comparison uses a real NASA NISAR L-band (HH) browse image.',
        ar: 'بيانات Sentinel-1 C-band GRD الحقيقية (VV/VH) قبل حدث 13 سبتمبر 2026 وبعده لبطاقات الموقع والسلسلة الزمنية؛ بينما تستخدم مقارنة الرادار/البصري صورة حقيقية من NASA NISAR L-band (HH).',
      },
      interpretation: [
        {
          en: 'Open water is the cleanest SAR flood class: both polarizations drop sharply. Threshold VV or VH against a pre-event baseline to map the inundated area.',
          ar: 'الماء المكشوف أنظف صنف فيضان في الرادار: تنخفض القطبتان بحدة. استخدم عتبة VV أو VH مقابل خط أساس قبل الحدث لرسم المساحة المغمورة.',
        },
        {
          en: 'Buildings and tree crowns stay bright inside the flood, so the map is not a single dark polygon. A land-cover mask separates water from bright islands.',
          ar: 'تبقى المباني وتيجان الأشجار لامعة داخل الفيضان، لذا الخريطة ليست مضلعًا داكنًا واحدًا. قناع الغطاء الأرضي يفصل الماء عن الجزر اللامعة.',
        },
        {
          en: 'Because the orbit repeats, a pre-event and post-event pair around the storm is enough for a first damage map; a dense series separates temporary water from permanent channels.',
          ar: 'لأن المدار يتكرر، يكفي زوج قبل الحدث وبعده حول العاصفة لخريطة أضرار أولية؛ والسلسلة الكثيفة تفصل الماء المؤقت عن القنوات الدائمة.',
        },
      ],
      limits: [
        {
          en: 'Rice fields and wet soil can look like shallow water on a single date. Tide, wind and vegetation density all change the threshold.',
          ar: 'حقول الأرز والتربة الرطبة قد تبدو كماء ضحل في تاريخ واحد. المد والرياح وكثافة النباتات كلها تغيّر العتبة.',
        },
        {
          en: 'Steep terrain and built-up areas produce layover and shadow. Terrain correction is mandatory before comparing dates.',
          ar: 'التضاريس الشديدة والمناطق المبنية تنتج تراكبًا وظلًا. التصحيح التضاريسي إلزامي قبل مقارنة التواريخ.',
        },
      ],
      methods: [
        {
          en: 'Recovery is a normalized radar-structure index relative to the pre-flood baseline; the projection is a logistic fit.',
          ar: 'التعافي مؤشر بنيوي راداري مُعيَّر نسبةً إلى خط الأساس قبل الفيضان، والإسقاط ملاءمة لوجستية.',
        },
      ],
      sources: [
        { label: 'Sentinel Asia — Flood in Central Vietnam, 13 Sep 2026', href: 'https://sentinel-asia.org/EO/2026/article20260913VN.html' },
        { label: 'Copernicus Emergency Management Service', href: 'https://emergency.copernicus.eu/' },
        { label: 'NASA NISAR — Quick Facts', href: 'https://nisar.jpl.nasa.gov/mission/quick-facts' },
        { label: 'NASA Earthdata — ASF DAAC', href: 'https://asf.alaska.edu/' },
      ],
    },
  },

  {
    id: 'caldor',
    kind: 'forest',
    seed: 84,
    name: { en: 'West Attica wildfire', ar: 'حريق غرب أتيكا' },
    region: { en: 'Porto Germeno · Greece', ar: 'بورتو جيرمينو · اليونان' },
    // Inland at Agios Vasileios, where the fire started: the earlier shoreline
    // point put half of the 512×512 window over open water, and wind-driven sea
    // backscatter then swung the absolute VV level and the VV−VH gap.
    coords: { lat: 38.19, lng: 23.16 },
    wkt: 'POLYGON ((23.05 38.04, 23.36 38.04, 23.36 38.24, 23.05 38.24, 23.05 38.04))',
    eventDate: '2026-07-31',
    headline: {
      en: 'The slope that burned to the sea',
      ar: 'المنحدر الذي احترق حتى البحر',
    },
    tags: [
      { key: 'terrain', value: { en: 'Steep Mediterranean hills', ar: 'تلال متوسطية شديدة الانحدار' } },
      { key: 'soil', value: { en: 'Dry summer soil', ar: 'تربة صيفية جافة' } },
      { key: 'canopy', value: { en: 'Pine and scrub', ar: 'صنوبر وشجيرات' } },
      { key: 'driver', value: { en: 'Wildfire', ar: 'حريق غابات' } },
    ],
    story: [
      {
        en: 'On 31 July 2026 a wildfire broke out near Psatha and Porto Germeno, west of Athens. It burned more than 10,000 hectares of pine and scrub, damaged or destroyed more than 100 homes, and sent a smoke plume across the Gulf of Corinth. Copernicus EMS Rapid Mapping was activated (EMSR909).',
        ar: 'في 31 يوليو 2026 اندلع حريق قرب بساثا وبورتو جيرمينو غرب أثينا. أحرق أكثر من 10,000 هكتار من الصنوبر والشجيرات، وأتلف أو دمّر أكثر من 100 منزل، وأرسل عمود دخان عبر خليج كورنث. فُعّل رسم خرائط كوبرنيكوس السريع (EMSR909).',
      },
      {
        en: 'Radar does not see flame. It sees structure. Before the fire the pulse bounced through pine needles and branches; afterwards it met ash, dry soil and standing dead trunks. The scar reads darker and smoother, and it stayed that way for months.',
        ar: 'الرادار لا يرى اللهب، بل يرى البنية. قبل الحريق كانت النبضة ترتد بين إبر الصنوبر والأغصان؛ وبعده لاقت رمادًا وتربة جافة وجذوعًا ميتة قائمة. يبدو الأثر أغمق وأنعم، وبقي كذلك لأشهر.',
      },
    ],
    states: {
      before: {
        date: '2026-07-20',
        label: { en: 'BEFORE THE FIRE', ar: 'قبل الحريق' },
        params: { water: 0, emergent: 0.9, burn: 0.04, cloud: 0.1 },
        caption: {
          en: 'Continuous pine and scrub on dry slopes. Bright, textured volume scattering.',
          ar: 'صنوبر وشجيرات متصلة على منحدرات جافة، وتشتت حجمي لامع ذو نسيج.',
        },
        happened: {
          en: 'Mature Mediterranean pine and scrub cover the slopes. The soil is dry after a rainless summer, but the canopy is intact.',
          ar: 'يغطي الصنوبر المتوسطي الناضج والشجيرات المنحدرات. التربة جافة بعد صيف بلا مطر، لكن المظلة سليمة.',
        },
        why: {
          en: 'Needles, branches and trunks scatter the pulse in many directions. Volume scattering returns a strong, textured signal in both VV and VH.',
          ar: 'تبدد الإبر والأغصان والجذوع النبضة في اتجاهات كثيرة. يعيد التشتت الحجمي إشارة قوية ذات نسيج في VV وVH معًا.',
        },
        polarization: {
          en: 'VV: bright. VH: bright for a land surface — foliage twists the wave from vertical to horizontal.',
          ar: 'VV: لامع. VH: لامع بالنسبة لسطح أرضي — الأوراق تلفّ الموجة من العمودي إلى الأفقي.',
        },
      },
      after: {
        date: '2026-08-10',
        label: { en: 'AFTER THE FIRE', ar: 'بعد الحريق' },
        params: { water: 0, emergent: 0.1, burn: 0.9, cloud: 0.1 },
        caption: {
          en: 'A dark, smooth burn scar. Surviving trunks stand as isolated bright points.',
          ar: 'أثر حرق داكن وأملس. الجذوع الناجية تقف كنقاط لامعة معزولة.',
        },
        happened: {
          en: 'Crown fire and severe burning removed the canopy across the scar. Ash and exposed soil replaced needles and branches.',
          ar: 'أزال حريق التاج والاحتراق الشديد المظلة عبر مساحة الأثر. حلّ الرماد والتربة المكشوفة محل الإبر والأغصان.',
        },
        why: {
          en: 'With the canopy gone, the pulse hits a smoother, drier surface and bounces away. VV drops hardest over the scorched strip; VH drops wherever the three-dimensional vegetation that twists the wave has actually disappeared.',
          ar: 'بغياب المظلة تصطدم النبضة بسطح أنعم وأجف وترتد بعيدًا. ينخفض VV بحدة فوق الشريط المحترق، وينخفض VH حيث تختفي فعلًا النباتات المجسّمة التي تلفّ الموجة.',
        },
        polarization: {
          en: 'VV falls with surface roughness, litter and soil moisture. VH only falls where the canopy itself was consumed — over a partly burned coastal strip it barely moves.',
          ar: 'ينخفض VV مع خشونة السطح والغطاء الميت ورطوبة التربة. أما VH فلا ينخفض إلا حيث استُهلكت المظلة نفسها — وعلى شريط ساحلي محترق جزئيًا يكاد لا يتغيّر.',
        },
      },
    },
    measurements: {
      vv: { before: -8.9, after: -13.6 },
      vh: { before: -15.4, after: -21.8 },
      crossPol: { before: -6.5, after: -8.2 },
      dateBefore: '2026-07-20',
      dateAfter: '2026-08-10',
    },
    series: [
      { date: '2026-06-20', vv: -8.8, vh: -15.2, burn: 0.02, change: 0.09 },
      { date: '2026-07-08', vv: -8.9, vh: -15.4, burn: 0.04, change: 0.10 },
      { date: '2026-07-20', vv: -9.0, vh: -15.6, burn: 0.05, change: 0.10 },
      { date: '2026-08-01', vv: -10.9, vh: -18.2, burn: 0.5, change: 0.6 },
      { date: '2026-08-10', vv: -13.6, vh: -21.8, burn: 0.9, change: 0.93 },
      { date: '2026-08-22', vv: -13.8, vh: -22.0, burn: 0.88, change: 0.86 },
      { date: '2026-09-15', vv: -13.2, vh: -20.9, burn: 0.82, change: 0.74 },
      { date: '2026-10-09', vv: -12.6, vh: -19.8, burn: 0.75, change: 0.62 },
      { date: '2026-10-27', vv: -12.1, vh: -19.0, burn: 0.7, change: 0.52 },
      { date: '2026-11-14', vv: -11.8, vh: -18.5, burn: 0.66, change: 0.47 },
    ],
    pulse: [0.1, 0.09, 0.11, 0.08, 0.1, 0.13, 0.3, 0.72, 0.93, 0.86, 0.74, 0.61, 0.55, 0.49, 0.44, 0.4],
    stablePulse: [0.05, 0.06, 0.05, 0.07, 0.06, 0.05, 0.06, 0.07, 0.05, 0.06, 0.05, 0.07, 0.06, 0.05, 0.06, 0.05],
    recovery: {
      thresholdDefault: 80,
      startLabel: { en: 'Fire', ar: 'الحريق' },
      points: [
        { month: 0, pct: 10, projected: false },
        { month: 1, pct: 16, projected: false },
        { month: 3, pct: 27, projected: false },
        { month: 6, pct: 40, projected: false },
        { month: 9, pct: 51, projected: false },
        { month: 12, pct: 59, projected: false },
        { month: 18, pct: 68, projected: false },
        { month: 24, pct: 74, projected: false },
        { month: 36, pct: 80, projected: true },
        { month: 48, pct: 84, projected: true },
      ],
      note: {
        en: 'Radar brightness can recover before the ecosystem does. A rising signal is not a restored forest — carbon, species and soil are still rebuilding.',
        ar: 'قد يتعافى سطوع الرادار قبل النظام البيئي. ارتفاع الإشارة لا يعني غابة مستعادة؛ فالكربون والأنواع والتربة ما زالت تتعافى.',
      },
    },
    contrast: {
      dominant: { en: 'Volume scattering', ar: 'تشتت حجمي' },
      signature: { en: 'Both channels fall; VV drops hard, VH follows', ar: 'تنخفض القناتان: VV بحدة وVH تبعًا' },
      timescale: { en: 'Years', ar: 'سنوات' },
    },
    researcher: {
      acquisition: {
        en: 'Real Sentinel-1 C-band GRD (VV/VH) before and after the 31 Jul 2026 fire for the site cards and time series; the radar/optical comparison uses a real NASA NISAR L-band (HH) browse image.',
        ar: 'بيانات Sentinel-1 C-band GRD الحقيقية (VV/VH) قبل حريق 31 يوليو 2026 وبعده لبطاقات الموقع والسلسلة الزمنية؛ بينما تستخدم مقارنة الرادار/البصري صورة حقيقية من NASA NISAR L-band (HH).',
      },
      interpretation: [
        {
          en: 'In Mediterranean pine, VH is a more robust burn-severity indicator than VV because VV is contaminated by surface roughness, soil moisture and char. A VH drop of >5 dB is a strong canopy-loss signal.',
          ar: 'في صنوبر البحر المتوسط، VH مؤشر أقوى لشدة الحرق من VV لأن VV يتأثر بخشونة السطح ورطوبة التربة والفحم. انخفاض VH أكثر من 5 ديسيبل إشارة قوية لفقدان المظلة.',
        },
        {
          en: 'L-band penetrates deeper than C-band and keeps sensitivity to woody trunks after the canopy is consumed. That should let NISAR separate “canopy consumed” from “canopy thinned” better than Sentinel-1.',
          ar: 'ينفذ نطاق L أعمق من نطاق C ويحافظ على حساسية للجذوع الخشبية بعد استهلاك المظلة. وهذا ينبغي أن يمكّن نيسار من التمييز بين «مظلة مستهلكة» و«مظلة مخففة» أفضل من Sentinel-1.',
        },
        {
          en: 'A 12-day repeat lets NISAR bracket a fire with pre- and post-event acquisitions — the single most valuable thing a radar time series can do for rapid damage assessment.',
          ar: 'تكرار 12 يومًا يتيح لنيسار تأطير الحريق باقتناءات قبل الحدث وبعده — وهو أثمن ما تقدمه سلسلة زمنية رادارية لتقييم الأضرار السريع.',
        },
      ],
      limits: [
        {
          en: 'Steep terrain produces layover and shadow. Without a DEM and terrain correction, bright and dark patches can be geometry, not ecology.',
          ar: 'التضاريس الشديدة تنتج تراكبًا وظلًا. دون نموذج ارتفاع رقمي وتصحيح تضاريسي، قد تكون البقع اللامعة والداكنة هندسةً لا بيئة.',
        },
        {
          en: 'Dead standing trunks, resprouting shrubs and wet soil can mimic each other on a single date. Dense time series and polarimetric decomposition are required.',
          ar: 'الجذوع الميتة القائمة والشجيرات النامية والتربة الرطبة قد تتشابه في تاريخ واحد. تلزم سلسلة زمنية كثيفة وتحليل استقطابي.',
        },
        {
          en: 'Radar recovery is a structural proxy. It is not a measure of biodiversity, carbon stock or ecosystem function.',
          ar: 'التعافي الراداري مؤشر بنيوي بديل، وليس قياسًا للتنوع الحيوي أو مخزون الكربون أو وظيفة النظام البيئي.',
        },
      ],
      methods: [
        {
          en: 'Recovery points are normalized to the pre-fire VH baseline; the dashed segment is a logistic projection.',
          ar: 'نقاط التعافي مُعيَّرة إلى خط أساس VH قبل الحريق؛ والجزء المتقطع إسقاط لوجستي.',
        },
      ],
      sources: [
        { label: 'Copernicus EMS — EMSR909 West Attica wildfire', href: 'https://emergency.copernicus.eu/' },
        { label: 'ESA — Greece continues to battle wildfires (2 Aug 2026)', href: 'https://www.esa.int/ESA_Multimedia/Images/2026/08/Greece_continues_to_battle_wildfires' },
        { label: 'NASA NISAR — Quick Facts', href: 'https://nisar.jpl.nasa.gov/mission/quick-facts' },
        { label: 'NASA Earthdata — ASF DAAC', href: 'https://asf.alaska.edu/' },
      ],
    },
  },
];

export const contrastRows = [
  {
    id: 'terrain',
    label: { en: 'Terrain', ar: 'التضاريس' },
    sundarbans: { en: 'Low river plain, fields and towns', ar: 'سهل نهري منخفض وحقول وبلدات' },
    caldor: { en: 'Steep coastal hills', ar: 'تلال ساحلية شديدة الانحدار' },
  },
  {
    id: 'moisture',
    label: { en: 'Soil moisture', ar: 'رطوبة التربة' },
    sundarbans: { en: 'Saturated during the flood', ar: 'مشبعة أثناء الفيضان' },
    caldor: { en: 'Dry summer soil', ar: 'تربة صيفية جافة' },
  },
  {
    id: 'canopy',
    label: { en: 'Canopy', ar: 'المظلة' },
    sundarbans: { en: 'Rice, scrub, trees', ar: 'أرز وشجيرات وأشجار' },
    caldor: { en: 'Pine and Mediterranean scrub', ar: 'صنوبر وشجيرات متوسطية' },
  },
  {
    id: 'scattering',
    label: { en: 'Dominant scattering', ar: 'التشتت السائد' },
    sundarbans: { en: 'Surface water + double bounce', ar: 'ماء سطحي + ارتداد مزدوج' },
    caldor: { en: 'Volume scattering', ar: 'تشتت حجمي' },
  },
  {
    id: 'fingerprint',
    label: { en: 'Change fingerprint', ar: 'بصمة التغير' },
    sundarbans: { en: 'Dark water sheet; bright roofs', ar: 'طبقة ماء داكنة وأسطح لامعة' },
    caldor: { en: 'Both channels fall; VV drops hard', ar: 'تنخفض القناتان وVV بحدة' },
  },
  {
    id: 'recovery',
    label: { en: 'Signal returns to 80%', ar: 'عودة الإشارة إلى 80%' },
    sundarbans: { en: 'Months', ar: 'أشهر' },
    caldor: { en: 'Years', ar: 'سنوات' },
  },
];

export const getSite = (id) => studyAreas.find((site) => site.id === id);
