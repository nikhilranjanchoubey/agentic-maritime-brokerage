import React from 'react';

export default function HeroSection({ children }) {
  return (
    <section className="hero-section-wrapper" id="hero-top">
      {/* Full-Width Maritime Port Photograph */}
      <div className="hero-bg-media">
        <img
          src="/maritime-hero.jpg"
          alt="Commercial container vessel at illuminated terminal with gantry cranes"
          className="hero-bg-img"
        />
        {/* Subtle Navy Overlay - Preserving full atmospheric lights and water reflections */}
        <div className="hero-overlay-gradient"></div>
        <div className="hero-ambient-glow"></div>
      </div>

      <div className="hero-content-container">
        {/* SkyTech-Style Centered Top Badge */}
        <div className="hero-top-badge">
          <span className="hero-badge-icon">⚓</span>
          <span className="hero-badge-text">GLOBAL MARITIME LOGISTICS</span>
        </div>

        {/* Hero Headline */}
        <h1 className="hero-master-heading">
          Your Next Shipment <span className="hero-heading-gradient">Starts Here.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="hero-subtext">
          Compare maritime routes. Explore freight estimates. Plan shipments with confidence.
        </p>

        {/* Spacious 2-Row SkyTech Search Card */}
        {children}
      </div>

      {/* Signature SkyTech Curved Blue Arc across the bottom */}
      <div className="hero-curved-arc-container">
        <svg
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          className="hero-curved-arc-svg"
        >
          <defs>
            <linearGradient id="skytechBlueArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#168BFF" />
              <stop offset="50%" stopColor="#56CCF2" />
              <stop offset="100%" stopColor="#168BFF" />
            </linearGradient>
          </defs>
          {/* Fill below arc with page background */}
          <path
            d="M 0,48 Q 720,12 1440,48 L 1440,64 L 0,64 Z"
            fill="#F4F8FC"
          />
          {/* Glowing blue/cyan arc line */}
          <path
            d="M 0,48 Q 720,12 1440,48"
            stroke="url(#skytechBlueArc)"
            strokeWidth="3.2"
            fill="none"
          />
        </svg>
      </div>
    </section>
  );
}
