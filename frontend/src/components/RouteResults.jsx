import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveRouteRecommendation } from '../services/api';
import {
  ClockIcon,
  WavesIcon,
  ContainerIcon,
  CheckCircleIcon,
  BookmarkIcon,
  ArrowRightIcon,
  CloseIcon,
  ShieldCheckIcon,
  CompassIcon,
} from './Icons';

export default function RouteResults({ resultState, onReset, onSaveSuccess, onOpenAuth }) {
  const { isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  if (!resultState) return null;

  const { success, data, error, query } = resultState;

  const handleSaveRoute = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    if (!data || !data.recommended_route) return;

    setSaving(true);
    setSaveError('');
    try {
      const rec = data.recommended_route;
      await saveRouteRecommendation({
        route_id: rec.route_id,
        origin: data.origin,
        destination: data.destination,
        route_type: rec.route_type,
        distance_nm: rec.distance_nm,
        transit_days: rec.transit_days,
        base_freight_usd: rec.base_freight_usd,
        route_score: rec.route_score,
        notes: `${query?.cargoType || 'Standard Dry'} • ${query?.containers || 1} Container(s)`,
      });
      setSavedSuccess(true);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setSaveError(err.message || 'Failed to bookmark route');
    } finally {
      setSaving(false);
    }
  };

  const containerQty = Math.max(1, parseInt(query?.containers, 10) || 1);

  return (
    <section className="results-section-wrapper" id="route-results-section">
      <div className="results-container">
        {/* Results Header Row */}
        <div className="results-header-row">
          <div className="results-header-info">
            <div className="results-eyebrow">
              <span className="eyebrow-dot"></span>
              <span>ROUTE INTELLIGENCE ANALYSIS</span>
            </div>
            <h2 className="results-main-title">
              {query?.origin || data?.origin} <span className="arrow-sep">→</span> {query?.destination || data?.destination}
            </h2>
            <p className="results-subtext">
              Voyage analysis for {containerQty} × {query?.cargoType || data?.cargo_type || 'Standard Dry'} container(s)
            </p>
          </div>
          <button
            type="button"
            className="btn-close-results"
            onClick={onReset}
            title="Close Route Analysis"
            aria-label="Close Analysis"
          >
            <CloseIcon size={14} className="mr-1.5" />
            <span>Close Analysis</span>
          </button>
        </div>

        {/* ERROR STATE: No Route Found */}
        {!success || !data || data.status === 'error' ? (
          <div className="no-route-alert-card">
            <div className="no-route-icon-box">
              <CompassIcon size={24} className="text-ocean" />
            </div>
            <div className="no-route-content">
              <h3>No Direct or Feeder Route Available</h3>
              <p className="no-route-desc">
                {error || data?.message || 'No matching route is currently available for this port combination.'}
              </p>
              <div className="no-route-advisory">
                <span>💡 Brokerage Advisory:</span> Our charter desk can structure a bespoke transshipment schedule or spot inducement call for this corridor.
              </div>
              <button
                type="button"
                className="btn-custom-charter"
                onClick={() => setInquiryModalOpen(true)}
              >
                Request Custom Charter Quotation
              </button>
            </div>
          </div>
        ) : (
          /* SUCCESS STATE: Display Recommended & Alternative Routes */
          <div className="results-body-grid">
            {/* RECOMMENDED ROUTE MAIN CARD */}
            <div className="recommended-route-hero">
              {/* Route Identification Header */}
              <div className="hero-route-badge-bar">
                <span className="recommended-pill">★ BEST OVERALL RECOMMENDATION</span>
                <span className="route-id-tag">ROUTE REF: {data.recommended_route?.route_id || 'N/A'}</span>
                <span className="route-type-tag">{data.recommended_route?.route_type || 'Standard'}</span>
              </div>

              {/* Score & Rationale Header Row */}
              <div className="route-score-header-row">
                <div className="route-score-box">
                  <div className="score-number-circle" title="AI Route Score out of 100">
                    <span className="score-val">{data.recommended_route?.route_score ?? 100}</span>
                    <span className="score-denom">/100</span>
                  </div>
                  <div className="score-meta">
                    <h3 className="score-title">Composite AI Route Score</h3>
                    <p className="score-rationale">
                      Recommended based on weighted transit time, sailing distance and transshipment efficiency.
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="hero-route-actions">
                  <button
                    type="button"
                    className={`btn-save-route ${savedSuccess ? 'saved' : ''}`}
                    onClick={handleSaveRoute}
                    disabled={saving || savedSuccess}
                  >
                    <BookmarkIcon size={16} className="mr-2" filled={savedSuccess} />
                    <span>{savedSuccess ? 'Saved in Workspace' : saving ? 'Saving...' : 'Save Route'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-inquire-broker"
                    onClick={() => setInquiryModalOpen(true)}
                  >
                    <span>Request Quotation</span>
                    <ArrowRightIcon size={16} className="ml-2" />
                  </button>
                </div>
              </div>

              {/* 4 Core Metrics Quad Grid */}
              <div className="metrics-quad-grid">
                {/* 1. Estimated Transit Time */}
                <div className="metric-cell">
                  <div className="metric-header">
                    <ClockIcon size={15} className="metric-icon-blue" />
                    <span>ESTIMATED TRANSIT TIME</span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">{data.recommended_route?.transit_days ?? 0}</span>
                    <span className="metric-unit">Days</span>
                  </div>
                  <div className="metric-score-bar">
                    <div
                      className="metric-fill"
                      style={{ width: `${Math.min(100, Math.max(15, data.recommended_route?.transit_score ?? 100))}%` }}
                    ></div>
                  </div>
                  <span className="metric-footer-note">Fastest available corridor</span>
                </div>

                {/* 2. Sailing Distance */}
                <div className="metric-cell">
                  <div className="metric-header">
                    <WavesIcon size={15} className="metric-icon-blue" />
                    <span>SAILING DISTANCE</span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">{(data.recommended_route?.distance_nm || 0).toLocaleString()}</span>
                    <span className="metric-unit">NM</span>
                  </div>
                  <div className="metric-score-bar">
                    <div
                      className="metric-fill"
                      style={{ width: `${Math.min(100, Math.max(15, data.recommended_route?.distance_score ?? 100))}%` }}
                    ></div>
                  </div>
                  <span className="metric-footer-note">Optimal nautical routing</span>
                </div>

                {/* 3. Number of Transshipments */}
                <div className="metric-cell">
                  <div className="metric-header">
                    <ContainerIcon size={15} className="metric-icon-emerald" />
                    <span>TRANSSHIPMENTS</span>
                  </div>
                  <div className="metric-value-row">
                    <span className={`metric-value ${data.recommended_route?.transshipments === 0 ? 'direct-voyage-text' : ''}`}>
                      {data.recommended_route?.transshipments === 0
                        ? '0 (Direct Voyage)'
                        : `${data.recommended_route?.transshipments} Port Transfer${data.recommended_route?.transshipments > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="metric-score-bar">
                    <div
                      className="metric-fill metric-fill-emerald"
                      style={{ width: `${Math.min(100, Math.max(15, data.recommended_route?.transshipment_score ?? 100))}%` }}
                    ></div>
                  </div>
                  <span className="metric-footer-note">
                    {data.recommended_route?.transshipments === 0 ? 'No transshipment delays' : 'Intermediate hub schedule'}
                  </span>
                </div>

                {/* 4. Indicative Freight Estimate */}
                <div className="metric-cell highlight-freight">
                  <div className="metric-header">
                    <ShieldCheckIcon size={15} className="metric-icon-blue" />
                    <span>INDICATIVE FREIGHT</span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">
                      ${(data.recommended_route?.total_freight_usd || (data.recommended_route?.base_freight_usd || 0) * containerQty).toLocaleString()}
                    </span>
                    <span className="metric-unit text-blue">USD</span>
                  </div>
                  <div className="metric-score-bar">
                    <div className="metric-fill" style={{ width: '100%' }}></div>
                  </div>
                  <span className="metric-footer-note">
                    ${(data.recommended_route?.base_freight_usd || 0).toLocaleString()} / TEU base estimate
                  </span>
                </div>
              </div>

              {/* Save Feedback Alerts */}
              {saveError && <div className="save-error-text">⚠️ {saveError}</div>}
              {savedSuccess && (
                <div className="save-success-banner">
                  <CheckCircleIcon size={16} className="mr-2 text-emerald-500" />
                  <span>Route saved to your Maritime Workspace. View it in your dashboard anytime.</span>
                </div>
              )}

              {/* Small Readable Disclaimer */}
              <div className="rate-nature-disclaimer">
                <span>Freight figures are indicative dataset estimates, not confirmed carrier quotations.</span>
              </div>
            </div>

            {/* ALTERNATIVE ROUTES COMPARISON */}
            {data.alternative_routes && data.alternative_routes.length > 0 && (
              <div className="alternative-routes-container">
                <div className="alternatives-header">
                  <h3 className="alternatives-title">Alternative Route Options ({data.alternative_routes.length})</h3>
                  <span className="alternatives-sub">
                    Compare secondary corridors by transit duration, sailing distance and freight pricing
                  </span>
                </div>

                <div className="alternatives-cards-grid">
                  {data.alternative_routes.map((alt) => {
                    const rec = data.recommended_route;
                    const daysDiff = rec ? alt.transit_days - rec.transit_days : 0;
                    const distDiff = rec ? alt.distance_nm - rec.distance_nm : 0;
                    const totalFreight = (alt.base_freight_usd || 0) * containerQty;

                    return (
                      <div key={alt.route_id} className="alt-route-card">
                        <div className="alt-card-top">
                          <div className="alt-tags-left">
                            <span className="alt-id-text">REF: {alt.route_id}</span>
                            <span className="alt-type-pill">{alt.route_type}</span>
                          </div>
                          <div className="alt-score-badge">
                            <span className="alt-score-label">Score</span>
                            <span className="alt-score-val">{alt.route_score}</span>
                            <span className="alt-score-denom">/100</span>
                          </div>
                        </div>

                        <div className="alt-stats-row">
                          <div className="alt-stat-col">
                            <span className="alt-label">Transit Time</span>
                            <span className="alt-num">{alt.transit_days} Days</span>
                            <span className={`alt-diff ${daysDiff > 0 ? 'slower' : 'faster'}`}>
                              {daysDiff > 0 ? `+${daysDiff}d slower` : daysDiff < 0 ? `${daysDiff}d faster` : 'equal'}
                            </span>
                          </div>

                          <div className="alt-stat-col">
                            <span className="alt-label">Distance</span>
                            <span className="alt-num">{(alt.distance_nm || 0).toLocaleString()} NM</span>
                            <span className="alt-diff text-muted">
                              {distDiff > 0 ? `+${distDiff.toLocaleString()} NM` : `${distDiff.toLocaleString()} NM`}
                            </span>
                          </div>

                          <div className="alt-stat-col">
                            <span className="alt-label">Transshipment</span>
                            <span className="alt-num">
                              {alt.transshipments === 0 ? 'Direct' : `${alt.transshipments} stop(s)`}
                            </span>
                            <span className="alt-diff text-muted">
                              {alt.transshipments === 0 ? 'Non-stop' : 'Hub transfer'}
                            </span>
                          </div>

                          <div className="alt-stat-col">
                            <span className="alt-label">Indicative Freight</span>
                            <span className="alt-num">${totalFreight.toLocaleString()}</span>
                            <span className="alt-diff text-muted">
                              ${(alt.base_freight_usd || 0).toLocaleString()} / TEU
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      {inquiryModalOpen && (
        <div className="modal-backdrop" onClick={() => setInquiryModalOpen(false)}>
          <div className="inquiry-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Maritime Broker Quotation Inquiry</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setInquiryModalOpen(false)}
                title="Close Modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {inquirySent ? (
              <div className="inquiry-success-view">
                <CheckCircleIcon size={48} className="text-emerald-500 mb-3" />
                <h4>Inquiry Logged Successfully!</h4>
                <p>
                  A commercial broker from our chartering desk will review your {query?.origin || data?.origin} → {query?.destination || data?.destination} request and prepare an official quotation within 4 business hours.
                </p>
                <button
                  type="button"
                  className="btn-hero-primary mt-4"
                  onClick={() => {
                    setInquirySent(false);
                    setInquiryModalOpen(false);
                  }}
                >
                  Return to Routing
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setInquirySent(true);
                }}
                className="inquiry-form"
              >
                <p className="inquiry-intro">
                  Request carrier allocation or custom charter rates for corridor <strong>{query?.origin || data?.origin} → {query?.destination || data?.destination}</strong> ({containerQty} × {query?.cargoType || data?.cargo_type || 'Standard Dry'}).
                </p>

                <div className="form-group">
                  <label>Company / Brokerage Name</label>
                  <input type="text" placeholder="e.g. Pacific Forwarding Ltd." required />
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" placeholder="broker@company.com" required />
                </div>

                <div className="form-group">
                  <label>Target Ready-to-Load Date</label>
                  <input type="date" required />
                </div>

                <div className="form-group">
                  <label>Special Instructions / Dangerous Cargo Notes</label>
                  <textarea rows={3} placeholder="Provide any IMO class, reefer temperature range, or specific carrier preferences..."></textarea>
                </div>

                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setInquiryModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-hero-primary">
                    Submit Broker Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
