import { useEffect, useState } from 'react';
import { Button, ButtonGroup, Icon, Tab, Tabs, Tag, HTMLTable } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { contrastRows } from '../data/sites';
import { buildSiteCsv } from '../services/sarApi';
import { SceneCanvas } from './SceneCanvas';
import { Disclosure, Panel, SectionHead, SourceBadge } from './ui';
import ObservationTable from './ObservationTable';

const STATE_KEYS = ['before', 'after'];
const INFO_KEYS = [
  { key: 'happened', label: 'sites.whatHappened' },
  { key: 'why', label: 'sites.whyRadar' },
];

function formatDate(value, language) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function Coordinates({ site }) {
  const lat = Math.abs(site.coords.lat).toFixed(2);
  const lng = Math.abs(site.coords.lng).toFixed(2);
  return (
    <span className="numeric" dir="ltr">
      {lat}°{site.coords.lat >= 0 ? 'N' : 'S'}, {lng}°{site.coords.lng >= 0 ? 'E' : 'W'}
    </span>
  );
}

export default function StudyAreas() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isResearcher } = useMode();
  const { sites, source, error } = useSiteData();
  const [activeId, setActiveId] = useState(() => sites[0]?.id);

  useEffect(() => {
    if (!sites.some((item) => item.id === activeId)) setActiveId(sites[0]?.id);
  }, [sites, activeId]);

  const site = sites.find((item) => item.id === activeId) ?? sites[0];
  if (!site) return null;
  const L = (value) => localized(value, language);

  const downloadCsv = () => {
    const blob = new Blob([buildSiteCsv(site)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${site.id}-radar-series.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="sites" className="content-section chapter chapter--mint" aria-labelledby="sites-title">
      <div className="section-inner">
        <SectionHead kicker={t('sites.kicker')} title={t('sites.title')} subtitle={t('sites.subtitle')} id="sites-title" />

        <ButtonGroup fill className="site-tabs" role="tablist" aria-label={t('sites.title')}>
          {sites.map((item, index) => {
            const selected = item.id === site.id;
            return (
              <Button
                key={item.id}
                role="tab"
                aria-selected={selected}
                active={selected}
                variant={selected ? 'solid' : 'outlined'}
                alignText="start"
                onClick={() => setActiveId(item.id)}
                data-testid={`site-tab-${item.id}`}
              >
                <span className="site-tab-content">
                  <span className="micro" style={{ color: selected ? 'inherit' : undefined }}>
                    {String(index + 1).padStart(2, '0')} · {t('sites.siteOf', { current: index + 1, total: sites.length })}
                  </span>
                  <span style={{ fontWeight: 600 }}>{L(item.name)}</span>
                  <span className="small" style={{ opacity: 0.78 }}>{L(item.region)}</span>
                </span>
              </Button>
            );
          })}
        </ButtonGroup>

        <div role="tabpanel" aria-label={L(site.name)} className="stack" style={{ marginTop: 14 }}>
          <div className="split-main">
            <div className="stack">
              <div className="row">
                <Tag minimal intent="primary" icon="map">
                  {t('common.site')} {String(sites.findIndex((item) => item.id === site.id) + 1).padStart(2, '0')}
                </Tag>
                <Tag minimal>{L(site.tags[0]?.value)}</Tag>
                <Tag minimal>{L(site.tags[3]?.value)}</Tag>
                <SourceBadge source={source} error={error} />
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.25 }} dir="auto">
                {L(site.headline)}
              </h3>
              <div className="row small muted">
                <span className="row" style={{ gap: 4 }}>
                  <Icon icon="map" size={13} aria-hidden="true" />
                  <Coordinates site={site} />
                </span>
                <span className="row" style={{ gap: 4 }}>
                  <Icon icon="calendar" size={13} aria-hidden="true" />
                  {t('sites.event')}: <span style={{ color: 'var(--bp-typography-color-default-rest)' }}>{formatDate(site.eventDate, language)}</span>
                </span>
              </div>
            </div>

            <Panel
              title={t('sites.story')}
              icon="document"
              status={L(site.states.after.label)}
              bodyClassName="card-pad"
            >
              <div className="stack" style={{ gap: 9 }}>
                {site.story.map((paragraph, index) => (
                  <p key={index} className="body-copy-muted" style={{ margin: 0 }}>{L(paragraph)}</p>
                ))}
                <div>
                  <Button variant="outlined" small icon="download" text={t('sites.downloadCsv')} onClick={downloadCsv} />
                </div>
              </div>
            </Panel>
          </div>

          <div className="scene-grid">
            {STATE_KEYS.map((stateKey) => {
              const state = site.states[stateKey];
              return (
                <div key={stateKey} className="stack" style={{ gap: 0 }}>
                  <Panel title={`${L(state.label)} · ${state.date}`} icon="camera">
                    <SceneCanvas
                      site={site}
                      params={state.params}
                      channel="radar"
                      alt={t('sites.ariaScene', { site: L(site.name), state: L(state.label) })}
                    />
                    <div className="card-pad" style={{ paddingTop: 10, paddingBottom: 10, borderTop: '1px solid var(--bp-surface-border-color-default)' }}>
                      <p className="micro" style={{ margin: 0 }}>{L(state.caption)}</p>
                    </div>
                  </Panel>

                  <div className="app-panel info-list" style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    {INFO_KEYS.map((info) => (
                      <div key={info.key} className="info-block">
                        <h4>{t(info.label)}</h4>
                        <p className="body-copy-muted" style={{ margin: 0 }}>{L(state[info.key])}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="micro" style={{ margin: 0 }}>{t('sites.sceneSimulated')}</p>

          <Panel title={t('sites.measurements')} icon="database" bodyClassName="card-pad">
            <div data-testid="deep-dive-tabs">
              <Tabs id="site-data" defaultSelectedTabId="reading" renderActiveTabPanelOnly>
                <Tab
                  id="reading"
                  title={t('sites.signalTab')}
                  panel={
                    <div className="split-even">
                      <Panel title={t('sites.readPol')} icon="layers" bodyClassName="card-pad">
                        <p className="body-copy-muted" style={{ margin: 0 }}>{L(site.states.after.polarization)}</p>
                        <div className="grid-2" style={{ marginTop: 12 }}>
                          <div className="stat">
                            <div className="stat-label">VV</div>
                            <p className="small" style={{ margin: 0 }}>
                              {language === 'ar'
                                ? 'إرسال عمودي واستقبال عمودي — الماء المفتوح داكن، والأشجار قد تلمع.'
                                : 'Vertical send, vertical receive — open water is dark, trunks can glow.'}
                            </p>
                          </div>
                          <div className="stat">
                            <div className="stat-label">VH</div>
                            <p className="small" style={{ margin: 0 }}>
                              {language === 'ar'
                                ? 'إرسال عمودي واستقبال أفقي — قناة المظلة ثلاثية الأبعاد.'
                                : 'Vertical send, horizontal receive — the 3-D canopy channel.'}
                            </p>
                          </div>
                        </div>
                      </Panel>

                      <Panel title={t('sites.contrastTitle')} icon="comparison" bodyClassName="card-pad">
                        <p className="body-copy-muted" style={{ marginBottom: 8 }}>{t('sites.contrastSubtitle')}</p>
                        <HTMLTable bordered striped compact className="is-full-width">
                          <thead>
                            <tr>
                              <th>{t('sites.comparison.label')}</th>
                              <th>{t('sites.comparison.sundarbans')}</th>
                              <th>{t('sites.comparison.caldor')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contrastRows.map((row) => (
                              <tr key={row.id}>
                                <th scope="row">{L(row.label)}</th>
                                <td>{L(row.sundarbans)}</td>
                                <td>{L(row.caldor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </HTMLTable>
                      </Panel>
                    </div>
                  }
                />
                <Tab
                  id="ledger"
                  title={t('sites.deepDive')}
                  panel={
                    <div className="deep-dive-panel">
                      <p className="body-copy-muted deep-dive-intro">{t('sites.observations.subtitle')}</p>
                      <ObservationTable />
                    </div>
                  }
                />
              </Tabs>
            </div>
          </Panel>

          <Disclosure
            key={isResearcher ? 'research-open' : 'public-closed'}
            title={t('sites.forResearchers')}
            subtitle={L(site.name)}
            icon="properties"
            className="researcher-disclosure"
            testId="for-researchers"
            defaultOpen={isResearcher}
          >
              <div className="grid-2">
                <div className="stack">
                  <div>
                    <h4 className="micro">01 · {t('sites.acquisition')}</h4>
                    <p className="body-copy-muted" style={{ margin: 0 }}>{L(site.researcher.acquisition)}</p>
                  </div>
                  <div>
                    <h4 className="micro">02 · {t('sites.interpretation')}</h4>
                    <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>
                      {site.researcher.interpretation.map((item, index) => (
                        <li key={index} style={{ marginBottom: 4 }}>{L(item)}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="micro">03 · {t('sites.methods')}</h4>
                    <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>
                      {site.researcher.methods.map((item, index) => (
                        <li key={index} style={{ marginBottom: 4 }}>{L(item)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="stack">
                  <div>
                    <h4 className="micro">04 · {t('sites.limits')}</h4>
                    <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>
                      {site.researcher.limits.map((item, index) => (
                        <li key={index} style={{ marginBottom: 4 }}>{L(item)}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="micro">05 · {t('sites.sources')}</h4>
                    <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                      {site.researcher.sources.map((sourceItem) => (
                        <li key={sourceItem.href}>
                          <a href={sourceItem.href} target="_blank" rel="noopener noreferrer" className="ref-link">
                            {sourceItem.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="micro" style={{ margin: 0 }}>{t('sites.dbNote')}</p>
                </div>
              </div>
          </Disclosure>
        </div>
      </div>
    </section>
  );
}
