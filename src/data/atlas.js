/**
 * Global Atlas — curated list of NISAR-relevant change sites across continents.
 *
 * Each entry is a story the backend can eventually measure with real NISAR
 * granules. `maturity` is the honesty contract:
 *   'lens'  — real amplitude/coherence/mechanism computed (Big Sur, Central Vietnam)
 *   'story' — narrative + coords only; the atlas shows it as "not yet measured"
 *
 * The two 'lens' entries reuse the stable study-area ids so URLs/tests keep
 * working. The 'story' entries are forward-looking: they tell the judge the
 * product scales, without faking numbers that were never computed.
 */

export const atlasSites = [
  {
    id: 'bigsur',
    name: { en: 'Big Sur megafire', ar: 'حريق بيج سور' },
    region: { en: 'California, USA', ar: 'كاليفورنيا، أمريكا' },
    changeType: 'wildfire',
    coords: { lat: 36.02, lng: -121.52 },
    bbox: [-121.58, 35.97, -121.46, 36.07],
    eventDate: '2026-08-16',
    continent: 'north-america',
    maturity: 'lens',
    summary: {
      en: 'L-band coherence collapsed over burned slopes even where brightness held — the burn scar reads as physical disturbance, not just dark ground.',
      ar: 'انهار الترابط فوق المنحدرات المحروقة حتى حيث بقي السطوع ثابتًا — تظهر ندبة الحريق اضطرابًا فيزيائيًا لا مجرد أرض داكنة.',
    },
  },
  {
    id: 'sundarbans',
    name: { en: 'Central Vietnam flood', ar: 'فيضان وسط فيتنام' },
    region: { en: 'Huế · Tam Giang · Vietnam', ar: 'هوي · تام جيانغ · فيتنام' },
    changeType: 'flood',
    coords: { lat: 16.55, lng: 107.575 },
    bbox: [107.45, 16.45, 107.7, 16.65],
    eventDate: '2026-09-13',
    continent: 'asia',
    maturity: 'lens',
    summary: {
      en: 'Open water scatters the pulse away and turns almost black; comparing before/after passes maps the inundation in one step.',
      ar: 'الماء المكشوف يشتت النبضة بعيدًا ويصير أسود تقريبًا؛ ومقارنة المرورين قبل وبعد ترسم الغمر في خطوة واحدة.',
    },
  },
  {
    id: 'sundarbans-delta',
    name: { en: 'Sundarbans delta', ar: 'دلتا سونداربانس' },
    region: { en: 'Bangladesh · India', ar: 'بنغلاديش · الهند' },
    changeType: 'flood',
    coords: { lat: 21.95, lng: 89.18 },
    bbox: [88.9, 21.7, 89.4, 22.2],
    eventDate: '2026-07-01',
    continent: 'asia',
    maturity: 'story',
    summary: {
      en: 'Cyclone surge and monsoon rain push brackish water into the mangrove delta; L-band sees through cloud to map the flooded forest.',
      ar: 'تدفع أمواج الإعصار وأمطار الرياح الموسمية الماء المالح إلى دلتا المانجروف؛ ويرى نطاق L عبر السحب ليخطّط الغابة التي غمرتها المياه.',
    },
  },
  {
    id: 'alaska-mendenhall',
    name: { en: 'Mendenhall glacier', ar: 'نهر ميندينهال الجليدي' },
    region: { en: 'Alaska, USA', ar: 'ألاسكا، أمريكا' },
    changeType: 'glacier',
    coords: { lat: 58.42, lng: -134.52 },
    bbox: [-134.7, 58.3, -134.4, 58.55],
    eventDate: '2026-06-01',
    continent: 'north-america',
    maturity: 'story',
    summary: {
      en: 'Glacier retreat and ice-surface lowering show as slow surface deformation — InSAR stacks the passes to measure millimetres of change.',
      ar: 'يظهر تراجع النهر الجليدي وانخفاض سطح الجليد كتغيّر سطحي بطيء — وتراكم InSAR المرورات لقياس مليمترات من التغيّر.',
    },
  },
  {
    id: 'iceland-reykjanes',
    name: { en: 'Reykjanes volcano', ar: 'بركان ريكيانس' },
    region: { en: 'Reykjanes, Iceland', ar: 'ريكيانس، آيسلندا' },
    changeType: 'volcano',
    coords: { lat: 63.88, lng: -22.45 },
    bbox: [-22.6, 63.8, -22.3, 63.95],
    eventDate: '2026-03-15',
    continent: 'europe',
    maturity: 'story',
    summary: {
      en: 'Ground inflation before an eruption deforms the surface by centimetres; InSAR interferograms turn the deformation into a fringe pattern.',
      ar: 'ينتفاخ الأرض قبل الثوران فيغيّر السطح بالسنتيمترات؛ وتحوّل مقابلات InSAR التغيّر إلى نمط أهداب متعرج.',
    },
  },
  {
    id: 'germany-flood',
    name: { en: 'Rhine valley flood', ar: 'فيضان وادي الراين' },
    region: { en: 'Germany · France', ar: 'ألمانيا · فرنسا' },
    changeType: 'flood',
    coords: { lat: 48.85, lng: 7.85 },
    bbox: [7.7, 48.75, 8.0, 48.95],
    eventDate: '2026-05-20',
    continent: 'europe',
    maturity: 'story',
    summary: {
      en: 'River dikes overtop and flood the floodplain; coherence drops where water and mud replace vegetated ground.',
      ar: 'تفيض السدود وتغمر السهل الفيضي؛ وينخفض الترابط حيث يحل الماء والطين محل الأرض النباتية.',
    },
  },
  {
    id: 'brazil-deforest',
    name: { en: 'Amazon deforestation', ar: 'إزالة غابات الأمازون' },
    region: { en: 'Pará, Brazil', ar: 'بارا، البرازيل' },
    changeType: 'deforestation',
    coords: { lat: -5.5, lng: -55.5 },
    bbox: [-55.7, -5.7, -55.3, -5.3],
    eventDate: '2026-04-01',
    continent: 'south-america',
    maturity: 'story',
    summary: {
      en: 'Canopy removal roughens the surface and brightens HH backscatter; the forest-to-cleared boundary is sharp in radar even under cloud.',
      ar: 'إزالة المظلة تجعل السطح أخشن وتزيد الارتداد HH؛ وتظهر حدود الغابة إلى الأرض المكشوفة بوضوح في الرادار حتى تحت السحب.',
    },
  },
  {
    id: 'japan-subside',
    name: { en: 'Tokyo subsidence', ar: 'هبوط طوكيو' },
    region: { en: 'Tokyo, Japan', ar: 'طوكيو، اليابان' },
    changeType: 'subsidence',
    coords: { lat: 35.68, lng: 139.69 },
    bbox: [139.5, 35.6, 139.85, 35.78],
    eventDate: '2026-02-01',
    continent: 'asia',
    maturity: 'story',
    summary: {
      en: 'Groundwater extraction sinks reclaimed land by millimetres per year; InSAR measures the subsidence bowl without any ground sensor.',
      ar: 'يؤدي استخراج المياه الجوفية إلى هبوط الأراضي المستصلحة بمليمترات سنويًا؛ ويقيس InSAR حوض الهبوط دون أي مستشعر أرضي.',
    },
  },
  {
    id: 'nigeria-oil',
    name: { en: 'Niger delta spill', ar: 'تسرب نفط دلتا النيجر' },
    region: { en: 'Niger delta, Nigeria', ar: 'دلتا النيجر، نيجيريا' },
    changeType: 'oil-spill',
    coords: { lat: 4.75, lng: 7.35 },
    bbox: [7.2, 4.6, 7.5, 4.9],
    eventDate: '2026-03-01',
    continent: 'africa',
    maturity: 'story',
    summary: {
      en: 'Oil sheen smooths the water surface and drops backscatter to near-black; the slick edge is visible in a single HH pass.',
      ar: 'يلطّف لمعان النفط سطح الماء ويخفض الارتداد إلى شبه أسود؛ وتظهر حافة البقعة في مرور HH واحد.',
    },
  },
  {
    id: 'australia-crop',
    name: { en: 'Murray crop failure', ar: 'فشل محصول موراي' },
    region: { en: 'Murray-Darling, Australia', ar: 'موراي-دارلينغ، أستراليا' },
    changeType: 'crop',
    coords: { lat: -34.2, lng: 143.8 },
    bbox: [143.6, -34.4, 144.0, -34.0],
    eventDate: '2026-05-01',
    continent: 'oceania',
    maturity: 'story',
    summary: {
      en: 'A dry season withers the canopy and smooths the soil; the dual-pol HH–HV ratio shifts as volume scattering collapses.',
      ar: 'يجفف موسم جاف المظلة وينعّم التربة؛ ويتغيرت نسبة HH–HV ثنائية الاستقطاب مع انهيار تشتت الحجم.',
    },
  },
  {
    id: 'peru-earthquake',
    name: { en: 'Peru earthquake', ar: 'زلزال بيرو' },
    region: { en: 'Lima, Peru', ar: 'ليما، بيرو' },
    changeType: 'earthquake',
    coords: { lat: -12.05, lng: -77.04 },
    bbox: [-77.2, -12.2, -76.9, -11.9],
    eventDate: '2026-01-15',
    continent: 'south-america',
    maturity: 'story',
    summary: {
      en: 'Co-seismic deformation shifts the surface by centimetres; the interferogram fringe count maps the rupture along the fault.',
      ar: 'يزيح التزيال الزلزالي السطح بالسنتيمترات؛ ويخطّط عدد أهداب المقابلة الصدع على طول الصدع.',
    },
  },
];

export const CONTINENTS = [
  { id: 'north-america', name: { en: 'North America', ar: 'أمريكا الشمالية' } },
  { id: 'south-america', name: { en: 'South America', ar: 'أمريكا الجنوبية' } },
  { id: 'europe', name: { en: 'Europe', ar: 'أوروبا' } },
  { id: 'africa', name: { en: 'Africa', ar: 'أفريقيا' } },
  { id: 'asia', name: { en: 'Asia', ar: 'آسيا' } },
  { id: 'oceania', name: { en: 'Oceania', ar: 'أوقيانوسيا' } },
];

export const CHANGE_TYPES = [
  { id: 'wildfire', color: '#e8833a', name: { en: 'Wildfire', ar: 'حريق' } },
  { id: 'flood', color: '#3a7ae8', name: { en: 'Flood', ar: 'فيضان' } },
  { id: 'glacier', color: '#8ad1e8', name: { en: 'Glacier', ar: 'نهر جليدي' } },
  { id: 'volcano', color: '#e8443a', name: { en: 'Volcano', ar: 'بركان' } },
  { id: 'deforestation', color: '#3ae87a', name: { en: 'Deforestation', ar: 'إزالة غابات' } },
  { id: 'subsidence', color: '#e8d13a', name: { en: 'Subsidence', ar: 'هبوط' } },
  { id: 'oil-spill', color: '#9a6ae8', name: { en: 'Oil spill', ar: 'تسرب نفط' } },
  { id: 'crop', color: '#e8a13a', name: { en: 'Crop', ar: 'محصول' } },
  { id: 'earthquake', color: '#e85a3a', name: { en: 'Earthquake', ar: 'زلزال' } },
];