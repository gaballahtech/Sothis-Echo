/**
 * “Radar detective” rounds — two real post-launch cases plus three reasoning
 * checks that reuse the existing change maps (no new acquisition):
 *   - Central Vietnam flood, September 2026
 *   - Big Sur (California) megafire, August 2026
 *   - Bright change ≠ damage (change-only round, no before/after pair)
 *   - Big Sur: coherence as an independent line of evidence (change-only)
 *   - Vietnam: specular reflection — why water turns dark (change-only)
 * The before/after dates are taken from the live site measurements at render
 * time; evidence chips are derived from the real backscatter series.
 */

export const detectiveRounds = [
  {
    id: 'vietnam-flood',
    siteId: 'sundarbans',
    title: { en: 'A river plain disappears', ar: 'سهل نهري يختفي' },
    brief: {
      en: 'Two NISAR L-band passes over central Vietnam around the September 2026 storm. Match the signal to the cause.',
      ar: 'مروران لـ NISAR L-band فوق وسط فيتنام حول عاصفة سبتمبر 2026. طابق الإشارة مع السبب.',
    },
    before: { date: '2026-09-07', params: { water: 0.2, emergent: 0.6, burn: 0, cloud: 0.7 } },
    after: { date: '2026-09-15', params: { water: 0.85, emergent: 0.55, burn: 0, cloud: 0.9 } },
    options: [
      { id: 'flood', label: { en: 'River flooding after heavy rain', ar: 'فيضان نهري بعد أمطار غزيرة' } },
      { id: 'drought', label: { en: 'Drought / water retreat', ar: 'جفاف / انحسار الماء' } },
      { id: 'fire', label: { en: 'Wildfire', ar: 'حريق غابات' } },
      { id: 'urban', label: { en: 'New construction', ar: 'بناء جديد' } },
    ],
    answer: 'flood',
    explanation: {
      en: 'Open water appears as near-black sheets and channels, while roofs and tree crowns that remain above the surface stay bright. That combination — a dark water sheet with bright islands — is river flooding, not drought or fire.',
      ar: 'يظهر الماء المكشوف كمسطحات وقنوات سوداء تقريبًا، بينما تبقى الأسطح وتيجان الأشجار فوق السطح لامعة. هذا المزيج — طبقة ماء داكنة وجزر لامعة — فيضان نهري، وليس جفافًا أو حريقًا.',
    },
  },
  {
    id: 'bigsur-fire',
    siteId: 'bigsur',
    title: { en: 'The canopy disappears', ar: 'المظلة تختفي' },
    brief: {
      en: 'Two NISAR L-band passes over Big Sur before and after the August 2026 megafire. Read the two polarization channels.',
      ar: 'مروران لـ NISAR L-band فوق بيغ سور قبل حريق أغسطس 2026 وبعده. اقرأ قناتي الاستقطاب.',
    },
    before: { date: '2026-08-16', params: { water: 0, emergent: 0.9, burn: 0.04, cloud: 0.1 } },
    after: { date: '2026-09-09', params: { water: 0, emergent: 0.1, burn: 0.9, cloud: 0.1 } },
    options: [
      { id: 'fire', label: { en: 'Severe wildfire', ar: 'حريق غابات شديد' } },
      { id: 'flood', label: { en: 'Flooding', ar: 'فيضان' } },
      { id: 'logging', label: { en: 'Selective logging', ar: 'قطع انتقائي للأشجار' } },
      { id: 'quake', label: { en: 'Earthquake deformation', ar: 'تشوه زلزالي' } },
    ],
    answer: 'fire',
    explanation: {
      en: 'The ground got darker and smoother: HH falls sharply as canopy and litter are removed, and HV — the channel fed by 3-D vegetation — drops wherever the canopy was fully consumed. A flood would leave roofs and banks bright inside the dark water; an earthquake would shift phase, not erase texture.',
      ar: 'صار السطح أغمق وأنعم: ينخفض HH بحدة مع اختفاء المظلة والغطاء الميت، وينخفض HV — قناة النباتات المجسّمة — حيث تُستهلك المظلة بالكامل. الفيضان كان سيُبقي الأسطح والضفاف لامعة داخل الماء الداكن؛ والزلزال كان سيغيّر الطور لا النسيج.',
    },
  },
  {
    // Judgment round: same Vietnam change map, no new satellite image needed.
    id: 'bright-change',
    siteId: 'sundarbans',
    changeOnly: true,
    title: { en: 'Bright signal, real disaster?', ar: 'إشارة ساطعة، فهل هي كارثة حقيقية؟' },
    brief: {
      en: 'Same Vietnam change map (|after − before|), zoomed on the rice fields and the coast — no new satellite image is needed.',
      ar: 'نفس خريطة التغيّر في فيتنام (|بعد − قبل|) مع التركيز على الحقول الزراعية والساحل — دون استخدام صورة جديدة من القمر الصناعي.',
    },
    question: {
      en: 'In a radar change map (|after − before|), a wide agricultural area turns bright white, showing a sharp shift in returned energy. Does a bright change signal always confirm severe flood damage?',
      ar: 'في خريطة كشف التغير الرادارية (|بعد − قبل|)، تحولت منطقة زراعية واسعة إلى اللون الأبيض الساطع مما يدل على تغير حاد في الطاقة المرتدة. هل تؤكد الإشارة الساطعة دائمًا وقوع دمار فيضاني شديد؟',
    },
    options: [
      {
        id: 'context',
        label: {
          en: 'No — routine rice irrigation, soil moisture, or tide shifts can trigger the same bright change',
          ar: 'لا — فالري الدوري لحقول الأرز، أو رطوبة التربة، أو حركة المد والجزر قد تُحدث نفس التغير الساطع.',
        },
      },
      {
        id: 'collapse',
        label: {
          en: 'Yes — bright white pixels in L-band radar only appear when buildings collapse',
          ar: 'نعم — البقع البيضاء الساطعة في رادار L-band لا تظهر إلا عند انهيار المباني.',
        },
      },
      {
        id: 'penetrate',
        label: {
          en: 'Yes — because radar pulses cannot penetrate wet soil under any condition',
          ar: 'نعم — لأن نبضات الرادار لا تستطيع اختراق التربة الرطبة تحت أي ظرف.',
        },
      },
    ],
    answer: 'context',
    explanation: {
      en: 'Radar measures physical change in surface roughness and moisture, not intent or damage. Flooded rice paddies, seasonal irrigation, and tidal shifts all turn smooth and mirror-like, producing a strong change signal that requires local context to interpret.',
      ar: 'يقيس الرادار التغير الفيزيائي في خشونة السطح ورطوبته، ولا يميز بين السبب الطبيعي والكارثة. فحقول الأرز المغمورة للزراعة، والري الموسمي، وتغيرات المد والجزر تجعل السطح أملس كالمرآة، مما ينتج إشارة تغير قوية تتطلب معرفة السياق المحلي لتفسيرها بدقة.',
    },
  },
  {
    // Reasoning round from the Big Sur megafire story: coherence is a second,
    // independent line of evidence beyond the amplitude drop.
    id: 'bigsur-coherence',
    siteId: 'bigsur',
    changeOnly: true,
    title: { en: 'Coherence tells the deeper story', ar: 'التماسك يحكي القصة الأعمق' },
    brief: {
      en: 'This real L-band change map is from the Big Sur megafire (August 2026). The burn scar shows a sharp amplitude drop — but the Big Sur story notes that coherence collapsed even where brightness held.',
      ar: 'خريطة التغيّر الحقيقية هذه من حريق بيج سور (أغسطس 2026). تُظهر ندبة الحريق انخفاضًا حادًا في السعة — لكن قصة بيج سور تذكر أن التماسك انهار حتى حيث بقي السطوع ثابتًا.',
    },
    question: {
      en: 'Why is InSAR coherence a valuable second line of evidence for the fire, beyond the amplitude drop?',
      ar: 'لماذا يُعدّ تماسك InSAR دليلًا ثانيًا قيمًا للحريق، إلى جانب انخفاض السعة؟',
    },
    options: [
      {
        id: 'coherence',
        label: {
          en: 'Coherence detects the physical disturbance (canopy/soil change) even where brightness looks stable — an independent signal.',
          ar: 'يكشف التماسك الاضطراب الفيزيائي (تغيّر المظلة/التربة) حتى حيث يبدو السطوع مستقرًا — إشارة مستقلة.',
        },
      },
      {
        id: 'amplitudeOnly',
        label: {
          en: 'Only amplitude matters; coherence is unaffected by fire.',
          ar: 'السعة فقط هي المهمة؛ والتماسك لا يتأثر بالحريق.',
        },
      },
      {
        id: 'phaseOnly',
        label: {
          en: 'Coherence only measures how bright the fire is.',
          ar: 'يقيس التماسك فقط مدى سطوع الحريق.',
        },
      },
    ],
    answer: 'coherence',
    explanation: {
      en: 'Fire removes canopy (amplitude drops) AND breaks phase coherence between passes (InSAR decorrelates). Coherence is an independent physical measurement, so it confirms the disturbance even where a single brightness channel looks stable.',
      ar: 'الحريق يزيل المظلة (تنخفض السعة) ويكسر تماسك الطور بين المرورين (عدم الترابط). التماسك قياس فيزيائي مستقل، لذا يؤكد الاضطراب حتى حيث تبدو قناة سطوع واحدة مستقرة.',
    },
  },
  {
    // Reasoning round from the Central Vietnam flood story: specular reflection.
    id: 'vietnam-specular',
    siteId: 'sundarbans',
    changeOnly: true,
    title: { en: 'Why water turns black', ar: 'لماذا يصير الماء أسود' },
    brief: {
      en: 'This real L-band change map is from the Central Vietnam flood (September 2026). The Vietnam story says open water scatters the pulse away and turns almost black, while banks and buildings stay bright.',
      ar: 'خريطة التغيّر الحقيقية هذه من فيضان وسط فيتنام (سبتمبر 2026). قصة فيتنام تقول إن الماء المكشوف يشتت النبضة ويصير شبه أسود، بينما تبقى الضفاف والمباني لامعة.',
    },
    question: {
      en: 'In the flood change map, why do the flooded fields go dark while the banks and buildings stay bright?',
      ar: 'في خريطة تغيّر الفيضان، لماذا تُظلم الحقول المغمورة بينما تبقى الضفاف والمباني لامعة؟',
    },
    options: [
      {
        id: 'specular',
        label: {
          en: 'Smooth open water acts like a mirror, sending the L-band pulse away (dark), while rough/built surfaces still return energy (bright).',
          ar: 'الماء المكشوف الأملس يعمل كمرآة، فيعيد النبضة بعيدًا (داكن)، بينما تعيد الأسطح الخشنة/المبنية الطاقة (لامعة).',
        },
      },
      {
        id: 'absorb',
        label: {
          en: 'Water absorbs all radar energy, so everything goes dark.',
          ar: 'يمتص الماء كل طاقة الرادار، فيصير كل شيء داكنًا.',
        },
      },
      {
        id: 'emit',
        label: {
          en: 'Buildings emit their own radar signal.',
          ar: 'تصدر المباني إشارة رادار خاصة بها.',
        },
      },
    ],
    answer: 'specular',
    explanation: {
      en: 'L-band is a microwave: smooth water is a specular reflector that sends the pulse away from the satellite (near-black), while rough vegetated/built surfaces scatter energy back (bright). That is why a flood map shows dark water sheets with bright islands.',
      ar: 'النطاق L ميكروويف: الماء الأملس عاكس مرآوي يرسل النبضة بعيدًا عن القمر (شبه أسود)، بينما تشتت الأسطح الخشنة/المبنية الطاقة عائدة (لامعة). لذلك تُظهر خريطة الفيضان مسطحات ماء داكنة وجزرًا لامعة.',
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
 * Every chip is a real backscatter delta: ΔVV, ΔVH, and the change in the
 * VH−VV gap. The gap is the honest third signal — the "dark share" proxy is
 * noisy across wind, soil moisture and tide, and on the live Vietnam passes it
 * moves opposite to the flood, so it is not shown as evidence.
 */
export function buildDetectiveEvidence(round, site) {
  if (!round || !site) return [];
  const before = passFor(site, site.measurements?.dateBefore || round.before.date);
  const after = passFor(site, site.measurements?.dateAfter || round.after.date);
  if (!before || !after || before.vv == null || after.vv == null || before.vh == null || after.vh == null) {
    return [];
  }

  const evidence = [
    { id: 'dhh', label: { en: '\u0394HH', ar: '\u0394HH' }, value: `${signed(after.vv - before.vv, 1)} dB` },
    { id: 'dhv', label: { en: '\u0394HV', ar: '\u0394HV' }, value: `${signed(after.vh - before.vh, 1)} dB` },
  ];

  // Same convention as the ledger: cross-pol is HV minus HH.
  const gapBefore = before.vh - before.vv;
  const gapAfter = after.vh - after.vv;
  evidence.push({
    id: 'gap',
    label: { en: 'HV\u2212HH gap', ar: 'فجوة HV\u2212HH' },
    value: `${signed(gapAfter - gapBefore, 1)} dB`,
  });

  return evidence;
}
