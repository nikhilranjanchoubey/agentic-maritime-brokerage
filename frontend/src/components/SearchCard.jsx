import React, { useState, useEffect } from 'react';
import PortSelect from './PortSelect';
import { analyzeRoute } from '../services/api';

export default function SearchCard({
  ports = [],
  onResultsFound,
  prefillOrigin = '',
  prefillDestination = '',
}) {
  const [origin, setOrigin] = useState(prefillOrigin || 'Chennai');
  const [destination, setDestination] = useState(prefillDestination || 'Rotterdam');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefillOrigin) setOrigin(prefillOrigin);
    if (prefillDestination) setDestination(prefillDestination);
  }, [prefillOrigin, prefillDestination]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setError('');
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!origin.trim()) {
      setError('Please select an origin port.');
      return;
    }
    if (!destination.trim()) {
      setError('Please select a destination port.');
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Origin and destination ports cannot be the same.');
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeRoute({
        origin: origin.trim(),
        destination: destination.trim(),
        cargo_type: 'Standard Dry',
        containers: 1,
      });

      onResultsFound({
        success: true,
        data,
        query: { origin, destination },
      });

      setTimeout(() => {
        const resultsEl = document.getElementById('route-results');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      onResultsFound({
        success: false,
        error: err.message || 'No matching routes found for the selected ports.',
        query: { origin, destination },
      });
      setTimeout(() => {
        const resultsEl = document.getElementById('route-results');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="search-section" id="route-search">
      <div className="search-card">
        <h2 className="search-card-title">Route Search</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-fields-row">
            <div className="search-field-col">
              <PortSelect
                label="Origin Port (POL)"
                value={origin}
                onChange={(val) => {
                  setOrigin(val);
                  setError('');
                }}
                ports={ports}
                placeholder="Search origin port..."
              />
            </div>

            <button
              type="button"
              className="btn-swap-ports"
              onClick={handleSwap}
              title="Swap origin and destination"
              aria-label="Swap Ports"
            >
              ⇄
            </button>

            <div className="search-field-col">
              <PortSelect
                label="Destination Port (POD)"
                value={destination}
                onChange={(val) => {
                  setDestination(val);
                  setError('');
                }}
                ports={ports}
                placeholder="Search destination port..."
              />
            </div>
          </div>

          {error && <div className="form-error-banner">{error}</div>}

          <div className="search-action-row">
            <button
              type="submit"
              className="btn-find-routes"
              disabled={loading}
            >
              {loading ? 'Searching Routes...' : 'Find Routes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
