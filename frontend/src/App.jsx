import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchPorts, fetchPopularRoutes } from './services/api';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SearchCard from './components/SearchCard';
import RouteResults from './components/RouteResults';
import PopularRoutes from './components/PopularRoutes';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Services from './components/Services';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ShieldCheckIcon } from './components/Icons';
import './App.css';

function MainApp() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'dashboard'
  const [ports, setPorts] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [searchResult, setSearchResult] = useState(null);
  const [prefill, setPrefill] = useState({ origin: '', destination: '' });

  // Load ports and popular corridors on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [portsData, popularData] = await Promise.all([
          fetchPorts(),
          fetchPopularRoutes(),
        ]);
        setPorts(portsData);
        setPopularRoutes(popularData);
      } catch (err) {
        console.error('Error initializing platform data:', err);
      }
    }
    loadData();
  }, []);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectCorridor = (origin, destination) => {
    setPrefill({ origin, destination });
    const searchEl = document.getElementById('search-section');
    if (searchEl) {
      searchEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExploreHero = () => {
    const searchEl = document.getElementById('search-section');
    if (searchEl) {
      searchEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDiscoverHero = () => {
    const featEl = document.getElementById('why-choose-us');
    if (featEl) {
      featEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFooterNav = (id) => {
    setCurrentView('main');
    setTimeout(() => {
      const el = document.getElementById(id === 'home' ? 'hero-top' : id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // If user requests dashboard or profile but is not signed in
  if ((currentView === 'dashboard' || currentView === 'profile') && !isAuthenticated) {
    return (
      <div className="auth-required-screen">
        <div className="auth-required-card">
          <div className="auth-req-icon-box">
            <ShieldCheckIcon size={36} className="auth-req-icon-svg" />
          </div>
          <h2 className="auth-req-heading">Authentication Required</h2>
          <p className="auth-req-desc">
            Please sign in to access your shipment bookings and broker account.
          </p>
          <div className="auth-req-buttons">
            <button
              type="button"
              className="btn-auth-signin"
              onClick={() => handleOpenAuth('login')}
            >
              Sign In Now
            </button>
            <button
              type="button"
              className="btn-auth-return"
              onClick={() => setCurrentView('main')}
            >
              Return to Homepage
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }

  // Render Admin Dashboard
  if (currentView === 'admin' && isAdmin) {
    return (
      <AdminDashboard
        ports={ports}
        onBackToHome={() => setCurrentView('main')}
      />
    );
  }

  // Render User Dashboard (Overview / My Shipments) or Profile with SkyTech Layout
  if (currentView === 'dashboard' || currentView === 'profile') {
    return (
      <div className="app-container">
        <Navbar
          onOpenAuth={handleOpenAuth}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <UserDashboard
          ports={ports}
          viewMode={currentView === 'profile' ? 'profile' : 'overview'}
          onBackToHome={() => setCurrentView('main')}
          onOpenSearch={() => {
            setCurrentView('main');
            setTimeout(() => {
              const el = document.getElementById('search-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
        />
        <Footer onNavClick={handleFooterNav} />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }

  // Render Public Homepage
  return (
    <div className="app-container">
      {/* Sticky Navigation Bar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Hero Section with SkyTech Top Badge, Headline & Spacious 2-Row Search Card */}
      <HeroSection>
        <SearchCard
          ports={ports}
          prefillOrigin={prefill.origin}
          prefillDestination={prefill.destination}
          onResultsFound={(res) => setSearchResult(res)}
        />
      </HeroSection>

      {/* Route Intelligence Results (Rendered upon search) */}
      {searchResult && (
        <RouteResults
          resultState={searchResult}
          onReset={() => setSearchResult(null)}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* Popular Shipping Routes inspired by SkyTech */}
      <PopularRoutes
        popularRoutes={popularRoutes}
        onSelectCorridor={handleSelectCorridor}
      />

      {/* Why Choose Us Features */}
      <Features />

      {/* How It Works Process */}
      <HowItWorks />

      {/* Specialized Maritime AI Services */}
      <Services onExploreRoute={handleExploreHero} />

      {/* Navy Maritime Footer */}
      <Footer onNavClick={handleFooterNav} />

      {/* Split-screen SkyTech Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setCurrentView('dashboard');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
