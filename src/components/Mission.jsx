import { Icon, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { Disclosure, Meter, Panel, SectionHead } from './ui';

const CARDS = [
  { key: 'radar', icon: 'cloud' },
  { key: 'bands', icon: 'layers' },
  { key: 'heartbeat', icon: 'history' },
  { key: 'open', icon: 'globe-network' },
];

const FACT_KEYS = ['launch', 'orbit', 'repeat', 'bands', 'swath', 'resolution', 'baseline'];

const MEASURES = [
  { key: 'canopy', icon: 'tree' },
  { key: 'moisture', icon: 'waves' },
  { key: 'flood', icon: 'cloud' },
  { key: 'fire', icon: 'flame' },
  { key: 'motion', icon: 'changes' },
  { key: 'ice', icon: 'temperature' },
];

const TIMELINE = ['launch', 'commission', 'ops', 'mission'];

export default function Mission() {
  const { t } = useTranslation();

  return (
    <section id="mission" className="content-section chapter chapter--sky" aria-labelledby="mission-title">
      <div className="section-inner">
        <SectionHead kicker={t('mission.kicker')} title={t('mission.title')} subtitle={t('mission.subtitle')} id="mission-title" />

        <div className="stack">
          <div className="callout-row">
            <Icon icon="info-sign" size={16} style={{ color: 'var(--bp-intent-primary-rest)', flex: '0 0 auto' }} aria-hidden="true" />
            <p className="body-copy" style={{ margin: 0 }}>{t('mission.lead')}</p>
          </div>

          <div className="grid-2">
            {CARDS.map((card, index) => (
              <Panel key={card.key} title={t(`mission.cards.${card.key}.title`)} icon={card.icon} status={`0${index + 1}`} bodyClassName="card-pad">
                <p className="body-copy-muted" style={{ margin: 0 }}>{t(`mission.cards.${card.key}.body`)}</p>
              </Panel>
            ))}
          </div>

          <div>
            <div className="row" style={{ marginBottom: 8 }}>
              <Icon icon="satellite" size={14} style={{ color: 'var(--bp-intent-primary-rest)' }} aria-hidden="true" />
              <span className="micro">{t('mission.measures.title')}</span>
            </div>
            <div className="row">
              {MEASURES.map((measure) => (
                <Tag key={measure.key} minimal icon={measure.icon}>
                  {t(`mission.measures.${measure.key}`)}
                </Tag>
              ))}
            </div>
          </div>
        </div>

        <Disclosure
          title={t('mission.detailsTitle')}
          subtitle={t('mission.detailsSubtitle')}
          icon="properties"
          className="mission-details"
          testId="mission-details"
        >
          <div className="split-even">
            <div>
              <h4 className="micro">{t('mission.facts.title')}</h4>
              <div className="mission-launch">
                <div>
                  <div className="stat-label">{t('mission.facts.launch')}</div>
                  <div className="stat-value" style={{ fontSize: 20 }}>30.07.2025</div>
                </div>
                <div className="micro" style={{ textAlign: 'end' }}>
                  GSLV-F16
                  <br />
                  SDSC-SHAR
                </div>
              </div>

              <dl className="telemetry-list">
                {FACT_KEYS.map((key) => (
                  <div className="telemetry-row" key={key}>
                    <dt>{t(`mission.facts.${key}`)}</dt>
                    <dd>{t(`mission.facts.${key}Value`)}</dd>
                  </div>
                ))}
              </dl>

              <div style={{ marginTop: 12 }}>
                <div className="row-between" style={{ marginBottom: 4 }}>
                  <span className="micro">L-BAND COVERAGE</span>
                  <span className="micro" style={{ color: 'var(--bp-intent-success-rest)' }}>GLOBAL</span>
                </div>
                <Meter value={0.97} label="L-band coverage" />
              </div>
            </div>

            <div>
              <h4 className="micro">{t('mission.timeline.title')}</h4>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none' }} className="stack">
                {TIMELINE.map((key, index) => (
                  <li key={key} className="row" style={{ alignItems: 'flex-start', gap: 9 }}>
                    <span className="numeric micro" style={{ flex: '0 0 24px', color: index === 0 ? 'var(--bp-intent-primary-rest)' : undefined }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="body-copy-muted" style={{ margin: 0 }}>{t(`mission.timeline.${key}`)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <p className="micro mission-source" style={{ margin: 0 }}>{t('mission.sourceNote')}</p>
        </Disclosure>
      </div>
    </section>
  );
}
