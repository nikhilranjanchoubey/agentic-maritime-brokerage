import React from 'react';

export default function HeroSection({ onStartSearch }) {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <h1 className="hero-heading">Maritime Route Analysis System</h1>
        <p className="hero-subtitle">
          Find and compare available shipping routes between ports.
        </p>
        <button
          type="button"
          className="btn-start-search"
          onClick={onStartSearch}
        >
          Start Route Search
        </button>
      </div>
    </section>
  );
}
