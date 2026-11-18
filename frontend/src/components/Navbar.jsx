import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShipLogo, ShieldCheckIcon } from './Icons';

export default function Navbar({ onOpenAuth, currentView, setCurrentView }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'route-intelligence', label: 'Route Intelligence' },
    { id: 'popular-routes', label: 'Popular Routes' },
    { id: 'services', label: 'Services' },
    { id: 'why-choose-us', label: 'About Us' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    if (id === 'home') {
      setCurrentView('main');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'route-intelligence') {
      setCurrentView('main');
      setTimeout(() => {
        const el = document.getElementById('search-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      setCurrentView('main');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const userInitial = (user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'M').toUpperCase();
  const userDisplayName = user?.full_name?.trim().split(' ')[0] || (isAdmin ? 'Admin' : 'Broker');

  return (
    <header className={`navbar-header-full ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="navbar-inner-wrapper">
        {/* LEFT: Ship Logo & Branding (Fixed Width, Aligned Horizontally, No Wrap) */}
        <div
          className="navbar-brand-wrap"
          onClick={() => {
            setCurrentView('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Agentic Maritime Platform"
        >
          <div className="navbar-logo-glow">
            <ShipLogo size={34} />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">AGENTIC MARITIME</span>
            <span className="navbar-brand-subtitle">BROKERAGE & ROUTE INTELLIGENCE</span>
          </div>
        </div>

        {/* CENTER: Clean Navigation Links (Home, Route Intelligence, Popular Routes, Services, About Us, Contact) */}
        <nav className="navbar-center-links">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`nav-item-btn ${currentView === 'main' && link.id === 'home' ? 'is-active' : ''}`}
              onClick={() => handleNavClick(link.id)}
            >
              <span>{link.label}</span>
              <span className="nav-hover-indicator"></span>
            </button>
          ))}
        </nav>

        {/* RIGHT: Actions (Logged In vs Logged Out) */}
        <div className="navbar-right-actions">
          {isAuthenticated ? (
            <div className="navbar-auth-actions">
              {/* My Shipments compact navigation button */}
              <button
                type="button"
                className={`navbar-action-btn ${currentView === 'dashboard' ? 'is-active-btn' : ''}`}
                onClick={() => {
                  setCurrentView('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                title="My Shipments & Freight Records"
              >
                <span>My Shipments</span>
              </button>

              {/* User profile (small circular avatar + short name) */}
              <button
                type="button"
                className={`navbar-user-btn ${currentView === 'profile' ? 'is-active-btn' : ''}`}
                onClick={() => {
                  setCurrentView('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                title="Account & Profile Settings"
              >
                <div className="navbar-user-avatar">{userInitial}</div>
                <span className="navbar-user-name">{userDisplayName}</span>
              </button>

              {/* Admin Panel (ONLY for admin accounts) */}
              {isAdmin && (
                <button
                  type="button"
                  className={`navbar-admin-btn ${currentView === 'admin' ? 'is-active-btn' : ''}`}
                  onClick={() => {
                    setCurrentView('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title="Administrator Portal"
                >
                  <ShieldCheckIcon size={14} className="mr-1.5" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Sign Out (simple, compact button) */}
              <button
                type="button"
                className="navbar-signout-compact-btn"
                onClick={() => {
                  logout();
                  setCurrentView('main');
                }}
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="navbar-guest-actions">
              {/* Login (simple outlined button) */}
              <button
                type="button"
                className="btn-nav-login"
                onClick={() => onOpenAuth('login')}
              >
                Login
              </button>

              {/* Sign Up (solid blue button) */}
              <button
                type="button"
                className="btn-nav-signup"
                onClick={() => onOpenAuth('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
          >
            <span className={`bar ${mobileMenuOpen ? 'bar-open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'bar-open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'bar-open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <div className="mobile-links-container">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                className="mobile-link-item"
                onClick={() => handleNavClick(link.id)}
              >
                {link.label}
              </button>
            ))}
            <div className="mobile-drawer-divider"></div>
            {isAuthenticated ? (
              <div className="mobile-user-row">
                <button
                  type="button"
                  className="mobile-auth-action-btn primary mb-2"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCurrentView('dashboard');
                  }}
                >
                  My Shipments
                </button>
                <button
                  type="button"
                  className="mobile-auth-action-btn secondary mb-2"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCurrentView('profile');
                  }}
                >
                  Profile & Account
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="mobile-auth-action-btn admin mb-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCurrentView('admin');
                    }}
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  type="button"
                  className="mobile-auth-action-btn signout"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    setCurrentView('main');
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-guest-row">
                <button
                  type="button"
                  className="btn-nav-login w-full mb-2"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="btn-nav-signup w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
