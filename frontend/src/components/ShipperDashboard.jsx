import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchPorts,
  fetchRouteOrigins,
  fetchRouteDestinations,
  analyzeRoute,
  createShipmentBooking,
  fetchUserBookings,
  cancelUserShipment,
} from '../services/api';
import ShipmentTrackingModal from './ShipmentTrackingModal';

const CARGO_TYPES = [
  'Dry Container (General)',
  'Refrigerated (Reefer)',
  'Electronics',
  'Hazardous Cargo',
  'Bulk Liquid (Tank)',
  'Flat Rack / Oversized',
];

// Helper to get today's local date string formatted as YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function ShipperDashboard({
  onBackToHome,
  onOpenAuth,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab,
  onNavClick,
}) {
  const { user, isAuthenticated, logout } = useAuth();

  // Route Search Form State
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [cargoType, setCargoType] = useState('Dry Container (General)');
  const [containers, setContainers] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRouteForBooking, setSelectedRouteForBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingForm, setBookingForm] = useState({
    cargo_desc: '',
    shipper_name: user?.full_name || '',
    contact_phone: user?.phone || '',
    pickup_address: user?.address || '',
    delivery_address: '',
    pickup_date: getTodayDateString(),
  });

  // Tab State: 'home' | 'consignments' (supports controlled prop from App or internal state)
  const [internalActiveTab, setInternalActiveTab] = useState('home');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setInternalActiveTab;

  // User Bookings State
  const [userBookings, setUserBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingBookingId, setTrackingBookingId] = useState(null);

  // Clear booking notifications on sign out or auth changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setBookingSuccess('');
      setBookingError('');
    }
  }, [isAuthenticated, user]);

  // Automatically dismiss booking success banner after 4 seconds (visible for 2-5 sec)
  useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => {
        setBookingSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [bookingSuccess]);

  // Prevent background scrolling while any modal is open
  useEffect(() => {
    if (showBookingModal || trackingModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBookingModal, trackingModalOpen]);

  // Load Origins and User Bookings on mount or authentication change
  useEffect(() => {
    async function initData() {
      try {
        const fetchTasks = [fetchRouteOrigins()];
        if (isAuthenticated) {
          fetchTasks.push(fetchUserBookings().catch(() => []));
        }
        const [origs, bks] = await Promise.all(fetchTasks);
        if (origs && origs.length > 0) {
          setOrigins(origs);
          if (origs.includes('Chennai')) {
            setSelectedOrigin('Chennai');
          } else {
            setSelectedOrigin(origs[0]);
          }
        } else {
          const portList = await fetchPorts();
          const pNames = portList.map((p) => p.name);
          setOrigins(pNames);
          if (pNames.length > 0) setSelectedOrigin(pNames[0]);
        }
        if (isAuthenticated && bks) {
          setUserBookings(bks || []);
        } else {
          setUserBookings([]);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    initData();
  }, [isAuthenticated]);

  // Keep booking form values synced with authenticated user profile
  useEffect(() => {
    if (user) {
      setBookingForm((prev) => ({
        ...prev,
        shipper_name: user.full_name || prev.shipper_name,
        contact_phone: user.phone || prev.contact_phone,
        pickup_address: user.address || prev.pickup_address,
      }));
    }
  }, [user]);

  // Handle Tab Switch with Authentication Guard
  const handleTabClick = (tab) => {
    if (tab === 'how-it-works' || tab === 'manual') {
      if (onNavClick) onNavClick('how-it-works');
      return;
    }
    if (tab === 'consignments' && !isAuthenticated) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    setActiveTab(tab);
  };

  // Whenever origin changes, load valid destinations for that origin
  useEffect(() => {
    async function loadDestinationsForOrigin() {
      if (!selectedOrigin) {
        setDestinations([]);
        setSelectedDestination('');
        return;
      }
      try {
        const dests = await fetchRouteDestinations(selectedOrigin);
        if (dests && dests.length > 0) {
          setDestinations(dests);
          if (dests.includes('Rotterdam')) {
            setSelectedDestination('Rotterdam');
          } else {
            setSelectedDestination(dests[0]);
          }
        } else {
          const portList = await fetchPorts();
          const filtered = portList.map((p) => p.name).filter((p) => p !== selectedOrigin);
          setDestinations(filtered);
          setSelectedDestination(filtered[0] || '');
        }
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    }
    loadDestinationsForOrigin();
  }, [selectedOrigin]);

  // Load User Bookings
  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await fetchUserBookings();
      setUserBookings(data || []);
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleCancelConsignment = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel consignment ${bookingId}?`)) {
      return;
    }
    try {
      await cancelUserShipment(bookingId);
      setBookingSuccess(`Consignment ${bookingId} has been successfully cancelled.`);
      loadBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel consignment.');
    }
  };

  // Reset Search Fields
  const handleReset = () => {
    setSelectedOrigin(origins[0] || '');
    setCargoType('Dry Container (General)');
    setContainers(1);
    setAnalysisResult(null);
    setSelectedRouteForBooking(null);
    setAnalysisError('');
  };

  // Analyze Optimal Route
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalysisError('');
    setBookingSuccess('');

    if (!selectedOrigin || !selectedDestination) {
      setAnalysisError('Please select both an Origin Port and a Destination Port.');
      return;
    }

    if (selectedOrigin.trim().toLowerCase() === selectedDestination.trim().toLowerCase()) {
      setAnalysisError('Origin Port and Destination Port cannot be identical.');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await analyzeRoute({
        origin: selectedOrigin,
        destination: selectedDestination,
        cargo_type: cargoType,
        containers: parseInt(containers, 10) || 1,
      });

      if (res.status === 'error') {
        setAnalysisError(res.message || 'No matching route is currently available for this port combination.');
        setAnalysisResult(null);
        setSelectedRouteForBooking(null);
      } else {
        setAnalysisResult(res);
        setSelectedRouteForBooking(res.recommended_route || null);
      }
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyze optimal maritime route.');
      setAnalysisResult(null);
      setSelectedRouteForBooking(null);
    } finally {
      setAnalyzing(false);
    }
  };

  // Open Booking Modal for Route (defaults to recommended route, or specified route from table)
  const handleOpenBooking = (routeToBook = null) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    const target = routeToBook || selectedRouteForBooking || analysisResult?.recommended_route;
    if (!target) return;
    setSelectedRouteForBooking(target);
    setBookingError('');
    setBookingForm({
      cargo_desc: '',
      shipper_name: user?.full_name || '',
      contact_phone: user?.phone || '',
      pickup_address: user?.address || '',
      delivery_address: '',
      pickup_date: getTodayDateString(),
    });
    setShowBookingModal(true);
  };

  // Submit Shipment Booking Request
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    const target = selectedRouteForBooking || analysisResult?.recommended_route;
    if (!target) return;

    setBookingError('');

    if (!bookingForm.cargo_desc.trim()) {
      setBookingError('Please enter a description for your cargo.');
      return;
    }
    if (!bookingForm.shipper_name.trim()) {
      setBookingError('Shipper name is required.');
      return;
    }
    if (/\d/.test(bookingForm.shipper_name) || !/^[a-zA-Z\s'-]+$/.test(bookingForm.shipper_name.trim())) {
      setBookingError('Shipper name must contain letters only (no numbers allowed).');
      return;
    }
    const cleanPhone = bookingForm.contact_phone.replace(/\D/g, '');
    if (!bookingForm.contact_phone.trim()) {
      setBookingError('Contact phone number is required.');
      return;
    }
    if (cleanPhone.length !== 10 || /\D/.test(bookingForm.contact_phone.trim())) {
      setBookingError('Contact phone number must be of 10 digits only (numbers only).');
      return;
    }
    if (!bookingForm.pickup_address.trim()) {
      setBookingError('Pickup address is required.');
      return;
    }
    if (!bookingForm.delivery_address.trim()) {
      setBookingError('Delivery address is required.');
      return;
    }

    setBookingLoading(true);
    try {
      const contCount = parseInt(containers, 10) || 1;
      const totalFreight = target.total_freight_usd ?? ((target.base_freight_usd || 0) * contCount);

      const bookingPayload = {
        route_id: target.route_id,
        origin: analysisResult.origin,
        destination: analysisResult.destination,
        cargo_desc: bookingForm.cargo_desc.trim(),
        cargo_type: cargoType,
        containers: contCount,
        shipper_name: bookingForm.shipper_name.trim(),
        contact_phone: bookingForm.contact_phone.trim(),
        pickup_address: bookingForm.pickup_address.trim(),
        delivery_address: bookingForm.delivery_address.trim(),
        pickup_date: bookingForm.pickup_date,
        transit_days: target.transit_days,
        distance_nm: target.distance_nm,
        transshipments: target.transshipments,
        freight_usd: totalFreight,
      };

      const res = await createShipmentBooking(bookingPayload);
      const newBooking = res.booking;

      setBookingSuccess(
        `✓ Shipment booking request submitted successfully! Booking ID: ${newBooking.booking_id}. Your request is currently Pending administrator approval.`
      );
      setBookingForm({
        cargo_desc: '',
        shipper_name: user?.full_name || '',
        contact_phone: user?.phone || '',
        pickup_address: user?.address || '',
        delivery_address: '',
        pickup_date: getTodayDateString(),
      });
      setShowBookingModal(false);
      setSelectedRouteForBooking(null);
      setActiveTab('consignments');
      loadBookings();
    } catch (err) {
      setBookingError(err.message || 'Failed to submit shipment booking request.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Prepare full comparison list (Rank 1 recommended + alternatives)
  // All score metrics (Transit Score, Distance Score, Transshipment Score, Overall Score) removed per user instruction.
  const comparisonList = [];
  if (analysisResult?.recommended_route) {
    const rec = analysisResult.recommended_route;
    const contCount = parseInt(containers, 10) || 1;
    comparisonList.push({
      rank: 1,
      route_id: rec.route_id,
      route_type: rec.route_type,
      transit_days: rec.transit_days,
      distance_nm: rec.distance_nm,
      transshipments: rec.transshipments,
      base_freight_usd: rec.base_freight_usd,
      total_freight_usd: rec.total_freight_usd || (rec.base_freight_usd * contCount),
      raw_route: rec,
    });

    if (analysisResult.alternative_routes && analysisResult.alternative_routes.length > 0) {
      analysisResult.alternative_routes.forEach((alt, idx) => {
        comparisonList.push({
          rank: idx + 2,
          route_id: alt.route_id,
          route_type: alt.route_type,
          transit_days: alt.transit_days,
          distance_nm: alt.distance_nm,
          transshipments: alt.transshipments,
          base_freight_usd: alt.base_freight_usd,
          total_freight_usd: alt.total_freight_usd || (alt.base_freight_usd * contCount),
          raw_route: alt,
        });
      });
    }
  }

  return (
    <div className="shipper-container">
      {/* Top Header */}
      <header className="shipper-header-nav">
        <div className="shipper-header-brand" onClick={() => handleTabClick('home')} style={{ cursor: 'pointer' }}>
          <img src="/searoute-logo.jpg" alt="SeaRoute Logo" className="brand-logo-img" />
          <h1 className="shipper-brand-title">SeaRoute</h1>
        </div>

        {/* Shipper Navigation Tabs */}
        <nav className="shipper-nav-tabs">
          <button
            type="button"
            className={`shipper-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`shipper-nav-btn ${activeTab === 'consignments' ? 'active' : ''}`}
            onClick={() => handleTabClick('consignments')}
          >
            My Consignment
          </button>
          <button
            type="button"
            className={`shipper-nav-btn ${activeTab === 'how-it-works' ? 'active' : ''}`}
            onClick={() => handleTabClick('how-it-works')}
          >
            How It Works
          </button>
        </nav>

        <div className="shipper-header-actions">
          {isAuthenticated ? (
            <>
              <span className="shipper-badge">
                <span className="user-avatar-circle">
                  {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="user-name-text">
                  {user?.full_name || user?.email?.split('@')[0] || 'Shipper'}
                </span>
              </span>
              <button type="button" className="btn-secondary btn-sm" onClick={logout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => onOpenAuth && onOpenAuth('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => onOpenAuth && onOpenAuth('signup')}
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      <div className="shipper-body">
        {bookingSuccess && (
          <div className="alert-banner alert-success alert-dismissible">
            <span>{bookingSuccess}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setBookingSuccess('')}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: HOME (QUOTATION & BOOKING, WHY CHOOSE US, PLATFORM FEATURES)
        ========================================================================= */}
        {activeTab === 'home' && (
          <>
            {/* SECTION 4.1: MARITIME FREIGHT QUOTATION & BOOKING */}
            <section id="route-quotation-card" className="card-box">
          <div className="card-box-header">
            <div>
              <h2 className="card-box-title">Maritime Freight Quotation & Booking</h2>
              <p className="card-box-subtitle">
                Find suitable shipping routes and compare freight options for your cargo.
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="quotation-form">
            {analysisError && <div className="alert-banner alert-danger">{analysisError}</div>}

            <div className="form-row-4">
              {/* 1. Origin Port */}
              <div className="form-group">
                <label>Origin Port (Departure) *</label>
                <select
                  className="input-field"
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  required
                >
                  {origins.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Destination Port (filtered for origin) */}
              <div className="form-group">
                <label>Destination Port (Discharge) *</label>
                <select
                  className="input-field"
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  required
                >
                  {destinations.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Cargo Type */}
              <div className="form-group">
                <label>Cargo Type *</label>
                <select
                  className="input-field"
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                >
                  {CARGO_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Number of Containers */}
              <div className="form-group">
                <label>Number of Containers (TEU) *</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  className="input-field"
                  value={containers}
                  onChange={(e) => setContainers(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-actions-row">
              <button type="button" className="btn-secondary" onClick={handleReset}>
                Reset Fields
              </button>
              <button type="submit" className="btn-primary" disabled={analyzing}>
                {analyzing ? 'Analyzing Corridor...' : 'Analyze Optimal Route'}
              </button>
            </div>
          </form>
        </section>

        {/* =========================================================================
            SECTION 4.2: RECOMMENDED ROUTE RESULT (CLEAN 5 CARDS, NO FORMULA BOX)
        ========================================================================= */}
        {analysisResult?.recommended_route && (
          <section className="card-box mt-4">
            <div className="card-box-header">
              <div>
                <span className="badge-highlight">★ RECOMMENDED OPTIMAL CORRIDOR</span>
                <h2 className="card-box-title mt-1">
                  Recommended Route: {analysisResult.origin} → {analysisResult.destination}
                </h2>
                <p className="card-box-subtitle">
                  Optimized for transit speed, voyage distance, and minimal transshipments across active trade lanes.
                </p>
              </div>
              <button type="button" className="btn-primary" onClick={() => handleOpenBooking(analysisResult.recommended_route)}>
                Request Shipment Booking on this Route
              </button>
            </div>

            {/* Exactly Five Information Cards: Route ID, Transit Time, Voyage Distance (in nm), Transshipments, Total Freight Cost */}
            <div className="route-metrics-grid">
              <div className="metric-cell">
                <div className="metric-label">Route ID</div>
                <div className="metric-val font-mono">{analysisResult.recommended_route.route_id}</div>
              </div>

              <div className="metric-cell">
                <div className="metric-label">Transit Time</div>
                <div className="metric-val">{analysisResult.recommended_route.transit_days} Days</div>
              </div>

              <div className="metric-cell">
                <div className="metric-label">Voyage Distance (in nm)</div>
                <div className="metric-val">
                  {Number(analysisResult.recommended_route.distance_nm).toLocaleString()}
                </div>
              </div>

              <div className="metric-cell">
                <div className="metric-label">Transshipments</div>
                <div className="metric-val">{analysisResult.recommended_route.transshipments}</div>
              </div>

              <div className="metric-cell metric-cell-highlight">
                <div className="metric-label">Total Freight Cost</div>
                <div className="metric-val font-bold text-navy">
                  ${Number(analysisResult.recommended_route.total_freight_usd).toLocaleString()}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 4.3: AVAILABLE ROUTE COMPARISON (NO SCORE COLUMNS, WITH BOOK ACTION)
        ========================================================================= */}
        {comparisonList.length > 0 && (
          <section className="card-box mt-4">
            <div className="card-box-header">
              <div>
                <h3 className="card-box-title">Available Route Comparison</h3>
                <p className="card-box-subtitle">
                  Comparison table of all available routes for {analysisResult?.origin} → {analysisResult?.destination}. You can choose and book any route below.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Route ID</th>
                    <th>Route Type</th>
                    <th>Transit (Days)</th>
                    <th>Distance (NM)</th>
                    <th>Transshipments</th>
                    <th>Total Freight (USD)</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonList.map((r) => (
                    <tr key={r.route_id}>
                      <td style={{ fontWeight: 600, color: '#123456' }}>{r.rank}</td>
                      <td className="font-mono font-bold">{r.route_id}</td>
                      <td>{r.route_type}</td>
                      <td>{r.transit_days} d</td>
                      <td>{Number(r.distance_nm).toLocaleString()} NM</td>
                      <td>{r.transshipments}</td>
                      <td style={{ fontWeight: 600, color: '#123456' }}>
                        ${Number(r.total_freight_usd).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => handleOpenBooking(r.raw_route || r)}
                        >
                          Book Route
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 4.2B: WHY CHOOSE US / WHY TRUST US (HOME TAB)
        ========================================================================= */}
            <section className="card-box mt-4">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Why Choose SeaRoute</h2>
                  <p className="card-box-subtitle">
                    A dependable, verified brokerage platform for maritime route analysis, transparent freight benchmarking, and consignment tracking.
                  </p>
                </div>
              </div>

              <div className="why-trust-grid mt-3">
                <div className="why-trust-card">
                  <div className="why-trust-icon">🧭</div>
                  <h3 className="why-trust-title">Optimized Route Intelligence</h3>
                  <p className="why-trust-desc">
                    Intelligent route optimization balances transit speed, sailing distance, and transshipment safety across global shipping corridors.
                  </p>
                </div>

                <div className="why-trust-card">
                  <div className="why-trust-icon">🌍</div>
                  <h3 className="why-trust-title">Verified Port Corridors</h3>
                  <p className="why-trust-desc">
                    Comprehensive dataset connecting 47 premier international container terminals across Asia, Europe, Middle East, and the Americas.
                  </p>
                </div>

                <div className="why-trust-card">
                  <div className="why-trust-icon">💰</div>
                  <h3 className="why-trust-title">Transparent Freight Benchmarks</h3>
                  <p className="why-trust-desc">
                    Dataset-grounded TEU pricing with predictable calculations, eliminating undisclosed carrier markups and intermediary broker fees.
                  </p>
                </div>

                <div className="why-trust-card">
                  <div className="why-trust-icon">📦</div>
                  <h3 className="why-trust-title">Reliable Shipment Tracking</h3>
                  <p className="why-trust-desc">
                    Direct visibility into consolidated maritime dispatch milestones from port intake to destination delivery with verified notes.
                  </p>
                </div>
              </div>
            </section>

        {/* =========================================================================
            SECTION 4.2C: PLATFORM FEATURES (HOME TAB)
        ========================================================================= */}
            <section className="card-box mt-4">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Platform Features & Capabilities</h2>
                  <p className="card-box-subtitle">
                    Key functionalities available in your commercial maritime brokerage workspace.
                  </p>
                </div>
              </div>

              <div className="features-highlight-grid mt-3">
                <div className="feature-item-card">
                  <div className="feature-item-badge">ROUTE AGENT</div>
                  <h4 className="feature-item-title">Autonomous Corridor Scoring</h4>
                  <p className="feature-item-desc">
                    Automated multi-criteria evaluation normalizes transit time, nautical miles, and transshipment stops to compute the optimal corridor.
                  </p>
                </div>

                <div className="feature-item-card">
                  <div className="feature-item-badge">BOOKING DESK</div>
                  <h4 className="feature-item-title">Streamlined Consignment Orders</h4>
                  <p className="feature-item-desc">
                    Instant booking modal automatically binds selected route parameters, TEU quantity, cargo description, and scheduled pickup date.
                  </p>
                </div>

                <div className="feature-item-card">
                  <div className="feature-item-badge">LIVE TRACKING</div>
                  <h4 className="feature-item-title">7-Stage Milestone Tracking</h4>
                  <p className="feature-item-desc">
                    Consolidated tracking timeline monitors order intake, port reception, vessel transit, and final delivery without unnecessary clutter.
                  </p>
                </div>

                <div className="feature-item-card">
                  <div className="feature-item-badge">SUPPORT & ASSISTANCE</div>
                  <h4 className="feature-item-title">Dedicated Port Desk Assistance</h4>
                  <p className="feature-item-desc">
                    Direct assistance for port intake, cargo documentation, and quick administrative approvals so your cargo moves without delays.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* =========================================================================
            TAB 2: MY CONSIGNMENT (MY CONSIGNMENT BOOKINGS & STATUS)
        ========================================================================= */}
        {activeTab === 'consignments' && (
          !isAuthenticated ? (
            <section className="card-box" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '42px', marginBottom: '16px' }}>🔒</div>
              <h2 className="card-box-title" style={{ fontSize: '20px', marginBottom: '8px' }}>
                Sign In Required to View Consignments
              </h2>
              <p className="card-box-subtitle" style={{ maxWidth: '480px', margin: '0 auto 24px' }}>
                Please sign in to access your consignment tracking records, shipment milestones, and order history.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onOpenAuth && onOpenAuth('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onOpenAuth && onOpenAuth('signup')}
                >
                  Register New Account
                </button>
              </div>
            </section>
          ) : (
          <section id="my-bookings-section" className="card-box">
            <div className="card-box-header">
              <div>
                <h2 className="card-box-title">My Consignment Bookings & Status</h2>
                <p className="card-box-subtitle">
                  Track and manage your submitted shipment orders and review approval progress.
                </p>
              </div>
              <button type="button" className="btn-secondary btn-sm" onClick={loadBookings}>
                Refresh Status
              </button>
            </div>

            {bookingsLoading ? (
              <div className="loading-state">Loading your shipments...</div>
            ) : userBookings.length === 0 ? (
              <div className="empty-state-notice">
                You do not have any active shipment bookings yet. Switch to the Home tab to analyze routes and request a booking.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Origin → Destination</th>
                      <th>Cargo Type</th>
                      <th>Container Quantity</th>
                      <th>Transit Days</th>
                      <th>Estimated Total Freight</th>
                      <th>Booking Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBookings.map((b) => {
                      const isPending = b.booking_status === 'Pending' || b.current_status === 'Pending' || b.current_status === 'Order Placed';
                      const isApproved = b.booking_status === 'Approved' || b.current_status === 'Approved';
                      const isRejected = b.booking_status === 'Rejected' || b.current_status === 'Rejected';
                      const isCancelled = b.booking_status === 'Cancelled' || b.current_status === 'Cancelled' || (b.dispatch_status && b.dispatch_status.toLowerCase().includes('cancelled'));

                      return (
                        <tr key={b.booking_id}>
                          <td className="font-mono font-bold text-navy">{b.booking_id}</td>
                          <td>
                            <strong>{b.origin}</strong> → <strong>{b.destination}</strong>
                          </td>
                          <td>
                            <div>{b.cargo_type}</div>
                            <div className="text-muted text-xs">{b.cargo_desc}</div>
                          </td>
                          <td><strong>{b.containers} TEU</strong></td>
                          <td>{b.transit_days} Days</td>
                          <td><strong>${Number(b.freight_usd || 0).toLocaleString()}</strong></td>
                          <td>
                            <span
                              className={`status-badge ${
                                isPending
                                  ? 'status-pending'
                                  : isApproved
                                  ? 'status-approved'
                                  : isCancelled
                                  ? 'status-cancelled'
                                  : isRejected
                                  ? 'status-rejected'
                                  : 'status-info'
                              }`}
                            >
                              {isCancelled ? 'Cancelled' : isRejected ? 'Rejected' : b.booking_status || b.current_status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="booking-actions-row">
                              <button
                                type="button"
                                className="btn-outline btn-xs"
                                onClick={() => {
                                  setTrackingBookingId(b.booking_id);
                                  setTrackingModalOpen(true);
                                }}
                              >
                                Track Shipment
                              </button>
                              {!isCancelled && !isRejected && b.dispatch_status !== 'In Transit' && b.dispatch_status !== 'Arrived at Destination Port' && b.dispatch_status !== 'Delivered' && b.current_status !== 'In Transit' && b.current_status !== 'Delivered' && (
                                <button
                                  type="button"
                                  className="btn-cancel-consignment btn-xs"
                                  onClick={() => handleCancelConsignment(b.booking_id)}
                                  title="Cancel consignment booking"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) )}
      </div>

      {/* =========================================================================
          MODAL: REQUEST SHIPMENT BOOKING FORM (FIXED CENTERED & PROPERLY ALIGNED)
      ========================================================================= */}
      {showBookingModal && (selectedRouteForBooking || analysisResult?.recommended_route) && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.classList.contains('modal-backdrop')) {
              setShowBookingModal(false);
              setSelectedRouteForBooking(null);
            }
          }}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <h3 id="modal-title">Request Shipment Booking</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedRouteForBooking(null);
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="modal-form">
              <div className="modal-body">
                {bookingError && <div className="alert-banner alert-danger">{bookingError}</div>}

                {/* Selected Route Summary Banner */}
                {(() => {
                  const targetRoute = selectedRouteForBooking || analysisResult?.recommended_route;
                  const contCount = parseInt(containers, 10) || 1;
                  const totalFreight = targetRoute?.total_freight_usd ?? ((targetRoute?.base_freight_usd || 0) * contCount);
                  return (
                    <div className="booking-summary-banner">
                      <div>
                        <strong>Selected Route:</strong> {targetRoute?.route_id} ({analysisResult?.origin} → {analysisResult?.destination})
                      </div>
                      <div>
                        <strong>Cargo & Freight:</strong> {contCount} TEU • ${Number(totalFreight).toLocaleString()} USD
                      </div>
                    </div>
                  );
                })()}

                {/* Row 1: Cargo Description */}
                <div className="form-group">
                  <label htmlFor="modal-cargo-desc">Cargo Description *</label>
                  <input
                    id="modal-cargo-desc"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Industrial machinery parts / Textiles / Electronics"
                    value={bookingForm.cargo_desc}
                    onChange={(e) => setBookingForm({ ...bookingForm, cargo_desc: e.target.value })}
                    required
                  />
                </div>

                {/* Row 2: Shipper Name & Contact Phone Number */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="modal-shipper-name">Shipper Name *</label>
                    <input
                      id="modal-shipper-name"
                      type="text"
                      className="input-field"
                      placeholder="Letters only (e.g. Alexander Vance)"
                      value={bookingForm.shipper_name}
                      onChange={(e) => setBookingForm({ ...bookingForm, shipper_name: e.target.value.replace(/[^a-zA-Z\s'-]/g, '') })}
                      pattern="[A-Za-z\s'-]+"
                      title="Letters only, no numbers allowed"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal-contact-phone">Contact Phone Number *</label>
                    <input
                      id="modal-contact-phone"
                      type="tel"
                      className="input-field"
                      placeholder="10-digit number (e.g. 9876543210)"
                      maxLength={10}
                      value={bookingForm.contact_phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      pattern="[0-9]{10}"
                      title="Exactly 10 digits, numbers only"
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Pickup Address / Port Facility & Delivery Address */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="modal-pickup-address">Pickup Address / Port Facility *</label>
                    <input
                      id="modal-pickup-address"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Origin Port Terminal Warehouse Bay 3"
                      value={bookingForm.pickup_address}
                      onChange={(e) => setBookingForm({ ...bookingForm, pickup_address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal-delivery-address">Delivery Address *</label>
                    <input
                      id="modal-delivery-address"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Inland Container Depot / Receiving Warehouse"
                      value={bookingForm.delivery_address}
                      onChange={(e) => setBookingForm({ ...bookingForm, delivery_address: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 4: Expected Cargo Ready / Pickup Date */}
                <div className="form-group">
                  <label htmlFor="modal-pickup-date">Expected Cargo Ready / Pickup Date *</label>
                  <input
                    id="modal-pickup-date"
                    type="date"
                    min={getTodayDateString()}
                    className="input-field"
                    value={bookingForm.pickup_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, pickup_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={bookingLoading}>
                  {bookingLoading ? 'Submitting Request...' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipment Tracking Timeline Modal */}
      <ShipmentTrackingModal
        isOpen={trackingModalOpen}
        bookingId={trackingBookingId}
        onClose={() => {
          setTrackingModalOpen(false);
          setTrackingBookingId(null);
        }}
      />
    </div>
  );
}
