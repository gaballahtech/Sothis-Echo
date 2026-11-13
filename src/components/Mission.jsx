import { useTranslation } from 'react-i18next';
import { Disclosure, SectionHead } from './ui';

const CARDS = ['radar', 'bands', 'heartbeat', 'open'];

const FACT_KEYS = ['launch', 'orbit', 'repeat', 'bands', 'swath', 'resolution', 'baseline'];

const TIMELINE = ['launch', 'commission', 'ops', 'mission'];

export default function Mission() {
  const { t } = useTranslation();

  return (
    <section id="mission" className="content-section chapter chapter--sky" aria-labelledby="mission-title">
      <div className="section-inner">
        <SectionHead title={t('mission.title')} subtitle={t('mission.subtitle')} id="mission-title" />

        <div className="stack">
          <p className="body-copy lead-copy" style={{ margin: 0 }}>{t('mission.lead')}</p>

          <div className="feature-grid">
            {CARDS.map((key, index) => (
              <article className="feature" key={key}>
                <span className="feature-index">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="feature-title">{t(`mission.cards.${key}.title`)}</h3>
                <p className="body-copy-muted" style={{ margin: 0 }}>{t(`mission.cards.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </div>

        <Disclosure
          title={t('mission.detailsTitle')}
          subtitle={t('mission.detailsSubtitle')}
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
