import { AnchorButton } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { Panel, SectionHead } from './ui';

const teamMembers = [
  {
    name: 'Abdelrahman Gaballah',
    handle: 'gaballahtech',
    roleKey: 'frontendLead',
    icon: 'code',
    links: [
      { icon: 'globe-network', href: 'https://gaballahtech.vercel.app', labelKey: 'portfolio' },
      { icon: 'code', href: 'https://github.com/gaballahtech', labelKey: 'github' },
    ],
  },
  {
    name: 'Mohamed Khider',
    handle: 'mohamed50mostafa',
    roleKey: 'backendDev',
    icon: 'database',
    links: [
      { icon: 'globe-network', href: 'https://mohamed50mostafa.github.io/-mohamed50mostafa.github.io/', labelKey: 'portfolio' },
      { icon: 'code', href: 'https://github.com/mohamed50mostafa', labelKey: 'github' },
    ],
  },
  {
    name: 'Jana Ayman',
    handle: 'jana-ayman',
    roleKey: 'researcher',
    icon: 'book',
    links: [
      { icon: 'briefcase', href: 'https://www.linkedin.com/in/jana-ayman-9ab862389/', labelKey: 'linkedin' },
    ],
  },
  {
    name: 'Ahd Fayez',
    handle: 'ahd-fayez',
    roleKey: 'designer',
    icon: 'style',
    links: [
      { icon: 'briefcase', href: 'https://www.linkedin.com/in/ahd-fayez-2049a0363/', labelKey: 'linkedin' },
    ],
  },
  {
    name: 'Nouran Ahmed',
    handle: 'nouran-ahmed',
    roleKey: 'researcher',
    icon: 'book',
    links: [
      { icon: 'briefcase', href: 'https://www.linkedin.com/in/noran-ahmed-a05162373?utm_source=share_via&utm_content=profile&utm_medium=member_android', labelKey: 'linkedin' },
    ],
  },
  {
    name: 'Mariam Emad',
    handle: 'mariam-emad',
    roleKey: 'designer',
    icon: 'style',
    links: [],
  },
];

export default function Team() {
  const { t } = useTranslation();

  return (
    <section id="team" className="content-section chapter chapter--gold" aria-labelledby="team-title">
      <div className="section-inner" style={{ maxWidth: 980 }}>
        <SectionHead title={t('team.title')} subtitle={t('team.subtitle')} id="team-title" />

        <div className="grid-2">
          {teamMembers.map((member) => (
            <Panel
              key={member.handle}
              title={t(`team.roles.${member.roleKey}`)}
              className="team-card"
              bodyClassName="card-pad"
            >
              <div className="team-name">{member.name}</div>
              <div className="team-handle" dir="ltr">@{member.handle}</div>

              <div className="row" style={{ marginTop: 12 }}>
                {member.links.map((link) => (
                  <AnchorButton
                    key={link.href}
                    variant="outlined"
                    small
                    text={t(`team.links.${link.labelKey}`)}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t(`team.links.${link.labelKey}`)} — ${member.name}`}
                  />
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}
