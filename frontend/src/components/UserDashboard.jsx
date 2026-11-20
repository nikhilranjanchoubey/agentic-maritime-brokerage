import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserDashboard,
  fetchUserBookings,
  updateUserProfile,
  changeUserPassword,
} from '../services/api';
import ShipmentTrackingModal from './ShipmentTrackingModal';

export default function UserDashboard({ onBackToHome, onOpenSearch, viewMode = 'shipments' }) {
  const { user, updateUser } = useAuth();
  
  // Dashboard tab: 'shipments', 'searches', 'profile'
  const [activeTab, setActiveTab] = useState(viewMode === 'profile' ? 'profile' : 'shipments');

  const [bookings, setBookings] = useState([]);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  useEffect(() => {
    if (viewMode === 'profile') {
      setActiveTab('profile');
    }
  }, [viewMode]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashData, bookingsData] = await Promise.all([
        fetchUserDashboard(),
        fetchUserBookings(),
      ]);

      if (dashData?.recent_searches) {
        setSearches(dashData.recent_searches);
      }
      if (dashData?.user) {
        setFullName(dashData.user.full_name || '');
        setCompany(dashData.user.company || '');
        setPhone(dashData.user.phone || '');
      }
      setBookings(bookingsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load user information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenTracking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setTrackingModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    if (!fullName.trim()) {
      setProfileErr('Please provide your full name.');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await updateUserProfile({
        full_name: fullName.trim(),
        company: company.trim(),
        phone: phone.trim(),
      });
      setProfileMsg('Profile updated successfully.');
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (!currentPassword) {
      setPasswordErr('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErr('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changeUserPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordErr(err.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Top Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome to SeaRoute</h1>
            <p className="dashboard-subtitle">
              Manage your maritime route searches, track shipments, and oversee account details.
            </p>
          </div>
          <div className="dashboard-top-actions">
            <button type="button" className="btn-primary" onClick={onOpenSearch}>
              + Search Routes
            </button>
            <button type="button" className="btn-secondary" onClick={onBackToHome}>
              Back to Home
            </button>
          </div>
        </div>

        {error && <div className="form-error-banner mb-3">{error}</div>}

        {/* User Account Details Card */}
        <div className="card mb-3">
          <h2 className="card-title">Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">{user?.full_name || 'Maritime Shipper'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email Address</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">System Role</span>
              <span className="info-value">
                <span className="role-tag role-user">{(user?.role || 'user').toUpperCase()}</span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Company</span>
              <span className="info-value">{user?.company || 'None specified'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* User Dashboard Tabs */}
        <div className="tabs-nav-bar">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
          >
            My Shipments ({bookings.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'searches' ? 'active' : ''}`}
            onClick={() => setActiveTab('searches')}
          >
            Search History ({searches.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile & Settings
          </button>
        </div>

        {/* TAB 1: MY SHIPMENTS */}
        {activeTab === 'shipments' && (
          <div className="card">
            <div className="card-header-row">
              <div>
                <h2 className="card-title">My Booked Shipments</h2>
                <p className="card-subtitle">
                  Track and monitor shipment progress across verified operational milestones.
                </p>
              </div>
              <button type="button" className="btn-sm btn-primary" onClick={onOpenSearch}>
                + Book New Shipment
              </button>
            </div>

            {loading ? (
              <div className="loading-text">Loading your shipments...</div>
            ) : bookings.length === 0 ? (
              <div className="empty-table-state">
                <p>No shipments booked yet.</p>
                <button type="button" className="btn-primary mt-2" onClick={onOpenSearch}>
                  Search Routes & Book
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Origin Port (POL)</th>
                      <th>Destination Port (POD)</th>
                      <th>Containers</th>
                      <th>Booking Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.booking_id}>
                        <td>
                          <strong className="booking-code-cell">{b.booking_id}</strong>
                        </td>
                        <td>{b.origin}</td>
                        <td>{b.destination}</td>
                        <td>{b.containers} × {b.cargo_type}</td>
                        <td>{b.created_at ? b.created_at.split(' ')[0] : '-'}</td>
                        <td>
                          <span className={`status-badge status-${(b.current_status || 'order').toLowerCase().replace(/\s+/g, '-')}`}>
                            {b.current_status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-action-track"
                            onClick={() => handleOpenTracking(b.booking_id)}
                          >
                            Track Shipment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SEARCH HISTORY */}
        {activeTab === 'searches' && (
          <div className="card">
            <div className="card-header-row">
              <div>
                <h2 className="card-title">My Search History</h2>
                <p className="card-subtitle">Previous route intelligence inquiries and quotations.</p>
              </div>
              <button type="button" className="btn-sm btn-primary" onClick={onOpenSearch}>
                + New Search
              </button>
            </div>

            {loading ? (
              <div className="loading-text">Loading search history...</div>
            ) : searches.length === 0 ? (
              <div className="empty-table-state">
                No past route searches recorded. Click "Search Routes" to find shipping corridors.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Origin Port</th>
                      <th>Destination Port</th>
                      <th>Best Route</th>
                      <th>Transit (Days)</th>
                      <th>Distance (NM)</th>
                      <th>Freight (USD)</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searches.map((s) => (
                      <tr key={s.id}>
                        <td>{new Date(s.created_at).toLocaleDateString()}</td>
                        <td>{s.origin}</td>
                        <td>{s.destination}</td>
                        <td><strong>{s.best_route_id || 'N/A'}</strong></td>
                        <td>{s.transit_days || '-'}</td>
                        <td>{s.distance_nm?.toLocaleString() || '-'}</td>
                        <td>${s.base_freight_usd?.toLocaleString() || '-'}</td>
                        <td>
                          {s.route_score ? (
                            <span className="score-pill">{s.route_score.toFixed(1)}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="profile-grid">
            <div className="card">
              <h2 className="card-title">Edit Profile Information</h2>
              {profileMsg && <div className="form-success-banner mb-3">{profileMsg}</div>}
              {profileErr && <div className="form-error-banner mb-3">{profileErr}</div>}
              <form onSubmit={handleUpdateProfile} className="simple-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Company / Organization</label>
                  <input
                    type="text"
                    className="form-input"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="card-title">Change Password</h2>
              {passwordMsg && <div className="form-success-banner mb-3">{passwordMsg}</div>}
              {passwordErr && <div className="form-error-banner mb-3">{passwordErr}</div>}
              <form onSubmit={handleChangePassword} className="simple-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password (min 6 chars)</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={passwordSaving}>
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Shipment Tracking Modal */}
      <ShipmentTrackingModal
        isOpen={trackingModalOpen}
        bookingId={selectedBookingId}
        onClose={() => {
          setTrackingModalOpen(false);
          setSelectedBookingId(null);
        }}
      />
    </div>
  );
}
