import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, currentView = 'how-it-works', setCurrentView, onNavClick }) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleNavigate = (target) => {
    if (onNavClick) {
      onNavClick(target);
    } else if (setCurrentView) {
      if (target === 'home') setCurrentView('main');
      else setCurrentView(target);
    }
  };

  const handleLogout = () => {
    logout();
    handleNavigate('home');
  };

  return (
    <header className="shipper-header-nav">
      <div
        className="shipper-header-brand"
        onClick={() => handleNavigate('home')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
      >
        <img src="/searoute-logo.jpg" alt="SeaRoute Logo" className="brand-logo-img" />
        <h1 className="shipper-brand-title">SeaRoute</h1>
      </div>

      {/* Navigation Tabs */}
      <nav className="shipper-nav-tabs">
        <button
          type="button"
          className={`shipper-nav-btn ${currentView === 'home' || currentView === 'main' ? 'active' : ''}`}
          onClick={() => handleNavigate('home')}
        >
          Home
        </button>
        <button
          type="button"
          className={`shipper-nav-btn ${currentView === 'consignments' || currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigate('consignments')}
        >
          My Consignment
        </button>
        <button
          type="button"
          className={`shipper-nav-btn ${currentView === 'manual' || currentView === 'how-it-works' ? 'active' : ''}`}
          onClick={() => handleNavigate('how-it-works')}
        >
          How It Works
        </button>
      </nav>

      <div className="shipper-header-actions">
        {isAuthenticated ? (
          <>
            <span className="shipper-badge">
              <span className="user-avatar-circle">
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="user-name-text">
                {user?.full_name || user?.email?.split('@')[0] || 'Shipper'}
              </span>
            </span>
            <button type="button" className="btn-secondary btn-sm" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => onOpenAuth && onOpenAuth('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => onOpenAuth && onOpenAuth('signup')}
            >
              Register
            </button>
          </>
        )}
      </div>
    </header>
  );
}
