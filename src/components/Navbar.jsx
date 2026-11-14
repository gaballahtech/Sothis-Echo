import { useState } from 'react';
import {
  Alignment,
  Button,
  Drawer,
  Icon,
  Navbar as BpNavbar,
  NavbarGroup,
  NavbarHeading,
  Position,
} from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useActiveSection } from '../utils/useActiveSection';
import { NAV_ITEMS } from '../data/navigation';
import { NavigationMenu } from './NavigationMenu';

export default function Navbar() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(NAV_ITEMS.map((item) => item.id));

  return (
    <>
      <BpNavbar className="app-navbar" aria-label={t('navbar.brand')}>
        <NavbarGroup align={Alignment.START} className="navbar-start">
          <Button
            className="mobile-only"
            variant="minimal"
            icon="menu"
            aria-label={t('navbar.menu')}
            onClick={() => setMenuOpen(true)}
          />
          <a
            href="#home"
            className="brand-link"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById('home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span className="brand-mark">
              <Icon icon="globe-network" size={22} aria-hidden="true" />
            </span>
            <NavbarHeading className="brand-copy">
              <span className="brand-name">{t('navbar.brand')}</span>
            </NavbarHeading>
          </a>
        </NavbarGroup>

        <NavbarGroup align={Alignment.END} className="navbar-end">
          <Button
            className="language-toggle"
            variant="outlined"
            small
            onClick={toggleLanguage}
            aria-label={t('navbar.switchLanguage')}
            text={language === 'en' ? 'العربية' : 'English'}
          />
        </NavbarGroup>
      </BpNavbar>

      <Drawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('navbar.brand')}
        position={language === 'ar' ? Position.RIGHT : Position.LEFT}
        size={300}
        className="app-drawer"
      >
        <div className="app-drawer-body">
          <NavigationMenu activeId={active} onNavigate={() => setMenuOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}
