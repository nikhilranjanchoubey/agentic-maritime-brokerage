import React from 'react';
import { CompassIcon, ShieldCheckIcon, WavesIcon, ContainerIcon } from './Icons';

export default function Features() {
  const features = [
    {
      id: 1,
      title: "AI-Powered Route Intelligence",
      description: "Proprietary multi-factor scoring engine optimizing transit days (40%), sailing distance (25%), and transshipment risk (35%) across maritime trade lanes.",
      icon: <CompassIcon size={20} className="text-cyan" />,
      iconBg: "icon-bg-cyan",
    },
    {
      id: 2,
      title: "Smarter Freight Decisions",
      description: "Data-driven container freight estimates modeled from commercial shipping benchmarks, eliminating unexpected carrier surcharges.",
      icon: <ShieldCheckIcon size={20} className="text-ocean" />,
      iconBg: "icon-bg-ocean",
    },
    {
      id: 3,
      title: "Global Port Connectivity",
      description: "Standardized corridor network spanning 500+ verified routes and 47 premier deepwater ports, transshipment hubs, and regional terminals.",
      icon: <WavesIcon size={20} className="text-emerald" />,
      iconBg: "icon-bg-emerald",
    },
    {
      id: 4,
      title: "Simplified Shipment Planning",
      description: "Streamlined workflow designed specifically for cargo brokers, NVOCCs, and freight forwarders seeking rapid multi-corridor comparisons.",
      icon: <ContainerIcon size={20} className="text-amber" />,
      iconBg: "icon-bg-amber",
    },
  ];

  return (
    <section className="features-section" id="why-choose-us">
      <div className="section-container">
        <div className="section-header-center">
          <div className="section-badge-pill">
            <span>MARITIME EXCELLENCE</span>
          </div>
          <h2 className="section-title">Why Ship with Agentic Maritime</h2>
          <p className="section-subtitle">
            Commercial-grade voyage intelligence engineered for speed, accuracy, and stronger freight brokerage margins.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feat) => (
            <div key={feat.id} className="feature-card-clean">
              <div className={`feature-icon-circle ${feat.iconBg}`}>
                {feat.icon}
              </div>
              <h3 className="feature-card-title">{feat.title}</h3>
              <p className="feature-card-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
