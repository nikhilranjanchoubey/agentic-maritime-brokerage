import React from 'react';
import { CompassIcon, ShieldCheckIcon, ArrowRightIcon } from './Icons';

export default function Services({ onExploreRoute }) {
  const services = [
    {
      id: 'route-agent',
      title: 'Route Intelligence Engine',
      category: 'Autonomous Routing Agent',
      desc: 'Multi-criteria route ranking incorporating sailing distance, transit duration, and transshipment friction with automatic scoring across 500+ verified maritime corridors.',
      icon: <CompassIcon size={24} className="text-ocean" />,
      iconBg: 'icon-bg-ocean',
    },
    {
      id: 'freight-estimator',
      title: 'Freight Benchmark Estimator',
      category: 'Pricing Engine',
      desc: 'Indicative base freight calculations by container volume and container classification across verified international global trade lanes.',
      icon: <ShieldCheckIcon size={24} className="text-ocean" />,
      iconBg: 'icon-bg-ocean',
    },
  ];

  return (
    <section className="services-section" id="services">
      <div className="section-container">
        <div className="section-header-center">
          <div className="section-badge-pill">
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="section-title">Specialized Maritime AI Services</h2>
          <p className="section-subtitle">
            Commercial logistics intelligence designed to empower modern ocean freight routing and container brokerage operations.
          </p>
        </div>

        <div className="services-cards-grid services-two-col">
          {services.map((svc) => (
            <div key={svc.id} className="service-card-clean service-active">
              <div className="service-card-top">
                <div className={`service-icon-box ${svc.iconBg}`}>{svc.icon}</div>
                <span className="service-status-pill status-pill-live">
                  Operational
                </span>
              </div>

              <div className="service-card-body">
                <span className="service-category-label">{svc.category}</span>
                <h3 className="service-title-text">{svc.title}</h3>
                <p className="service-desc-text">{svc.desc}</p>
              </div>

              <div className="service-card-footer">
                <button
                  type="button"
                  className="service-launch-btn"
                  onClick={onExploreRoute}
                >
                  <span>Launch Service</span>
                  <ArrowRightIcon size={14} className="ml-1.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
