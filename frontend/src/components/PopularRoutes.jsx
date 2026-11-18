import React from 'react';
import { ArrowRightIcon } from './Icons';

export default function PopularRoutes({ popularRoutes = [], onSelectCorridor }) {
  return (
    <section className="popular-routes-section" id="popular-routes">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-center">
          <div className="section-badge-pill">
            <span>MAJOR MARITIME TRADE LANES</span>
          </div>
          <h2 className="section-title">Popular Global Shipping Routes</h2>
          <p className="section-subtitle">
            Explore major maritime corridors and discover intelligent route recommendations.
          </p>
        </div>

        {/* 3-Column Grid on Desktop */}
        <div className="popular-cards-grid">
          {popularRoutes.map((corridor) => (
            <div key={corridor.id} className="skytech-route-card">
              {/* TOP: Maritime Photograph with Category Badge */}
              <div className="skytech-card-media">
                <img
                  src={corridor.image}
                  alt={`${corridor.origin} to ${corridor.destination} commercial container freight corridor`}
                  className="skytech-media-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/container-ship-sea.jpg';
                  }}
                />
                <div className="skytech-media-gradient"></div>
                <div className="skytech-badge-container">
                  <span className="skytech-category-badge">{corridor.badge}</span>
                </div>
              </div>

              {/* BODY: Ports, UN/LOCODEs, Countries, Freight, Transit */}
              <div className="skytech-card-body">
                <div className="skytech-code-row">
                  <span className="skytech-port-code">{corridor.origin_code}</span>
                  <span className="skytech-code-arrow">→</span>
                  <span className="skytech-port-code">{corridor.destination_code}</span>
                </div>

                <h3 className="skytech-corridor-title">
                  {corridor.origin} <span className="arrow-accent">→</span> {corridor.destination}
                </h3>

                <div className="skytech-countries-row">
                  <span>{corridor.origin_country}</span>
                  <span className="dot-divider">•</span>
                  <span>{corridor.destination_country}</span>
                </div>

                {/* Compact 2-Column Metrics Panel */}
                <div className="skytech-metrics-panel">
                  <div className="skytech-metric-col">
                    <span className="skytech-metric-label">STARTING FREIGHT</span>
                    <span className="skytech-metric-value">${corridor.estimated_freight_usd?.toLocaleString()}</span>
                    <span className="skytech-metric-sub">Dataset Estimate</span>
                  </div>
                  <div className="skytech-panel-divider"></div>
                  <div className="skytech-metric-col">
                    <span className="skytech-metric-label">TRANSIT DURATION</span>
                    <span className="skytech-metric-value">⏱ {corridor.transit_days} Days</span>
                    <span className="skytech-metric-sub">{corridor.distance_nm?.toLocaleString()} NM • Direct</span>
                  </div>
                </div>

                {/* Compact Professional Explore Button */}
                <button
                  type="button"
                  className="skytech-btn-explore"
                  onClick={() => onSelectCorridor(corridor.origin, corridor.destination)}
                >
                  <span>Explore Route</span>
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
