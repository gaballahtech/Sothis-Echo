import { useTranslation } from 'react-i18next';
import { useActiveSection } from '../utils/useActiveSection';
import { NAV_ITEMS } from '../data/navigation';
import { NavigationMenu } from './NavigationMenu';

export default function Sidebar() {
  const { t } = useTranslation();
  const active = useActiveSection(NAV_ITEMS.map((item) => item.id));

  return (
    <aside className="app-rail" aria-label={t('navbar.menu')}>
      <div className="rail-kicker">{t('common.site')} / NISAR</div>
      <NavigationMenu activeId={active} compact />
      <div className="rail-foot">
        <span className="rail-foot-label">{t('footer.brand')}</span>
        <span className="rail-foot-meta">{t('footer.copyright', { year: new Date().getFullYear() })}</span>
      </div>
    </aside>
  );
}
