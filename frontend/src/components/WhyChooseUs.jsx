import React from 'react';

export default function WhyChooseUs() {
  const points = [
    {
      id: 1,
      title: 'Route Comparison',
      desc: 'Compare available shipping routes between major international ports with direct and feeder options.',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16.2 7.8l-2 6.3-6.4 2.1 2.1-6.4z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Better Decisions',
      desc: 'Understand transit time, sailing distance, transshipment counts, and indicative freight benchmarks.',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
      ),
    },
    {
      id: 3,
      title: 'Shipment Tracking',
      desc: 'Follow shipment progress through realistic maritime voyage milestones from pickup to final discharge.',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      id: 4,
      title: 'Transparent Updates',
      desc: 'View validated shipment status changes, timestamps, transshipment port transfers, and administrator remarks.',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section className="why-choose-section">
      <div className="why-choose-container">
        <h2 className="why-choose-heading">Why Choose SeaRoute</h2>
        <p className="why-choose-subtext">
          A dependable, student-developed platform for maritime route analysis, booking, and shipment tracking.
        </p>

        <div className="why-choose-grid">
          {points.map((p) => (
            <div key={p.id} className="why-choose-card">
              <div className="why-choose-icon-box">{p.icon}</div>
              <h3 className="why-choose-title">{p.title}</h3>
              <p className="why-choose-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
