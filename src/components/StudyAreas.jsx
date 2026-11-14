import { useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Tab, Tabs, HTMLTable } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { contrastRows } from '../data/sites';
import { buildSiteCsv } from '../services/sarApi';
import { SceneCanvas } from './SceneCanvas';
import { Disclosure, Panel, SectionHead } from './ui';
import ObservationTable from './ObservationTable';

const STATE_KEYS = ['before', 'after'];

function formatDate(value, language) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    numberingSystem: 'latn',
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

function WorldMap({ sites, activeId, onSelect, language }) {
  const W = 640;
  const H = 320;
  const project = (lat, lng) => ({
    x: ((lng + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  });
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="world-map"
      role="img"
      aria-label="Study areas map"
      style={{ width: '100%', height: 'auto', background: '#eef2ea', border: '1px solid var(--bp-surface-border-color-default)' }}
    >
      {/* graticule */}
      {[...Array(7)].map((_, i) => (
        <line key={`v${i}`} x1={(i * W) / 6} y1={0} x2={(i * W) / 6} y2={H} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      ))}
      {[...Array(5)].map((_, i) => (
        <line key={`h${i}`} x1={0} y1={(i * H) / 4} x2={W} y2={(i * H) / 4} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      ))}
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      {sites.map((site) => {
        const { x, y } = project(site.coords.lat, site.coords.lng);
        const active = site.id === activeId;
        return (
          <g key={site.id} onClick={() => onSelect(site.id)} style={{ cursor: 'pointer' }}>
            <circle cx={x} cy={y} r={active ? 9 : 6} fill={active ? 'var(--bp-intent-primary-rest)' : 'var(--bp-intent-warning-rest)'} stroke="#fff" strokeWidth="2" />
            <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fontWeight={active ? 'bold' : 'normal'} fill="var(--bp-typography-color-default-rest)">
              {localized(site.name, language)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TimeSeriesChart({ site, language }) {
  const points = site?.series || [];
  if (points.length < 2) return null;
  const W = 640;
  const H = 220;
  const pad = { l: 44, r: 16, t: 12, b: 30 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const vvValues = points.map((p) => p.vv).filter((v) => Number.isFinite(v));
  const vhValues = points.map((p) => p.vh).filter((v) => Number.isFinite(v));
  const all = [...vvValues, ...vhValues];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = Math.max(1, max - min);
  const x = (i) => pad.l + (i / Math.max(1, points.length - 1)) * innerW;
  const y = (v) => pad.t + ((max - v) / range) * innerH;
  const vvPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.vv)}`).join(' ');
  const vhPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.vh)}`).join(' ');
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ts-chart" role="img" aria-label="Backscatter time series" style={{ width: '100%', height: 'auto' }}>
      {[min, (min + max) / 2, max].map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--bp-surface-border-color-default)" strokeWidth="1" strokeDasharray="2 4" />
          <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--bp-typography-color-muted)">{v.toFixed(1)}</text>
        </g>
      ))}
      <path d={vvPath} fill="none" stroke="var(--bp-intent-primary-rest)" strokeWidth="2" />
      <path d={vhPath} fill="none" stroke="var(--bp-intent-success-rest)" strokeWidth="2" />
      {ticks.map((i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--bp-typography-color-muted)">
          {points[i]?.date?.slice(0, 7)}
        </text>
      ))}
      {/* legend */}
      <g transform={`translate(${pad.l}, ${pad.t - 2})`}>
        <line x1={0} x2={14} y1={0} y2={0} stroke="var(--bp-intent-primary-rest)" strokeWidth="2" />
        <text x={18} y={3} fontSize="9" fill="var(--bp-typography-color-muted)">VV</text>
        <line x1={50} x2={64} y1={0} y2={0} stroke="var(--bp-intent-success-rest)" strokeWidth="2" />
        <text x={68} y={3} fontSize="9" fill="var(--bp-typography-color-muted)">VH</text>
      </g>
    </svg>
  );
}

export default function StudyAreas() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites } = useSiteData();
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
        <SectionHead title={t('sites.title')} subtitle={t('sites.subtitle')} id="sites-title" />

        <div style={{ marginBottom: 14 }}>
          <WorldMap sites={sites} activeId={site.id} onSelect={setActiveId} language={language} />
        </div>

        <ButtonGroup fill className="site-tabs" role="tablist" aria-label={t('sites.title')}>
          {sites.map((item) => {
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
                  <span style={{ fontWeight: 600 }}>{L(item.name)}</span>
                  <span className="small" style={{ opacity: 0.78 }}>{L(item.region)}</span>
                </span>
              </Button>
            );
          })}
        </ButtonGroup>

        <div role="tabpanel" aria-label={L(site.name)} className="stack" style={{ marginTop: 14 }}>
          <div className="stack" style={{ gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.25 }} dir="auto">
              {L(site.headline)}
            </h3>
            <div className="row small muted">
              <span>
                <Coordinates site={site} />
              </span>
              <span>
                {t('sites.event')}: <span style={{ color: 'var(--bp-typography-color-default-rest)' }}>{formatDate(site.eventDate, language)}</span>
              </span>
            </div>
            <div className="stack site-story" style={{ gap: 8 }}>
              {site.story.map((paragraph, index) => (
                <p key={index} className="body-copy-muted" style={{ margin: 0 }}>{L(paragraph)}</p>
              ))}
            </div>
            <div>
              <Button variant="outlined" small icon="download" text={t('sites.downloadCsv')} onClick={downloadCsv} />
            </div>
          </div>

          <div className="scene-grid">
            {STATE_KEYS.map((stateKey) => {
              const state = site.states[stateKey];
              return (
                <div key={stateKey} className="stack" style={{ gap: 0 }}>
                  <Panel title={`${L(state.label)} · ${state.date}`}>
                    <SceneCanvas
                      site={site}
                      params={state.params}
                      channel="radar"
                      imageUrl={state.imageUrl}
                      alt={t('sites.ariaScene', { site: L(site.name), state: L(state.label) })}
                    />
                    <div className="card-pad" style={{ paddingTop: 10, paddingBottom: 10, borderTop: '1px solid var(--bp-surface-border-color-default)' }}>
                      <p className="micro" style={{ margin: 0 }}>{L(state.caption)}</p>
                    </div>
                  </Panel>

                  <p className="body-copy-muted scene-explain" style={{ margin: 0 }}>
                    {L(state.happened)} {L(state.why)}
                  </p>
                </div>
              );
            })}
          </div>

          <Panel title={t('sites.measurements')} bodyClassName="card-pad">
            <div style={{ marginBottom: 12 }}>
              <TimeSeriesChart site={site} language={language} />
            </div>
            <div data-testid="deep-dive-tabs">
              <Tabs id="site-data" defaultSelectedTabId="reading" renderActiveTabPanelOnly>
                <Tab
                  id="reading"
                  title={t('sites.signalTab')}
                  panel={
                    <div className="split-even">
                      <Panel title={t('sites.readPol')} bodyClassName="card-pad">
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

                      <Panel title={t('sites.contrastTitle')} bodyClassName="card-pad">
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
            title={t('sites.forResearchers')}
            subtitle={L(site.name)}
            className="researcher-disclosure"
            testId="for-researchers"
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
