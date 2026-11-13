/**
 * Study-area catalogue — the narrative + numeric heart of the app.
 *
 * HONESTY CONTRACT
 * ----------------
 * Narrative, event dates and scattering physics are sourced / literature-informed.
 * Scene pixels, backscatter values, sonification series and recovery curves are
 * ILLUSTRATIVE (physically plausible, not official NISAR products). Each surface
 * that renders them is labelled. `src/services/sarApi.js` can overwrite the
 * numeric blocks (`states[*].params`, `measurements`, `series`, `recovery`,
 * `pulse`) with a live backend without touching the prose.
 */

export const SITE_DATA_VERSION = '2026.11-demo.1';

export const studyAreas = [
  {
    id: 'sundarbans',
    kind: 'wetland',
    seed: 21,
    name: { en: 'Sundarbans', ar: 'سندربانز' },
    region: { en: 'Bengal delta · Bangladesh and India', ar: 'دلتا البنغال · بنغلاديش والهند' },
    coords: { lat: 21.94, lng: 89.18 },
    wkt: 'POLYGON ((89.00 21.72, 89.36 21.72, 89.36 22.10, 89.00 22.10, 89.00 21.72))',
    eventDate: '2024-05-26',
    headline: {
      en: 'When the tide takes the forest',
      ar: 'حين يأخذ المدّ الغابة',
    },
    tags: [
      { key: 'terrain', value: { en: 'Flat tidal delta', ar: 'دلتا مدّية منبسطة' } },
      { key: 'soil', value: { en: 'Waterlogged clay', ar: 'طين مشبع بالماء' } },
      { key: 'canopy', value: { en: 'Dense mangrove', ar: 'مانغروف كثيف' } },
      { key: 'driver', value: { en: 'Cyclone surge', ar: 'عاصفة إعصارية' } },
    ],
    story: [
      {
        en: 'The Sundarbans is the largest mangrove forest on Earth: a maze of tidal channels, mudflats and salt-tolerant trees shared by Bangladesh and India. It shelters millions of people from cyclones, and it is never still — water rises and falls twice a day, and a monsoon surge can push it far inland.',
        ar: 'سندربانز أكبر غابة مانغروف على الأرض: متاهة من القنوات المدّية والسهول الطينية وأشجار تتحمل الملح، تتقاسمها بنغلاديش والهند. تحمي ملايين البشر من الأعاصير، ولا تعرف السكون أبدًا: الماء يعلو وينخفض مرتين يوميًا، ويمكن لمدّ الرياح الموسمية أن يدفعه بعيدًا إلى الداخل.',
      },
      {
        en: 'In May 2024, Cyclone Remal drove a storm surge into the delta and breached embankments. Channels and ponds merged into one shallow sheet of water. A camera sees a wall of cloud. Radar sees the change written in brightness: open water turns almost black, while trees standing in water can turn bright because the trunk and the water surface return the pulse together.',
        ar: 'في مايو 2024 دفع إعصار «ريمال» عاصفة مدّية إلى الدلتا فاخترقت السدود، واتحدت القنوات والبرك في طبقة ماء ضحلة واحدة. الكاميرا ترى جدارًا من الغيوم، أما الرادار فيرى التغير مكتوبًا بالسطوع: الماء المكشوف يصير أسود تقريبًا، بينما قد تلمع الأشجار الواقفة في الماء لأن الجذع وسطح الماء يعيدان النبضة معًا.',
      },
    ],
    states: {
      before: {
        date: '2024-05-10',
        label: { en: 'BEFORE THE SURGE', ar: 'قبل العاصفة' },
        params: { water: 0.34, emergent: 0.58, burn: 0, cloud: 0.55 },
        caption: {
          en: 'Narrow tidal channels, exposed mudflats and a continuous mangrove canopy.',
          ar: 'قنوات مدّية ضيقة، وسهول طينية مكشوفة، ومظلة مانغروف متصلة.',
        },
        happened: {
          en: 'Tidal creeks thread through the mangrove. Water is confined to channels and a few ponds; most of the surface is mud and leaf.',
          ar: 'تتخلل الجداول المدّية غابة المانغروف. الماء محصور في القنوات وبعض البرك، ومعظم السطح طين وأوراق.',
        },
        why: {
          en: 'The pulse scatters inside leaves and branches (volume scattering), so the canopy looks textured and moderately bright. Smooth channel water reflects the pulse away and looks almost black.',
          ar: 'تتشتت النبضة داخل الأوراق والأغصان (تشتت حجمي)، فتبدو المظلة ذات نسيج وسطوع متوسط. أما ماء القنوات الأملس فيعكس النبضة بعيدًا ويظهر أسود تقريبًا.',
        },
        polarization: {
          en: 'VV: moderate — canopy plus damp mud. VH: comparatively high — the “twist” channel is fed by leaves and branches.',
          ar: 'VV: متوسط — مظلة وطين رطب. VH: مرتفع نسبيًا — قناة «الالتواء» تتغذى من الأوراق والأغصان.',
        },
      },
      after: {
        date: '2024-05-30',
        label: { en: 'AFTER THE SURGE', ar: 'بعد العاصفة' },
        params: { water: 0.82, emergent: 0.74, burn: 0, cloud: 0.9 },
        caption: {
          en: 'Channels connect into broad open water. Submerged and damaged canopy is patchy; trunks still stand in the flood.',
          ar: 'تتصل القنوات في مياه مفتوحة واسعة. المظلة المغمورة والمتضررة متفرقة، لكن الجذوع ما زالت واقفة في الفيضان.',
        },
        happened: {
          en: 'The storm surge and a breached embankment flooded the western block. Open water expanded and the canopy was partly submerged or stripped.',
          ar: 'أغرق مدّ العاصفة وسدّ منهار الكتلة الغربية. اتسع الماء المكشوف وغمرت المياه جزءًا من المظلة أو أزالتها.',
        },
        why: {
          en: 'Open water is a mirror at L-band: very dark. But the flood is not uniformly dark. A trunk standing in water forms a corner reflector — pulse bounces off the water, then the trunk, and returns strongly. That is why flooded forest can brighten while open water darkens.',
          ar: 'الماء المكشوف مرآة في نطاق L: داكن جدًا. لكن الفيضان ليس داكنًا كله. الجذع الواقف في الماء يشكّل عاكسًا زاويًا: ترتد النبضة عن الماء ثم عن الجذع فتعود بقوة. لذلك قد تلمع الغابة المغمورة بينما يُظلم الماء المكشوف.',
        },
        polarization: {
          en: 'VV: brightens in flooded forest (double bounce). VH: collapses (canopy volume scattering is lost). The VV–VH gap widens by about 8 dB.',
          ar: 'VV: يلمع في الغابة المغمورة (ارتداد مزدوج). VH: ينهار (يضيع التشتت الحجمي للمظلة). وتتسع الفجوة بين VV وVH بنحو 8 ديسيبل.',
        },
      },
    },
    measurements: {
      vv: { before: -13.2, after: -9.8 },
      vh: { before: -20.1, after: -24.6 },
      crossPol: { before: -6.9, after: -14.8 },
      dateBefore: '2024-05-10',
      dateAfter: '2024-05-30',
      source: 'illustrative',
    },
    series: [
      { date: '2024-04-06', vv: -13.1, vh: -20.0, water: 0.31, change: 0.08 },
      { date: '2024-04-30', vv: -12.9, vh: -19.8, water: 0.36, change: 0.11 },
      { date: '2024-05-10', vv: -13.2, vh: -20.1, water: 0.34, change: 0.09 },
      { date: '2024-05-24', vv: -11.4, vh: -21.7, water: 0.58, change: 0.52 },
      { date: '2024-05-30', vv: -9.8, vh: -24.6, water: 0.82, change: 0.94 },
      { date: '2024-06-18', vv: -10.7, vh: -23.4, water: 0.71, change: 0.78 },
      { date: '2024-07-22', vv: -12.1, vh: -21.6, water: 0.52, change: 0.41 },
      { date: '2024-09-03', vv: -13.0, vh: -20.4, water: 0.38, change: 0.17 },
      { date: '2024-11-14', vv: -13.4, vh: -20.0, water: 0.33, change: 0.12 },
      { date: '2025-02-08', vv: -13.3, vh: -20.2, water: 0.35, change: 0.10 },
    ],
    pulse: [0.08, 0.07, 0.09, 0.12, 0.18, 0.34, 0.62, 0.94, 0.88, 0.71, 0.49, 0.33, 0.22, 0.18, 0.14, 0.11],
    stablePulse: [0.06, 0.07, 0.05, 0.08, 0.06, 0.07, 0.05, 0.06, 0.08, 0.06, 0.05, 0.07, 0.06, 0.08, 0.05, 0.06],
    recovery: {
      thresholdDefault: 80,
      startLabel: { en: 'Surge', ar: 'العاصفة' },
      points: [
        { month: 0, pct: 35, projected: false },
        { month: 2, pct: 52, projected: false },
        { month: 4, pct: 63, projected: false },
        { month: 6, pct: 71, projected: false },
        { month: 9, pct: 78, projected: false },
        { month: 12, pct: 83, projected: false },
        { month: 18, pct: 88, projected: false },
        { month: 24, pct: 91, projected: false },
        { month: 36, pct: 94, projected: true },
        { month: 48, pct: 96, projected: true },
      ],
      note: {
        en: 'Fast radar recovery reflects receding water and leaf flush — not full mangrove recovery. Salinity stress and lost seedlings can take years to repair.',
        ar: 'التعافي الراداري السريع يعكس انحسار الماء ونمو الأوراق، وليس تعافي المانغروف الكامل. قد يستغرق إجهاد الملوحة وفقدان الشتلات سنوات للإصلاح.',
      },
    },
    contrast: {
      dominant: { en: 'Volume + double bounce', ar: 'تشتت حجمي + ارتداد مزدوج' },
      signature: { en: 'VH collapses; VV can brighten', ar: 'ينهار VH وقد يلمع VV' },
      timescale: { en: 'Months', ar: 'أشهر' },
    },
    researcher: {
      acquisition: {
        en: 'Target products: NISAR L-band GSLC (HH/HV) and GCOV; Sentinel-1 C-band GRD as the historical bridge. 12-day repeat, ascending and descending.',
        ar: 'المنتجات المستهدفة: NISAR L-band GSLC (HH/HV) وGCOV؛ وSentinel-1 C-band GRD كجسر تاريخي. تكرار 12 يومًا، صعودًا وهبوطًا.',
      },
      interpretation: [
        {
          en: 'VH is the stronger discriminator for flooding beneath vegetation because it loses canopy volume scattering. VV alone can mislead: flooded vegetation often brightens through double bounce.',
          ar: 'VH هو الفاصل الأقوى للفيضان تحت الغطاء النباتي لأنه يفقد التشتت الحجمي للمظلة. أما VV وحده فقد يضلل: الغطاء المغمور يلمع غالبًا بفعل الارتداد المزدوج.',
        },
        {
          en: 'L-band penetrates further into the mangrove canopy than C-band, so NISAR should preserve more trunk and branch signal during partial inundation — useful for separating “water under trees” from “open water”.',
          ar: 'ينفذ نطاق L أعمق في مظلة المانغروف من نطاق C، لذا ينبغي أن يحتفظ نيسار بإشارة أكبر من الجذوع والأغصان أثناء الغمر الجزئي، ما يساعد على التمييز بين «ماء تحت الأشجار» و«ماء مكشوف».',
        },
        {
          en: 'Quad-pol decomposition (surface / double-bounce / volume) is the clean way to map the three flood classes. Dual-pol HH/HV supports a simpler VH-based flood mask.',
          ar: 'تحليل الاستقطاب الرباعي (سطحي / مزدوج / حجمي) هو الطريق الأنظف لرسم أصناف الفيضان الثلاثة. أما الاستقطاب المزدوج HH/HV فيدعم قناع فيضان أبسط قائم على VH.',
        },
      ],
      limits: [
        {
          en: 'Tidal stage, wind roughening and vegetation density all modulate backscatter. One date cannot separate permanent water from a temporary sheet.',
          ar: 'مرحلة المدّ واضطراب الرياح وكثافة النباتات كلها تغيّر الارتداد. تاريخ واحد لا يفصل الماء الدائم عن طبقة مؤقتة.',
        },
        {
          en: 'Tall mangroves cause layover and shadow in side-looking geometry; radiometric terrain correction is mandatory before comparing dates.',
          ar: 'أشجار المانغروف العالية تسبب التراكب والظل في الهندسة الجانبية؛ التصحيح الراديومتري للتضاريس ضروري قبل مقارنة التواريخ.',
        },
      ],
      methods: [
        {
          en: 'Scenes are procedurally rendered illustrations, not satellite rasters. Values are anchored to published Sentinel-1 flood behaviour in mangroves.',
          ar: 'المشاهد رسوم توضيحية مولّدة إجرائيًا وليست صورًا فضائية حقيقية. القيم مستندة إلى سلوك الفيضان المنشور لـSentinel-1 في بيئات المانغروف.',
        },
        {
          en: 'Recovery is a normalized radar-structure index relative to the pre-surge baseline, with a logistic fit for the projection.',
          ar: 'التعافي مؤشر بنيوي راداري مُعيَّر نسبةً إلى خط الأساس قبل العاصفة، مع ملاءمة لوجستية للإسقاط.',
        },
      ],
      sources: [
        { label: 'NASA NISAR — Quick Facts', href: 'https://nisar.jpl.nasa.gov/mission/quick-facts' },
        { label: 'NISAR Science Users’ Handbook (2nd ed., 2025)', href: 'https://dataverse.jpl.nasa.gov/api/access/datafile/97405?gbrecs=true' },
        { label: 'NASA Earthdata — ASF DAAC', href: 'https://asf.alaska.edu/' },
        { label: 'ISRO Bhoonidhi — NISAR products', href: 'https://bhoonidhi.nrsc.gov.in/NISAR/NisarProducts.html' },
      ],
    },
  },

  {
    id: 'caldor',
    kind: 'forest',
    seed: 84,
    name: { en: 'Caldor burn scar', ar: 'أثر حريق كالدور' },
    region: { en: 'Sierra Nevada · California, USA', ar: 'سييرا نيفادا · كاليفورنيا، الولايات المتحدة' },
    coords: { lat: 38.75, lng: -120.35 },
    wkt: 'POLYGON ((-120.62 38.56, -120.08 38.56, -120.08 38.94, -120.62 38.94, -120.62 38.56))',
    eventDate: '2021-08-14',
    headline: {
      en: 'The forest that went quiet',
      ar: 'الغابة التي صمتت',
    },
    tags: [
      { key: 'terrain', value: { en: 'Steep conifer ridges', ar: 'قمم صنوبرية شديدة الانحدار' } },
      { key: 'soil', value: { en: 'Seasonally dry', ar: 'جافة موسميًا' } },
      { key: 'canopy', value: { en: 'Mixed conifer', ar: 'صنوبريات مختلطة' } },
      { key: 'driver', value: { en: 'Wildfire', ar: 'حريق غابات' } },
    ],
    story: [
      {
        en: 'The Caldor Fire burned more than 220,000 acres of mixed conifer forest in the Sierra Nevada in 2021. It removed canopy, exposed dry soil and left a burn scar that is still visible years later.',
        ar: 'أحرق حريق كالدور أكثر من 220 ألف فدان من غابات الصنوبريات المختلطة في سييرا نيفادا عام 2021. أزال المظلة وكشف التربة الجافة وترك أثر حرق ما زال ظاهرًا بعد سنوات.',
      },
      {
        en: 'Radar does not see ash. It sees structure. Before the fire, L-band waves bounced through needles and branches; afterwards the pulse met a smoother, drier surface and returned less energy. VH — the channel that loves twisted, three-dimensional vegetation — fell hardest. Recovery is slow: shrubs and young trees return long before the radar signal climbs back to its pre-fire level.',
        ar: 'الرادار لا يرى الرماد، بل يرى البنية. قبل الحريق كانت موجات نطاق L ترتد بين الإبر والأغصان؛ وبعده لاقت النبضة سطحًا أكثر نعومة وجفافًا فعادت بطاقة أقل. وكان VH — القناة التي تحب النباتات المجسّمة الملتفة — الأشد انخفاضًا. التعافي بطيء: تعود الشجيرات والأشجار الصغيرة قبل أن ترتفع إشارة الرادار إلى مستواها قبل الحريق بوقت طويل.',
      },
    ],
    states: {
      before: {
        date: '2021-07-18',
        label: { en: 'BEFORE THE FIRE', ar: 'قبل الحريق' },
        params: { water: 0, emergent: 0.9, burn: 0.04, cloud: 0.4 },
        caption: {
          en: 'Continuous conifer canopy on folded ridges. Bright, textured volume scattering.',
          ar: 'مظلة صنوبرية متصلة على قمم مطوية، وتشتت حجمي لامع وذو نسيج.',
        },
        happened: {
          en: 'A mature mixed-conifer forest covers the slopes. Soil is dry after a rainless summer, but the canopy is intact.',
          ar: 'تغطي الغابة الصنوبرية الناضجة المنحدرات. التربة جافة بعد صيف بلا مطر، لكن المظلة سليمة.',
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
        date: '2021-09-12',
        label: { en: 'AFTER THE FIRE', ar: 'بعد الحريق' },
        params: { water: 0, emergent: 0.12, burn: 0.9, cloud: 0.35 },
        caption: {
          en: 'A dark, smooth burn scar. Surviving trunks stand as isolated bright points.',
          ar: 'أثر حرق داكن وأملس. الجذوع الناجية تقف كنقاط لامعة معزولة.',
        },
        happened: {
          en: 'Crown fire and severe burning removed the canopy across the scar. Ash and exposed soil replaced needles and branches.',
          ar: 'أزال حريق التاج والاحتراق الشديد المظلة عبر مساحة الأثر. حلّ الرماد والتربة المكشوفة محل الإبر والأغصان.',
        },
        why: {
          en: 'With the canopy gone, the pulse hits a smoother, drier surface and bounces away. Both channels drop; VH drops more because the three-dimensional vegetation that twists the wave has disappeared.',
          ar: 'بغياب المظلة تصطدم النبضة بسطح أنعم وأجف وترتد بعيدًا. تنخفض القناتان، وينخفض VH أكثر لأن النباتات المجسّمة التي تلفّ الموجة قد اختفت.',
        },
        polarization: {
          en: 'VV: −4.7 dB. VH: −6.4 dB. The wider VH drop is the fingerprint of lost canopy structure, not just a darker surface.',
          ar: 'VV: −4.7 ديسيبل. VH: −6.4 ديسيبل. الانخفاض الأكبر في VH هو بصمة فقدان بنية المظلة، وليس مجرد سطح أغمق.',
        },
      },
    },
    measurements: {
      vv: { before: -8.9, after: -13.6 },
      vh: { before: -15.4, after: -21.8 },
      crossPol: { before: -6.5, after: -8.2 },
      dateBefore: '2021-07-18',
      dateAfter: '2021-09-12',
      source: 'illustrative',
    },
    series: [
      { date: '2021-06-20', vv: -8.8, vh: -15.2, burn: 0.02, change: 0.09 },
      { date: '2021-07-18', vv: -8.9, vh: -15.4, burn: 0.04, change: 0.10 },
      { date: '2021-08-14', vv: -10.1, vh: -17.6, burn: 0.45, change: 0.58 },
      { date: '2021-09-12', vv: -13.6, vh: -21.8, burn: 0.9, change: 0.93 },
      { date: '2021-10-24', vv: -13.9, vh: -22.1, burn: 0.88, change: 0.86 },
      { date: '2022-06-11', vv: -13.1, vh: -20.9, burn: 0.8, change: 0.72 },
      { date: '2023-07-02', vv: -12.2, vh: -19.1, burn: 0.66, change: 0.54 },
      { date: '2024-08-17', vv: -11.4, vh: -17.6, burn: 0.54, change: 0.42 },
      { date: '2025-07-29', vv: -10.8, vh: -16.7, burn: 0.45, change: 0.34 },
      { date: '2026-08-09', vv: -10.3, vh: -16.0, burn: 0.39, change: 0.29 },
    ],
    pulse: [0.1, 0.09, 0.11, 0.08, 0.1, 0.13, 0.28, 0.71, 0.93, 0.86, 0.74, 0.61, 0.55, 0.48, 0.42, 0.38],
    stablePulse: [0.05, 0.06, 0.05, 0.07, 0.06, 0.05, 0.06, 0.07, 0.05, 0.06, 0.05, 0.07, 0.06, 0.05, 0.06, 0.05],
    recovery: {
      thresholdDefault: 80,
      startLabel: { en: 'Fire', ar: 'الحريق' },
      points: [
        { month: 0, pct: 12, projected: false },
        { month: 3, pct: 18, projected: false },
        { month: 6, pct: 24, projected: false },
        { month: 12, pct: 34, projected: false },
        { month: 18, pct: 45, projected: false },
        { month: 24, pct: 54, projected: false },
        { month: 30, pct: 61, projected: false },
        { month: 36, pct: 66, projected: false },
        { month: 42, pct: 70, projected: false },
        { month: 48, pct: 73, projected: false },
        { month: 60, pct: 78, projected: false },
        { month: 72, pct: 82, projected: true },
        { month: 84, pct: 85, projected: true },
        { month: 96, pct: 87, projected: true },
      ],
      note: {
        en: 'Radar brightness can recover before the ecosystem does. A 73% signal at four years is not 73% of the original forest — carbon, species and soil are still rebuilding.',
        ar: 'قد يتعافى سطوع الرادار قبل النظام البيئي. إشارة 73% بعد أربع سنوات لا تعني 73% من الغابة الأصلية؛ فالكربون والأنواع والتربة ما زالت تتعافى.',
      },
    },
    contrast: {
      dominant: { en: 'Volume scattering', ar: 'تشتت حجمي' },
      signature: { en: 'VV and VH fall; VH falls more', ar: 'ينخفض VV وVH، وVH أكثر' },
      timescale: { en: 'Years', ar: 'سنوات' },
    },
    researcher: {
      acquisition: {
        en: 'Target products: NISAR L-band GSLC / GCOV (HH/HV, quad-pol where available), plus Sentinel-1 C-band for the 2021 archive. Terrain-corrected, radiometrically calibrated, same-track pairs.',
        ar: 'المنتجات المستهدفة: NISAR L-band GSLC / GCOV (HH/HV، ورباعي حيث يتاح)، مع Sentinel-1 C-band لأرشيف 2021. تصحيح تضاريسي ومعايرة راديومترية وأزواج من المسار نفسه.',
      },
      interpretation: [
        {
          en: 'In conifer forest, VH is a more robust burn-severity indicator than VV because VV is contaminated by surface roughness, soil moisture and char. A VH drop of >5 dB is a strong canopy-loss signal.',
          ar: 'في غابات الصنوبر، VH مؤشر أقوى لشدة الحرق من VV لأن VV يتأثر بخشونة السطح ورطوبة التربة والفحم. انخفاض VH أكثر من 5 ديسيبل إشارة قوية لفقدان المظلة.',
        },
        {
          en: 'L-band penetrates deeper than C-band and keeps sensitivity to woody trunks after the canopy is consumed. That should let NISAR separate “canopy consumed” from “canopy thinned” better than Sentinel-1.',
          ar: 'ينفذ نطاق L أعمق من نطاق C ويحافظ على حساسية للجذوع الخشبية بعد استهلاك المظلة. وهذا ينبغي أن يمكّن نيسار من التمييز بين «مظلة مستهلكة» و«مظلة مخففة» أفضل من Sentinel-1.',
        },
        {
          en: 'Because the orbit repeats within 12 days, NISAR can bracket a fire with pre- and post-event acquisitions — the single most valuable thing a radar time series can do for rapid damage assessment.',
          ar: 'لأن المدار يتكرر خلال 12 يومًا، يستطيع نيسار تأطير الحريق باقتناءات قبل الحدث وبعده — وهو أثمن ما تقدمه سلسلة زمنية رادارية لتقييم الأضرار السريع.',
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
          en: 'Scenes are procedurally rendered illustrations. Backscatter values are literature-informed, not official NISAR products.',
          ar: 'المشاهد رسوم توضيحية مولّدة إجرائيًا. قيم الارتداد مستندة إلى الأدبيات وليست منتجات نيسار رسمية.',
        },
        {
          en: 'Recovery points are normalized to the pre-fire VH baseline; the dashed segment is a logistic projection (K = 91%, r = 0.045/month).',
          ar: 'نقاط التعافي مُعيَّرة إلى خط أساس VH قبل الحريق؛ والجزء المتقطع إسقاط لوجستي (K = 91%، r = 0.045/شهر).',
        },
      ],
      sources: [
        { label: 'NASA NISAR — Quick Facts', href: 'https://nisar.jpl.nasa.gov/mission/quick-facts' },
        { label: 'NISAR Science Users’ Handbook (2nd ed., 2025)', href: 'https://dataverse.jpl.nasa.gov/api/access/datafile/97405?gbrecs=true' },
        { label: 'CAL FIRE — Caldor Fire incident', href: 'https://www.fire.ca.gov/incidents/2021/8/14/caldor-fire/' },
        { label: 'NASA Earthdata — ASF DAAC', href: 'https://asf.alaska.edu/' },
      ],
    },
  },
];

export const contrastRows = [
  {
    id: 'terrain',
    label: { en: 'Terrain', ar: 'التضاريس' },
    sundarbans: { en: 'Flat delta, tidal channels', ar: 'دلتا منبسطة وقنوات مدّية' },
    caldor: { en: 'Steep folds, 1,000 m relief', ar: 'طيات شديدة الانحدار وارتفاع 1000 م' },
  },
  {
    id: 'moisture',
    label: { en: 'Soil moisture', ar: 'رطوبة التربة' },
    sundarbans: { en: 'Saturated, saline', ar: 'مشبعة ومالحة' },
    caldor: { en: 'Dry most of the year', ar: 'جافة معظم السنة' },
  },
  {
    id: 'canopy',
    label: { en: 'Canopy', ar: 'المظلة' },
    sundarbans: { en: 'Low, dense mangrove', ar: 'مانغروف منخفض وكثيف' },
    caldor: { en: 'Tall mixed conifer', ar: 'صنوبريات مرتفعة مختلطة' },
  },
  {
    id: 'scattering',
    label: { en: 'Dominant scattering', ar: 'التشتت السائد' },
    sundarbans: { en: 'Volume + double bounce', ar: 'حجمي + ارتداد مزدوج' },
    caldor: { en: 'Volume scattering', ar: 'تشتت حجمي' },
  },
  {
    id: 'fingerprint',
    label: { en: 'Change fingerprint', ar: 'بصمة التغير' },
    sundarbans: { en: 'VH −4.5 dB; VV +3.4 dB', ar: 'VH −4.5 dB؛ VV +3.4 dB' },
    caldor: { en: 'VH −6.4 dB; VV −4.7 dB', ar: 'VH −6.4 dB؛ VV −4.7 dB' },
  },
  {
    id: 'recovery',
    label: { en: 'Signal returns to 80%', ar: 'عودة الإشارة إلى 80%' },
    sundarbans: { en: '≈ 10 months', ar: '≈ 10 أشهر' },
    caldor: { en: '≈ 66 months', ar: '≈ 66 شهرًا' },
  },
];

export const getSite = (id) => studyAreas.find((site) => site.id === id);
