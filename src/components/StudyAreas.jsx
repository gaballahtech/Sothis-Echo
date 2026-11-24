import { useEffect, useState } from 'react';
import { Button, ButtonGroup, Tab, Tabs, HTMLTable } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { contrastRows } from '../data/sites';
import { buildSiteCsv, loadChangeStats, sceneImageUrl } from '../services/sarApi';
import { SceneCanvas } from './SceneCanvas';
import { SwipeCompare } from './SwipeCompare';
import { Disclosure, FacetShell, Panel, SectionHead } from './ui';
import GlossaryText from './GlossaryText';
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

/* The tag on each card names the sensor behind that image, so the label, the
   date and the file shown underneath always describe the same pass. */
function sceneProduct(state) {
  const product = state.product || '';
  if (/nisar/i.test(product)) return 'NISAR L-band · HH';
  return null;
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

export default function StudyAreas({ embedded = false, siteId }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, source, loading, selectedSiteId, setSelectedSiteId } = useSiteData();
  const activeId = siteId ?? selectedSiteId;
  const setActiveId = embedded ? () => {} : setSelectedSiteId;
  const [cardView, setCardView] = useState('hh');
  const [swipeMode, setSwipeMode] = useState('hh');
  const [changeStats, setChangeStats] = useState(null);

  useEffect(() => {
    if (!sites.some((item) => item.id === activeId)) setActiveId(sites[0]?.id);
  }, [sites, activeId]);

  const site = sites.find((item) => item.id === activeId) ?? sites[0];
  const provenance = site?.provenance || null;
  const statsAvailable = source === 'api' && provenance?.cards?.changeStats === true;

  useEffect(() => {
    setCardView('hh');
    setSwipeMode('hh');
    setChangeStats(null);
    if (!statsAvailable || !site?.id) return undefined;
    let cancelled = false;
    loadChangeStats(site.id).then((stats) => {
      if (!cancelled && stats) setChangeStats(stats);
    });
    return () => {
      cancelled = true;
    };
  }, [site?.id, statsAvailable]);

  if (!site) return null;
  const L = (value) => localized(value, language);
  const nisar = /nisar/i.test(site.source || '') || Boolean(site.states?.after?.nisarImageUrl);
  // Channel names follow the numbers, which now come from the calibrated NISAR
  // L-band GCOV series (HH/HV gamma-0), so the table can label them HH/HV.
  const numbers = provenance?.numbers || null;
  const numbersNisar = Boolean(numbers?.calibrated) || /nisar/i.test(String(numbers?.sensor || ''));
  const coPol = numbersNisar ? 'HH' : 'VV';
  const crossPol = numbersNisar ? 'HV' : 'VH';
  const crossLabel = `${crossPol} \u2212 ${coPol}`;
  const rgbAvailable = Boolean(provenance?.cards?.rgbComposite && nisar);
  const rgbSides = provenance?.cards?.rgbSides || {};
  const showComposite = (stateKey) => cardView === 'rgb' && rgbAvailable && rgbSides[stateKey] === true;
  // Inside the swipe view the HH·HV option stays usable: each side shows its RGB
  // composite when that pass actually has one, otherwise it falls back to HH.
  const swipeBeforeUrl =
    swipeMode === 'rgb' && rgbSides.before
      ? sceneImageUrl(site.id, 'before', 'nisar', 'rgb')
      : site.states.before.imageUrl;
  const swipeAfterUrl =
    swipeMode === 'rgb' && rgbSides.after
      ? sceneImageUrl(site.id, 'after', 'nisar', 'rgb')
      : site.states.after.imageUrl;
  const polList = (list) => (Array.isArray(list) ? list.join('/') : '');
  const cardsText = provenance?.cards
    ? t(provenance.cards.sensor === 'NISAR' ? 'sites.provCardsNisar' : 'sites.provCardsSentinel', {
        polarizations: polList(provenance.cards.polarizations),
      })
    : null;
  const numbersText = provenance?.numbers
    ? t(provenance.numbers.calibrated ? 'sites.provNumbersNisar' : 'sites.provNumbersSentinel', {
        polarizations: polList(provenance.numbers.polarizations),
      })
    : null;

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

  // The swipe divider only makes sense when both passes have a rendered image.
  const swipeAvailable = Boolean(site.states?.before?.imageUrl && site.states?.after?.imageUrl);
  const showCardToggle = rgbAvailable || swipeAvailable;

  const changePanel =
    site?.source?.startsWith('sentinel-1') || site?.source?.startsWith('nisar') || site?.states?.after?.nisarImageUrl ? (
      <div className="stack" style={{ gap: 0 }}>
        <Panel title={t('sites.changeTitle', { date: `${site.states.before.date} → ${site.states.after.date}` })}>
          <SceneCanvas
            imageUrl={sceneImageUrl(site.id, 'change', site?.states?.after?.nisarImageUrl ? 'nisar' : undefined)}
            alt={t('sites.changeAria', { site: L(site.name) })}
          />
          <div className="card-pad" style={{ paddingTop: 10, paddingBottom: 10, borderTop: '1px solid var(--bp-surface-border-color-default)' }}>
            <p className="micro" style={{ margin: 0 }}>{t('sites.changeCaption')}</p>
          </div>
        </Panel>
        <p className="body-copy-muted scene-explain" style={{ margin: 0 }}>
          {t('sites.changeNote')}
        </p>
        {changeStats ? (
          <div className="change-stats" data-testid="change-stats">
            <span className="micro">{t('sites.changeStatsLabel')}</span>
            <p className="body-copy" style={{ margin: '2px 0 0' }}>
              {t('sites.changeStatsValue', {
                changed: changeStats.changedPct,
                area: changeStats.changedAreaKm2 != null ? Number(changeStats.changedAreaKm2).toFixed(1) : '—',
              })}
            </p>
            <p className="micro" style={{ margin: '2px 0 0' }}>
              {t('sites.changeStatsCaveat', {
                threshold: changeStats.thresholdDb,
                mean: changeStats.meanDeltaDb,
                valid: changeStats.validPct,
              })}
            </p>
            {changeStats.snapshot ? (
              <p className="micro" style={{ margin: '2px 0 0' }}>
                {t('sites.changeStatsSnapshot', { date: changeStats.computedAt })}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <FacetShell embedded={embedded} id="sites" className="content-section chapter chapter--mint" labelledBy="sites-title">
      {!embedded ? <SectionHead title={t('sites.title')} subtitle={t('sites.subtitle')} id="sites-title" /> : null}

      {loading ? (
          <p className="micro" role="status" style={{ marginBottom: 12 }}>
            {t('common.checkingLive')}
          </p>
        ) : null}
        {!loading && source !== 'api' ? (
          <p className="micro" role="status" style={{ marginBottom: 12 }}>
            {t('sites.localData')}
          </p>
        ) : null}
        {!loading && site.degraded ? (
          <p className="micro" role="status" data-testid="degraded-note" style={{ marginBottom: 12 }}>
            {t('sites.degraded')}
          </p>
        ) : null}

        {!embedded ? (
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
        ) : null}

        <div role="tabpanel" aria-label={L(site.name)} className="stack" style={{ marginTop: 14 }}>
          <div className="stack" style={{ gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.25 }} dir="auto">
              <GlossaryText text={L(site.headline)} />
            </h3>
            {site.signalNote ? (
              <p className="signal-note">
                <span className="signal-note-dot" aria-hidden="true" />
                {L(site.signalNote)}
              </p>
            ) : null}
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
                <p key={index} className="body-copy-muted" style={{ margin: 0 }}><GlossaryText text={L(paragraph)} /></p>
              ))}
            </div>
            {site.impact ? (
              <dl className="impact-list" data-testid="site-impact">
                <div>
                  <dt>{t('sites.impactUsers')}</dt>
                  <dd>{L(site.impact.users)}</dd>
                </div>
                <div>
                  <dt>{t('sites.impactDecision')}</dt>
                  <dd>{L(site.impact.decision)}</dd>
                </div>
              </dl>
            ) : null}
            <div>
              <Button variant="outlined" small icon="download" text={t('sites.downloadCsv')} onClick={downloadCsv} />
            </div>
          </div>

          {showCardToggle ? (
            <div className="row-between card-view-toggle" data-testid="card-view-toggle">
              <span className="micro">{t('sites.cardViewAria')}</span>
              <ButtonGroup minimal>
                <Button
                  small
                  active={cardView === 'hh' || (cardView === 'swipe' && swipeMode === 'hh')}
                  text={t('sites.cardViewHh')}
                  onClick={() => (cardView === 'swipe' ? setSwipeMode('hh') : setCardView('hh'))}
                  data-testid="card-view-hh"
                />
                {rgbAvailable ? (
                  <Button
                    small
                    active={cardView === 'rgb' || (cardView === 'swipe' && swipeMode === 'rgb')}
                    text={t('sites.cardViewRgb')}
                    onClick={() => (cardView === 'swipe' ? setSwipeMode('rgb') : setCardView('rgb'))}
                    data-testid="card-view-rgb"
                  />
                ) : null}
                {swipeAvailable ? (
                  <Button
                    small
                    active={cardView === 'swipe'}
                    text={t('sites.cardViewSwipe')}
                    onClick={() => {
                      if (cardView !== 'swipe') setSwipeMode(cardView === 'rgb' ? 'rgb' : 'hh');
                      setCardView('swipe');
                    }}
                    data-testid="card-view-swipe"
                  />
                ) : null}
              </ButtonGroup>
            </div>
          ) : null}

          {cardView === 'swipe' && swipeAvailable ? (
            <div className="stack" style={{ gap: 12 }}>
              <SwipeCompare
                beforeUrl={swipeBeforeUrl}
                afterUrl={swipeAfterUrl}
                beforeLabel={L(site.states.before.label)}
                afterLabel={L(site.states.after.label)}
                beforeDate={formatDate(site.states.before.date, language)}
                afterDate={formatDate(site.states.after.date, language)}
                alt={t('sites.swipeAria', { site: L(site.name) })}
              />
              {swipeMode === 'rgb' ? (
                <p className="micro" data-testid="swipe-rgb-note" style={{ margin: 0 }}>
                  {t('sites.cardViewRgbNote')}
                </p>
              ) : null}
              {changePanel}
            </div>
          ) : (
            <div className="scene-grid">
              {STATE_KEYS.map((stateKey) => {
                const state = site.states[stateKey];
                return (
                  <div key={stateKey} className="stack" style={{ gap: 0 }}>
                    <Panel
                      title={`${L(state.label)} · ${state.date}`}
                      status={showComposite(stateKey) ? 'NISAR L-band · HH/HV' : sceneProduct(state)}
                    >
                      <SceneCanvas
                        site={site}
                        params={state.params}
                        channel="radar"
                        imageUrl={
                          showComposite(stateKey)
                            ? sceneImageUrl(site.id, stateKey, 'nisar', 'rgb')
                            : state.imageUrl
                        }
                        alt={t('sites.ariaScene', { site: L(site.name), state: L(state.label) })}
                      />
                      <div className="card-pad" style={{ paddingTop: 10, paddingBottom: 10, borderTop: '1px solid var(--bp-surface-border-color-default)' }}>
                        <p className="micro" style={{ margin: 0 }}>{L(state.caption)}</p>
                      </div>
                    </Panel>

                    {state.nisarGranule || state.acquiredAt ? (
                      <p className="micro" dir="ltr" data-testid={`scene-meta-${stateKey}`} style={{ margin: 0 }}>
                        {state.nisarGranule ? `${state.nisarGranule} · ` : ''}
                        {state.nisarAcquiredAt || state.acquiredAt || state.date}
                      </p>
                    ) : null}

                    <p className="body-copy-muted scene-explain" style={{ margin: 0 }}>
                      {L(state.happened)} {L(state.why)}
                    </p>
                  </div>
                );
              })}
              {changePanel}
              {cardView === 'rgb' ? (
                <p className="micro" data-testid="rgb-note" style={{ margin: 0 }}>
                  {t('sites.cardViewRgbNote')}
                </p>
              ) : null}
            </div>
          )}

          <Panel title={t('sites.measurements')} bodyClassName="card-pad">
            {source === 'api' && nisar && provenance && !site.degraded ? (
              <p className="micro series-source-note" role="note" data-testid="series-source-note">
                {t('sites.seriesSourceNote', { cards: cardsText, numbers: numbersText })}
              </p>
            ) : null}
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
                            <div className="stat-label">{coPol}</div>
                            <p className="small" style={{ margin: 0 }}>{t('sites.coPolDesc')}</p>
                          </div>
                          <div className="stat">
                            <div className="stat-label">{crossPol}</div>
                            <p className="small" style={{ margin: 0 }}>{t('sites.crossPolDesc')}</p>
                          </div>
                        </div>
                        {site.measurements?.crossPol ? (
                          <>
                          <HTMLTable bordered striped compact className="is-full-width" style={{ marginTop: 12 }}>
                            <thead>
                              <tr>
                                <th>{t('sites.metric')}</th>
                                <th>{t('sites.beforePass')}</th>
                                <th>{t('sites.afterPass')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr><th scope="row">{coPol}</th><td>{site.measurements.vv?.before ?? '—'}</td><td>{site.measurements.vv?.after ?? '—'}</td></tr>
                              <tr><th scope="row">{crossPol}</th><td>{site.measurements.vh?.before ?? '—'}</td><td>{site.measurements.vh?.after ?? '—'}</td></tr>
                              <tr><th scope="row">{crossLabel}</th><td>{site.measurements.crossPol.before ?? '—'}</td><td>{site.measurements.crossPol.after ?? '—'}</td></tr>
                            </tbody>
                          </HTMLTable>
                          <p className="micro" style={{ margin: '6px 0 0' }}>{t('sites.crossDbNote', { coPol, crossPol })}</p>
                          </>
                        ) : null}
                      </Panel>

                      <Panel title={t('sites.contrastTitle')} bodyClassName="card-pad">
                        <p className="body-copy-muted" style={{ marginBottom: 8 }}>{t('sites.contrastSubtitle')}</p>
                        <HTMLTable bordered striped compact className="is-full-width">
                          <thead>
                            <tr>
                              <th>{t('sites.comparison.label')}</th>
                              {sites.map((item) => (
                                <th key={item.id}>{L(item.name)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {contrastRows.map((row) => (
                              <tr key={row.id}>
                                <th scope="row">{L(row.label)}</th>
                                {sites.map((item) => (
                                  <td key={item.id}>
                                    {row.values?.[item.id] ? L(row.values[item.id]) : '—'}
                                  </td>
                                ))}
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
                    <p className="body-copy-muted" style={{ margin: 0 }}>
                      {source === 'api' && !site.degraded ? L(site.researcher.acquisition) : t('sites.acquisitionFallback')}
                    </p>
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
                  <p className="micro" style={{ margin: 0 }}>
                    {source === 'api' && provenance && !site.degraded
                      ? t('sites.dbNote', { cards: cardsText, numbers: numbersText })
                      : t('sites.dbNoteFallback')}
                  </p>
                </div>
              </div>
          </Disclosure>
        </div>
    </FacetShell>
  );
}
