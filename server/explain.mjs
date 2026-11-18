/**
 * "Explain the Echo" — turn a site's computed metrics into a grounded,
 * numbers-first physical hypothesis. Deterministic and testable: no LLM, no
 * hallucination. Every claim cites the real measurement it came from, and any
 * question the data cannot answer returns an explicit "not measured" state.
 *
 * Inputs are the same real NISAR numbers the site already shows (amplitude
 * gamma-0, coherence, dual-pol mechanism) plus the site's own narrative.
 */

const round1 = (value) => (Number.isFinite(value) ? Math.round(value * 10) / 10 : null);
const pct = (value) => (Number.isFinite(value) ? `${Math.round(value)}%` : '—');
const db = (value) => (Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${value} dB` : '—');

/**
 * Classify the dominant physical story from the measured deltas.
 * Pure, ordered rules — the first matching rule wins, so the result is stable.
 */
function dominantMechanism({ amplitude, mechanism, coherence, change }) {
  const dHH = amplitude?.dHH;
  const dHV = amplitude?.dHV;
  const volBefore = mechanism?.before?.volume;
  const volAfter = mechanism?.after?.volume;
  const lowBefore = mechanism?.before?.low;
  const lowAfter = mechanism?.after?.low;
  const cohLow = coherence?.lowCoherencePct;

  // Change-only site (e.g. a flood with an amplitude-change map but no
  // coherence/mechanism): name what was actually measured.
  if (!Number.isFinite(dHH) && !Number.isFinite(dHV) && !Number.isFinite(cohLow)) {
    const changedPct = change?.changePct;
    if (Number.isFinite(changedPct) && changedPct >= 10) return 'amplitude-change';
    if (Number.isFinite(changedPct)) return 'stable';
  }

  // Flood / inundation: cross-pol rises (volume), low-return (open water) grows.
  if (Number.isFinite(dHV) && dHV > 1 && Number.isFinite(lowAfter) && Number.isFinite(lowBefore) && lowAfter > lowBefore + 0.03) {
    return 'flood';
  }
  // Wildfire / vegetation loss: co-pol drops, volume share falls.
  if (Number.isFinite(dHH) && dHH < -1 && Number.isFinite(volAfter) && Number.isFinite(volBefore) && volAfter < volBefore - 0.03) {
    return 'fire';
  }
  // Structural / mechanical change: coherence collapses even if amplitude is flat.
  if (Number.isFinite(cohLow) && cohLow > 20) {
    return 'disturbance';
  }
  // Generic amplitude change.
  if (Number.isFinite(dHH) && Math.abs(dHH) >= 1) {
    return dHH < 0 ? 'smoothing' : 'roughening';
  }
  return 'stable';
}

const MECHANISM_TEXT = {
  fire: {
    en: 'canopy volume was lost — a burn scar: HH backscatter fell and the volume (cross-pol) share dropped.',
    ar: 'فُقد حجم المظلة — ندبة حريق: انخفض ارتداد HH وتراجعت نسبة الحجم (القطب المتقاطع).',
  },
  flood: {
    en: 'surface water expanded — a flood: cross-pol rose and open-water (low-return) pixels grew.',
    ar: 'تمددت المياه السطحية — فيضان: ارتفع القطب المتقاطع ونمت بكسلات المياه المفتوحة (الارتداد المنخفض).',
  },
  disturbance: {
    en: 'the surface structure changed — coherence collapsed, marking physical disturbance even where brightness held.',
    ar: 'تغيّر البناء السطحي — انهار التماسك، مما يشير إلى اضطراب فيزيائي حتى حيث بقي السطوع ثابتًا.',
  },
  smoothing: {
    en: 'the surface got smoother or wetter — co-pol backscatter dropped.',
    ar: 'أصبح السطح أنعم أو أكثر رطوبة — انخفض ارتداد القطب المشترك.',
  },
  roughening: {
    en: 'the surface got rougher — co-pol backscatter rose.',
    ar: 'أصبح السطح أخشن — ارتفع ارتداد القطب المشترك.',
  },
  stable: {
    en: 'no strong physical change stood out above the noise in this pair.',
    ar: 'لم يبرز تغيّر فيزيائي قوي فوق الضجيج في هذا الزوج.',
  },
  'amplitude-change': {
    en: 'a large share of the surface changed by more than the amplitude threshold between the two passes — a substantial physical change of the ground.',
    ar: 'تغيّرت نسبة كبيرة من السطح بأكثر من عتبة السعة بين المرورين — تغيّر فيزيائي جوهري في الأرض.',
  },
};

/**
 * Build the grounded hypothesis object.
 * @param {{amplitude?:object, mechanism?:object, coherence?:object, pair?:object, label?:string, computedAt?:string}} lenses
 * @param {'en'|'ar'} language
 */
export function buildExplanation(lenses, language = 'en') {
  const ar = language === 'ar';
  const amplitude = lenses?.amplitude || {};
  const mechanism = lenses?.mechanism || {};
  const coherence = lenses?.coherence || {};
  const change = lenses?.change || {};
  const kind = dominantMechanism({ amplitude, mechanism, coherence, change });

  const numbers = [];
  if (Number.isFinite(amplitude.dHH)) {
    numbers.push({ id: 'dHH', label: ar ? 'تغير HH' : 'Δ HH', value: db(amplitude.dHH), source: 'GCOV gamma-0' });
  }
  if (Number.isFinite(amplitude.dHV)) {
    numbers.push({ id: 'dHV', label: ar ? 'تغير HV' : 'Δ HV', value: db(amplitude.dHV), source: 'GCOV gamma-0' });
  }
  if (!Number.isFinite(amplitude.dHH) && Number.isFinite(change.changePct)) {
    numbers.push({ id: 'changedPct', label: ar ? 'نسبة التغيّر' : 'Changed area', value: pct(change.changePct), source: 'GCOV |Δ|' });
    if (Number.isFinite(change.changedAreaKm2)) {
      numbers.push({ id: 'changedKm2', label: ar ? 'المساحة المتغيّرة' : 'Changed extent', value: `${change.changedAreaKm2} km²`, source: 'GCOV |Δ|' });
    }
    if (Number.isFinite(change.meanAbsDeltaDb)) {
      numbers.push({ id: 'meanAbs', label: ar ? 'متوسط |Δ|' : 'Mean |Δ|', value: `${change.meanAbsDeltaDb} dB`, source: 'GCOV |Δ|' });
    }
  }
  if (Number.isFinite(coherence.mean)) {
    numbers.push({ id: 'coh', label: ar ? 'متوسط التماسك' : 'Mean coherence', value: coherence.mean, source: 'GSLC pair' });
  }
  if (Number.isFinite(coherence.lowCoherencePct)) {
    numbers.push({ id: 'cohLow', label: ar ? 'تماسك منخفض' : 'Low coherence', value: pct(coherence.lowCoherencePct), source: 'GSLC pair' });
  }
  if (Number.isFinite(mechanism.after?.volume) && Number.isFinite(mechanism.before?.volume)) {
    numbers.push({
      id: 'vol',
      label: ar ? 'نسبة الحجم قبل → بعد' : 'Volume share before → after',
      value: `${pct(mechanism.before.volume * 100)} → ${pct(mechanism.after.volume * 100)}`,
      source: 'HH/HV classes',
    });
  }

  const headline = ar
    ? `القراءة الفيزيائية: ${MECHANISM_TEXT[kind].ar}`
    : `The physical read: ${MECHANISM_TEXT[kind].en}`;

  const citations = [
    lenses?.pair?.before ? { label: 'before granule', value: lenses.pair.before } : null,
    lenses?.pair?.after ? { label: 'after granule', value: lenses.pair.after } : null,
    coherence?.granuleBefore ? { label: 'coherence (GSLC)', value: coherence.granuleBefore } : null,
    coherence?.granuleAfter ? { label: 'coherence (GSLC)', value: coherence.granuleAfter } : null,
  ].filter(Boolean);

  return {
    kind,
    headline,
    numbers,
    citations,
    computedAt: lenses?.computedAt || null,
    unknowns: ar
      ? ['لم يُقَس بعد: إزاحة الارتفاع (InSAR) أو الرطوبة الأرضية الكمية لهذا الموقع.']
      : ['Not measured here yet: InSAR surface displacement or quantitative soil moisture for this site.'],
  };
}

/**
 * Answer a free-form question using only the grounded explanation. Returns an
 * explicit "unknown" answer when the question is outside the measured data.
 */
export function answerQuestion(lenses, question, language = 'en') {
  const ar = language === 'ar';
  const q = String(question || '').toLowerCase();
  const explanation = buildExplanation(lenses, language);
  const amplitude = lenses?.amplitude || {};
  const mechanism = lenses?.mechanism || {};

  const asksAbout = (...terms) => terms.some((term) => q.includes(term));

  if (asksAbout('why', 'كيف', 'لماذا', 'سبب', 'physical', 'mechanism', 'آلية')) {
    return {
      answer: explanation.headline,
      citations: explanation.citations,
      confidence: 'grounded',
    };
  }
  if (asksAbout('how much', 'كم', 'change', 'delta', 'تغير', 'مقدار')) {
    if (!Number.isFinite(amplitude.dHH) && Number.isFinite(lenses?.change?.changePct)) {
      return {
        answer: ar
          ? `تغيّرت ${Math.round(lenses.change.changePct)}% من المساحة بمتوسط |Δ| ${lenses.change.meanAbsDeltaDb} dB.`
          : `${Math.round(lenses.change.changePct)}% of the area changed, with a mean |Δ| of ${lenses.change.meanAbsDeltaDb} dB.`,
        citations: explanation.citations,
        confidence: 'grounded',
      };
    }
    return {
      answer: ar
        ? ` HH: ${db(amplitude.dHH)} ، HV: ${db(amplitude.dHV)}.`
        : `HH changed ${db(amplitude.dHH)} and HV changed ${db(amplitude.dHV)} between the two passes.`,
      citations: explanation.citations,
      confidence: 'grounded',
    };
  }
  if (asksAbout('coherence', 'تماسك')) {
    if (!Number.isFinite(lenses?.coherence?.mean)) {
      return { answer: ar ? 'لم يُحسب التماسك لهذا الموقع.' : 'Coherence was not computed for this site.', citations: [], confidence: 'unknown' };
    }
    return {
      answer: ar
        ? `متوسط التماسك ${lenses.coherence.mean}، مع ${pct(lenses.coherence.lowCoherencePct)} مساحة منخفضة التماسك.`
        : `Mean coherence is ${lenses.coherence.mean}, with ${pct(lenses.coherence.lowCoherencePct)} of the area at low coherence.`,
      citations: explanation.citations,
      confidence: 'grounded',
    };
  }
  // Default: refuse rather than invent.
  return {
    answer: ar
      ? 'هذا السؤال خارج ما قاسته بيانات هذا الموقع. المتاح: السعة (HH/HV)، التماسك، وآلية التشتت.'
      : 'That question is outside what this site measured. Available: amplitude (HH/HV), coherence, and scattering mechanism.',
    citations: [],
    confidence: 'unknown',
  };
}