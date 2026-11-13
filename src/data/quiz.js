/**
 * “Radar detective” rounds. Each round renders a before/after radar pair from
 * the same procedural engine as the study areas, then asks the player to name
 * the change. Evidence is shown only after the answer — the point is to teach
 * the signature, not to guess from the prose.
 */

export const detectiveRounds = [
  {
    id: 'sundarbans-surge',
    siteId: 'sundarbans',
    title: { en: 'A delta holds its breath', ar: 'دلتا تحبس أنفاسها' },
    brief: {
      en: 'Two L-band radar passes over the same mangrove block, 20 days apart. Match the signal to the cause.',
      ar: 'مروران راداريان في نطاق L فوق الكتلة نفسها من المانغروف بفارق 20 يومًا. طابق الإشارة مع السبب.',
    },
    before: { date: '2024-05-10', params: { water: 0.34, emergent: 0.58, burn: 0, cloud: 0.2 } },
    after: { date: '2024-05-30', params: { water: 0.82, emergent: 0.74, burn: 0, cloud: 0.2 } },
    options: [
      { id: 'flood', label: { en: 'Storm-surge flooding', ar: 'فيضان مدّ عاصفة' } },
      { id: 'drought', label: { en: 'Drought / water retreat', ar: 'جفاف / انحسار الماء' } },
      { id: 'fire', label: { en: 'Wildfire', ar: 'حريق غابات' } },
      { id: 'urban', label: { en: 'New construction', ar: 'بناء جديد' } },
    ],
    answer: 'flood',
    explanation: {
      en: 'Open water appears as near-black channels and sheets, while the canopy that remains standing in water brightens in VV. That combination — dark water plus bright double-bounce — is a flood under vegetation, not a drought.',
      ar: 'يظهر الماء المكشوف كقنوات ومسطحات سوداء تقريبًا، بينما تلمع المظلة الباقية في الماء في VV. هذا المزيج — ماء داكن مع ارتداد مزدوج لامع — فيضان تحت الغطاء النباتي، وليس جفافًا.',
    },
  },
  {
    id: 'caldor-scar',
    siteId: 'caldor',
    title: { en: 'The canopy disappears', ar: 'المظلة تختفي' },
    brief: {
      en: 'A conifer ridge before and after a severe fire. Read the two polarization channels.',
      ar: 'قمم صنوبرية قبل حريق شديد وبعده. اقرأ قناتي الاستقطاب.',
    },
    before: { date: '2021-07-18', params: { water: 0, emergent: 0.9, burn: 0.04, cloud: 0.2 } },
    after: { date: '2021-09-12', params: { water: 0, emergent: 0.12, burn: 0.9, cloud: 0.2 } },
    options: [
      { id: 'fire', label: { en: 'Severe wildfire', ar: 'حريق غابات شديد' } },
      { id: 'flood', label: { en: 'Flooding', ar: 'فيضان' } },
      { id: 'logging', label: { en: 'Selective logging', ar: 'قطع انتقائي للأشجار' } },
      { id: 'quake', label: { en: 'Earthquake deformation', ar: 'تشوه زلزالي' } },
    ],
    answer: 'fire',
    explanation: {
      en: 'Both channels fall, but VH falls further. That is the signature of lost 3-D canopy — needles and branches that used to twist the wave. A flood would darken open water and often brighten flooded trunks; an earthquake would shift phase, not erase texture.',
      ar: 'تنخفض القناتان، لكن VH ينخفض أكثر. هذه بصمة فقدان المظلة المجسّمة: الإبر والأغصان التي كانت تلفّ الموجة. الفيضان كان سيُظلم الماء المكشوف وقد يُلمع الجذوع المغمورة؛ والزلزال كان سيغيّر الطور لا النسيج.',
    },
  },
  {
    id: 'sundarbans-dry',
    siteId: 'sundarbans',
    title: { en: 'The water steps back', ar: 'الماء يتراجع' },
    brief: {
      en: 'Same channels, different season. What does the brighter surface mean?',
      ar: 'القنوات نفسها في موسم مختلف. ماذا يعني السطح الأكثر لمعانًا؟',
    },
    before: { date: '2024-05-30', params: { water: 0.74, emergent: 0.62, burn: 0, cloud: 0.2 } },
    after: { date: '2024-11-14', params: { water: 0.18, emergent: 0.5, burn: 0, cloud: 0.2 } },
    options: [
      { id: 'drought', label: { en: 'Dry season / water retreat', ar: 'موسم جاف / انحسار الماء' } },
      { id: 'flood', label: { en: 'New flooding', ar: 'فيضان جديد' } },
      { id: 'fire', label: { en: 'Fire', ar: 'حريق' } },
      { id: 'urban', label: { en: 'Urban expansion', ar: 'توسع عمراني' } },
    ],
    answer: 'drought',
    explanation: {
      en: 'The dark channels shrink and expose damp mud and roots, which scatter more energy back. VH does not collapse, because the canopy is still there. Water leaving is as visible as water arriving — radar measures the surface, not the season label.',
      ar: 'تتقلص القنوات الداكنة وتكشف طينًا وجذورًا رطبة تعيد طاقة أكبر. لا ينهار VH لأن المظلة ما زالت موجودة. انسحاب الماء مرئي كقدومه؛ فالرادار يقيس السطح لا اسم الموسم.',
    },
  },
  {
    id: 'caldor-regrowth',
    siteId: 'caldor',
    title: { en: 'Something is growing back', ar: 'شيء يعود للنمو' },
    brief: {
      en: 'A burn scar nearly five years apart. The signal is climbing — slowly. What is happening?',
      ar: 'أثر حريق بفارق يقارب خمس سنوات. الإشارة ترتفع ببطء. ما الذي يحدث؟',
    },
    before: { date: '2021-10-24', params: { water: 0, emergent: 0.12, burn: 0.88, cloud: 0.2 } },
    after: { date: '2026-08-09', params: { water: 0, emergent: 0.38, burn: 0.48, cloud: 0.2 } },
    options: [
      { id: 'recovery', label: { en: 'Post-fire vegetation recovery', ar: 'تعافي الغطاء النباتي بعد الحريق' } },
      { id: 'flood', label: { en: 'Flooding', ar: 'فيضان' } },
      { id: 'newfire', label: { en: 'A second fire', ar: 'حريق ثانٍ' } },
      { id: 'urban', label: { en: 'Construction', ar: 'إنشاءات' } },
    ],
    answer: 'recovery',
    explanation: {
      en: 'VV and VH both rise as shrubs and young trees rebuild three-dimensional structure. The scar is still darker than the pre-fire forest — recovery is real, but incomplete. That difference between “improving” and “recovered” is exactly what a time series protects you from missing.',
      ar: 'يرتفع VV وVH مع إعادة الشجيرات والأشجار الصغيرة بناء البنية المجسّمة. ما زال الأثر أغمق من الغابة قبل الحريق: التعافي حقيقي لكنه غير مكتمل. والفرق بين «يتحسن» و«تعافى» هو ما تحميك السلسلة الزمنية من إغفاله.',
    },
  },
];

function nearestPass(series, date) {
  if (!Array.isArray(series) || series.length === 0) return null;
  const target = new Date(`${date}T00:00:00Z`).getTime();
  if (!Number.isFinite(target)) return null;
  let best = null;
  let bestGap = Infinity;
  for (const point of series) {
    const time = new Date(`${point.date}T00:00:00Z`).getTime();
    if (!Number.isFinite(time)) continue;
    const gap = Math.abs(time - target);
    if (gap < bestGap) {
      best = point;
      bestGap = gap;
    }
  }
  return best;
}

/** Resolve the pass shown by a round, preferring the (API-merged) series. */
function passFor(site, date) {
  const pass = nearestPass(site.series, date);
  if (pass) {
    return {
      vv: Number.isFinite(pass.vv) ? pass.vv : null,
      vh: Number.isFinite(pass.vh) ? pass.vh : null,
      water: Number.isFinite(pass.water) ? pass.water : null,
      burn: Number.isFinite(pass.burn) ? pass.burn : null,
    };
  }
  const measurements = site.measurements;
  if (!measurements) return null;
  const side = measurements.dateBefore === date ? 'before' : measurements.dateAfter === date ? 'after' : null;
  if (!side) return null;
  return {
    vv: Number.isFinite(measurements.vv?.[side]) ? measurements.vv[side] : null,
    vh: Number.isFinite(measurements.vh?.[side]) ? measurements.vh[side] : null,
    water: null,
    burn: null,
  };
}

const signed = (value, digits) =>
  `${value >= 0 ? '+' : '\u2212'}${Math.abs(value).toFixed(digits)}`;

/**
 * Derive the evidence chips from the live study-area numbers.
 * Radar deltas come from the pass pair; the third chip is the surface change
 * that the site actually tracks (water fraction for wetlands, burn fraction
 * for the burn scar), falling back to the cross-pol gap.
 */
export function buildDetectiveEvidence(round, site) {
  if (!round || !site) return [];
  const before = passFor(site, round.before.date);
  const after = passFor(site, round.after.date);
  if (!before || !after || before.vv == null || after.vv == null || before.vh == null || after.vh == null) {
    return [];
  }

  const evidence = [
    { id: 'dvv', label: { en: '\u0394VV', ar: '\u0394VV' }, value: `${signed(after.vv - before.vv, 1)} dB` },
    { id: 'dvh', label: { en: '\u0394VH', ar: '\u0394VH' }, value: `${signed(after.vh - before.vh, 1)} dB` },
  ];

  if (before.water != null && after.water != null) {
    const delta = Math.round((after.water - before.water) * 100);
    evidence.push({ id: 'water', label: { en: 'Water cover', ar: 'الغطاء المائي' }, value: `${signed(delta, 0)} pts` });
  } else if (before.burn != null && after.burn != null) {
    const delta = Math.round((after.burn - before.burn) * 100);
    evidence.push({ id: 'burn', label: { en: 'Burn cover', ar: 'مساحة الاحتراق' }, value: `${signed(delta, 0)} pts` });
  } else {
    const gap = after.vv - after.vh - (before.vv - before.vh);
    evidence.push({ id: 'gap', label: { en: 'VV\u2212VH gap', ar: 'فجوة VV\u2212VH' }, value: `${signed(gap, 1)} dB` });
  }

  return evidence;
}
