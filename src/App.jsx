import { useEffect } from 'react';
import { OverlaysProvider } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SiteDataProvider, useSiteData } from './context/SiteDataContext';
import { CaseFileProvider } from './context/CaseFileContext';
import { isApiConfigured } from './services/sarApi';
import { TourProvider } from './context/TourContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import DemoVideo from './components/DemoVideo';
import Mission from './components/Mission';
import AtlasSection from './components/AtlasSection';
import CaseFileOverlay from './components/CaseFileOverlay';
import Detective from './components/Detective';
import Method from './components/Method';
import Team from './components/Team';
import Footer from './components/Footer';
import GuidedTour from './components/GuidedTour';
import AIChat from './components/AIChat';
import './index.css';

function AppContent() {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { loading } = useSiteData();

  useEffect(() => {
    document.title = `${t('footer.brand')} · ${t('app.tagline')}`;
  }, [language, t]);

  return (
    <div className={`${isDark ? 'bp6-dark' : 'bp6-light'} app-shell`}>
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <Navbar />
      {!isApiConfigured() && !loading ? (
        <div className="demo-banner" role="status">
          {t('common.demoBanner')}
        </div>
      ) : null}
      <div className="app-frame">
        <Sidebar />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <Hero />
          <DemoVideo />
          <Mission />
          <AtlasSection />
          <Detective />
          <Method />
          <Team />
        </main>
      </div>
      <Footer />
      <GuidedTour />
      <CaseFileOverlay />
      <AIChat />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <TourProvider>
          <SiteDataProvider>
            <CaseFileProvider>
              <OverlaysProvider>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </OverlaysProvider>
            </CaseFileProvider>
          </SiteDataProvider>
        </TourProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
