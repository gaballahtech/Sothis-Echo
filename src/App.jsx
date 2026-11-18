import { useEffect } from 'react';
import { OverlaysProvider } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SiteDataProvider, useSiteData } from './context/SiteDataContext';
import { TourProvider } from './context/TourContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import Mission from './components/Mission';
import SeeThrough from './components/SeeThrough';
import StudyAreas from './components/StudyAreas';
import AtlasSection from './components/AtlasSection';
import Lenses from './components/Lenses';
import ExplainPanel from './components/ExplainPanel';
import RapidResponse from './components/RapidResponse';
import Sonification from './components/Sonification';
import Recovery from './components/Recovery';
import Detective from './components/Detective';
import Method from './components/Method';
import Team from './components/Team';
import Footer from './components/Footer';
import GuidedTour from './components/GuidedTour';
import './index.css';

function AppContent() {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { source, loading } = useSiteData();

  useEffect(() => {
    document.title = `${t('footer.brand')} · ${t('app.tagline')}`;
  }, [language, t]);

  return (
    <div className={`${isDark ? 'bp6-dark' : 'bp6-light'} app-shell`}>
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <Navbar />
      {!loading && source !== 'api' ? (
        <div className="demo-banner" role="status">
          {t('common.demoBanner')}
        </div>
      ) : null}
      <div className="app-frame">
        <Sidebar />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <Hero />
          <Mission />
          <SeeThrough />
          <StudyAreas />
          <AtlasSection />
          <Lenses />
          <ExplainPanel />
          <RapidResponse />
          <Sonification />
          <Recovery />
          <Detective />
          <Method />
          <Team />
        </main>
      </div>
      <Footer />
      <GuidedTour />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <TourProvider>
          <SiteDataProvider>
            <OverlaysProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </OverlaysProvider>
          </SiteDataProvider>
        </TourProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
