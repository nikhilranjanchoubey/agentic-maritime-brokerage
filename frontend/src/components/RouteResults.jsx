import React from 'react';

export default function RouteResults({ resultState, onReset, onBookRoute }) {
  if (!resultState) return null;

  const { success, data, error, query } = resultState;

  if (!success || !data || data.status === 'error' || !data.recommended_route) {
    return (
      <section className="results-section" id="route-results">
        <div className="results-container">
          <div className="results-card empty-results">
            <h2 className="results-heading">Available Shipping Routes</h2>
            <p className="no-routes-message">
              No matching routes found for the selected ports.
            </p>
            {onReset && (
              <button type="button" className="btn-secondary" onClick={onReset}>
                Clear Search
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const rec = data.recommended_route;
  const alternatives = data.alternative_routes || [];
  const origin = query?.origin || data.origin;
  const destination = query?.destination || data.destination;

  return (
    <section className="results-section" id="route-results">
      <div className="results-container">
        <div className="results-header">
          <div>
            <h2 className="results-heading">Available Shipping Routes</h2>
            <p className="results-corridor">
              Showing routes for: <strong>{origin}</strong> → <strong>{destination}</strong>
            </p>
          </div>
          {onReset && (
            <button type="button" className="btn-reset-search" onClick={onReset}>
              Close Results
            </button>
          )}
        </div>

        {/* Recommended Route Card First */}
        <div className="recommended-card">
          <div className="rec-card-header">
            <div className="rec-badge-group">
              <span className="rec-badge">Recommended Route</span>
              <span className="rec-route-id">Route ID: {rec.route_id}</span>
            </div>
            {onBookRoute && (
              <button
                type="button"
                className="btn-book-route"
                onClick={() => onBookRoute({ ...rec, origin, destination })}
              >
                Book This Route
              </button>
            )}
          </div>

          <div className="rec-corridor-row">
            <div className="rec-port-col">
              <span className="rec-port-label">Origin</span>
              <span className="rec-port-name">{origin}</span>
            </div>
            <div className="rec-arrow">➔</div>
            <div className="rec-port-col">
              <span className="rec-port-label">Destination</span>
              <span className="rec-port-name">{destination}</span>
            </div>
          </div>

          <div className="rec-metrics-grid">
            <div className="rec-metric-item">
              <span className="metric-label">Transit Time</span>
              <span className="metric-value">{rec.transit_days} Days</span>
            </div>

            <div className="rec-metric-item">
              <span className="metric-label">Distance</span>
              <span className="metric-value">{rec.distance_nm?.toLocaleString()} NM</span>
            </div>

            <div className="rec-metric-item">
              <span className="metric-label">Transshipments</span>
              <span className="metric-value">
                {rec.transshipments === 0 ? '0 (Direct)' : `${rec.transshipments} stop(s)`}
              </span>
            </div>

            <div className="rec-metric-item">
              <span className="metric-label">Route Score</span>
              <span className="metric-value score-highlight">
                {typeof rec.route_score === 'number' ? rec.route_score.toFixed(1) : rec.route_score} / 100
              </span>
            </div>

            <div className="rec-metric-item">
              <span className="metric-label">Total Freight Cost</span>
              <span className="metric-value price-highlight">
                ${rec.base_freight_usd?.toLocaleString()} USD
              </span>
            </div>
          </div>
        </div>

        {/* Alternative Routes Table Below */}
        {alternatives.length > 0 && (
          <div className="alternatives-wrapper">
            <h3 className="alternatives-title">Alternative Routes ({alternatives.length})</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Route ID</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Transit (Days)</th>
                    <th>Distance (NM)</th>
                    <th>Transshipments</th>
                    <th>Route Type</th>
                    <th>Base Freight</th>
                    <th>Score</th>
                    {onBookRoute && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {alternatives.map((alt) => (
                    <tr key={alt.route_id}>
                      <td><strong>{alt.route_id}</strong></td>
                      <td>{origin}</td>
                      <td>{destination}</td>
                      <td>{alt.transit_days}</td>
                      <td>{alt.distance_nm?.toLocaleString()}</td>
                      <td>{alt.transshipments === 0 ? '0 (Direct)' : alt.transshipments}</td>
                      <td>{alt.route_type}</td>
                      <td>${alt.base_freight_usd?.toLocaleString()}</td>
                      <td>
                        <span className="score-pill">
                          {typeof alt.route_score === 'number' ? alt.route_score.toFixed(1) : alt.route_score}
                        </span>
                      </td>
                      {onBookRoute && (
                        <td>
                          <button
                            type="button"
                            className="btn-book-sm"
                            onClick={() => onBookRoute({ ...alt, origin, destination })}
                          >
                            Book
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
