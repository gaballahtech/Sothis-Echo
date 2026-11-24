import { Card, Icon, ProgressBar, Section, SectionCard, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';

/** Blueprint brand mark: restrained, token-coloured, no glow. */
export function RadarMark({ size = 24, className = '' }) {
  return <Icon icon="globe-network" size={size} className={className} aria-hidden="true" />;
}

/**
 * Bounded panel built on Blueprint Card. Keeps the compact header the old
 * Window had, but every surface, border and label now comes from Blueprint.
 */
export function Panel({
  title,
  status,
  tone = 'default',
  children,
  className = '',
  bodyClassName = '',
}) {
  const statusIntent = tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : tone === 'primary' ? 'primary' : 'none';
  return (
    <Card className={`app-panel ${className}`} elevation={1}>
      {title ? (
        <div className="panel-head">
          <span className="panel-title">{title}</span>
          {status ? (
            typeof status === 'string' ? (
              <Tag minimal intent={statusIntent} className="panel-status">
                {status}
              </Tag>
            ) : (
              status
            )
          ) : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}

/** Accordion-style disclosure built on Blueprint's collapsible Section. */
export function Disclosure({
  title,
  subtitle,
  children,
  className = '',
  testId,
  defaultOpen = false,
}) {
  return (
    <Section
      className={`app-panel app-disclosure ${className}`}
      collapsible
      collapseProps={{ defaultIsOpen: defaultOpen, transitionDuration: 800 }}
      elevation={1}
      title={title}
      subtitle={subtitle}
      data-testid={testId}
    >
      <SectionCard padded={false} className="card-pad">
        {children}
      </SectionCard>
    </Section>
  );
}

export function SourceBadge({ source, error, loading = false, className = '' }) {
  const { t } = useTranslation();
  const live = source === 'api';
  return (
    <Tag
      className={className}
      minimal
      intent={loading ? 'none' : live ? 'success' : error ? 'warning' : 'none'}
      title={error || undefined}
    >
      {loading ? '…' : live ? t('common.live') : t('common.local')}
    </Tag>
  );
}

export function Meter({ value = 0, intent = 'primary', className = '', label }) {
  const normalised = Math.max(0, Math.min(1, Number(value) || 0));
  return (
    <ProgressBar
      value={normalised}
      intent={intent}
      stripes={false}
      animate={false}
      className={`app-meter ${className}`}
      aria-label={label}
    />
  );
}

export function SectionHead({ title, subtitle, id }) {
  return (
    <header className="section-head">
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </header>
  );
}

/**
 * Section wrapper that can render either as a full landing-page <section>
 * (with the standard `.section-inner` gutter) or, when `embedded`, as a bare
 * `.casefile-facet` block used inside the full-screen case-file / compare
 * panes. This lets the same per-site component power both the landing page and
 * the case file without duplicating its content.
 */
export function FacetShell({ embedded = false, id, className = '', labelledBy, children }) {
  if (embedded) {
    return <div className="casefile-facet">{children}</div>;
  }
  return (
    <section id={id} className={className} aria-labelledby={labelledBy}>
      <div className="section-inner">{children}</div>
    </section>
  );
}
