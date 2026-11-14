import { useEffect } from 'react';
import { OverlaysProvider } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SiteDataProvider } from './context/SiteDataContext';
import { TourProvider } from './context/TourContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import Mission from './components/Mission';
import SeeThrough from './components/SeeThrough';
import StudyAreas from './components/StudyAreas';
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
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('footer.brand')} · ${t('app.tagline')}`;
  }, [language, t]);

  return (
    <div className="bp6-light app-shell">
      <Navbar />
      <div className="app-frame">
        <Sidebar />
        <main id="main-content" className="app-main">
          <Hero />
          <Mission />
          <SeeThrough />
          <StudyAreas />
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
      <TourProvider>
        <SiteDataProvider>
          <OverlaysProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </OverlaysProvider>
        </SiteDataProvider>
      </TourProvider>
    </LanguageProvider>
  );
}
