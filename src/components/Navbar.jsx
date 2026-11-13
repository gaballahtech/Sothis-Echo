import { useState } from 'react';
import {
  Alignment,
  Button,
  ButtonGroup,
  Drawer,
  Icon,
  Navbar as BpNavbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Position,
  Tag,
  Tooltip,
} from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useSiteData } from '../context/SiteDataContext';
import { useTour } from '../context/TourContext';
import { useActiveSection } from '../utils/useActiveSection';
import { NAV_ITEMS } from '../data/navigation';
import { NavigationMenu } from './NavigationMenu';
import { SourceBadge } from './ui';

export default function Navbar() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { mode, toggleMode, isResearcher } = useMode();
  const { source, error } = useSiteData();
  const { startTour } = useTour();
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
              <span className="brand-sub">NISAR · NASA / ISRO</span>
            </NavbarHeading>
          </a>
          <NavbarDivider />
          <Tag minimal icon="satellite" className="desktop-only">
            NISAR · NASA / ISRO
          </Tag>
          <SourceBadge source={source} error={error} className="desktop-only" />
        </NavbarGroup>

        <NavbarGroup align={Alignment.END} className="navbar-end">
          <Button
            className="desktop-only"
            variant="minimal"
            icon="search"
            text={t('navbar.data')}
            onClick={() => document.getElementById('data')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
          <Tooltip
            content={isResearcher ? t('navbar.switchToPublic') : t('navbar.switchToResearcher')}
            placement="bottom"
          >
            <Button
              variant="outlined"
              icon={isResearcher ? 'eye-open' : 'eye-off'}
              text={isResearcher ? t('navbar.researcher') : t('navbar.public')}
              onClick={toggleMode}
              aria-pressed={isResearcher}
              data-testid="mode-toggle"
              aria-label={isResearcher ? t('navbar.switchToPublic') : t('navbar.switchToResearcher')}
              title={isResearcher ? t('navbar.switchToPublic') : t('navbar.switchToResearcher')}
            />
          </Tooltip>
          <ButtonGroup className="language-group">
            <Button
              small
              variant={language === 'en' ? 'solid' : 'minimal'}
              active={language === 'en'}
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              aria-label="English"
              text="EN"
            />
            <Button
              small
              variant={language === 'ar' ? 'solid' : 'minimal'}
              active={language === 'ar'}
              onClick={() => setLanguage('ar')}
              aria-pressed={language === 'ar'}
              aria-label="العربية"
              text="AR"
            />
          </ButtonGroup>
          <Button
            className="desktop-only"
            variant="minimal"
            icon="help"
            aria-label={t('tour.help')}
            title={t('tour.help')}
            onClick={startTour}
          />
        </NavbarGroup>
      </BpNavbar>

      <Drawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('navbar.brand')}
        icon="menu"
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
