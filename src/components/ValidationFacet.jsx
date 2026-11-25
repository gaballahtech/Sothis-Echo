import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { localized } from '../data/localized';
import { FacetShell, Panel } from './ui';

/**
 * Judge-facing validation: study-window geometry, cross-validation (NISAR L-band
 * vs Sentinel-1 C-band), and the exact data sources. Uses only real site data.
 */
export default function ValidationFacet({ site, embedded = true }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const L = (x) => (x ? localized(x, language) : '');
  const sources = site?.researcher?.sources || [];
  const acq = site?.researcher?.acquisition;

  return (
    <FacetShell embedded={embedded} id="validation" className="content-section chapter" labelledBy="validation-title">
      <h3 id="validation-title" style={{ margin: 0 }}>{t('validation.title')}</h3>
      <p className="body-copy-muted" style={{ margin: '6px 0 0', maxWidth: 720 }}>{t('validation.subtitle')}</p>

      <div className="stack" style={{ gap: 12, marginTop: 12 }}>
        <Panel title={t('validation.window')} bodyClassName="card-pad">
          <p className="body-copy-muted" style={{ margin: 0 }}>{t('validation.windowBody', { site: L(site?.name) })}</p>
          {site?.wkt ? <p className="micro" dir="ltr" style={{ marginTop: 6 }}>{site.wkt}</p> : null}
          {acq ? <p className="body-copy-muted" style={{ marginTop: 6 }}>{L(acq)}</p> : null}
        </Panel>

        <Panel title={t('validation.cross')} bodyClassName="card-pad">
          <p className="body-copy-muted" style={{ margin: 0 }}>{t('validation.crossBody')}</p>
        </Panel>

        {sources.length ? (
          <Panel title={t('validation.sources')} bodyClassName="card-pad">
            <ul className="body-copy-muted" style={{ margin: 0, paddingInlineStart: 18 }}>
              {sources.map((s, i) => (
                <li key={i}>{L(s)}</li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </FacetShell>
  );
}