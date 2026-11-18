import { useEffect, useState } from 'react';
import { Button, Callout, InputGroup, Spinner } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { askExplain, loadExplanation } from '../services/sarApi';

/**
 * "Explain the Echo" — a grounded, numbers-first physical hypothesis for the
 * selected site, plus an "Ask the Radar" box whose answers come only from the
 * real computed metrics (never invented; unknown questions say so).
 */
export default function ExplainPanel() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, source, selectedSiteId, setSelectedSiteId } = useSiteData();
  const activeId = selectedSiteId;
  const setActiveId = setSelectedSiteId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!sites.length) return;
    if (!sites.some((item) => item.id === activeId)) setActiveId(sites[0]?.id);
  }, [sites, activeId, setActiveId]);

  const site = sites.find((item) => item.id === activeId) ?? sites[0];

  useEffect(() => {
    if (source !== 'api' || !site?.id) {
      setData(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setData(null);
    setAnswer(null);
    loadExplanation(site.id, language).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [site?.id, source, language]);

  if (!site) return null;

  if (source !== 'api') {
    return (
      <section id="explain" className="content-section chapter" aria-labelledby="explain-title">
        <div className="section-inner">
          <h2 id="explain-title" style={{ margin: 0 }}>{t('explain.title')}</h2>
          <p className="body-copy-muted" style={{ marginTop: 8 }}>{t('explain.offline')}</p>
        </div>
      </section>
    );
  }

  const ask = async () => {
    if (!question.trim() || !site?.id) return;
    setAsking(true);
    const result = await askExplain(site.id, question.trim(), language);
    setAnswer(result);
    setAsking(false);
  };

  return (
    <section id="explain" className="content-section chapter" aria-labelledby="explain-title">
      <div className="section-inner">
        <h2 id="explain-title" style={{ margin: 0 }}>{t('explain.title')}</h2>
        <p className="body-copy-muted" style={{ margin: '6px 0 0', maxWidth: 760 }}>{t('explain.subtitle')}</p>

        {loading ? (
          <div style={{ padding: '24px 0' }}><Spinner size={24} /></div>
        ) : !data ? (
          <Callout intent="primary" style={{ marginTop: 14 }}>{t('explain.unavailable')}</Callout>
        ) : (
          <div className="stack" style={{ gap: 16, marginTop: 14 }}>
            <div className="explain-headline" role="note" data-testid="explain-headline">
              {data.headline}
            </div>

            <div className="grid-2">
              {data.numbers.map((item) => (
                <div key={item.id} className="stat">
                  <div className="stat-label">{item.label}</div>
                  <p className="numeric" style={{ margin: 0, fontSize: 18, fontWeight: 600 }} dir="ltr">{item.value}</p>
                  <p className="micro" style={{ margin: '2px 0 0' }}>{item.source}</p>
                </div>
              ))}
            </div>

            <div className="stack" style={{ gap: 8 }}>
              <h3 className="micro" style={{ margin: 0 }}>{t('explain.askTitle')}</h3>
              <div className="row" style={{ gap: 8 }}>
                <InputGroup
                  fill
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') ask();
                  }}
                  placeholder={t('explain.askPlaceholder')}
                  aria-label={t('explain.askTitle')}
                  data-testid="explain-ask-input"
                />
                <Button intent="primary" onClick={ask} loading={asking} text={t('explain.askButton')} />
              </div>
              {answer ? (
                <div className="explain-answer" data-testid="explain-answer" role="status">
                  <p className="body-copy" style={{ margin: 0 }}>{answer.answer}</p>
                  <p className="micro" style={{ margin: '4px 0 0' }}>
                    {answer.confidence === 'grounded' ? t('explain.grounded') : t('explain.unknown')}
                  </p>
                  {answer.citations?.length ? (
                    <p className="micro" dir="ltr" style={{ margin: '4px 0 0', opacity: 0.8 }}>
                      {answer.citations.map((citation) => citation.value).join(' · ')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {data.unknowns?.length ? (
              <p className="micro" style={{ margin: 0, opacity: 0.85 }}>{t('explain.unknowns')}: {data.unknowns.join(' ')}</p>
            ) : null}

            {data.citations?.length ? (
              <div className="stack" style={{ gap: 4 }}>
                <h3 className="micro" style={{ margin: 0 }}>{t('explain.sources')}</h3>
                {data.citations.map((citation) => (
                  <p key={citation.value} className="micro" dir="ltr" style={{ margin: 0, opacity: 0.8 }}>
                    {citation.label}: {citation.value}
                  </p>
                ))}
              </div>
            ) : null}

            {data.computedAt ? (
              <p className="micro" style={{ margin: 0, opacity: 0.7 }}>{t('lenses.computedAt', { date: data.computedAt })}</p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}