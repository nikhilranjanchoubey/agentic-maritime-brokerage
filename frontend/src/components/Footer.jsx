import React from 'react';
import { ShipLogo } from './Icons';

export default function Footer({ onNavClick }) {
  return (
    <footer className="footer-navy-wrapper" id="contact">
      <div className="footer-horizon-glow"></div>

      <div className="footer-container">
        <div className="footer-main-grid">
          {/* LEFT: Logo & Brand Description */}
          <div className="footer-brand-col">
            <div className="footer-brand-row">
              <ShipLogo size={32} className="mr-3 text-cyan" />
              <div>
                <span className="footer-brand-name">AGENTIC MARITIME</span>
                <span className="footer-brand-tagline">BROKERAGE & ROUTE INTELLIGENCE</span>
              </div>
            </div>
            <p className="footer-desc">
              Global AI-powered maritime freight quotation, route optimization, and commercial logistics platform. Empowering cargo brokers, NVOCCs, and forwarders with transparent routing intelligence.
            </p>
            <div className="footer-meta-pill">
              <span className="meta-dot"></span>
              <span>Autonomous Maritime Operations Platform</span>
            </div>
          </div>

          {/* COLUMN 1: Platform Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => onNavClick('home')}>Home</button></li>
              <li><button type="button" onClick={() => onNavClick('route-intelligence')}>Route Intelligence</button></li>
              <li><button type="button" onClick={() => onNavClick('popular-routes')}>Popular Corridors</button></li>
              <li><button type="button" onClick={() => onNavClick('why-choose-us')}>Why Ship With Us</button></li>
            </ul>
          </div>

          {/* COLUMN 2: Services */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Services</h4>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => onNavClick('services')}>Route Intelligence Engine</button></li>
              <li><button type="button" onClick={() => onNavClick('services')}>Freight Benchmark Estimator</button></li>
              <li><button type="button" onClick={() => onNavClick('route-intelligence')}>Voyage Multi-Factor Scoring</button></li>
              <li><button type="button" onClick={() => onNavClick('popular-routes')}>Global Trade Lane Benchmarks</button></li>
            </ul>
          </div>

          {/* COLUMN 3: Information & Contact */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Information</h4>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => onNavClick('how-it-works')}>How It Works</button></li>
              <li><button type="button" onClick={() => onNavClick('contact')}>Commercial Contact</button></li>
              <li><span className="footer-muted-item">Global Maritime Carrier Directory</span></li>
              <li><span className="footer-muted-item">Port Congestion Advisories</span></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM: Copyright & Professional Tagline */}
        <div className="footer-bottom-bar">
          <div className="footer-copy">
            Copyright © 2026 Agentic Maritime. All rights reserved.
          </div>
          <div className="footer-legal">
            <span>Maritime Logistics Intelligence</span>
            <span className="sep">•</span>
            <span>Commercial Freight Routing</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
