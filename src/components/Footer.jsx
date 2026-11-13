import { Icon } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { RadarMark } from './ui';

const GITHUB = 'https://github.com/gaballahtech/aura-sar-frontend';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('footer.columns.resources'),
      links: [
        { label: t('footer.resourceLinks.nisar'), href: 'https://nisar.jpl.nasa.gov/', external: true },
        { label: t('footer.resourceLinks.handbook'), href: 'https://dataverse.jpl.nasa.gov/api/access/datafile/97405?gbrecs=true', external: true },
        { label: t('footer.resourceLinks.asf'), href: 'https://asf.alaska.edu/', external: true },
        { label: t('footer.resourceLinks.bhoonidhi'), href: 'https://bhoonidhi.nrsc.gov.in/NISAR/NisarProducts.html', external: true },
        { label: t('footer.resourceLinks.spaceApps'), href: 'https://www.spaceappschallenge.org/', external: true },
      ],
    },
    {
      title: t('footer.columns.community'),
      links: [
        { label: t('footer.communityLinks.github'), href: GITHUB, external: true },
        { label: t('footer.communityLinks.issues'), href: `${GITHUB}/issues`, external: true },
        { label: t('footer.communityLinks.contribute'), href: `${GITHUB}/pulls`, external: true },
      ],
    },
  ];

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-grid">
        <div>
          <a
            href="#home"
            className="brand-link"
            style={{ marginBottom: 8 }}
            aria-label={t('footer.brand')}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById('home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <RadarMark size={22} />
            <span className="brand-copy">
              <span className="brand-name">{t('footer.brand')}</span>
            </span>
          </a>
          <p className="body-copy-muted" style={{ maxWidth: 330, margin: 0 }}>{t('footer.tagline')}</p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h4 className="footer-title">{column.title}</h4>
            <ul className="footer-links">
              {column.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    onClick={(event) => {
                      if (!link.external) {
                        event.preventDefault();
                        document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="row">
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="ref-link">
            <Icon icon="code" size={13} aria-hidden="true" />
            GitHub
          </a>
          <a href="https://www.spaceappschallenge.org/" target="_blank" rel="noopener noreferrer" className="ref-link">
            <Icon icon="globe-network" size={13} aria-hidden="true" />
            {t('footer.challenge')}
          </a>
        </div>

        <div className="micro" style={{ maxWidth: 660, textAlign: 'end' }}>
          <p style={{ margin: 0 }}>{t('footer.disclosure')} · {t('footer.copyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
