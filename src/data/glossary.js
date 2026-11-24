/**
 * Curated glossary of technical terms used across Sothis Echo.
 * Each entry: display name (en/ar), the tokens to auto-highlight in strings
 * (match / matchAr), and a plain one–two sentence definition (en/ar).
 * This is a MANUAL dictionary — GlossaryText only highlights these exact terms.
 */
export const GLOSSARY = {
  nisar: {
    en: 'NISAR', ar: 'نيسار', match: ['NISAR'], matchAr: ['نيسار'],
    def: {
      en: 'NASA–ISRO Synthetic Aperture Radar: a satellite that maps Earth\'s land and ice with radar every 12 days, day or night and through cloud.',
      ar: 'رادار نيسار (NASA–ISRO): قمر صناعي يرسم اليابسة والجليد بالرادار كل 12 يومًا، ليلًا ونهارًا وعبر السحاب.',
    },
  },
  sar: {
    en: 'SAR', ar: 'الرادار (SAR)', match: ['SAR'], matchAr: ['الرادار'],
    def: {
      en: 'Synthetic Aperture Radar: a radar that uses the satellite\'s motion to build a sharp image, and can see shape and moisture, not just light.',
      ar: 'الرادار ذو الفتحة الاصطناعية: رادار يستخدم حركة القمر لبناء صورة حادة، ويرى الشكل والرطوبة لا الضوء فقط.',
    },
  },
  insar: {
    en: 'InSAR', ar: 'إنسار (InSAR)', match: ['InSAR'], matchAr: ['إنسار'],
    def: {
      en: 'Interferometric SAR: comparing the phase of two radar passes to measure how the ground moved or how coherent it stayed.',
      ar: 'إنسار: مقارنة طور مرورين راداريين لقياس حركة الأرض أو مدى تماسكها.',
    },
  },
  coherence: {
    en: 'coherence', ar: 'التماسك', match: ['coherence'], matchAr: ['التماسك'],
    def: {
      en: 'A 0–1 measure of how similar two radar passes are. High = the ground stayed the same; low = something changed (burn, flood, movement).',
      ar: 'مقياس من 0 إلى 1 لمدى تشابه مرورين. مرتفع = الأرض بقيت كما هي؛ منخفض = تغيّر شيء (حرق، فيضان، حركة).',
    },
  },
  backscatter: {
    en: 'backscatter', ar: 'الارتداد الخلفي', match: ['backscatter'], matchAr: ['الارتداد الخلفي', 'الارتداد'],
    def: {
      en: 'The radar energy that bounces back to the satellite. Rough or wet surfaces return more; smooth water returns very little.',
      ar: 'طاقة الرادار التي ترتد عائدة إلى القمر. الأسطح الخشنة أو المبللة تعيد أكثر؛ الماء الأملس يعيد القليل جدًا.',
    },
  },
  hh: {
    en: 'HH / HV', ar: 'HH / HV', match: ['HH', 'HV'], matchAr: [],
    def: {
      en: 'Polarization channels: HH = horizontal send/receive, HV = horizontal send, vertical receive. Their difference reveals structure (canopy, water).',
      ar: 'قنوات الاستقطاب: HH = إرسال/استقبال أفقي، HV = إرسال أفقي واستقبال رأسي. وفرقها يكشف البنية (المظلة، الماء).',
    },
  },
  polarization: {
    en: 'polarization', ar: 'الاستقطاب', match: ['polarization'], matchAr: ['الاستقطاب'],
    def: {
      en: 'The orientation of the radar wave (horizontal/vertical). Different surfaces reflect each orientation differently, which helps tell water from vegetation.',
      ar: 'اتجاه الموجة الرادارية (أفقي/رأسي). الأسطح المختلفة تعكس كل اتجاه بشكل مختلف، مما يساعد على تمييز الماء عن النبات.',
    },
  },
  gamma0: {
    en: 'gamma-0 (γ0)', ar: 'غاما-0 (γ0)', match: ['gamma-0', 'γ0'], matchAr: ['غاما-0'],
    def: {
      en: 'A calibrated radar brightness value (gamma-naught), corrected for the viewing angle so different places can be compared fairly.',
      ar: 'قيمة سطوع رادارية معايرة (غاما-صفر)، مصحّحة لزاوية الرؤية حتى تُقارن الأماكن المختلفة بعدل.',
    },
  },
  gcov: {
    en: 'GCOV', ar: 'GCOV', match: ['GCOV'], matchAr: ['GCOV'],
    def: {
      en: 'NISAR\'s calibrated ground-range backscatter product — the radar brightness (HH/HV) used for the amplitude lens.',
          ar: 'منتج نيسار لمعايرة الارتداد الخلفي الأرضي — سطوع الرادار (HH/HV) المستخدم في عدسة السعة.',
    },
  },
  gslc: {
    en: 'GSLC', ar: 'GSLC', match: ['GSLC'], matchAr: ['GSLC'],
    def: {
      en: 'NISAR\'s geocoded single-look complex product — the radar phase used to compute InSAR coherence.',
      ar: 'منتج نيسار المركّب أحادي النظر الجغرافي — طور الرادار المستخدم لحساب تماسك InSAR.',
    },
  },
  db: {
    en: 'decibel (dB)', ar: 'الديسيبل (dB)', match: ['dB', 'decibel'], matchAr: ['ديسيبل'],
    def: {
      en: 'A logarithmic unit of radar brightness. A drop of a few dB means the surface returned much less energy (e.g. water or burn).',
      ar: 'وحدة لوغاريتمية لسطوع الرادار. انخفاض بضعة ديسيبل يعني أن السطح أعاد طاقة أقل بكثير (مثل الماء أو الحرق).',
    },
  },
  lband: {
    en: 'L-band', ar: 'نطاق L', match: ['L-band'], matchAr: ['نطاق L'],
    def: {
      en: 'The long radar wavelength NISAR uses (~24 cm). It penetrates cloud, smoke and light vegetation, so it sees structure a camera cannot.',
      ar: 'طول الموجة الرادارية الطويل الذي يستخدمه نيسار (~24 سم). ينفذ عبر السحاب والدخان والنبات الخفيف، فيرى بنية لا تراها الكاميرا.',
    },
  },
  volume: {
    en: 'volume scattering', ar: 'التشتت الحجمي', match: ['volume scattering'], matchAr: ['التشتت الحجمي'],
    def: {
      en: 'Radar energy scattered by a 3D structure like a forest canopy. It fades when the canopy is removed (fire) or flooded.',
      ar: 'طاقة رادارية يشتتها هيكل ثلاثي الأبعاد مثل مظلة الغابة. تضعف عند إزالة المظلة (حريق) أو إغراقها.',
    },
  },
  surface: {
    en: 'surface scattering', ar: 'التشتت السطحي', match: ['surface scattering'], matchAr: ['التشتت السطحي'],
    def: {
      en: 'Radar energy bounced off a flat surface (soil, rock, water). It dominates after a burn removes the canopy.',
      ar: 'طاقة رادارية ترتد عن سطح أملس (تربة، صخر، ماء). تسود بعد أن يزيل الحريق المظلة.',
    },
  },
  specular: {
    en: 'specular reflection', ar: 'الانعكاس المرآوي', match: ['specular'], matchAr: ['المرآوي'],
    def: {
      en: 'Mirror-like reflection: smooth water sends the radar pulse away from the satellite, so it looks dark.',
      ar: 'انعكاس كالمرآة: الماء الأملس يرسل النبضة بعيدًا عن القمر، فيبدو داكنًا.',
    },
  },
  granule: {
    en: 'granule', ar: 'حبة (granule)', match: ['granule'], matchAr: ['حبة'],
    def: {
      en: 'A single packaged unit of satellite data (one scene/frame). Each card names the exact NISAR granule it came from.',
      ar: 'وحدة بيانات واحدة (مشهد/إطار). كل بطاقة تذكر حبة نيسار الدقيقة التي جاءت منها.',
    },
  },
  swath: {
    en: 'swath', ar: 'مسار المسح (swath)', match: ['swath'], matchAr: ['المسح'],
    def: {
      en: 'The wide strip on the ground the radar images in one pass.',
      ar: 'الشريط العريض على الأرض الذي يصوّره الرادار في مرور واحد.',
    },
  },
  aic: {
    en: 'AIC / BIC', ar: 'AIC / BIC', match: ['AIC', 'BIC'], matchAr: ['AIC'],
    def: {
      en: 'Information criteria used to pick the best-fitting recovery model while penalising needless complexity.',
      ar: 'معايير معلومات تُستخدم لاختيار أفضل نموذج تعافٍ مع معاقبة التعقيد غير الضروري.',
    },
  },
  worldpop: {
    en: 'WorldPop', ar: 'WorldPop', match: ['WorldPop'], matchAr: ['WorldPop'],
    def: {
      en: 'A global population-density dataset used to estimate how many people live in the flooded/burned area (an estimate, labelled as such).',
      ar: 'بيانات عالمية لكثافة السكان تُستخدم لتقدير عدد السكان في المنطقة المتأثرة (تقدير، وموسوم بذلك).',
    },
  },
  recovery: {
    en: 'recovery', ar: 'التعافي', match: ['recovery'], matchAr: ['التعافي'],
    def: {
      en: 'How fast the radar signal returns toward its pre-event level after a fire or flood — a measure of how the surface heals.',
      ar: 'مدى سرعة عودة إشارة الرادار إلى مستوى ما قبل الحدث بعد حريق أو فيضان — مقياس لمدى تعافي السطح.',
    },
  },
};

/** Flat list for the highlighter: { id, tokens[] } (Latin + Arabic). */
export const GLOSSARY_TOKENS = Object.entries(GLOSSARY).flatMap(([id, entry]) => {
  const tokens = [...(entry.match || []), ...(entry.matchAr || [])].filter(Boolean);
  return tokens.map((token) => ({ id, token }));
});