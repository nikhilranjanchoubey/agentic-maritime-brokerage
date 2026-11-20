import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createShipmentBooking } from '../services/api';

const getTodayDateString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function ShipmentBookingModal({
  isOpen,
  routeData,
  onClose,
  onBookingSuccess,
  onOpenAuth,
}) {
  const { user, isAuthenticated } = useAuth();

  const [cargoDesc, setCargoDesc] = useState('');
  const [cargoType, setCargoType] = useState('Standard Dry (20ft / 40ft GP)');
  const [containers, setContainers] = useState(1);
  const [shipperName, setShipperName] = useState(user?.full_name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(getTodayDateString);

  useEffect(() => {
    if (isOpen) {
      setCargoDesc('');
      setDeliveryAddress('');
      setPickupDate(getTodayDateString());
      if (user?.full_name) setShipperName(user.full_name);
      if (user?.phone) setContactPhone(user.phone);
      if (user?.address) setPickupAddress(user.address);
    }
  }, [isOpen, user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  if (!isOpen) return null;

  // If user is not authenticated, prompt to sign in
  if (!isAuthenticated) {
    return (
      <div className="modal-backdrop">
        <div className="modal-card auth-prompt-modal">
          <div className="modal-header">
            <h3 className="modal-title">Sign In Required to Book</h3>
            <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <p className="auth-prompt-desc">
            Please sign in to your SeaRoute account or create a new account to book this shipping corridor.
          </p>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth('login');
              }}
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!cargoDesc.trim()) {
      setError('Please provide a cargo description.');
      return;
    }
    if (!shipperName.trim()) {
      setError('Please enter the shipper or company contact name.');
      return;
    }
    if (/\d/.test(shipperName) || !/^[a-zA-Z\s'-]+$/.test(shipperName.trim())) {
      setError('Shipper name must contain letters only (no numbers allowed).');
      return;
    }
    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!contactPhone.trim()) {
      setError('Please enter a contact phone number.');
      return;
    }
    if (cleanPhone.length !== 10 || /\D/.test(contactPhone.trim())) {
      setError('Contact phone number must be of 10 digits only (numbers only).');
      return;
    }
    if (!pickupAddress.trim()) {
      setError('Please enter the cargo pickup address.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Please enter the cargo delivery address.');
      return;
    }
    if (!pickupDate) {
      setError('Please select an expected pickup date.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        route_id: routeData?.route_id || 'R501',
        origin: routeData?.origin || '',
        destination: routeData?.destination || '',
        cargo_desc: cargoDesc.trim(),
        cargo_type: cargoType,
        containers: parseInt(containers, 10) || 1,
        shipper_name: shipperName.trim(),
        contact_phone: contactPhone.trim(),
        pickup_address: pickupAddress.trim(),
        delivery_address: deliveryAddress.trim(),
        pickup_date: pickupDate,
        transit_days: parseInt(routeData?.transit_days, 10) || 0,
        distance_nm: parseInt(routeData?.distance_nm, 10) || 0,
        transshipments: parseInt(routeData?.transshipments, 10) || 0,
        freight_usd: parseFloat(routeData?.base_freight_usd || 0.0) * (parseInt(containers, 10) || 1),
        intermediate_port: routeData?.intermediate_port || '',
      };

      const res = await createShipmentBooking(payload);
      if (res?.booking) {
        setConfirmedBooking(res.booking);
        if (onBookingSuccess) onBookingSuccess(res.booking);
      } else {
        throw new Error('Booking could not be confirmed in database.');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit shipment booking. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) onClose(); }}>
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-booking-title">
        {/* SUCCESS VIEW: Booking Confirmed */}
        {confirmedBooking ? (
          <div className="modal-body" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div className="confirmation-icon-box" style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>✓</div>
            <h2 className="confirmation-title" style={{ fontSize: 20, color: '#123456', marginBottom: 6 }}>Shipment Booking Confirmed!</h2>
            <p className="confirmation-subtitle" style={{ fontSize: 14, color: '#5A6A80', marginBottom: 20 }}>
              Your maritime shipment has been registered in the database.
            </p>

            <div className="booking-summary-banner" style={{ textAlign: 'left', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#5A6A80', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Booking ID</span>
                <span className="status-badge status-pending">Pending Approval</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#123456', fontFamily: 'monospace' }}>
                {confirmedBooking.booking_id}
              </div>
              <div style={{ borderTop: '1px solid #DCE4EC', paddingTop: 8, marginTop: 4, fontSize: 13 }}>
                <strong>Corridor:</strong> {confirmedBooking.origin} → {confirmedBooking.destination} | <strong>Freight:</strong> ${Number(confirmedBooking.freight_usd || 0).toLocaleString()} USD ({confirmedBooking.containers} TEU)
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none', padding: 0, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  if (onBookingSuccess) onBookingSuccess(confirmedBooking, true);
                }}
              >
                Track Shipment Now
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW: Request Shipment Booking */
          <>
            <div className="modal-header">
              <h3 id="modal-booking-title">Request Shipment Booking</h3>
              <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-body">
                {error && <div className="alert-banner alert-danger">{error}</div>}

                {/* Top Route Summary Banner */}
                <div className="booking-summary-banner">
                  <div>
                    <strong>Selected Route:</strong> {routeData?.route_id || 'R501'} ({routeData?.origin} → {routeData?.destination})
                  </div>
                  <div>
                    <strong>Cargo & Freight:</strong> {containers} TEU • ${Number((routeData?.base_freight_usd || 0) * (parseInt(containers, 10) || 1)).toLocaleString()} USD
                  </div>
                </div>

                {/* Row 1: Cargo Description (full width) */}
                <div className="form-group">
                  <label htmlFor="modal-bm-desc">Cargo Description *</label>
                  <input
                    id="modal-bm-desc"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Industrial machinery parts / Textiles / Electronics"
                    value={cargoDesc}
                    onChange={(e) => setCargoDesc(e.target.value)}
                    required
                  />
                </div>

                {/* Row 2: Shipper Name (half width) | Contact Phone Number (half width) */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="modal-bm-shipper">Shipper Name *</label>
                    <input
                      id="modal-bm-shipper"
                      type="text"
                      className="input-field"
                      placeholder="Letters only (e.g. Alexander Vance)"
                      value={shipperName}
                      onChange={(e) => setShipperName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ''))}
                      pattern="[A-Za-z\s'-]+"
                      title="Letters only, no digits allowed"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal-bm-phone">Contact Phone Number *</label>
                    <input
                      id="modal-bm-phone"
                      type="tel"
                      className="input-field"
                      placeholder="10-digit number (e.g. 9876543210)"
                      maxLength={10}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      pattern="[0-9]{10}"
                      title="Exactly 10 digits, numbers only"
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Pickup Address / Port Facility (half width) | Delivery Address (half width) */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="modal-bm-pickup">Pickup Address / Port Facility *</label>
                    <input
                      id="modal-bm-pickup"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Origin Port Terminal Warehouse Bay 3"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal-bm-deliv">Delivery Address *</label>
                    <input
                      id="modal-bm-deliv"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Inland Container Depot / Receiving Warehouse"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Row 4: Expected Cargo Ready / Pickup Date (full width) */}
                <div className="form-group">
                  <label htmlFor="modal-bm-date">Expected Cargo Ready / Pickup Date *</label>
                  <input
                    id="modal-bm-date"
                    type="date"
                    min={getTodayDateString()}
                    className="input-field"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Submitting Request...' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
