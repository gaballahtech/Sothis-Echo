import { Icon, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { CompareSlider } from './SceneCanvas';
import { Panel, SectionHead } from './ui';

const LEGEND = [
  { key: 'legendWater', swatch: 'var(--bp-palette-gray-1)' },
  { key: 'legendCanopy', swatch: 'var(--bp-palette-gray-3)' },
  { key: 'legendTrunk', swatch: 'var(--bp-palette-light-gray-2)' },
];

export default function SeeThrough() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites } = useSiteData();
  const site = sites.find((item) => item.id === 'sundarbans') ?? sites[0];
  const state = site?.states?.after;

  if (!site || !state) return null;

  const siteName = localized(site.name, language);
  const stateLabel = localized(state.label, language);

  return (
    <section id="see-through" className="content-section chapter chapter--teal" aria-labelledby="see-through-title">
      <div className="section-inner">
        <SectionHead
          kicker={t('seeThrough.kicker')}
          title={t('seeThrough.title')}
          subtitle={t('seeThrough.subtitle')}
          id="see-through-title"
        />

        <div className="split-main">
          <Panel
            title={`${siteName} · ${state.date} · ${stateLabel}`}
            icon="layers"
            status={<Tag minimal intent="warning">{t('seeThrough.simulated')}</Tag>}
            bodyClassName="card-pad"
          >
            <CompareSlider
              site={site}
              params={state.params}
              opticalAlt={`${siteName} — ${t('seeThrough.optical')}`}
              radarAlt={`${siteName} — ${t('seeThrough.radar')}`}
              opticalLabel={t('seeThrough.optical')}
              radarLabel={t('seeThrough.radar')}
              simulatedLabel={t('seeThrough.simulated')}
            />

            <div className="info-list" style={{ marginTop: 12, border: '1px solid var(--bp-surface-border-color-default)', borderRadius: 'var(--bp-surface-border-radius)' }}>
              <div className="info-block">
                <h4>{t('seeThrough.optical')}</h4>
                <p className="body-copy-muted" style={{ margin: 0 }}>{t('seeThrough.opticalCaption')}</p>
              </div>
              <div className="info-block">
                <h4>{t('seeThrough.radar')}</h4>
                <p className="body-copy" style={{ margin: 0 }}>{t('seeThrough.radarCaption')}</p>
              </div>
            </div>

            <div className="row-between" style={{ marginTop: 10 }}>
              <Tag minimal intent="primary" icon="satellite">L-BAND · 24 CM</Tag>
              <span className="micro">DAY / NIGHT · ALL-WEATHER</span>
            </div>
          </Panel>

          <div className="stack">
            <Panel title={t('seeThrough.calloutTitle')} icon="info-sign" bodyClassName="card-pad">
              <p className="body-copy-muted" style={{ margin: 0 }}>{t('seeThrough.calloutBody')}</p>
            </Panel>

            <Panel title={t('seeThrough.legendTitle')} icon="list" bodyClassName="card-pad">
              <div className="stack" style={{ gap: 8 }}>
                {LEGEND.map((item) => (
                  <div key={item.key} className="row" style={{ flexWrap: 'nowrap' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 34,
                        height: 18,
                        flex: '0 0 34px',
                        background: item.swatch,
                        border: '1px solid var(--bp-surface-border-color-strong)',
                        borderRadius: 2,
                      }}
                    />
                    <span className="small">{t(`seeThrough.${item.key}`)}</span>
                  </div>
                ))}
                <div className="callout-row" style={{ marginTop: 4 }}>
                  <Icon icon="layers" size={14} style={{ color: 'var(--bp-intent-primary-rest)' }} aria-hidden="true" />
                  <span className="micro">{t('seeThrough.legendNote')}</span>
                </div>
              </div>
            </Panel>

            <div className="callout-row">
              <Icon icon="warning-sign" size={14} style={{ color: 'var(--bp-intent-warning-rest)', flex: '0 0 auto' }} aria-hidden="true" />
              <p className="micro" style={{ margin: 0 }}>{t('seeThrough.note')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
