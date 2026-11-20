import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Footer({ onNavClick, onOpenAuth }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleBrandClick = () => {
    if (onNavClick) onNavClick('home');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-full">
      <div className="footer-container">
        <div className="footer-columns-grid">
          {/* Brand & Platform Description */}
          <div className="footer-brand-col">
            <div
              className="footer-brand-header"
              onClick={handleBrandClick}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <img src="/searoute-logo.jpg" alt="SeaRoute Logo" className="footer-logo-img" />
              <span className="footer-brand-name">SeaRoute</span>
            </div>
            <p className="footer-brand-desc">
              Maritime freight benchmarking, corridor intelligence, and end-to-end consignment milestone tracking platform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavClick && onNavClick('home')}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavClick && onNavClick('quotation')}
                >
                  Freight Quotation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavClick && onNavClick('consignments')}
                >
                  My Consignment
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavClick && onNavClick('how-it-works')}
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Account</h4>
            <ul className="footer-links-list">
              {!isAuthenticated ? (
                <>
                  <li>
                    <button
                      type="button"
                      className="footer-link-btn"
                      onClick={() => onOpenAuth && onOpenAuth('login')}
                    >
                      Sign In
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="footer-link-btn"
                      onClick={() => onOpenAuth && onOpenAuth('signup')}
                    >
                      Register
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li style={{ fontSize: '13px', color: '#123456', fontWeight: 600 }}>
                    {isAdmin ? 'Admin' : (user?.full_name || user?.email?.split('@')[0] || 'Shipper')}
                  </li>
                  <li>
                    <button
                      type="button"
                      className="footer-link-btn"
                      onClick={() => onNavClick && onNavClick(isAdmin ? 'admin_dashboard' : 'consignments')}
                    >
                      {isAdmin ? 'Operational Dashboard' : 'Track Consignments'}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="footer-link-btn"
                      onClick={logout}
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom-row">
          <p className="footer-copyright-text">
            © 2026 SeaRoute. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
