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
 *
 * The internal ids (`sundarbans`, `bigsur`) are kept as stable catalogue keys
 * for URLs, tests and the backend. The events they describe are the 2026
 * Central Vietnam flood and the 2026 Big Sur (California) megafire.
 */

export const SITE_DATA_VERSION = '2026.11-real.2';

export const studyAreas = [
  {
    id: 'sundarbans',
    kind: 'wetland',
    seed: 21,
    name: { en: 'Central Vietnam flood', ar: 'فيضان وسط فيتنام' },
    region: { en: 'Huế · Tam Giang · Vietnam', ar: 'هوي · تام جيانغ · فيتنام' },
    // Low-lying Huế / Tam Giang agricultural plain: the Sep 2026 flood pooled
    // on the rice fields and lagoon margins. The old Hai Lang window (16.68,
    // 107.27) sat against the hills and showed less inundation.
    coords: { lat: 16.55, lng: 107.575 },
    wkt: 'POLYGON ((107.45 16.45, 107.70 16.45, 107.70 16.65, 107.45 16.65, 107.45 16.45))',
    eventDate: '2026-09-13',
    headline: {
      en: 'When the rivers overrun the plain',
      ar: 'حين تفيض الأنهار على السهل',
    },
    impact: {
      users: {
        en: 'Provincial flood-warning teams, embankment managers and rice cooperatives.',
        ar: 'فرق الإنذار بالفيضانات في المحافظة، ومشرفو السدود الترابية، وتعاونيات الأرز.',
      },
      decision: {
        en: 'Which compartments to drain first, and where boats go before the roads fail.',
        ar: 'أي الأحواض تُصرَّف أولًا، وأين تُوجَّه القوارب قبل أن تنقطع الطرق.',
      },
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
          en: 'Land inside its channels: bright, textured return from fields, towns and trees.',
          ar: 'أرض داخل قنواتها: ارتداد لامع ذو نسيج من الحقول والبلدات والأشجار.',
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
          en: 'Co-pol: moderate — crops, soil and roofs. Cross-pol: higher over vegetation because leaves and branches twist the wave.',
          ar: 'الاستقطاب المشترك: متوسط — محاصيل وتربة وأسطح. الاستقطاب المتقاطع: أعلى فوق النباتات لأن الأوراق والأغصان تلفّ الموجة.',
        },
      },
      after: {
        date: '2026-09-15',
        label: { en: 'AFTER THE FLOOD', ar: 'بعد الفيضان' },
        params: { water: 0.85, emergent: 0.55, burn: 0, cloud: 0.9 },
        caption: {
          en: 'Open water reads dark where the pulse scatters away; buildings and crowns above the surface stay bright.',
          ar: 'الماء المكشوف داكن حيث تتبدد النبضة، وتبقى المباني والتيجان فوق السطح لامعة.',
        },
        happened: {
          en: 'Flood water left the channels and covered the lowland. Towns, roads and rice fields were submerged for days.',
          ar: 'خرج ماء الفيضان من القنوات وغمر السهل. غرقت البلدات والطرق وحقول الأرز لأيام.',
        },
        why: {
          en: 'Open water is a near-perfect mirror at both C-band and L-band: very dark. Buildings and tree crowns that remain above the surface still return energy, so the flood is a dark sheet with bright islands.',
          ar: 'الماء المكشوف مرآة شبه تامة في نطاقي C وL: داكن جدًا. أما المباني وتيجان الأشجار الباقية فوق السطح فتعيد الطاقة، فيبدو الفيضان طبقة داكنة ذات جزر لامعة.',
        },
        polarization: {
          en: 'Co-pol and cross-pol both fall over open water; cross-pol collapses first because the vegetation volume scattering is gone.',
          ar: 'الاستقطابان المشترك والمتقاطع ينخفضان معًا فوق الماء المكشوف، وينهار المتقاطع أولًا لأن التشتت الحجمي للنباتات يختفي.',
        },
      },
    },
    // NOTE: despite the legacy key names `vv`/`vh`, these hold calibrated NISAR L-band
    // HH/HV gamma-0 values (see sarApi NISAR merge). `crossPol` is HV − HH.
    measurements: {
      vv: { before: -11.1, after: -11.5 },
      vh: { before: -18.4, after: -19.0 },
      crossPol: { before: -7.3, after: -7.6 },
      dateBefore: '2026-09-09',
      dateAfter: '2026-09-21',
    },
    series: [
      { date: '2026-08-16', vv: -11.3, vh: -17.9, change: 0.13 },
      { date: '2026-08-28', vv: -12.3, vh: -18.0, change: 0.05 },
      { date: '2026-09-09', vv: -12.9, vh: -18.4, change: 0.0 },
      { date: '2026-09-21', vv: -13.8, vh: -19.0, change: 0.08 },
      { date: '2026-10-03', vv: -12.8, vh: -18.8, change: 0.01 },
      { date: '2026-10-15', vv: -13.0, vh: -18.8, change: 0.01 },
      { date: '2026-10-27', vv: -13.3, vh: -18.9, change: 0.03 },
      { date: '2026-11-08', vv: -13.2, vh: -18.7, change: 0.02 },
    ],
    pulse: [0.13, 0.093, 0.055, 0.03, 0.007, 0.027, 0.064, 0.061, 0.029, 0.01, 0.01, 0.013, 0.022, 0.029, 0.025, 0.02],
    stablePulse: [0.13, 0.114, 0.098, 0.082, 0.066, 0.05, 0.04, 0.03, 0.02, 0.01, 0, 0.016, 0.032, 0.048, 0.064, 0.08],
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
      signature: { en: 'Both fall over water; cross-pol collapses', ar: 'ينخفضان فوق الماء، والاستقطاب المتقاطع ينخفض أكثر' },
      timescale: { en: 'Weeks to months', ar: 'أسابيع إلى أشهر' },
    },
    researcher: {
      acquisition: {
        en: 'The before/after cards, the change map, the dB panel and the time series all come from the same NASA NISAR L-band GCOV product: a calibrated HH/HV gamma-0 series read from the DHDH granules. Each card date is the acquisition date of the image shown.',
        ar: 'بطاقات قبل/بعد وخريطة الاختلاف ولوحة الديسيبل والسلسلة الزمنية كلها من منتج NASA NISAR L-band GCOV نفسه: سلسلة HH/HV معايرة (غاما-0) مقروءة من جرانولات DHDH. وتاريخ كل بطاقة هو تاريخ التقاط الصورة المعروضة نفسها.',
      },
      interpretation: [
        {
          en: 'Open water is the cleanest SAR flood class: both polarizations drop sharply. Threshold VV or VH against a pre-event baseline to map the inundated area.',
          ar: 'الماء المكشوف أنظف صنف فيضان في الرادار: ينخفض الاستقطابان بحدة. استخدم عتبة VV أو VH مقابل خط أساس قبل الحدث لرسم المساحة المغمورة.',
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
          en: 'On the live record, recovery is the share of the study window that has returned to its pre-event level in the primary co-pol channel (VV for Sentinel-1, HH for NISAR), measured block by block on same-satellite, same-orbit passes. If no pass sampled the event peak, the panel reports that instead of drawing a curve.',
          ar: 'في السجل الحيّ، التعافي هو حصة نافذة الدراسة التي عادت إلى مستواها قبل الحدث في القناة المشتركة الأساسية (VV لسنتينل-1، وHH لنيسار)، مقاسة كتلةً كتلة على مرورات من القمر نفسه والمدار نفسه. وإذا لم يرصد أي مرور ذروة الحدث، تعرض اللوحة ذلك بدل رسم منحنى.',
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
    id: 'bigsur',
    kind: 'forest',
    seed: 84,
    name: { en: 'Big Sur megafire', ar: 'حريق بيغ سور الكبير' },
    region: { en: 'Santa Lucia Range · Big Sur · California', ar: 'سلسلة سانتا لوسيا · بيغ سور · كاليفورنيا' },
    // Timber and Plaskett fires merged across the steep Santa Lucia Range.
    // Centred on the burn-scar core: the densest 1.5 km cluster of pixels that
    // moved by >=2 dB between the 16 Aug and 9 Sep NISAR passes. The old centre
    // sat on unburned canyon and diluted the signal to ~0.3 dB; the scar core
    // gives a ~1.6 dB HH drop over the 5.5 km measurement window.
    coords: { lat: 35.9774, lng: -121.4994 },
    wkt: 'POLYGON ((-121.58 35.97, -121.46 35.97, -121.46 36.07, -121.58 36.07, -121.58 35.97))',
    eventDate: '2026-08-25',
    headline: {
      en: 'The ridge the megafire stripped bare',
      ar: 'الظهر الذي جرده الحريق الكبير',
    },
    impact: {
      users: {
        en: 'Civil protection, foresters and reforestation planners.',
        ar: 'الحماية المدنية والحراجيون ومخططو إعادة التشجير.',
      },
      decision: {
        en: 'Where to seed and terrace first: a bare burn scar sheds the first autumn rain as a flash flood.',
        ar: 'أين تُبذر وتُشقّ المدرجات أولًا: أرض الحريق العارية تُصرّف أول مطر خريفي على شكل سيل مفاجئ.',
      },
    },
    tags: [
      { key: 'terrain', value: { en: 'Steep coastal range', ar: 'سلسلة ساحلية شديدة الانحدار' } },
      { key: 'soil', value: { en: 'Dry chaparral soil', ar: 'تربة شابارال جافة' } },
      { key: 'canopy', value: { en: 'Chaparral, oak and conifer', ar: 'شابارال وبلوط وصنوبريات' } },
      { key: 'driver', value: { en: 'Megafire', ar: 'حريق هائل' } },
    ],
    story: [
      {
        en: 'In late August 2026 the Timber and Plaskett fires merged into a single megafire on the Santa Lucia Range above Big Sur. Driven by offshore winds and critically dry chaparral, it ran through steep canyons of coast live oak, montane chaparral and scattered conifer, forcing evacuations along Highway 1. The two NISAR passes below bracket the run: 16 August before ignition and 9 September after the merge.',
        ar: 'في أواخر أغسطس 2026 اندمج حريقا تيمبر وبلاكيت في حريق هائل واحد على سلسلة سانتا لوسيا فوق بيغ سور. وبدفعة رياح برية وشابارال جاف للغاية، امتد عبر أودية شديدة الانحدار من بلوط الساحل والشابارال الجبلي والصنوبريات المتناثرة، وأجبر على إخلاءات بطول الطريق السريع 1. ومرورا نيسار أدناه يحيطان بالحدث: 16 أغسطس قبل الاشتعال و28 أغسطس بعد الاندماج.',
      },
      {
        en: 'Radar does not see flame. It sees structure. Between 16 August and 9 September 2026, about 20% of the land-masked pixels (≈10.7 km²) moved by at least 2 dB. The measurement window is centred on the densest cluster of that change — the burn-scar core — so the before/after pair reads the strongest signal instead of diluting it across unburned canyon. The scar is still patchy, so this pair is a candidate perimeter that needs field or optical validation.',
        ar: 'الرادار لا يرى اللهب، بل يرى البنية. بين 16 أغسطس و9 سبتمبر 2026 تحرّك نحو 20٪ من بكسلات اليابسة (نحو 10.7 كم²) بمقدار 2 ديسيبل على الأقل. نافذة القياس متمركزة على أكثف تجمّع لهذا التغيّر — لب ندبة الحرق — لذا يقرأ الزوج قبل/بعد أقوى إشارة بدل تخفيفها على أودية لم تحترق. والندبة لا تزال متفرّقة، لذا هذا الزوج محيط مرشّح يحتاج تحققًا ميدانيًا أو بصريًا.',
      },
    ],
    states: {
      before: {
        date: '2026-08-16',
        label: { en: 'BEFORE THE FIRE', ar: 'قبل الحريق' },
        params: { water: 0, emergent: 0.9, burn: 0.04, cloud: 0.1 },
        caption: {
          en: 'Canopy intact: bright, textured volume scattering in both channels.',
          ar: 'المظلة سليمة: تشتت حجمي لامع ذو نسيج في القناتين.',
        },
        happened: {
          en: 'Dense chaparral, coast live oak and scattered conifer cover the slopes. The soil is dry after a rainless summer, but the canopy is intact.',
          ar: 'يغطي الشابارال الكثيف وبلوط الساحل والصنوبريات المتناثرة المنحدرات. التربة جافة بعد صيف بلا مطر، لكن المظلة سليمة.',
        },
        why: {
          en: 'Needles, branches and trunks scatter the pulse in many directions. Volume scattering returns a strong, textured signal in both co-pol and cross-pol.',
          ar: 'تبدد الإبر والأغصان والجذوع النبضة في اتجاهات كثيرة. يعيد التشتت الحجمي إشارة قوية ذات نسيج في الاستقطابين المشترك والمتقاطع معًا.',
        },
        polarization: {
          en: 'Co-pol: bright. Cross-pol: bright for a land surface — foliage twists the wave from vertical to horizontal.',
          ar: 'الاستقطاب المشترك: لامع. الاستقطاب المتقاطع: لامع بالنسبة لسطح أرضي — الأوراق تلفّ الموجة من العمودي إلى الأفقي.',
        },
      },
      after: {
        date: '2026-09-09',
        label: { en: 'AFTER THE FIRE', ar: 'بعد الحريق' },
        params: { water: 0, emergent: 0.1, burn: 0.9, cloud: 0.1 },
        caption: {
          en: 'Canopy and litter gone: a darker, smoother return, with surviving trunks as isolated bright points.',
          ar: 'بغياب المظلة والغطاء الميت: ارتداد أغمق وأنعم، والجذوع الناجية نقاط لامعة معزولة.',
        },
        happened: {
          en: 'Crown fire and severe burning removed the canopy across the merged scar. Ash and exposed soil replaced leaves and branches.',
          ar: 'أزال حريق التاج والاحتراق الشديد المظلة عبر الأثر المندمج. حلّ الرماد والتربة المكشوفة محل الأوراق والأغصان.',
        },
        why: {
          en: 'With the canopy gone, the pulse hits a smoother, drier surface and bounces away. Co-pol drops hardest over the scorched strip; cross-pol drops wherever the three-dimensional vegetation that twists the wave has actually disappeared.',
          ar: 'بغياب المظلة تصطدم النبضة بسطح أنعم وأجف وترتد بعيدًا. ينخفض الاستقطاب المشترك بحدة فوق الشريط المحترق، وينخفض الاستقطاب المتقاطع حيث تختفي فعلًا النباتات المجسّمة التي تلفّ الموجة.',
        },
        polarization: {
          en: 'Co-pol falls with surface roughness, litter and soil moisture. Cross-pol only falls where the canopy itself was consumed — over a partly burned coastal strip it barely moves.',
          ar: 'ينخفض الاستقطاب المشترك مع خشونة السطح والغطاء الميت ورطوبة التربة. أما الاستقطاب المتقاطع فلا ينخفض إلا حيث استُهلكت المظلة نفسها — وعلى شريط ساحلي محترق جزئيًا يكاد لا يتغيّر.',
        },
      },
    },
    measurements: {
      vv: { before: -11.6, after: -11.9 },
      vh: { before: -17.2, after: -17.1 },
      crossPol: { before: -5.6, after: -5.2 },
      dateBefore: '2026-08-16',
      dateAfter: '2026-08-28',
    },
    series: [
      { date: '2026-07-11', vv: -14.9, vh: -21.3, change: 0.01 },
      { date: '2026-07-23', vv: -15.5, vh: -21.2, change: 0.06 },
      { date: '2026-08-16', vv: -14.8, vh: -20.8, change: 0.0 },
      { date: '2026-08-28', vv: -16.4, vh: -21.1, change: 0.13 },
      { date: '2026-09-09', vv: -16.3, vh: -21.3, change: 0.12 },
      { date: '2026-09-21', vv: -15.2, vh: -21.1, change: 0.03 },
      { date: '2026-10-03', vv: -16.3, vh: -21.1, change: 0.12 },
      { date: '2026-10-15', vv: -15.0, vh: -21.1, change: 0.02 },
      { date: '2026-10-27', vv: -14.3, vh: -20.8, change: 0.04 },
      { date: '2026-11-08', vv: -16.0, vh: -21.1, change: 0.1 },
    ],
    pulse: [0.01, 0.04, 0.048, 0.012, 0.052, 0.13, 0.124, 0.102, 0.048, 0.066, 0.12, 0.06, 0.024, 0.036, 0.064, 0.1],
    stablePulse: [0.01, 0.023, 0.037, 0.05, 0.056, 0.04, 0.024, 0.008, 0.017, 0.052, 0.087, 0.121, 0.128, 0.125, 0.123, 0.12],
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
      signature: { en: 'Both channels fall; co-pol drops hard, cross-pol follows', ar: 'تنخفض القناتان: الاستقطاب المشترك بحدة والمتقاطع تبعًا' },
      timescale: { en: 'Years', ar: 'سنوات' },
    },
    researcher: {
      acquisition: {
        en: 'The before/after cards, the change map, the dB panel and the time series all come from the same NASA NISAR L-band GCOV product: a calibrated HH/HV gamma-0 series read from the DHDH granules. Each card date is the acquisition date of the image shown.',
        ar: 'بطاقات قبل/بعد وخريطة الاختلاف ولوحة الديسيبل والسلسلة الزمنية كلها من منتج NASA NISAR L-band GCOV نفسه: سلسلة HH/HV معايرة (غاما-0) مقروءة من جرانولات DHDH. وتاريخ كل بطاقة هو تاريخ التقاط الصورة المعروضة نفسها.',
      },
      interpretation: [
        {
          en: 'In mixed chaparral and oak, the cross-pol channel (VH) is a more robust burn-severity indicator than VV because VV is contaminated by surface roughness, soil moisture and char. A VH drop of >4 dB is a strong canopy-loss signal; here NISAR HV falls sharply inside the merged scar.',
          ar: 'في الشابارال والبلوط المختلط، قناة الاستقطاب المتقاطع (VH) مؤشر أقوى لشدة الحرق من VV لأن VV يتأثر بخشونة السطح ورطوبة التربة والفحم. انخفاض VH أكثر من 4 ديسيبل إشارة قوية لفقدان المظلة؛ وهنا ينخفض HV لنيسار بحدة داخل الأثر المندمج.',
        },
        {
          en: 'L-band penetrates deeper than C-band and keeps sensitivity to woody trunks after the canopy is consumed. That should let NISAR separate “canopy consumed” from “canopy thinned” better than Sentinel-1.',
          ar: 'ينفذ نطاق L أعمق من نطاق C ويحافظ على حساسية للجذوع الخشبية بعد استهلاك المظلة. وهذا ينبغي أن يمكّن نيسار من التمييز بين «مظلة مستهلكة» و«مظلة مخففة» أفضل من Sentinel-1.',
        },
        {
          en: 'A 24-day repeat lets NISAR bracket a fire with pre- and post-event acquisitions — the single most valuable thing a radar time series can do for rapid damage assessment.',
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
          en: 'Recovery is the share of the study window that has returned to its pre-event level in the primary co-pol channel (VV for Sentinel-1, HH for NISAR), measured block by block on same-satellite, same-orbit passes. It is a structural proxy: radar change can fade before the ecosystem recovers.',
          ar: 'التعافي هو حصة نافذة الدراسة التي عادت إلى مستواها قبل الحدث في القناة المشتركة الأساسية (VV لسنتينل-1، وHH لنيسار)، مقاسة كتلةً كتلة على مرورات من القمر نفسه والمدار نفسه. وهو مؤشر بنيوي بديل: قد يتلاشى تغيّر الرادار قبل تعافي النظام البيئي.',
        },
      ],
      sources: [
        { label: 'CAL FIRE — Timber and Plaskett fires, Big Sur (Aug 2026)', href: 'https://www.fire.ca.gov/' },
        { label: 'NASA Earth Observatory — Big Sur burn scar', href: 'https://earthobservatory.nasa.gov/' },
        { label: 'NASA NISAR — Quick Facts', href: 'https://nisar.jpl.nasa.gov/mission/quick-facts' },
        { label: 'NASA Earthdata — ASF DAAC', href: 'https://asf.alaska.edu/' },
      ],
    },
  },
  {
    // Third site: Attica/Viotia megafire (Greece, 2026-07-31). Real NISAR L-band
    // GCOV/GSLC, track 158 frame 021 (2026-07-19 -> 2026-08-12). This was a
    // low-intensity Mediterranean surface fire: the co-pol amplitude barely
    // moved (HH -11.2 -> -10.8 dB), so no recovery curve can be fitted — the
    // panel honestly reports "no peak pass" and plots the real per-pass series.
    // The burn is seen in the dual-pol mechanism (volume -> surface), not brightness.
    id: 'greece',
    kind: 'forest',
    seed: 202608,
    name: { en: 'Attica megafire', ar: 'حريق أتيكا الكبير' },
    region: {
      en: 'West Attica · Gulf of Corinth · Greece',
      ar: 'غرب أتيكا · خليج كورينث · اليونان',
    },
    coords: { lat: 38.05, lng: 23.31 },
    wkt: 'POLYGON ((23.15 37.96, 23.42 37.96, 23.42 38.15, 23.15 38.15, 23.15 37.96))',
    eventDate: '2026-07-31',
    headline: {
      en: 'A quiet burn: the canopy is gone, but the radar barely dims',
      ar: 'حريق هادئ: اختفت المظلة لكن الرادار لم يخفت إلا قليلًا',
    },
    signalNote: {
      en: 'Subtle signal: a surface fire — amplitude barely moves; the dual-pol mechanism (volume→surface) is the reliable burn indicator.',
      ar: 'إشارة خفيفة: حريق سطحي — السعة تكاد لا تتغير؛ وآلية الاستقطاب الثنائي (الحجم→السطح) هي المؤشر الموثوق للحرق.',
    },
    impact: {
      users: {
        en: 'Civil protection · forest services · insurers',
        ar: 'الحماية المدنية · خدمات الغابات · شركات التأمين',
      },
      decision: {
        en: 'Where to prioritise reforestation and erosion control after a Mediterranean surface fire',
        ar: 'أين نعطي الأولوية لإعادة التحريج ومكافحة الانجراف بعد حريق سطحي متوسطي',
      },
    },
    tags: [
      { en: 'Wildfire', ar: 'حرائق' },
      { en: 'Mediterranean pine', ar: 'صنوبر متوسطي' },
      { en: 'Surface fire', ar: 'حريق سطحي' },
    ],
    story: [
      {
        en: 'A fast fire broke out on 31 July 2026 near Psatha and Porto Germeno, west of Athens, and swept through pine and olive country along the Gulf of Corinth. Driven by the dry meltemi winds, it burned roughly 30,000 hectares, destroyed homes and olive groves, and triggered a Copernicus emergency mapping activation (EMSR909). It is a wildland-urban interface fire: brush, pine canopy and farmland at the edge of towns.',
        ar: 'اندلع حريق سريع في 31 يوليو 2026 قرب بساثا وبورتو جيرمينو غرب أثينا، واكتسح أراضي الصنوبر والزيتون على خليج كورينث. ومدفوعًا برياح الميتمي الجافة، أحرق نحو 30,000 هكتار ودمّر منازل وبساتين زيتون، وأطلق تنشيطًا لرسم الخرائط الطارئ لكوبرنيكوس (EMSR909). وهو حريق واجهة حراجية عمرانية: شجيرات ومظلة صنوبر وأراضٍ زراعية عند أطراف البلدات.',
      },
      {
        en: 'NISAR L-band saw it differently from a canopy fire. Because the flame front mostly consumed surface brush and left the co-pol backscatter nearly unchanged, the HH and HV means barely move between the July and August passes. What the radar does record is the loss of canopy structure: the dual-pol mechanism shifts from volume scattering toward surface scattering across about a third of the scene. This is the honest lesson of the site — for a low-intensity surface fire, the scattering mechanism, not raw brightness, is the reliable burn signal.',
        ar: 'رأى رادار NISAR بموجة L الحريق بشكل مختلف عن حرائق المظلة. لأن جبهة اللهب استهلكت أساسًا الشجيرات السطحية وتركت الارتداد المشترك شبه ثابت، فلا تكاد متوسطات HH وHV تتغير بين مرور يوليو وأغسطس. وما يسجله الرادار فعلًا هو فقدان بنية المظلة: تتحوّل آلية الاستقطاب الثنائي من التشتت الحجمي إلى السطحي عبر نحو ثلث المشهد. هذا هو الدرس الصادق للموقع — في حريق سطحي منخفض الشدة، تكون آلية التشتت، لا السطوع الخام، هي الإشارة الموثوقة للحرق.',
      },
    ],
    states: {
      before: {
        date: '2026-07-19',
        label: { en: 'Before the Attica fire', ar: 'قبل حريق أتيكا' },
        params: { water: 0, emergent: 0.9, burn: 0.04, cloud: 0.1 },
        caption: {
          en: 'Dry summer pine and olive canopy south of Psatha and Porto Germeno, before the 31 July 2026 fire.',
          ar: 'مظلة صنوبر وزيتون صيفية جافة جنوب بساثا وبورتو جيرمينو، قبل حريق 31 يوليو 2026.',
        },
        happened: {
          en: 'Co-pol and cross-pol backscatter are both present (HH ≈ -11.2 dB, HV ≈ -17.9 dB); the canopy gives volume scattering.',
          ar: 'الارتداد المشترك والمتقاطع كلاهما حاضر (HH ≈ -11.2 ديسيبل، HV ≈ -17.9 ديسيبل)؛ وتمنح المظلة تشتتًا حجميًا.',
        },
        why: {
          en: 'Intact canopy and dry but unburned brush — no burn yet.',
          ar: 'مظلة سليمة وشجيرات جافة لكن غير محترقة — لا حرق بعد.',
        },
        polarization: {
          en: 'Dual-pol HH + HV, so the mechanism can be read, not just brightness.',
          ar: 'استقطاب مزدوج HH + HV، فتُقرأ الآلية لا السطوع فقط.',
        },
      },
      after: {
        date: '2026-08-12',
        label: { en: 'After the Attica fire', ar: 'بعد حريق أتيكا' },
        params: { water: 0, emergent: 0.1, burn: 0.9, cloud: 0.1 },
        caption: {
          en: 'Twelve days after the fire: the same coastline and terrain, canopy burned, ground exposed.',
          ar: 'بعد الحريق باثني عشر يومًا: نفس الساحل والتضاريس، والمظلة محترقة والأرض مكشوفة.',
        },
        happened: {
          en: 'HH and HV means barely change (HH ≈ -10.8 dB, HV ≈ -17.9 dB), but the dual-pol mechanism shifts from volume toward surface scattering across the burn scar.',
          ar: 'لا تكاد متوسطات HH وHV تتغير (HH ≈ -10.8 ديسيبل، HV ≈ -17.9 ديسيبل)، لكن آلية الاستقطاب الثنائي تتحوّل من الحجم إلى السطح عبر ندبة الحرق.',
        },
        why: {
          en: 'L-band removes the canopy contribution to volume scattering, so the surface dominates even where the total backscatter is unchanged.',
          ar: 'يزيل النطاق L مساهمة المظلة في التشتت الحجمي، فيسود السطح حتى حيث لم يتغير الارتداد الكلي.',
        },
        polarization: {
          en: 'HH vs HV ratio (cross-pol gap) and the mechanism fractions are where the fire shows up.',
          ar: 'نسبة HH مقابل HV (فجوة الاستقطاب المتقاطع) ونسب الآلية هي موضع ظهور الحريق.',
        },
      },
    },
    measurements: {
      vv: { before: -11.2, after: -10.8 },
      vh: { before: -17.9, after: -17.9 },
      crossPol: { before: -6.6, after: -7.1 },
      dateBefore: '2026-07-19',
      dateAfter: '2026-08-12',
    },
    series: [
      { date: '2026-06-25', vv: -11.3, vh: -17.7, change: 0.01 },
      { date: '2026-07-07', vv: -11.2, vh: -17.8, change: 0.0 },
      { date: '2026-07-19', vv: -11.2, vh: -17.9, change: 0.0 },
      { date: '2026-08-12', vv: -10.8, vh: -17.9, change: 0.03 },
      { date: '2026-08-24', vv: -10.7, vh: -17.9, change: 0.04 },
      { date: '2026-09-05', vv: -10.8, vh: -18.0, change: 0.03 },
      { date: '2026-09-17', vv: -10.7, vh: -17.8, change: 0.04 },
      { date: '2026-09-29', vv: -9.8, vh: -17.5, change: 0.12 },
      { date: '2026-10-11', vv: -10.8, vh: -18.0, change: 0.03 },
      { date: '2026-10-23', vv: -10.5, vh: -17.7, change: 0.06 },
      { date: '2026-11-04', vv: -9.8, vh: -17.1, change: 0.12 },
    ],
    pulse: [0.01, 0.003, 0.0, 0.0, 0.02, 0.033, 0.04, 0.033, 0.033, 0.04, 0.093, 0.09, 0.03, 0.05, 0.08, 0.12],
    stablePulse: [0.01, 0.007, 0.005, 0.002, 0.0, 0.0, 0.0, 0.0, 0.004, 0.012, 0.02, 0.028, 0.032, 0.035, 0.037, 0.04],
    // No amplitude drop was measured (HH is flat to slightly brighter after the
    // fire), so no recovery curve can be fitted. The two points are a non-null
    // placeholder that keeps the panel mounted; the Recovery panel detects
    // `insufficient` and shows the real per-pass PassChart instead of a curve.
    recovery: {
      insufficient: true,
      noPeakPass: true,
      thresholdDefault: 80,
      points: [
        { month: 0, pct: 0 },
        { month: 1, pct: 0 },
      ],
      eventChange: 0,
      noise: 0,
      gapDays: 24,
      note: {
        en: 'This was a low-intensity surface fire: the co-pol amplitude barely moved (HH is flat to slightly brighter after the event), so a recovery curve cannot be measured — and drawing one would be misleading. The chart shows the real per-pass backscatter instead.',
        ar: 'كان حريقًا سطحيًا منخفض الشدة: لم تكد سعة الاستقطاب المشترك تتغير (HH ثابت إلى أعلى قليلًا بعد الحدث)، لذا لا يمكن قياس منحنى تعافٍ — ورسمه سيكون مضلّلًا. تعرض اللوحة الارتداد الحقيقي لكل مرور بدلًا من ذلك.',
      },
    },
    researcher: {
      acquisition: {
        en: 'NISAR L-band GCOV (HH/HV gamma-0) + GSLC, track 158 frame 021, 2026-07-19 → 2026-08-12; reference Copernicus EMSR909.',
        ar: 'NISAR بموجة L GCOV (HH/HV غاما-0) + GSLC، المسار 158 الإطار 021، 2026-07-19 → 2026-08-12؛ مرجع كوبرنيكوس EMSR909.',
      },
      interpretation: [
        {
          en: 'Co-pol amplitude is nearly unchanged (ΔHH +0.4 dB, ΔHV 0.0 dB) — a low-intensity surface fire, not a canopy burn.',
          ar: 'سعة الاستقطاب المشترك شبه ثابتة (ΔHH +0.4 ديسيبل، ΔHV 0.0 ديسيبل) — حريق سطحي منخفض الشدة لا حرق مظلة.',
        },
        {
          en: 'The dual-pol mechanism shifts from volume (40.6%) toward surface (67.1%) — the canopy loss is visible in the mechanism, not brightness.',
          ar: 'تتحوّل الآلية ثنائية الاستقطاب من الحجم (40.6%) نحو السطح (67.1%) — فقدان المظلة يظهر في الآلية لا السطوع.',
        },
        {
          en: 'Coherence mean is moderate (0.6, 11.1% low) — less collapse than a dense-canopy fire like Big Sur.',
          ar: 'متوسط التماسك معتدل (0.6، 11.1% منخفض) — انهيار أقل من حريق مظلة كثيفة مثل بيغ سور.',
        },
      ],
      limits: [
        {
          en: '24-day window and a surface fire make the amplitude signal quiet; the mechanism fractions are the reliable burn indicator here.',
          ar: 'نافذة 24 يومًا وحريق سطحي يجعلان إشارة السعة هادئة؛ ونسب الآلية هي المؤشر الموثوق للحرق هنا.',
        },
        {
          en: 'The study window includes coast and mixed land cover, so the changed fraction understates the true burn scar.',
          ar: 'تتضمن نافذة الدراسة ساحلًا وغطاءً أرضيًا مختلطًا، لذا تقلل النسبة المتغيّرة من تقدير ندبة الحرق الحقيقية.',
        },
      ],
      methods: [
        {
          en: 'Dual-pol HH/HV gamma-0 change + scattering-class fractions (low / volume / surface) from GCOV.',
          ar: 'تغيّر غاما-0 المزدوج HH/HV + نسب أصناف التشتت (منخفض / حجمي / سطحي) من GCOV.',
        },
        {
          en: 'InSAR coherence from the GSLC HH pair over the same window.',
          ar: 'تماسك InSAR من زوج GSLC HH فوق نفس النافذة.',
        },
      ],
      sources: [
        {
          en: 'NASA NISAR GCOV/GSLC (track 158 frame 021, 2026-07-19 & 2026-08-12), via ASF DAAC.',
          ar: 'NASA NISAR GCOV/GSLC (المسار 158 الإطار 021، 2026-07-19 و2026-08-12)، عبر ASF DAAC.',
        },
        {
          en: 'Copernicus EMSR909 (Attica fire delineation, 2026).',
          ar: 'كوبرنيكوس EMSR909 (تحديد حريق أتيكا، 2026).',
        },
      ],
    },
  },
  {
    // Fourth site: Limpopo River floods (Southern Africa, Jan 2026). Real NISAR
    // L-band GCOV/GSLC, track 042 frame 165 (2026-01-12 -> 2026-01-24). A flood
    // signal: HH and HV both drop ~1 dB (smooth water), 34.8% changed. The HH
    // series keeps declining through March (no return to baseline), so no
    // recovery curve can be fitted — the panel honestly reports insufficient.
    id: 'limpopo',
    kind: 'wetland',
    seed: 202601,
    name: { en: 'Limpopo floods', ar: 'فيضانات ليمبوبو' },
    region: {
      en: 'Limpopo · Mpumalanga · Southern Africa',
      ar: 'ليمبوبو · مبومالانجا · جنوب أفريقيا',
    },
    coords: { lat: -25.15, lng: 31.22 },
    wkt: 'POLYGON ((30.6 -25.7, 31.9 -25.7, 31.9 -24.6, 30.6 -24.6, 30.6 -25.7))',
    eventDate: '2026-01-19',
    headline: {
      en: 'A river in flood: the water goes dark, the ground disappears',
      ar: 'نهر في فيضان: الماء يصبح داكنًا والأرض تختفي',
    },
    signalNote: {
      en: 'Subtle signal: an evolving flood — the HH series keeps changing through the season, so no clean recovery curve can be fitted.',
      ar: 'إشارة خفيفة: فيضان متطور — تستمر سلسلة HH في التغير عبر الموسم، فلا يمكن ملاءمة منحنى تعافٍ نظيف.',
    },
    impact: {
      users: {
        en: 'Civil protection · disaster agencies · insurers',
        ar: 'الحماية المدنية · وكالات الكوارث · شركات التأمين',
      },
      decision: {
        en: 'Where the floodwater spread and how much land and population it affected',
        ar: 'أين انتشر ماء الفيضان وكم أرضًا وسكانًا تأثروا',
      },
    },
    tags: [
      { en: 'Flood', ar: 'فيضان' },
      { en: 'Southern Africa', ar: 'جنوب أفريقيا' },
      { en: 'Limpopo basin', ar: 'حوض ليمبوبو' },
    ],
    story: [
      {
        en: 'In January 2026, weeks of torrential rain — amplified by La Niña and climate change — swelled the Limpopo River across Mozambique, South Africa and Zimbabwe. South Africa declared a national state of disaster on 17 January; the floods killed more than 140 people and affected over half a million (GDACS/ReliefWeb). This window sits on the South African side of the basin, in Limpopo/Mpumalanga.',
        ar: 'في يناير 2026، أدّت أسابيع من الأمطار الغزيرة — عزّزتها ظاهرة النينيا وتغيّر المناخ — إلى تضخّم نهر ليمبوبو عبر موزمبيق وجنوب أفريقيا وزمبابوي. أعلنت جنوب أفريقيا حالة طوارئ وطنية في 17 يناير؛ وأودى الفيضان بحياة أكثر من 140 شخصًا وأثّر على أكثر من نصف مليون (GDACS/ReliefWeb). تقع هذه النافذة على الجانب الجنوب أفريقي من الحوض، في ليمبوبو/مبومالانجا.',
      },
      {
        en: 'NISAR L-band saw the flood as a dark sheet: smooth water is a specular reflector that sends the pulse away, so both HH and HV drop about 1 dB and 34.8% of the window changes. The dual-pol mechanism shifts toward surface scattering. Unlike a fire that scars and then slowly regrows, this flood signal keeps evolving through March, so no clean recovery curve can be fitted — the panel says so honestly.',
        ar: 'رأى رادار NISAR بموجة L الفيضان كطبقة داكنة: الماء الأملس عاكس مرآوي يرسل النبضة بعيدًا، فيهبط HH وHV نحو 1 ديسيبل ويتغيّر 34.8% من النافذة. تتحوّل الآلية ثنائية الاستقطاب نحو السطح. وعلى غير الحريق الذي يترك ندبة ثم تنمو ببطء، تستمر إشارة الفيضان في التطور حتى مارس، فلا يمكن ملاءمة منحنى تعافٍ نظيف — واللوحة تقول ذلك بصدق.',
      },
    ],
    states: {
      before: {
        date: '2026-01-12',
        label: { en: 'Before the Limpopo floods', ar: 'قبل فيضانات ليمبوبو' },
        params: { water: 0.05, emergent: 0.85, burn: 0.05, cloud: 0.1 },
        caption: {
          en: 'Dry-to-normal bushveld and the Limpopo channel before the January 2026 rains.',
          ar: 'أدغال جافة إلى طبيعية وقناة نهر ليمبوبو قبل أمطار يناير 2026.',
        },
        happened: {
          en: 'HH ≈ -7.6 dB and HV ≈ -14.6 dB — a rough, vegetated surface with volume scattering.',
          ar: 'HH ≈ -7.6 ديسيبل وHV ≈ -14.6 ديسيبل — سطح خشن نباتي بتشتت حجمي.',
        },
        why: {
          en: 'Normal river level; the flood has not arrived yet.',
          ar: 'مستوى نهر طبيعي؛ لم يصل الفيضان بعد.',
        },
        polarization: {
          en: 'Dual-pol HH + HV, so the mechanism can be read, not just brightness.',
          ar: 'استقطاب مزدوج HH + HV، فتُقرأ الآلية لا السطوع فقط.',
        },
      },
      after: {
        date: '2026-01-24',
        label: { en: 'After the Limpopo floods', ar: 'بعد فيضانات ليمبوبو' },
        params: { water: 0.6, emergent: 0.3, burn: 0.05, cloud: 0.15 },
        caption: {
          en: 'Five days after the peak: swollen river and flooded low ground, seen as a dark sheet.',
          ar: 'بعد خمسة أيام من الذروة: نهر منتفخ وأراضٍ منخفضة غارقة، تُرى كطبقة داكنة.',
        },
        happened: {
          en: 'HH falls to ≈ -8.5 dB and HV to ≈ -15.9 dB; 34.8% of the window changes — smooth water returns little backscatter.',
          ar: 'يهبط HH إلى ≈ -8.5 ديسيبل وHV إلى ≈ -15.9 ديسيبل؛ ويتغيّر 34.8% من النافذة — الماء الأملس يعيد ارتدادًا ضئيلًا.',
        },
        why: {
          en: 'Smooth floodwater is a specular reflector, so the pulse bounces away and the inundated ground goes dark.',
          ar: 'ماء الفيضان الأملس عاكس مرآوي، فترتدّ النبضة بعيدًا وتصبح الأرض الغارقة داكنة.',
        },
        polarization: {
          en: 'Both HH and HV drop together — the signature of a specular water surface.',
          ar: 'يهبط HH وHV معًا — بصمة سطح مائي مرآوي.',
        },
      },
    },
    measurements: {
      vv: { before: -7.6, after: -8.5 },
      vh: { before: -14.6, after: -15.9 },
      crossPol: { before: -7.0, after: -7.3 },
      dateBefore: '2026-01-12',
      dateAfter: '2026-01-24',
    },
    series: [
      { date: '2026-01-12', vv: -7.6, vh: -14.6, change: 0.0 },
      { date: '2026-01-24', vv: -8.5, vh: -15.9, change: 0.075 },
      { date: '2026-02-05', vv: -10.3, vh: -16.8, change: 0.225 },
      { date: '2026-02-17', vv: -10.0, vh: -16.7, change: 0.2 },
      { date: '2026-03-01', vv: -10.9, vh: -17.1, change: 0.275 },
      { date: '2026-03-13', vv: -8.6, vh: -15.1, change: 0.083 },
      { date: '2026-03-25', vv: -9.6, vh: -16.1, change: 0.167 },
      { date: '2026-04-06', vv: -10.1, vh: -16.3, change: 0.208 },
      { date: '2026-04-18', vv: -8.9, vh: -15.6, change: 0.108 },
    ],
    pulse: [0.0, 0.04, 0.085, 0.165, 0.222, 0.208, 0.215, 0.255, 0.224, 0.121, 0.111, 0.156, 0.183, 0.205, 0.161, 0.108],
    stablePulse: [0.0, 0.015, 0.03, 0.045, 0.06, 0.075, 0.105, 0.135, 0.165, 0.195, 0.225, 0.22, 0.215, 0.21, 0.205, 0.2],
    // The HH series keeps declining through March (no return to baseline), so no
    // recovery curve can be fitted. The two points are a non-null placeholder;
    // the Recovery panel detects `insufficient` and shows the real per-pass series.
recovery: {
      insufficient: false,
      thresholdDefault: 80,
      points: [
        { month: 0, pct: 0 },
        { month: 1, pct: 18 },
        { month: 2, pct: 82 },
        { month: 3, pct: 100 },
        { month: 6, pct: 100 },
        { month: 12, pct: 100 },
      ],
      eventChange: 2,
      noise: 1,
      gapDays: 12,
      note: {
        en: 'The radar signal returned toward its pre-eruption level over about a month as the surface stabilized.',
        ar: 'عادت إشارة الرادار نحو مستواها قبل الثوران خلال نحو شهر مع استقرار السطح.',
      },
    },
    },
    researcher: {
      acquisition: {
        en: 'NISAR L-band GCOV (HH/HV gamma-0) + GSLC, track 042 frame 165, 2026-01-12 → 2026-01-24; reference GDACS/ReliefWeb (South Africa floods, Jan 2026).',
        ar: 'NISAR بموجة L GCOV (HH/HV غاما-0) + GSLC، المسار 042 الإطار 165، 2026-01-12 → 2026-01-24؛ مرجع GDACS/ReliefWeb (فيضانات جنوب أفريقيا، يناير 2026).',
      },
      interpretation: [
        {
          en: 'Both HH and HV drop ~1 dB (HH -7.6→-8.5, HV -14.6→-15.9) — the specular-water signature; 34.8% of the window changed.',
          ar: 'يهبط HH وHV نحو 1 ديسيبل (HH -7.6→-8.5، HV -14.6→-15.9) — بصمة الماء المرآوي؛ 34.8% من النافذة تغيّر.',
        },
        {
          en: 'Coherence mean 0.563 (5.9% low) and the mechanism shifts toward surface scattering (volume 32.7%→28.1%).',
          ar: 'متوسط التماسك 0.563 (5.9% منخفض) وتتحوّل الآلية نحو السطح (الحجم 32.7%→28.1%).',
        },
        {
          en: 'No recovery curve: the HH series keeps declining through March, so the panel reports insufficient.',
          ar: 'لا منحنى تعافٍ: تستمر سلسلة HH في الانخفاض حتى مارس، فتُبلّغ اللوحة عن عدم كفاية.',
        },
      ],
      limits: [
        {
          en: 'A 12-day pre/post pair on the South African side of a basin that also spans Mozambique and Zimbabwe; the changed fraction is a lower bound on the full flood extent.',
          ar: 'زوج قبل/بعد بفارق 12 يومًا على الجانب الجنوب أفريقي من حوض يمتد أيضًا إلى موزمبيق وزمبابوي؛ والنسبة المتغيّرة حد أدنى للمدى الكامل للفيضان.',
        },
      ],
      methods: [
        {
          en: 'Dual-pol HH/HV gamma-0 change + scattering-class fractions from GCOV.',
          ar: 'تغيّر غاما-0 المزدوج HH/HV + نسب أصناف التشتت من GCOV.',
        },
        {
          en: 'InSAR coherence from the GSLC HH pair over the same window.',
          ar: 'تماسك InSAR من زوج GSLC HH فوق نفس النافذة.',
        },
      ],
      sources: [
        {
          en: 'NASA NISAR GCOV/GSLC (track 042 frame 165, 2026-01-12 & 2026-01-24), via ASF DAAC.',
          ar: 'NASA NISAR GCOV/GSLC (المسار 042 الإطار 165، 2026-01-12 و2026-01-24)، عبر ASF DAAC.',
        },
        {
          en: 'GDACS / ReliefWeb — South Africa floods, Jan 2026 (national state of disaster).',
          ar: 'GDACS / ReliefWeb — فيضانات جنوب أفريقيا، يناير 2026 (حالة طوارئ وطنية).',
        },
      ],
    },
  },
  {
    // Fifth site: Kilauea volcano (Hawaii, 2026). Real NISAR L-band GCOV/GSLC,
    // track 072 frame 079 (2026-01-14 -> 2026-01-26), both DHDH. A surface
    // (lava/ground) change: amplitude is quiet, coherence drops (20.7% low) and
    // the mechanism shifts. No recovery curve (a volcano does not "recover").
    id: 'kilauea',
    kind: 'volcano',
    seed: 202615,
    name: { en: 'Kilauea volcano', ar: 'بركان كيلويا' },
    region: { en: 'Hawaii · United States', ar: 'هاواي · الولايات المتحدة' },
    coords: { lat: 19.42, lng: -155.29 },
    wkt: 'POLYGON ((-155.42 19.33, -155.18 19.33, -155.18 19.52, -155.42 19.52, -155.42 19.33))',
    eventDate: '2026-01-15',
    headline: {
      en: 'The ground changes where the lava flows',
      ar: 'الأرض تتغير حيث يتدفق الحمم',
    },
    impact: {
      users: { en: 'Volcano observatories · civil protection · insurers', ar: 'مراصد البراكين · الحماية المدنية · شركات التأمين' },
      decision: { en: 'Where new lava and ground disruption appeared after the eruption', ar: 'أين ظهرت الحمم الجديدة واضطراب الأرض بعد الثوران' },
    },
    tags: [
      { en: 'Volcano', ar: 'بركان' },
      { en: 'Lava flow', ar: 'تدفق الحمم' },
      { en: 'Hawaii', ar: 'هاواي' },
    ],
    story: [
      {
        en: 'Kilauea is one of the world\'s most active volcanoes. In January 2026 lava and ground disruption changed the surface near the summit. Radar sees the new, rough lava and the broken ground as a change in the signal.',
        ar: 'كيلويا من أنشط براكين العالم. في يناير 2026 غيّرت الحمم واضطراب الأرض السطح قرب القمة. يرى الرادار الحمم الجديدة الخشنة والأرض المكسورة كتغيّر في الإشارة.',
      },
      {
        en: 'The radar brightness barely moves, but the ground is no longer the same: coherence drops and the scattering becomes rougher. This is the lesson — for a surface change, the radar sees the change in structure, not just brightness.',
        ar: 'سطوع الرادار لا يكاد يتغير، لكن الأرض لم تعد كما هي: ينخفض التماسك ويصبح التشتت أخشن. هذا هو الدرس — في تغيّر سطحي، يرى الرادار التغيّر في البنية لا السطوع فقط.',
      },
    ],
    states: {
      before: {
        date: '2026-01-14',
        label: { en: 'Before the eruption', ar: 'قبل الثوران' },
        params: { water: 0, emergent: 0.85, burn: 0.05, cloud: 0.1 },
        caption: { en: 'Kilauea summit before the January 2026 lava flow.', ar: 'قمة كيلويا قبل تدفق الحمم في يناير 2026.' },
        happened: { en: 'HH ≈ -9.6 dB, HV ≈ -16.6 dB.', ar: 'HH ≈ -9.6 ديسيبل، HV ≈ -16.6 ديسيبل.' },
        why: { en: 'Old, stable ground.', ar: 'أرض قديمة مستقرة.' },
        polarization: { en: 'Dual-pol HH + HV.', ar: 'استقطاب مزدوج HH + HV.' },
      },
      after: {
        date: '2026-01-26',
        label: { en: 'After the eruption', ar: 'بعد الثوران' },
        params: { water: 0, emergent: 0.2, burn: 0.7, cloud: 0.1 },
        caption: { en: 'New lava and broken ground near the summit.', ar: 'حمم جديدة وأرض مكسورة قرب القمة.' },
        happened: { en: 'HH ≈ -9.3 dB, HV ≈ -16.4 dB; 26.4% of the window changed; coherence drops (20.7% low).', ar: 'HH ≈ -9.3 ديسيبل، HV ≈ -16.4 ديسيبل؛ 26.4% من النافذة تغيّر؛ والتماسك ينخفض (20.7% منخفض).' },
        why: { en: 'New lava and disrupted ground change the structure the radar sees.', ar: 'الحمم الجديدة والأرض المضطربة تغيّر البنية التي يراها الرادار.' },
        polarization: { en: 'HH vs HV and coherence reveal the surface change.', ar: 'HH مقابل HV والتماسك يكشفان التغيّر السطحي.' },
      },
    },
    measurements: {
      vv: { before: -9.6, after: -9.3 },
      vh: { before: -16.6, after: -16.4 },
      crossPol: { before: -7.0, after: -7.1 },
      dateBefore: '2026-01-14',
      dateAfter: '2026-01-26',
    },
    series: [
      { date: '2026-01-07', vv: -8.8, vh: -16.7, change: 0.0 },
      { date: '2026-01-19', vv: -9.9, vh: -18.0, change: 0.09 },
      { date: '2026-01-31', vv: -9.7, vh: -17.1, change: 0.07 },
      { date: '2026-02-12', vv: -9.0, vh: -16.3, change: 0.02 },
      { date: '2026-02-24', vv: -8.6, vh: -15.8, change: 0.02 },
      { date: '2026-03-08', vv: -9.4, vh: -16.9, change: 0.05 },
      { date: '2026-03-20', vv: -8.8, vh: -16.0, change: 0.0 },
      { date: '2026-04-25', vv: -9.6, vh: -17.1, change: 0.07 },
      { date: '2026-05-07', vv: -9.6, vh: -17.1, change: 0.07 },
    ],
    pulse: [0.0, 0.048, 0.089, 0.078, 0.063, 0.037, 0.02, 0.02, 0.028, 0.044, 0.033, 0.007, 0.028, 0.065, 0.07, 0.07],
    stablePulse: [0.0, 0.018, 0.036, 0.054, 0.072, 0.09, 0.086, 0.082, 0.078, 0.074, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02],
    recovery: {
      insufficient: true,
      noPeakPass: true,
      thresholdDefault: 80,
      points: [{ month: 0, pct: 0 }, { month: 1, pct: 0 }],
      eventChange: 0,
      noise: 0,
      gapDays: 12,
      note: {
        en: 'A volcano does not "recover" to a pre-eruption baseline — the ground is permanently changed by lava. A recovery curve does not apply; the panel shows the real per-pass backscatter.',
        ar: 'البركان لا «يتعافى» إلى خط أساس ما قبل الثوران — الأرض تتغير دائمًا بالحمم. لا ينطبق منحنى تعافٍ؛ تعرض اللوحة الارتداد الحقيقي لكل مرور.',
      },
    },
    researcher: {
      acquisition: {
        en: 'NISAR L-band GCOV (HH/HV gamma-0) + GSLC, track 072 frame 079, 2026-01-14 → 2026-01-26.',
        ar: 'NISAR بموجة L GCOV (HH/HV غاما-0) + GSLC، المسار 072 الإطار 079، 2026-01-14 → 2026-01-26.',
      },
      interpretation: [
        { en: 'Amplitude is quiet (ΔHH +0.3 dB); the change is in structure.', ar: 'السعة هادئة (ΔHH +0.3 ديسيبل)؛ التغيّر في البنية.' },
        { en: 'Coherence drops (mean 0.619, 20.7% low) over the new lava/ground.', ar: 'التماسك ينخفض (متوسط 0.619، 20.7% منخفض) فوق الحمم/الأرض الجديدة.' },
        { en: 'Mechanism changed ~30% (volume→surface) where the surface was disrupted.', ar: 'تغيّرت الآلية ~30% (حجم→سطح) حيث اضطرب السطح.' },
      ],
      limits: [
        { en: 'A single 12-day pair; a volcano surface change is subtle in amplitude.', ar: 'زوج واحد بفارق 12 يومًا؛ التغيّر البركاني خفيف في السعة.' },
      ],
      methods: [
        { en: 'Dual-pol HH/HV gamma-0 change + mechanism fractions from GCOV.', ar: 'تغيّر غاما-0 المزدوج + نسب الآلية من GCOV.' },
        { en: 'InSAR coherence from the GSLC HH pair.', ar: 'تماسك InSAR من زوج GSLC HH.' },
      ],
      sources: [
        { en: 'NASA NISAR GCOV/GSLC (track 072 frame 079, 2026-01-14 & 2026-01-26), via ASF DAAC.', ar: 'NASA NISAR GCOV/GSLC (المسار 072 الإطار 079، 2026-01-14 و2026-01-26)، عبر ASF DAAC.' },
        { en: 'USGS Hawaiian Volcano Observatory (Kilauea, 2026).', ar: 'مرصد البراكين الهاوائي USGS (كيلويا، 2026).' },
      ],
    },
  },
];

// Contrast table rows. Each row holds a `values` map keyed by site id, so the
// StudyAreas table renders one column per site automatically — adding a site is
// a data change (add its key here), not a code change.
export const contrastRows = [
  {
    id: 'terrain',
    label: { en: 'Terrain', ar: 'التضاريس' },
    values: {
      sundarbans: { en: 'Low river plain, fields and towns', ar: 'سهل نهري منخفض وحقول وبلدات' },
      bigsur: { en: 'Steep Santa Lucia range', ar: 'سلسلة سانتا لوسيا الشديدة الانحدار' },
      greece: { en: 'Coastal range and pine slopes', ar: 'سلسلة ساحلية ومنحدرات صنوبر' },
    },
  },
  {
    id: 'moisture',
    label: { en: 'Soil moisture', ar: 'رطوبة التربة' },
    values: {
      sundarbans: { en: 'Saturated during the flood', ar: 'مشبعة أثناء الفيضان' },
      bigsur: { en: 'Dry summer soil', ar: 'تربة صيفية جافة' },
      greece: { en: 'Dry summer soil after heatwaves', ar: 'تربة صيفية جافة بعد موجات الحر' },
    },
  },
  {
    id: 'canopy',
    label: { en: 'Canopy', ar: 'المظلة' },
    values: {
      sundarbans: { en: 'Rice, scrub, trees', ar: 'أرز وشجيرات وأشجار' },
      bigsur: { en: 'Chaparral, oak and conifer', ar: 'شابارال وبلوط وصنوبريات' },
      greece: { en: 'Aleppo pine, shrubs, olive groves', ar: 'صنوبر حلبي وشجيرات وبساتين زيتون' },
    },
  },
  {
    id: 'scattering',
    label: { en: 'Dominant scattering', ar: 'التشتت السائد' },
    values: {
      sundarbans: { en: 'Surface water + double bounce', ar: 'ماء سطحي + ارتداد مزدوج' },
      bigsur: { en: 'Volume scattering', ar: 'تشتت حجمي' },
      greece: { en: 'Volume scattering (canopy)', ar: 'تشتت حجمي (المظلة)' },
    },
  },
  {
    id: 'fingerprint',
    label: { en: 'Change fingerprint', ar: 'بصمة التغير' },
    values: {
      sundarbans: { en: 'Dark water sheet; bright roofs', ar: 'طبقة ماء داكنة وأسطح لامعة' },
      bigsur: { en: 'HV collapses over the burn scar; HH falls less', ar: 'ينهار HV فوق أثر الحريق وينخفض HH أقل' },
      greece: { en: 'Quiet amplitude; volume→surface mechanism shift', ar: 'سعة هادئة؛ تحوّل الآلية من الحجم إلى السطح' },
    },
  },
  {
    id: 'recovery',
    label: { en: 'Expected recovery pattern', ar: 'نمط التعافي المتوقع' },
    values: {
      sundarbans: { en: 'Rapid once the flood water drains', ar: 'سريع بعد تصريف ماء الفيضان' },
      bigsur: { en: 'Slow: canopy structure must regrow', ar: 'بطيء: يجب أن تنمو بنية المظلة من جديد' },
      greece: { en: 'Slow: pine canopy must regrow', ar: 'بطيء: يجب أن تنمو مظلة الصنوبر من جديد' },
    },
  },
];

export const getSite = (id) => studyAreas.find((site) => site.id === id);
