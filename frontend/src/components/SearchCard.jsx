import React, { useState, useEffect } from 'react';
import PortSelect from './PortSelect';
import CargoSelect from './CargoSelect';
import DatePicker from './DatePicker';
import { SwapIcon, SearchIcon } from './Icons';
import { analyzeRoute } from '../services/api';

export default function SearchCard({
  ports = [],
  onResultsFound,
  prefillOrigin = '',
  prefillDestination = '',
}) {
  const [origin, setOrigin] = useState(prefillOrigin || 'Chennai');
  const [destination, setDestination] = useState(prefillDestination || 'Rotterdam');
  const [cargoType, setCargoType] = useState('Standard Dry');
  const [containers, setContainers] = useState(1);
  const [readyDate, setReadyDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Handle external prefill triggers
  useEffect(() => {
    if (prefillOrigin) setOrigin(prefillOrigin);
    if (prefillDestination) setDestination(prefillDestination);
  }, [prefillOrigin, prefillDestination]);

  const handleSwapPorts = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setValidationError('');
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    if (!origin.trim()) {
      setValidationError('Please select an Origin Port (POL).');
      return;
    }
    if (!destination.trim()) {
      setValidationError('Please select a Destination Port (POD).');
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setValidationError('Origin and Destination ports cannot be identical. Please select distinct ports.');
      return;
    }
    const containerCount = parseInt(containers, 10);
    if (isNaN(containerCount) || containerCount <= 0) {
      setValidationError('Number of containers must be a positive integer (minimum 1 TEU).');
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeRoute({
        origin: origin.trim(),
        destination: destination.trim(),
        cargo_type: cargoType,
        containers: containerCount,
      });

      onResultsFound({
        success: true,
        data,
        query: { origin, destination, cargoType, containers: containerCount, readyDate },
      });

      setTimeout(() => {
        const resultsEl = document.getElementById('route-results-section');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      onResultsFound({
        success: false,
        error: err.message || 'No matching route is currently available for this corridor.',
        query: { origin, destination, cargoType, containers: containerCount, readyDate },
      });
      setTimeout(() => {
        const resultsEl = document.getElementById('route-results-section');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skytech-search-card-wrapper" id="search-section">
      <div className="skytech-search-card-box">
        {/* SkyTech-Style Balanced 2-Row Search Form */}
        <form onSubmit={handleSearch} className="skytech-rows-container">
          {/* ROW 1: [ ORIGIN PORT (POL) ] ⇄ [ DESTINATION PORT (POD) ] [ READY DATE ] */}
          <div className="skytech-row-1">
            <div className="skytech-ports-pair">
              <div className="skytech-port-col">
                <PortSelect
                  label="ORIGIN PORT (POL)"
                  placeholder="Search origin port..."
                  value={origin}
                  onChange={(val) => {
                    setOrigin(val);
                    setValidationError('');
                  }}
                  ports={ports}
                  disabledPort={destination}
                />
              </div>

              {/* Floating Circular Swap Button Centered Between Ports */}
              <button
                type="button"
                className="skytech-swap-btn-floating"
                onClick={handleSwapPorts}
                title="Swap origin and destination ports"
                aria-label="Swap origin and destination"
              >
                <SwapIcon size={16} />
              </button>

              <div className="skytech-port-col">
                <PortSelect
                  label="DESTINATION PORT (POD)"
                  placeholder="Search destination port..."
                  value={destination}
                  onChange={(val) => {
                    setDestination(val);
                    setValidationError('');
                  }}
                  ports={ports}
                  disabledPort={origin}
                />
              </div>
            </div>

            {/* Ready Date Field with SkyTech Calendar Popup */}
            <div className="skytech-ready-date-col">
              <DatePicker
                value={readyDate}
                onChange={(dateStr) => setReadyDate(dateStr)}
                label="READY DATE"
              />
            </div>
          </div>

          {/* ROW 2: [ CARGO TYPE ] [ NUMBER OF CONTAINERS (TEU) ] [ FIND BEST ROUTES CTA ] */}
          <div className="skytech-row-2">
            {/* Cargo Type Selector */}
            <div className="skytech-row2-col">
              <CargoSelect
                value={cargoType}
                onChange={(val) => setCargoType(val)}
              />
            </div>

            {/* Container Quantity / TEU Box */}
            <div className="skytech-row2-col">
              <div className="skytech-containers-box" title="Enter the number of containers (TEU)">
                <div className="skytech-containers-label-row">
                  <span className="skytech-label-hash">#</span>
                  <span className="skytech-containers-label">CONTAINERS (TEU)</span>
                </div>
                <div className="skytech-containers-value-row">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    step="1"
                    className="skytech-number-input"
                    placeholder="1"
                    value={containers}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContainers(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                      setValidationError('');
                    }}
                    required
                  />
                  <span className="skytech-unit-badge">TEU</span>
                </div>
                <div className="skytech-containers-subtext">Twenty-Foot Equivalent Units</div>
              </div>
            </div>

            {/* Find Best Routes Action CTA Button */}
            <div className="skytech-row2-col">
              <button
                type="submit"
                className="skytech-search-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="skytech-btn-spinner"></span>
                    <span>Analyzing Routes...</span>
                  </>
                ) : (
                  <>
                    <SearchIcon size={18} className="skytech-btn-icon" />
                    <span>Find Best Routes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Validation Warning Alert */}
        {validationError && (
          <div className="skytech-validation-banner">
            <span className="skytech-warn-icon">⚠️</span>
            <span>{validationError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
