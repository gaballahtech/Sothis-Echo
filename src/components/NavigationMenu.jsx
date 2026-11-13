import { Menu, MenuDivider, MenuItem, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useTour } from '../context/TourContext';
import { NAV_ITEMS } from '../data/navigation';

export function NavigationMenu({ activeId, onNavigate, compact = false }) {
  const { t } = useTranslation();
  const { startTour } = useTour();

  const go = (id) => {
    onNavigate?.(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <Menu className="nav-menu" large={!compact}>
      {NAV_ITEMS.map((item) => (
        <MenuItem
          key={item.id}
          icon={item.icon}
          text={t(item.key)}
          active={activeId === item.id}
          onClick={() => go(item.id)}
        />
      ))}
      <MenuDivider />
      <MenuItem
        icon="help"
        text={t('tour.help')}
        onClick={() => {
          onNavigate?.();
          startTour();
        }}
      />
      <div className="rail-meta">
        <Tag minimal icon="satellite">
          NISAR · NASA / ISRO
        </Tag>
        <Tag minimal icon="tick">
          {t('hero.panel.statusLocal')}
        </Tag>
      </div>
    </Menu>
  );
}
