import { Button, Callout, Icon, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useSiteData } from '../context/SiteDataContext';
import { buildSiteCsv } from '../services/sarApi';
import { Disclosure, Meter, SectionHead, SourceBadge } from './ui';

const ENDPOINTS = [
  'GET  /study-areas',
  'GET  /study-areas/:id',
  'GET  /sites/:id/series?start=&end=',
  'GET  /sites/:id/recovery?threshold=80',
  'GET  /sonification/:id',
  'GET  /nisar/status',
];

const REFERENCES = [
  { label: 'NASA NISAR — Quick Facts', href: 'https://nisar.jpl.nasa.gov/mission/quick-facts' },
  { label: 'NISAR Science Users’ Handbook (2nd ed., 2025)', href: 'https://dataverse.jpl.nasa.gov/api/access/datafile/97405?gbrecs=true' },
  { label: 'NASA Earthdata — ASF DAAC', href: 'https://asf.alaska.edu/' },
  { label: 'ISRO Bhoonidhi — NISAR products', href: 'https://bhoonidhi.nrsc.gov.in/NISAR/NisarProducts.html' },
  { label: 'NASA Space Apps Challenge', href: 'https://www.spaceappschallenge.org/' },
];

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Method() {
  const { t } = useTranslation();
  const { sites, source, error, api, refresh, loading } = useSiteData();

  const downloadJson = () => {
    download(
      'dancing-with-sar-dataset.json',
      JSON.stringify(
        {
          datasetVersion: api.version,
          generatedAt: new Date().toISOString(),
          mission: 'NISAR — NASA / ISRO',
          disclosure: 'Illustrative dataset. Scene pixels and numeric values are not official NISAR products.',
          sites,
        },
        null,
        2
      ),
      'application/json'
    );
  };

  const downloadCsv = () => {
    download('dancing-with-sar-series.csv', sites.map(buildSiteCsv).join('\n\n'), 'text/csv;charset=utf-8');
  };

  return (
    <section id="data" className="content-section chapter chapter--mint" aria-labelledby="data-title">
      <div className="section-inner">
        <SectionHead kicker={t('method.kicker')} title={t('method.title')} subtitle={t('method.subtitle')} id="data-title" />

        <div className="grid-3 method-callouts">
          <Callout className="method-callout" compact intent="success" icon="tick" title={t('method.realTitle')}>
            <p style={{ margin: 0 }}>{t('method.realBody')}</p>
          </Callout>
          <Callout className="method-callout" compact intent="warning" icon="search" title={t('method.simulatedTitle')}>
            <p style={{ margin: 0 }}>{t('method.simulatedBody')}</p>
          </Callout>
          <Callout className="method-callout" compact intent="primary" icon="database" title={t('method.backendTitle')}>
            <p style={{ margin: 0 }}>{t('method.backendBody')}</p>
          </Callout>
        </div>

        <Disclosure
          title={t('method.docsTitle')}
          subtitle={t('method.docsSubtitle')}
          icon="code"
          className="docs-disclosure"
          testId="developer-docs"
        >
          <div className="docs-grid">
            <div className="stack">
              <div>
                <h4 className="micro">{t('method.statusLabel')}</h4>
                <dl className="telemetry-list">
                  <div className="telemetry-row">
                    <dt>{t('method.statusLabel')}</dt>
                    <dd><SourceBadge source={source} error={error} /></dd>
                  </div>
                  <div className="telemetry-row">
                    <dt>API BASE</dt>
                    <dd style={{ maxWidth: '62%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{api.base || '—'}</dd>
                  </div>
                  <div className="telemetry-row">
                    <dt>{t('method.versionLabel')}</dt>
                    <dd>{api.version}</dd>
                  </div>
                  <div className="telemetry-row">
                    <dt>POLICY</dt>
                    <dd>{api.configured ? 'BACKEND FIRST' : 'ZERO REQUESTS'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <div className="row-between" style={{ marginBottom: 4 }}>
                  <span className="micro">SCENE LABELLING</span>
                  <span className="micro" style={{ color: 'var(--bp-intent-success-rest)' }}>100%</span>
                </div>
                <Meter value={1} intent="success" label="Scene labelling" />
                <p className="micro" style={{ marginTop: 9, marginBottom: 0 }}>
                  {api.configured ? t('method.liveNote') : t('method.noBackend')}
                </p>
              </div>

              {api.configured && error ? (
                <Button
                  variant="outlined"
                  small
                  icon="refresh"
                  text={loading ? t('common.loading') : t('common.retry')}
                  onClick={refresh}
                  disabled={loading}
                />
              ) : null}

              <div className="row">
                <Button variant="outlined" small icon="code" text={t('method.downloadJson')} onClick={downloadJson} />
                <Button variant="outlined" small icon="th" text={t('method.downloadCsv')} onClick={downloadCsv} />
              </div>
            </div>

            <div className="stack">
              <div>
                <h4 className="micro">{t('method.limitsTitle')}</h4>
                <ol className="small docs-list">
                  {[t('method.limits1'), t('method.limits2'), t('method.limits3')].map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="micro">{t('method.endpointsLabel')}</h4>
                <div className="endpoint-block">
                  <pre dir="ltr">{ENDPOINTS.join('\n')}</pre>
                  <p className="micro" style={{ margin: '6px 0 0' }} dir="ltr">{`{ "data": <payload>, "success": true }`}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="docs-refs">
            <h4 className="micro">{t('method.refsTitle')}</h4>
            <ul className="refs-list">
              {REFERENCES.map((reference) => (
                <li key={reference.href}>
                  <a href={reference.href} target="_blank" rel="noopener noreferrer" className="ref-link">
                    <Icon icon="share" size={12} style={{ marginTop: 2, flex: '0 0 auto' }} aria-hidden="true" />
                    <span>{reference.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Disclosure>

        <Callout className="method-disclosure-callout" intent="primary" icon="info-sign" style={{ marginTop: 14 }}>
          <div className="row-between">
            <p className="micro" style={{ margin: 0, maxWidth: 820 }}>{t('method.disclosure')}</p>
            <Tag minimal intent="primary" icon="download">OPEN SOURCE · EDUCATIONAL</Tag>
          </div>
        </Callout>
      </div>
    </section>
  );
}
