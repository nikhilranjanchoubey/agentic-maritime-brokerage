import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchPorts } from './services/api';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SearchCard from './components/SearchCard';
import RouteResults from './components/RouteResults';
import WhyChooseUs from './components/WhyChooseUs';
import AdminDashboard from './components/AdminDashboard';
import ShipperDashboard from './components/ShipperDashboard';
import AuthPage from './components/AuthPage';
import AuthModal from './components/AuthModal';
import ShipmentBookingModal from './components/ShipmentBookingModal';
import ShipmentTrackingModal from './components/ShipmentTrackingModal';
import Footer from './components/Footer';
import UserManual from './components/UserManual';
import './App.css';

function MainApp() {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  
  // Navigation / View state: 'auto', 'manual', 'login', 'register'
  const [viewState, setViewState] = useState('auto');
  const [shipperTab, setShipperTab] = useState('home');
  const [ports, setPorts] = useState([]);
  const [searchResult, setSearchResult] = useState(null);

  // Modals for guest / public search
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRouteForBooking, setSelectedRouteForBooking] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingBookingId, setTrackingBookingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const portsData = await fetchPorts();
        setPorts(portsData || []);
      } catch (err) {
        console.error('Failed to load initial ports:', err);
      }
    }
    loadData();
  }, []);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavClick = (target) => {
    if (target === 'manual' || target === 'how-it-works') {
      setViewState('manual');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'home') {
      setViewState('auto');
      setShipperTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'quotation' || target === 'search') {
      setViewState('auto');
      setShipperTab('home');
      setTimeout(() => {
        const el = document.getElementById('route-quotation-card') || document.querySelector('.quotation-form');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } else if (target === 'consignments') {
      if (!isAuthenticated) {
        handleOpenAuth('login');
      } else {
        setViewState('auto');
        setShipperTab('consignments');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (target === 'admin_dashboard') {
      setViewState('auto');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'login') {
      handleOpenAuth('login');
    } else if (target === 'signup' || target === 'register') {
      handleOpenAuth('signup');
    } else {
      setViewState('auto');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBookRoute = (route) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
    } else {
      setSelectedRouteForBooking(route);
      setBookingModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner"></div>
        <p>Loading SeaRoute Platform...</p>
      </div>
    );
  }

  // 1. Authenticated as Administrator: Render Administrator Panel
  if (isAuthenticated && isAdmin) {
    return (
      <div className="app-layout">
        <AdminDashboard onBackToHome={() => handleNavClick('home')} />
        <Footer onNavClick={handleNavClick} onOpenAuth={handleOpenAuth} />
      </div>
    );
  }

  // 2. How It Works View
  if (viewState === 'manual') {
    return (
      <div className="app-layout">
        <Navbar
          onOpenAuth={handleOpenAuth}
          currentView="how-it-works"
          onNavClick={handleNavClick}
        />
        <UserManual
          onBackToHome={() => handleNavClick('home')}
          onOpenAuth={handleOpenAuth}
        />
        <Footer
          onNavClick={handleNavClick}
          onOpenAuth={handleOpenAuth}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  // 3. Dedicated AuthPage (if explicitly navigated)
  if (viewState === 'login' || viewState === 'register') {
    return (
      <div className="app-layout">
        <AuthPage
          initialMode={viewState === 'register' ? 'register' : 'login'}
          onBrowseRoutes={() => handleNavClick('home')}
        />
        <Footer
          onNavClick={handleNavClick}
          onOpenAuth={handleOpenAuth}
        />
      </div>
    );
  }

  // 4. Default Home Experience (both for Guests and Authenticated Shippers):
  // Renders the collegiate Home page with Maritime Freight Quotation & Booking,
  // Why Choose Us, Platform Features, and My Consignments (protected by login).
  return (
    <div className="app-layout">
      <ShipperDashboard
        onBackToHome={() => handleNavClick('home')}
        onOpenAuth={handleOpenAuth}
        activeTab={shipperTab}
        setActiveTab={setShipperTab}
        onNavClick={handleNavClick}
      />
      <Footer
        onNavClick={handleNavClick}
        onOpenAuth={handleOpenAuth}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
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
