/**
 * Global Atlas — curated list of NISAR-relevant change sites across continents.
 *
 * Each entry is a story the backend can measure with real NISAR granules.
 * `maturity` is the honesty contract:
 *   'lens'  — real amplitude/coherence/mechanism computed (Big Sur, Central Vietnam)
 *   'story' — narrative + coords; the atlas shows a radar field-guide card, never
 *             fake numbers. Clicking a 'lens' site opens its full study area.
 *
 * Every entry carries: what happened (summary), why radar sees it (radar), and
 * what a NISAR pass would measure (measure) — so clicking is always informative.
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
      en: 'L-band coherence collapsed over burned slopes even where brightness held — the burn scar reads as physical disturbance rather than dark ground.',
      ar: 'انهار الترابط فوق المنحدرات المحروقة حتى حيث بقي السطوع ثابتًا — تظهر ندبة الحريق اضطرابًا فيزيائيًا حقيقيًا لا مجرد أرض أغمق.',
    },
    radar: {
      en: 'Fire removes canopy and scatters the L-band pulse off bare, rougher ground while the surviving structure breaks phase coherence between passes.',
      ar: 'تزيل النار المظلة وتشتت نبضة النطاق L على أرض عارية أخشن بينما يكسر البناء المتبقي تماسك الطور بين المرورين.',
    },
    measure: {
      en: 'Amplitude change (HH/HV), coherence collapse (% low-coherence), and a dual-pol shift from volume toward low-return scattering.',
      ar: 'تغيّر السعة (HH/HV)، وانهيار التماسك (نسبة منخفضة التماسك)، وتحوّل ثنائي الاستقطاب من الحجم نحو الارتداد المنخفض.',
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
    radar: {
      en: 'Smooth open water behaves like a mirror for L-band, sending the pulse away from the satellite; flooded fields go dark while banks and buildings stay bright.',
      ar: 'الماء المكشوف اللامع يعمل كمرآة للنطاق L فيعيد النبضة بعيدًا عن القمر؛ فتُظلم الحقول المغمورة بينما تبقى الضفاف والمباني لامعة.',
    },
    measure: {
      en: 'Amplitude change maps bright→dark flooding; the changed-area fraction and extent quantify how much ground the water took.',
      ar: 'خريطة تغيّر السعة تُظهر الفيضان من لامع إلى داكن؛ ونسبة المساحة المتغيّرة والمدى تحدد كم أرضًا غمرها الماء.',
    },
  },
  {
    id: 'greece',
    name: { en: 'Attica megafire', ar: 'حريق أتيكا الكبير' },
    region: { en: 'Attica · Gulf of Corinth · Greece', ar: 'أتيكا · خليج كورينث · اليونان' },
    changeType: 'wildfire',
    coords: { lat: 38.05, lng: 23.31 },
    bbox: [23.15, 37.96, 23.42, 38.15],
    eventDate: '2026-07-31',
    continent: 'europe',
    maturity: 'lens',
    summary: {
      en: 'A fire west of Athens burned pine and olive trees. The radar brightness barely changed, but the way the ground bounces radar shifted where the trees burned.',
      ar: 'حريق غرب أثينا أحرق أشجار الصنوبر والزيتون. لم يكد سطوع الرادار يتغير، لكن طريقة ارتداد الأرض للرادار تغيّرت حيث احترقت الأشجار.',
    },
    radar: {
      en: 'L-band penetrates the smoke and sees structure: fire removes the canopy that gives strong cross-pol volume scattering, so the surface dominates after the burn even where brightness is unchanged.',
      ar: 'ينفذ النطاق L عبر الدخان ويرى البنية: تزيل النار المظلة التي تمنح تشتتًا حجميًا قويًا بالاستقطاب المتقاطع، فيسود السطح بعد الحرق حتى حيث لم يتغير السطوع.',
    },
    measure: {
      en: 'Dual-pol mechanism (volume vs surface fraction) and InSAR coherence collapse mark the burn scar more reliably than amplitude alone for this surface fire.',
      ar: 'آلية الاستقطاب الثنائي (نسبة الحجم مقابل السطح) وانهيار تماسك InSAR يعلّمان ندبة الحرق أدق من السعة وحدها لهذا الحريق السطحي.',
    },
  },
  {
    id: 'limpopo',
    name: { en: 'Limpopo floods', ar: 'فيضانات ليمبوبو' },
    region: { en: 'Limpopo · Mpumalanga · Southern Africa', ar: 'ليمبوبو · مبومالانجا · جنوب أفريقيا' },
    changeType: 'flood',
    coords: { lat: -25.15, lng: 31.22 },
    bbox: [30.6, -25.7, 31.9, -24.6],
    eventDate: '2026-01-19',
    continent: 'africa',
    maturity: 'lens',
    summary: {
      en: 'Heavy January 2026 rains flooded the Limpopo river across Mozambique, South Africa and Zimbabwe. Radar shows the swollen river and flooded ground as a dark, smooth sheet.',
      ar: 'أمطار غزيرة في يناير 2026 أغرقت نهر ليمبوبو عبر موزمبيق وجنوب أفريقيا وزمبابوي. يُظهر الرادار النهر المنتفخ والأرض الغارقة كطبقة داكنة أملس.',
    },
    radar: {
      en: 'L-band is a microwave: smooth floodwater is a specular reflector that sends the pulse away from the satellite, so inundated ground goes dark while rough vegetated/built surfaces stay bright.',
      ar: 'النطاق L ميكروويف: ماء الفيضان الأملس عاكس مرآوي يرسل النبضة بعيدًا عن القمر، فتصبح الأرض الغارقة داكنة بينما تبقى الأسطح الخشنة/المبنية لامعة.',
    },
    measure: {
      en: 'Amplitude change maps bright→dark flooding; the changed-area fraction and extent quantify how much ground the water took.',
      ar: 'خريطة تغيّر السعة تُظهر الفيضان من لامع إلى داكن؛ ونسبة المساحة المتغيّرة والمدى تحدد كم أرضًا غمرها الماء.',
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
      en: 'Cyclone surge and monsoon rain push brackish water deep into the mangrove delta, drowning forest edges and farmland.',
      ar: 'تدفع أمواج الإعصار وأمطار الرياح الموسمية الماء المالح عميقًا في دلتا المانجروف، فتغرق حواف الغابة والأراضي الزراعية.',
    },
    radar: {
      en: 'L-band penetrates cloud and rain to see the water surface; flooded mangrove goes dark under the canopy while raised embankments stay bright.',
      ar: 'يخترق النطاق L السحاب والمطر ليرى سطح الماء؛ فيُظلم المانجروف المغمور تحت المظلة بينما تبقى السدود المرتفعة لامعة.',
    },
    measure: {
      en: 'A before/after amplitude change map marks the surge extent; coherence drops where water replaces vegetated ground.',
      ar: 'خريطة تغيّر السعة قبل/بعد تحدد مدى الأمواج؛ وينخفض التماسك حيث يحل الماء محل الأرض النباتية.',
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
      en: 'The glacier thins and its terminus retreats, lowering the ice surface and exposing fresh rock and meltwater.',
      ar: 'يترقق النهر الجليدي ويتراجع طرفه، فينخفض سطح الجليد وينكشف صخر وماء ذوبان جديدان.',
    },
    radar: {
      en: 'Ice and rock have very different L-band returns; snow and meltwater change the surface texture, so amplitude marks the retreating edge.',
      ar: 'للجليد والصخر عائدان مختلفان جدًا في النطاق L؛ والثلج وماء الذوبان يغيّران نسيج السطح، فتُعلّم السعة الحافة المتراجعة.',
    },
    measure: {
      en: 'Amplitude change along the terminus plus InSAR phase stacks that measure millimetres-to-centimetres of surface lowering.',
      ar: 'تغيّر السعة على طول الطرف مع تراكم طور InSAR الذي يقيس مليمترات إلى سنتيمترات من انخفاض السطح.',
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
      en: 'Magma moving underground inflates the surface before an eruption, then new lava and fissures reshape it.',
      ar: 'الصهارة المتحركة تحت الأرض تنفخ السطح قبل الثوران، ثم تعيد الحمم والشقوق الجديدة تشكيله.',
    },
    radar: {
      en: 'Inflation tilts the ground by centimetres, which InSAR turns into a fringe pattern; fresh lava changes the amplitude texture sharply.',
      ar: 'ينتفخ السطح بالسنتيمترات، ويحوّل InSAR ذلك إلى نمط أهداب؛ وتغيّر الحمم الجديدة نسيج السعة بحدة.',
    },
    measure: {
      en: 'InSAR interferogram fringes map the deformation; amplitude change pinpoints new lava and fissures.',
      ar: 'أهداب مقابلة InSAR ترسم التشكّل؛ وتغيّر السعة يحدد الحمم والشقوق الجديدة.',
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
      en: 'River dikes overtop and flood the plain after heavy rain, covering fields, roads and settlements.',
      ar: 'تفيض السدود وتغمر السهل بعد أمطار غزيرة، فتغطي الحقول والطرق والمستوطنات.',
    },
    radar: {
      en: 'Water and mud replace vegetated ground, so the L-band return drops sharply; coherence collapses where the surface is churned.',
      ar: 'يحل الماء والطين محل الأرض النباتية، فيهبط عائد النطاق L بحدة؛ وينهار التماسك حيث يُقلَّب السطح.',
    },
    measure: {
      en: 'Amplitude change delineates the flooded plain; low coherence confirms water and mud over formerly vegetated ground.',
      ar: 'تغيّر السعة يرسم السهل المغمور؛ ويؤكد التماسك المنخفض وجود الماء والطين فوق أرض كانت نباتية.',
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
      en: 'Clearing removes the forest canopy, exposing soil and leaving sharp straight edges where the forest used to be.',
      ar: 'تزيل عمليات القطع مظلة الغابة، فتكشف التربة وتترك حواف مستقيمة حادة حيث كانت الغابة.',
    },
    radar: {
      en: 'Canopy volume gives strong cross-pol (HV); cleared ground loses it and roughens co-pol. Cloud never blocks L-band.',
      ar: 'حجم المظلة يعطي استقطابًا متقاطعًا قويًا (HV)؛ والأرض المكشوفة تفقده وتخشّن الاستقطاب المشترك. والسحاب لا يحجب النطاق L.',
    },
    measure: {
      en: 'Amplitude change (HH up, HV down) and a volume→surface mechanism shift mark the forest-to-cleared boundary.',
      ar: 'تغيّر السعة (HH أعلى، HV أدنى) وتحوّل الآلية من الحجم إلى السطح يعلّمان حد الغابة إلى الأرض المكشوفة.',
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
      en: 'A rupture shifts the ground by centimetres along a fault, cracking roads and toppling weak structures.',
      ar: 'يزيح التمزق الأرض بالسنتيمترات على طول صدع، فيشقّ الطرق ويُسقط الأبنية الضعيفة.',
    },
    radar: {
      en: 'Co-seismic motion changes the phase but barely the amplitude; InSAR fringes count the displacement across the fault.',
      ar: 'الحركة الزلزالية تغيّر الطور لكنها تكاد لا تغيّر السعة؛ وأهداب InSAR تحسب الإزاحة عبر الصدع.',
    },
measure: {
      en: 'InSAR phase displacement / fringes across the fault: the phase difference between two passes maps the co-seismic movement (centimetres) even where the amplitude is unchanged.',
      ar: 'إزاحة الطور / أهداب InSAR عبر الصدع: فرق الطور بين مرورين يرسم الحركة الزلزالية (سنتيمترات) حتى حيث لم تتغير السعة.',
    },
  },
  {
    id: 'kilauea',
    name: { en: 'Kilauea volcano', ar: 'بركان كيلويا' },
    region: { en: 'Hawaii · United States', ar: 'هاواي · الولايات المتحدة' },
    changeType: 'volcano',
    coords: { lat: 19.42, lng: -155.29 },
    bbox: [-155.42, 19.33, -155.18, 19.52],
    eventDate: '2026-01-15',
    continent: 'oceania',
    maturity: 'lens',
    summary: {
      en: 'Kilauea erupted in January 2026; lava and broken ground changed the summit. Radar brightness barely moved, but the structure did.',
      ar: 'ثار كيلويا في يناير 2026؛ غيّرت الحمم والأرض المكسورة القمة. لم يكد سطوع الرادار يتغير، لكن البنية تغيّرت.',
    },
    radar: {
      en: 'L-band sees the new, rough lava and disrupted ground as a change in structure and coherence, even where brightness is unchanged.',
      ar: 'يرى النطاق L الحمم الجديدة الخشنة والأرض المضطربة كتغيّر في البنية والتماسك، حتى حيث لم يتغير السطوع.',
    },
    measure: {
      en: 'Coherence drop and the volume→surface mechanism shift mark the new lava/ground more reliably than amplitude.',
      ar: 'انخفاض التماسك وتحوّل الآلية من الحجم إلى السطح يعلّمان الحمم/الأرض الجديدة أدق من السعة.',
    },
  },
  {
    id: 'cantzama',
    name: { en: 'Cantzama landslide', ar: 'انهيار كانتازاما' },
    region: { en: 'Zamora Chinchipe · Ecuador', ar: 'زامورا تشينشيبي · الإكوادور' },
    changeType: 'landslide',
    coords: { lat: -3.885, lng: -79.003 },
    bbox: [-79.10, -3.95, -78.85, -3.78],
    eventDate: '2026-07-04',
    continent: 'south-america',
    maturity: 'lens',
    summary: {
      en: 'A July 2026 landslide above Cantzama (Ecuador) became a debris flow that destroyed the village. Radar amplitude barely moved, but the ground lost coherence.',
      ar: 'انهيار يوليو 2026 فوق كانتازاما (الإكوادور) تحول إلى تدفق أنقاض دمّر القرية. لم تكد سعة الرادار تتغير، لكن الأرض فقدت التماسك.',
    },
    radar: {
      en: 'L-band coherence collapses where the slope failed and the ground broke up — the structure is gone even where brightness is unchanged.',
      ar: 'ينهار تماسك النطاق L حيث انهار المنحدر وتفككت الأرض — البنية اختفت حتى حيث لم يتغير السطوع.',
    },
    measure: {
      en: 'Coherence collapse (mean 0.37, 56% low) marks the landslide more reliably than amplitude.',
      ar: 'انهيار التماسك (متوسط 0.37، 56% منخفض) يعلّم الانهيار أدق من السعة.',
    },
  },
  {
    id: 'mexico',
    name: { en: 'Mexico City subsidence', ar: 'هبوط مكسيكو سيتي' },
    region: { en: 'Mexico City · Mexico', ar: 'مكسيكو سيتي · المكسيك' },
    changeType: 'subsidence',
    coords: { lat: 19.43, lng: -99.13 },
    bbox: [-99.20, 19.35, -99.00, 19.50],
    eventDate: '2026-01-17',
    continent: 'north-america',
    maturity: 'lens',
    summary: {
      en: 'Mexico City sinks as groundwater is pumped and the ancient lakebed compacts. Radar sees the ground slowly dropping (NASA, 2026).',
      ar: 'تغرق مكسيكو سيتي مع ضخ المياه الجوفية وانضغاط قاع البحيرة القديم. يرى الرادار الأرض تهبط ببطء (ناسا، 2026).',
    },
    radar: {
      en: 'The surface drops and the water table falls, changing the radar backscatter and mechanism — the ground is not coming back.',
      ar: 'يهبط السطح وينخفض منسوب المياه، فيتغير ارتداد الرادار والآلية — والأرض لا تعود.',
    },
    measure: {
      en: 'HV drop and the mechanism shift track the compaction; coherence stays high because the change is slow and uniform.',
      ar: 'هبوط HV وتحوّل الآلية يتتبعان الانضغاط؛ والتماسك مرتفع لأن التغيّر بطيء ومنتظم.',
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
  { id: 'landslide', color: '#a0e83a', name: { en: 'Landslide', ar: 'انهيار' } },
];