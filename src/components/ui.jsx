import { Card, Icon, ProgressBar, Section, SectionCard, Tag } from '@blueprintjs/core';

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

export function SourceBadge({ source, error, className = '' }) {
  const live = source === 'api';
  return (
    <Tag
      className={className}
      minimal
      intent={live ? 'success' : error ? 'warning' : 'none'}
      title={error || undefined}
    >
      {live ? 'LIVE' : 'LOCAL'}
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
