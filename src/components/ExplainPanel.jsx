import { useEffect, useState } from 'react';
import { Button, Callout, Spinner } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { loadExplanation } from '../services/sarApi';

/**
 * "Explain the Echo" — a grounded, numbers-first physical hypothesis for the
 * selected site. The "Ask" box is now a shortcut into Sothis AI, which answers
 * from the same real measurements (never invented).
 */
export default function ExplainPanel() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, source, selectedSiteId, setSelectedSiteId } = useSiteData();
  const activeId = selectedSiteId;
  const setActiveId = setSelectedSiteId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const openChat = () => {
    window.dispatchEvent(new CustomEvent('sothis:ask', { detail: { question: t('explain.openChatPrompt') } }));
  };

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
              <Button intent="primary" onClick={openChat} text={t('explain.openChat')} data-testid="explain-open-chat" />
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