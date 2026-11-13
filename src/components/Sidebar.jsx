import { useTranslation } from 'react-i18next';
import { useActiveSection } from '../utils/useActiveSection';
import { NAV_ITEMS } from '../data/navigation';
import { NavigationMenu } from './NavigationMenu';

export default function Sidebar() {
  const { t } = useTranslation();
  const active = useActiveSection(NAV_ITEMS.map((item) => item.id));

  return (
    <aside className="app-rail" aria-label={t('navbar.menu')}>
      <NavigationMenu activeId={active} compact />
    </aside>
  );
}
