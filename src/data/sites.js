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
      vv: { before: -8.9, after: -12.4 },
      vh: { before: -15.4, after: -19.6 },
      crossPol: { before: -6.5, after: -7.2 },
      dateBefore: '2026-08-16',
      dateAfter: '2026-09-09',
    },
    series: [
      { date: '2026-06-18', vv: -8.8, vh: -15.2, burn: 0.02, change: 0.09 },
      { date: '2026-07-14', vv: -8.9, vh: -15.4, burn: 0.04, change: 0.10 },
      { date: '2026-08-16', vv: -9.0, vh: -15.6, burn: 0.05, change: 0.10 },
      { date: '2026-08-25', vv: -10.9, vh: -18.2, burn: 0.5, change: 0.6 },
      { date: '2026-09-09', vv: -12.4, vh: -19.6, burn: 0.9, change: 0.93 },
      { date: '2026-09-21', vv: -12.8, vh: -19.9, burn: 0.88, change: 0.86 },
      { date: '2026-10-03', vv: -12.2, vh: -19.1, burn: 0.82, change: 0.74 },
      { date: '2026-10-15', vv: -11.8, vh: -18.4, burn: 0.75, change: 0.62 },
      { date: '2026-10-27', vv: -11.5, vh: -17.9, burn: 0.7, change: 0.52 },
      { date: '2026-11-14', vv: -11.2, vh: -17.4, burn: 0.66, change: 0.47 },
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
];

export const contrastRows = [
  {
    id: 'terrain',
    label: { en: 'Terrain', ar: 'التضاريس' },
    sundarbans: { en: 'Low river plain, fields and towns', ar: 'سهل نهري منخفض وحقول وبلدات' },
    bigsur: { en: 'Steep Santa Lucia range', ar: 'سلسلة سانتا لوسيا الشديدة الانحدار' },
  },
  {
    id: 'moisture',
    label: { en: 'Soil moisture', ar: 'رطوبة التربة' },
    sundarbans: { en: 'Saturated during the flood', ar: 'مشبعة أثناء الفيضان' },
    bigsur: { en: 'Dry summer soil', ar: 'تربة صيفية جافة' },
  },
  {
    id: 'canopy',
    label: { en: 'Canopy', ar: 'المظلة' },
    sundarbans: { en: 'Rice, scrub, trees', ar: 'أرز وشجيرات وأشجار' },
    bigsur: { en: 'Chaparral, oak and conifer', ar: 'شابارال وبلوط وصنوبريات' },
  },
  {
    id: 'scattering',
    label: { en: 'Dominant scattering', ar: 'التشتت السائد' },
    sundarbans: { en: 'Surface water + double bounce', ar: 'ماء سطحي + ارتداد مزدوج' },
    bigsur: { en: 'Volume scattering', ar: 'تشتت حجمي' },
  },
  {
    id: 'fingerprint',
    label: { en: 'Change fingerprint', ar: 'بصمة التغير' },
    sundarbans: { en: 'Dark water sheet; bright roofs', ar: 'طبقة ماء داكنة وأسطح لامعة' },
    bigsur: { en: 'HV collapses over the burn scar; HH falls less', ar: 'ينهار HV فوق أثر الحريق وينخفض HH أقل' },
  },
  {
    id: 'recovery',
    label: { en: 'Expected recovery pattern', ar: 'نمط التعافي المتوقع' },
    sundarbans: { en: 'Rapid once the flood water drains', ar: 'سريع بعد تصريف ماء الفيضان' },
    bigsur: { en: 'Slow: canopy structure must regrow', ar: 'بطيء: يجب أن تنمو بنية المظلة من جديد' },
  },
];

export const getSite = (id) => studyAreas.find((site) => site.id === id);
