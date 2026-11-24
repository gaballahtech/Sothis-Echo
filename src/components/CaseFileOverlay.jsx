import { useMemo } from 'react';
import { Button, ButtonGroup, Dialog, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useCaseFile, CASE_SECTIONS } from '../context/CaseFileContext';
import { localized } from '../data/localized';
import StudyAreas from './StudyAreas';
import Lenses from './Lenses';
import Recovery from './Recovery';
import TimeSeries from './TimeSeries';
import RapidResponse from './RapidResponse';
import Sonification from './Sonification';
import SeeThrough from './SeeThrough';
import ExplainPanel from './ExplainPanel';

/** Render the facet for a given section id, scoped to one site. */
function Facet({ section, site }) {
  switch (section) {
    case 'lenses':
      return <Lenses embedded siteId={site.id} />;
    case 'recovery':
      return <Recovery embedded siteId={site.id} />;
    case 'timeseries':
      return <TimeSeries embedded siteId={site.id} />;
    case 'respond':
      return <RapidResponse embedded siteId={site.id} />;
    case 'sound':
      return <Sonification embedded siteId={site.id} />;
    case 'see':
      return <SeeThrough embedded siteId={site.id} />;
    case 'explain':
      return <ExplainPanel embedded siteId={site.id} />;
    case 'overview':
    default:
      return <StudyAreas embedded siteId={site.id} />;
  }
}

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const fmtDb = (value) => {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;
};

/** Compact vitals strip for a site: ΔHH, ΔHV and the cross-pol gap. */
function Vitals({ site }) {
  const { t } = useTranslation();
  const m = site?.measurements || {};
  const hhBefore = num(m.vv?.before);
  const hhAfter = num(m.vv?.after);
  const hvBefore = num(m.vh?.before);
  const hvAfter = num(m.vh?.after);
  const dHH = hhBefore != null && hhAfter != null ? hhAfter - hhBefore : null;
  const dHV = hvBefore != null && hvAfter != null ? hvAfter - hvBefore : null;
  const crossAfter = num(m.crossPol?.after);
  return (
    <div className="casefile-vitals" dir="ltr">
      <span className="casefile-vital">
        <span className="casefile-vital-label">{t('casefile.deltaHH')}</span>
        <span className="casefile-vital-value">{fmtDb(dHH)}</span>
      </span>
      <span className="casefile-vital">
        <span className="casefile-vital-label">{t('casefile.deltaHV')}</span>
        <span className="casefile-vital-value">{fmtDb(dHV)}</span>
      </span>
      <span className="casefile-vital">
        <span className="casefile-vital-label">{t('casefile.crossPol')}</span>
        <span className="casefile-vital-value">{crossAfter != null ? fmtDb(crossAfter) : '—'}</span>
      </span>
    </div>
  );
}

function Pane({ site, activeSection, language, isCompare }) {
  return (
    <div className="compare-pane">
      {isCompare ? (
        <div className="compare-pane-head">
          <span className="compare-pane-name">{localized(site.name, language)}</span>
          <Vitals site={site} />
        </div>
      ) : null}
      <div className="compare-pane-body">
        <Facet section={activeSection} site={site} />
      </div>
    </div>
  );
}

function Workspace() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const {
    sites,
    openSiteId,
    compareSiteId,
    layout,
    activeSection,
    isComparing,
    setCompare,
    toggleCompare,
    setLayout,
    setActiveSection,
  } = useCaseFile();

  const primary = sites.find((site) => site.id === openSiteId) ?? sites[0];
  const secondary = isComparing ? sites.find((site) => site.id === compareSiteId) ?? null : null;

  const otherSites = useMemo(
    () => sites.filter((site) => site.id !== openSiteId),
    [sites, openSiteId],
  );

  if (!primary) return null;

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="casefile-shell" dir={dir}>
      <aside className="casefile-sidebar">
        <div className="casefile-identity">
          <span className="casefile-kind">{primary.kind ? <Tag minimal>{primary.kind}</Tag> : null}</span>
          <h2 className="casefile-title">{localized(primary.name, language)}</h2>
          <p className="casefile-region">{localized(primary.region, language)}</p>
          {primary.eventDate ? (
            <p className="casefile-date" dir="ltr">{primary.eventDate}</p>
          ) : null}
        </div>

        <nav className="casefile-nav" aria-label={t('casefile.selectSite')}>
          {CASE_SECTIONS.map((section) => {
            const active = section.id === activeSection;
            return (
              <Button
                key={section.id}
                minimal
                alignText="start"
                active={active}
                aria-current={active ? 'page' : undefined}
                text={t(section.key)}
                onClick={() => setActiveSection(section.id)}
                className="casefile-nav-item"
              />
            );
          })}
        </nav>
      </aside>

      <div className="casefile-main">
        <div className="casefile-toolbar">
          <div className="casefile-toolbar-group">
            <Button
              small
              minimal
              icon={isComparing ? 'cross' : 'layers'}
              active={isComparing}
              text={isComparing ? t('casefile.clearCompare') : t('casefile.compare')}
              onClick={toggleCompare}
              data-testid="casefile-compare-toggle"
            />
            {isComparing ? (
              <ButtonGroup minimal className="casefile-layout-toggle">
                <Button
                  active={layout === 'side'}
                  variant={layout === 'side' ? 'solid' : 'outlined'}
                  text={t('casefile.layoutSide')}
                  onClick={() => setLayout('side')}
                  aria-pressed={layout === 'side'}
                />
                <Button
                  active={layout === 'stacked'}
                  variant={layout === 'stacked' ? 'solid' : 'outlined'}
                  text={t('casefile.layoutStacked')}
                  onClick={() => setLayout('stacked')}
                  aria-pressed={layout === 'stacked'}
                />
              </ButtonGroup>
            ) : null}
          </div>

          {isComparing ? (
            <div className="casefile-toolbar-group casefile-compare-picker">
              <span className="casefile-compare-label">{t('casefile.compareWith')}</span>
              <ButtonGroup minimal>
                {otherSites.map((site) => {
                  const active = site.id === compareSiteId;
                  return (
                    <Button
                      key={site.id}
                      active={active}
                      variant={active ? 'solid' : 'outlined'}
                      text={localized(site.name, language)}
                      onClick={() => setCompare(site.id)}
                      aria-pressed={active}
                    />
                  );
                })}
              </ButtonGroup>
            </div>
          ) : null}
        </div>

        {isComparing && secondary ? (
          <div className={`compare-panes compare-panes--${layout}`}>
            <Pane site={primary} activeSection={activeSection} language={language} isCompare />
            <Pane site={secondary} activeSection={activeSection} language={language} isCompare />
          </div>
        ) : (
          <div className="casefile-single">
            <div className="casefile-single-head">
              <span className="casefile-title-sm">{localized(primary.name, language)}</span>
              <Vitals site={primary} />
            </div>
            <div className="casefile-single-body">
              <Facet section={activeSection} site={primary} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseFileOverlay() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, openSiteId, isOpen, close } = useCaseFile();
  const site = sites.find((item) => item.id === openSiteId) ?? sites[0];
  const title = site ? localized(site.name, language) : '';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={close}
      title={title}
      icon="folder-open"
      className="casefile-dialog"
      portalClassName="casefile-dialog-portal"
      canOutsideClick
      canEscapeKeyClose
      aria-label={t('casefile.open')}
    >
      <Workspace />
    </Dialog>
  );
}