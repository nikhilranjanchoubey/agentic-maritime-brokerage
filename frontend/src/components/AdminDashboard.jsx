import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStats,
  fetchAdminUsers,
  toggleAdminUserStatus,
  deleteAdminUser,
  fetchAdminRoutes,
  addAdminRoute,
  updateAdminRoute,
  deleteAdminRoute,
  fetchAdminShipments,
  fetchPendingAdminShipments,
  approveAdminShipment,
  rejectAdminShipment,
  updateAdminShipmentStatus,
  cancelAdminShipment,
  deleteAdminShipment,
} from '../services/api';
import ShipmentTrackingModal from './ShipmentTrackingModal';

const SHIPMENT_STAGES = [
  'Booking Confirmed',
  'Cargo Received at Origin Port',
  'Loaded onto Vessel',
  'In Transit',
  'Arrived at Destination Port',
  'Delivered',
];

function getNextDispatchMilestone(currentDispatchStatus) {
  const curr = (currentDispatchStatus || '').trim();
  if (
    curr === 'Approved' ||
    curr === 'Approved - Ready for Dispatch' ||
    curr === 'Order Placed' ||
    curr === 'Booking Confirmed' ||
    curr === 'Pending' ||
    curr === 'Pending Approval'
  ) {
    return 'Cargo Received at Origin Port';
  }
  if (curr === 'Cargo Received at Origin Port' || curr === 'Cargo Received at Port') {
    return 'Loaded onto Vessel';
  }
  if (curr === 'Loaded onto Vessel') {
    return 'In Transit';
  }
  if (curr === 'In Transit') {
    return 'Arrived at Destination Port';
  }
  if (curr === 'Arrived at Destination Port') {
    return 'Delivered';
  }
  if (curr === 'Delivered') {
    return null;
  }
  const idx = SHIPMENT_STAGES.indexOf(curr);
  if (idx !== -1 && idx < SHIPMENT_STAGES.length - 1) {
    return SHIPMENT_STAGES[idx + 1];
  }
  return null;
}

export default function AdminDashboard({ onBackToHome }) {
  const { user: currentAdmin, logout } = useAuth();
  // 4 sections from instructor requirements
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'shipments', 'routes', 'shippers'

  // Operational Dashboard Stats & Queue
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingBookingId, setProcessingBookingId] = useState(null);

  // Shipment Requests State
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState('All');
  const [shipmentSuccess, setShipmentSuccess] = useState('');

  // Dispatch Status Update Modal State
  const [updatingShipment, setUpdatingShipment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState('');

  // Routes Management State
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesTotal, setRoutesTotal] = useState(0);
  const [routesTotalPages, setRoutesTotalPages] = useState(1);
  const [routesPage, setRoutesPage] = useState(1);
  const [routeSearch, setRouteSearch] = useState('');
  const [routeTypeFilter, setRouteTypeFilter] = useState('All');
  const [routeSuccess, setRouteSuccess] = useState('');

  // Add / Edit Route Modal State
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [routeForm, setRouteForm] = useState({
    route_id: '',
    origin: '',
    destination: '',
    distance_nm: 2500,
    transit_days: 10,
    transshipments: 0,
    route_type: 'Standard',
    base_freight_usd: 1500,
  });
  const [routeModalLoading, setRouteModalLoading] = useState(false);
  const [routeModalError, setRouteModalError] = useState('');

  // Registered Shippers State
  const [shippers, setShippers] = useState([]);
  const [shippersLoading, setShippersLoading] = useState(false);
  const [shipperError, setShipperError] = useState('');
  const [shipperSuccess, setShipperSuccess] = useState('');

  // Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingBookingId, setTrackingBookingId] = useState(null);

  // Clear notifications on tab switch or logout
  useEffect(() => {
    setActionMessage('');
    setActionError('');
    setShipmentSuccess('');
    setRouteSuccess('');
    setShipperSuccess('');
    setShipperError('');
  }, [activeTab, currentAdmin]);

  // Auto-dismiss success and error notifications after 3.5-4.5 seconds (visible for 2-5 sec)
  useEffect(() => {
    if (actionMessage) {
      const t = setTimeout(() => setActionMessage(''), 3500);
      return () => clearTimeout(t);
    }
  }, [actionMessage]);

  useEffect(() => {
    if (shipmentSuccess) {
      const t = setTimeout(() => setShipmentSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [shipmentSuccess]);

  useEffect(() => {
    if (routeSuccess) {
      const t = setTimeout(() => setRouteSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [routeSuccess]);

  useEffect(() => {
    if (shipperSuccess) {
      const t = setTimeout(() => setShipperSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [shipperSuccess]);

  useEffect(() => {
    if (actionError) {
      const t = setTimeout(() => setActionError(''), 4500);
      return () => clearTimeout(t);
    }
  }, [actionError]);

  useEffect(() => {
    if (shipperError) {
      const t = setTimeout(() => setShipperError(''), 4500);
      return () => clearTimeout(t);
    }
  }, [shipperError]);

  // Clear notifications on tab switch or logout
  useEffect(() => {
    setActionMessage('');
    setActionError('');
    setShipmentSuccess('');
    setRouteSuccess('');
    setShipperSuccess('');
    setShipperError('');
  }, [activeTab, currentAdmin]);

  // Auto-dismiss success and error notifications after 3.5-4.5 seconds (visible for 2-5 sec)
  useEffect(() => {
    if (actionMessage) {
      const t = setTimeout(() => setActionMessage(''), 3500);
      return () => clearTimeout(t);
    }
  }, [actionMessage]);

  useEffect(() => {
    if (shipmentSuccess) {
      const t = setTimeout(() => setShipmentSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [shipmentSuccess]);

  useEffect(() => {
    if (routeSuccess) {
      const t = setTimeout(() => setRouteSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [routeSuccess]);

  useEffect(() => {
    if (shipperSuccess) {
      const t = setTimeout(() => setShipperSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [shipperSuccess]);

  useEffect(() => {
    if (actionError) {
      const t = setTimeout(() => setActionError(''), 4500);
      return () => clearTimeout(t);
    }
  }, [actionError]);

  useEffect(() => {
    if (shipperError) {
      const t = setTimeout(() => setShipperError(''), 4500);
      return () => clearTimeout(t);
    }
  }, [shipperError]);

  // Load Operational Dashboard Data
  const loadDashboardData = async () => {
    setStatsLoading(true);
    setQueueLoading(true);
    try {
      const [statsData, queueData] = await Promise.all([
        fetchAdminStats(),
        fetchPendingAdminShipments(),
      ]);
      setStats(statsData);
      setPendingQueue(queueData || []);
    } catch (err) {
      console.error('Failed to load operational dashboard data:', err);
    } finally {
      setStatsLoading(false);
      setQueueLoading(false);
    }
  };

  // Load All Shipments
  const loadShipments = async (overrideParams = null) => {
    setShipmentsLoading(true);
    setShipmentSuccess('');
    try {
      const params = overrideParams || {
        search: shipmentSearch,
        booking_status: bookingStatusFilter,
        dispatch_status: dispatchStatusFilter,
      };
      const data = await fetchAdminShipments(params);
      setShipments(data || []);
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setShipmentsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setBookingStatusFilter('All');
    setDispatchStatusFilter('All');
    setShipmentSearch('');
    loadShipments({ search: '', booking_status: 'All', dispatch_status: 'All' });
  };

  // Load Routes
  const loadRoutes = async () => {
    setRoutesLoading(true);
    setRouteSuccess('');
    try {
      const data = await fetchAdminRoutes({
        page: routesPage,
        limit: 15,
        search: routeSearch,
        route_type: routeTypeFilter,
      });
      setRoutes(data.routes || []);
      setRoutesTotal(data.total_records || 0);
      setRoutesTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load routes dataset:', err);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Load Registered Shippers
  const loadShippers = async () => {
    setShippersLoading(true);
    setShipperError('');
    setShipperSuccess('');
    try {
      const usersList = await fetchAdminUsers();
      setShippers(usersList || []);
    } catch (err) {
      setShipperError(err.message || 'Failed to load registered shippers.');
    } finally {
      setShippersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'shipments') {
      loadShipments();
    } else if (activeTab === 'routes') {
      loadRoutes();
    } else if (activeTab === 'shippers') {
      loadShippers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'shipments') {
      loadShipments();
    }
  }, [bookingStatusFilter, dispatchStatusFilter]);

  // Handle Approve from Queue or Table
  const handleApprove = async (bookingId) => {
    if (processingBookingId) return;
    setProcessingBookingId(bookingId);
    setActionMessage('');
    setActionError('');
    try {
      await approveAdminShipment(bookingId);
      setActionMessage(`Booking ${bookingId} has been approved.`);
      // Immediately remove from pending queue in local state
      setPendingQueue((prev) => prev.filter((b) => b.booking_id !== bookingId));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              pending_approvals: Math.max(0, (prev.pending_approvals || 1) - 1),
            }
          : prev
      );
      // Synchronize both views
      await Promise.all([loadDashboardData(), loadShipments()]);
    } catch (err) {
      setActionError(err.message || 'Failed to approve booking.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Handle Reject from Queue or Table (Mandatory reason)
  const handleReject = async (bookingId) => {
    if (processingBookingId) return;
    const reason = window.prompt(
      'Please enter the required rejection reason for this booking:',
      'Capacity constraints or unserviceable cargo specification'
    );
    if (reason === null) return; // User cancelled prompt
    if (!reason.trim()) {
      alert('Rejection reason is mandatory.');
      return;
    }

    setProcessingBookingId(bookingId);
    setActionMessage('');
    setActionError('');
    try {
      await rejectAdminShipment(bookingId, reason.trim());
      setActionMessage(`Booking ${bookingId} has been rejected.`);
      // Immediately remove from pending queue in local state
      setPendingQueue((prev) => prev.filter((b) => b.booking_id !== bookingId));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              pending_approvals: Math.max(0, (prev.pending_approvals || 1) - 1),
            }
          : prev
      );
      // Synchronize both views
      await Promise.all([loadDashboardData(), loadShipments()]);
    } catch (err) {
      setActionError(err.message || 'Failed to reject booking.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Handle Administrator Cancellation of Approved Booking (Mandatory reason)
  const handleCancelShipment = async (bookingId) => {
    if (processingBookingId) return;
    const reason = window.prompt(
      `Please enter a mandatory cancellation reason for shipment ${bookingId}:`,
      'Operational carrier schedule disruption or customer requested cancellation'
    );
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Cancellation reason is required.');
      return;
    }

    setProcessingBookingId(bookingId);
    setActionMessage('');
    setActionError('');
    try {
      await cancelAdminShipment(bookingId, reason.trim());
      setActionMessage(`Shipment ${bookingId} has been cancelled by Administrator.`);
      await Promise.all([loadDashboardData(), loadShipments()]);
    } catch (err) {
      setActionError(err.message || 'Failed to cancel shipment.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Handle Delete Shipment
  const handleDeleteShipment = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to permanently delete shipment ${bookingId}? This action cannot be undone.`)) {
      return;
    }
    setActionMessage('');
    setActionError('');
    try {
      await deleteAdminShipment(bookingId);
      setActionMessage(`Shipment ${bookingId} was deleted successfully.`);
      if (activeTab === 'dashboard') {
        loadDashboardData();
      } else {
        loadShipments();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to delete shipment.');
    }
  };

  // Open Dispatch Status Update Modal
  const handleOpenDispatchModal = (shipment) => {
    if (shipment.booking_status !== 'Approved') {
      alert(`Booking ${shipment.booking_id} must be Approved before dispatch milestones can be advanced.`);
      return;
    }
    const curr = shipment.dispatch_status || 'Booking Confirmed';
    if (curr === 'Delivered') {
      alert(`Shipment ${shipment.booking_id} has already been Delivered. No further dispatch updates are permitted.`);
      return;
    }
    if (shipment.booking_status === 'Cancelled' || curr.toLowerCase().includes('cancelled')) {
      alert(`Shipment ${shipment.booking_id} has been cancelled. No further dispatch updates are permitted.`);
      return;
    }
    const next = getNextDispatchMilestone(curr);
    if (!next) {
      alert(`Shipment ${shipment.booking_id} has completed all dispatch stages.`);
      return;
    }
    setUpdatingShipment(shipment);
    setNewStatus(next);
    setUpdateRemarks('');
    setStatusUpdateError('');
  };

  const handleSaveDispatchStatus = async (e) => {
    e.preventDefault();
    if (!updatingShipment || !newStatus) return;

    setStatusUpdateLoading(true);
    setStatusUpdateError('');
    try {
      await updateAdminShipmentStatus(updatingShipment.booking_id, {
        status: newStatus,
        remarks: updateRemarks.trim(),
      });
      setShipmentSuccess(`Dispatch status successfully updated to "${newStatus}" for ${updatingShipment.booking_id}`);
      setUpdatingShipment(null);
      loadShipments();
      loadDashboardData();
    } catch (err) {
      setStatusUpdateError(err.message || 'Failed to update dispatch status.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Route Handlers
  const handleOpenAddRoute = () => {
    setEditingRouteId(null);
    setRouteForm({
      route_id: `R${String(routesTotal + 1).padStart(3, '0')}`,
      origin: '',
      destination: '',
      distance_nm: 2500,
      transit_days: 10,
      transshipments: 0,
      route_type: 'Standard',
      base_freight_usd: 1500,
    });
    setRouteModalError('');
    setShowRouteModal(true);
  };

  const handleOpenEditRoute = (route) => {
    setEditingRouteId(route.route_id);
    setRouteForm({
      route_id: route.route_id,
      origin: route.origin,
      destination: route.destination,
      distance_nm: route.distance_nm,
      transit_days: route.transit_days,
      transshipments: route.transshipments,
      route_type: route.route_type,
      base_freight_usd: route.base_freight_usd,
    });
    setRouteModalError('');
    setShowRouteModal(true);
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setRouteModalError('');

    if (!routeForm.origin.trim() || !routeForm.destination.trim()) {
      setRouteModalError('Origin port and destination port are required.');
      return;
    }

    setRouteModalLoading(true);
    try {
      if (editingRouteId) {
        await updateAdminRoute(editingRouteId, {
          origin: routeForm.origin.trim(),
          destination: routeForm.destination.trim(),
          distance_nm: parseInt(routeForm.distance_nm, 10),
          transit_days: parseInt(routeForm.transit_days, 10),
          transshipments: parseInt(routeForm.transshipments, 10),
          route_type: routeForm.route_type.trim(),
          base_freight_usd: parseFloat(routeForm.base_freight_usd),
        });
        setRouteSuccess(`Route ${editingRouteId} updated in dataset.`);
      } else {
        await addAdminRoute({
          route_id: routeForm.route_id.trim(),
          origin: routeForm.origin.trim(),
          destination: routeForm.destination.trim(),
          distance_nm: parseInt(routeForm.distance_nm, 10),
          transit_days: parseInt(routeForm.transit_days, 10),
          transshipments: parseInt(routeForm.transshipments, 10),
          route_type: routeForm.route_type.trim(),
          base_freight_usd: parseFloat(routeForm.base_freight_usd),
        });
        setRouteSuccess(`Route ${routeForm.route_id} added to dataset.`);
      }
      setShowRouteModal(false);
      loadRoutes();
    } catch (err) {
      setRouteModalError(err.message || 'Failed to save route.');
    } finally {
      setRouteModalLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm(`Are you sure you want to delete route ${routeId} from the active dataset?`)) {
      return;
    }
    try {
      await deleteAdminRoute(routeId);
      setRouteSuccess(`Route ${routeId} successfully deleted.`);
      loadRoutes();
    } catch (err) {
      alert(`Error deleting route: ${err.message}`);
    }
  };

  // Toggle Shipper Status
  const handleToggleShipperStatus = async (userId, userName, currentStatus) => {
    const isActivating = currentStatus && currentStatus.toLowerCase() !== 'active';
    const actionWord = isActivating ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionWord} the account for "${userName}" (#${userId})?`)) {
      return;
    }
    setShipperSuccess('');
    setShipperError('');
    try {
      const res = await toggleAdminUserStatus(userId);
      setShipperSuccess(`User account status updated to ${res.user?.status || (isActivating ? 'Active' : 'Deactivated')}.`);
      loadShippers();
    } catch (err) {
      setShipperError(err.message || `Failed to ${actionWord} user account.`);
    }
  };

  // Permanently Delete Shipper
  const handleDeleteShipper = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}" (#${userId})? This will permanently delete their account and associated records.`)) {
      return;
    }
    setShipperSuccess('');
    setShipperError('');
    try {
      await deleteAdminUser(userId);
      setShipperSuccess(`User "${userName}" (#${userId}) was deleted successfully.`);
      loadShippers();
      if (activeTab === 'dashboard') loadDashboardData();
    } catch (err) {
      setShipperError(err.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="admin-container">
      {/* Top Main Navigation Bar for Administrator */}
      <header className="admin-header-nav">
        <div className="admin-header-brand" onClick={() => onBackToHome && onBackToHome()} style={{ cursor: 'pointer' }}>
          <img src="/searoute-logo.jpg" alt="SeaRoute Logo" className="brand-logo-img" />
          <div>
            <h1 className="admin-brand-title">SeaRoute</h1>
            <span className="admin-brand-subtitle">Port Administration & Freight Governance</span>
          </div>
        </div>

        {/* 4 Instructor Sections */}
        <nav className="admin-nav-tabs">
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
          >
            Shipment Requests
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            Routes Management
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'shippers' ? 'active' : ''}`}
            onClick={() => setActiveTab('shippers')}
          >
            Registered Shippers
          </button>
        </nav>

        <div className="admin-header-actions">
          <span className="admin-badge">
            <span className="user-avatar-circle admin-avatar-circle">A</span>
            <span className="user-name-text">{currentAdmin?.full_name || 'Admin'}</span>
          </span>
          <button type="button" className="btn-secondary btn-sm" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Administrative Body */}
      <div className="admin-body">
        {/* Alerts / Feedback */}
        {actionMessage && (
          <div className="alert-banner alert-success alert-dismissible">
            <span>{actionMessage}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setActionMessage('')}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        {actionError && (
          <div className="alert-banner alert-danger alert-dismissible">
            <span>{actionError}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setActionError('')}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        {shipmentSuccess && (
          <div className="alert-banner alert-success alert-dismissible">
            <span>{shipmentSuccess}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setShipmentSuccess('')}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        {routeSuccess && (
          <div className="alert-banner alert-success alert-dismissible">
            <span>{routeSuccess}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setRouteSuccess('')}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        {shipperSuccess && (
          <div className="alert-banner alert-success alert-dismissible">
            <span>{shipperSuccess}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setShipperSuccess('')}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        {shipperError && (
          <div className="alert-banner alert-danger alert-dismissible">
            <span>{shipperError}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setShipperError('')}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* =========================================================================
            SECTION 3.1: DASHBOARD
        ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="admin-section">
            <div className="section-header-block">
              <h2>Dashboard</h2>
              <p className="section-desc">Real-time summary metrics calculated from actual backend database records.</p>
            </div>

            {/* 5 Summary Cards */}
            <div className="stats-card-grid">
              <div className="stat-card">
                <div className="stat-title">Total Bookings</div>
                <div className="stat-number">{statsLoading ? '...' : (stats?.total_bookings ?? 0)}</div>
                <div className="stat-footnote">All recorded shipment orders</div>
              </div>

              <div className="stat-card stat-highlight-orange">
                <div className="stat-title">Pending Approvals</div>
                <div className="stat-number">{statsLoading ? '...' : (stats?.pending_approvals ?? 0)}</div>
                <div className="stat-footnote">Requires administrator review</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Total Routes</div>
                <div className="stat-number">{statsLoading ? '...' : (stats?.total_routes ?? routesTotal ?? 511)}</div>
                <div className="stat-footnote">Active shipping corridors</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Registered Shippers</div>
                <div className="stat-number">{statsLoading ? '...' : (stats?.registered_shippers ?? stats?.total_users ?? 0)}</div>
                <div className="stat-footnote">Verified customer accounts</div>
              </div>

              <div className="stat-card stat-highlight-green">
                <div className="stat-title">Total Freight Booked</div>
                <div className="stat-number">
                  {statsLoading ? '...' : `$${Number(stats?.total_freight_booked || 0).toLocaleString()}`}
                </div>
                <div className="stat-footnote">Total commercial cargo volume</div>
              </div>
            </div>

            {/* Pending Shipment Approvals Queue */}
            <div className="card-box mt-4">
              <div className="card-box-header">
                <div>
                  <h3 className="card-box-title">Pending Shipment Approvals Queue</h3>
                  <p className="card-box-subtitle">Review new booking requests submitted by commercial shippers.</p>
                </div>
                <button type="button" className="btn-secondary btn-sm" onClick={loadDashboardData}>
                  Refresh Queue
                </button>
              </div>

              {queueLoading ? (
                <div className="loading-state">Loading pending shipment requests...</div>
              ) : pendingQueue.filter((req) => req.booking_status === 'Pending').length === 0 ? (
                <div className="empty-state-notice">
                  No pending shipment requests.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Shipper</th>
                        <th>Trade Lane</th>
                        <th>Cargo</th>
                        <th>Total Cost</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQueue
                        .filter((req) => req.booking_status === 'Pending')
                        .map((req) => (
                          <tr key={req.booking_id}>
                            <td className="font-mono font-bold text-navy">{req.booking_id}</td>
                            <td>
                              <strong>{req.shipper_name || 'Shipper'}</strong>
                              <div className="text-muted text-xs">{req.user_email}</div>
                            </td>
                            <td>
                              <strong>{req.origin}</strong> → <strong>{req.destination}</strong>
                              <div className="text-muted text-xs">Transit: {req.transit_days} Days</div>
                            </td>
                            <td>
                              <div>{req.cargo_type}</div>
                              <div className="text-muted text-xs">{req.containers} TEU</div>
                            </td>
                            <td>
                              <strong className="text-navy">${Number(req.freight_usd || 0).toLocaleString()}</strong>
                            </td>
                            <td>
                              <div className="btn-group-row">
                                <button
                                  type="button"
                                  className="btn-success btn-xs"
                                  onClick={() => handleApprove(req.booking_id)}
                                  disabled={processingBookingId === req.booking_id}
                                >
                                  {processingBookingId === req.booking_id ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger btn-xs"
                                  onClick={() => handleReject(req.booking_id)}
                                  disabled={processingBookingId === req.booking_id}
                                >
                                  {processingBookingId === req.booking_id ? 'Rejecting...' : 'Reject'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3.2: SHIPMENT REQUESTS MANAGEMENT
        ========================================================================= */}
        {activeTab === 'shipments' && (
          <div className="admin-section">
            <div className="section-header-block">
              <h2>Shipment Requests Management</h2>
              <p className="section-desc">Manage all commercial bookings, verify route parameters, and track dispatch status.</p>
            </div>

            {/* Dedicated Status Filter Panel: Separate Booking & Dispatch Status Filters */}
            <div className="filter-bar-card filter-controls-panel">
              <div className="filter-search-row">
                <div className="filter-search-box flex-grow">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search Booking ID, Shipper, Port, Route..."
                    value={shipmentSearch}
                    onChange={(e) => setShipmentSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadShipments()}
                  />
                  <button type="button" className="btn-primary btn-sm" onClick={loadShipments}>
                    Search
                  </button>
                  {(bookingStatusFilter !== 'All' || dispatchStatusFilter !== 'All' || shipmentSearch) && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={handleResetFilters}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-groups-wrap">
                <div className="filter-row">
                  <span className="filter-row-label">Booking Status:</span>
                  <div className="filter-tabs">
                    {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`filter-tab-btn ${bookingStatusFilter === status ? 'active' : ''}`}
                        onClick={() => setBookingStatusFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-row">
                  <span className="filter-row-label">Dispatch Status:</span>
                  <div className="filter-tabs">
                    {[
                      'All',
                      'Booking Confirmed',
                      'Cargo Received at Origin Port',
                      'Loaded onto Vessel',
                      'In Transit',
                      'Arrived at Destination Port',
                      'Delivered',
                    ].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`filter-tab-btn ${dispatchStatusFilter === status ? 'active' : ''}`}
                        onClick={() => setDispatchStatusFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipments Table */}
            <div className="card-box table-card-box mt-3">
              {shipmentsLoading ? (
                <div className="loading-state">Loading shipments list...</div>
              ) : shipments.length === 0 ? (
                <div className="empty-state-notice">No shipments found matching the selected filter criteria.</div>
              ) : (
                <div className="table-responsive">
                  <table className="clean-table shipments-management-table">
                    <thead>
                      <tr>
                        <th className="col-booking-id">Booking ID</th>
                        <th className="col-shipper">Shipper</th>
                        <th className="col-lane">Trade Lane</th>
                        <th className="col-cargo">Cargo</th>
                        <th className="col-route">Route ID</th>
                        <th className="col-transit">Transit</th>
                        <th className="col-cost">Total Cost</th>
                        <th className="col-status">Booking Status</th>
                        <th className="col-status">Dispatch Status</th>
                        <th className="col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((s) => {
                        const bStatus = (s.booking_status || '').trim();
                        const dStatus = (s.dispatch_status || '').trim();
                        const isPending = bStatus === 'Pending';
                        const isApproved = bStatus === 'Approved';
                        const isRejected = bStatus === 'Rejected';
                        const isCancelled = bStatus === 'Cancelled' || dStatus.toLowerCase().includes('cancelled');
                        const isDelivered = dStatus === 'Delivered';

                        return (
                          <tr key={s.booking_id}>
                            <td className="col-booking-id">{s.booking_id}</td>
                            <td className="col-shipper">
                              <strong>{s.shipper_name || 'Shipper'}</strong>
                              <div className="text-muted text-xs">{s.user_email}</div>
                            </td>
                            <td className="col-lane">
                              <strong>{s.origin}</strong> → <strong>{s.destination}</strong>
                            </td>
                            <td className="col-cargo">
                              <div>{s.cargo_type}</div>
                              <div className="text-muted text-xs">
                                {s.containers} TEU{s.cargo_desc ? ` • ${s.cargo_desc}` : ''}
                              </div>
                            </td>
                            <td className="col-route font-mono text-xs">{s.route_id || 'R-DIR'}</td>
                            <td className="col-transit">{s.transit_days} Days</td>
                            <td className="col-cost"><strong className="text-navy">${Number(s.freight_usd || 0).toLocaleString()}</strong></td>
                            <td className="col-status">
                              <span className={`status-badge ${
                                isPending ? 'status-pending' :
                                isApproved ? 'status-approved' :
                                isCancelled ? 'status-cancelled' :
                                isRejected ? 'status-rejected' : 'status-info'
                              }`}>
                                {isCancelled ? 'CANCELLED' : bStatus || 'PENDING'}
                              </span>
                            </td>
                            <td className="col-status">
                              <span className={`status-badge ${
                                isCancelled ? 'status-cancelled' :
                                isDelivered ? 'status-approved' :
                                'status-dispatch'
                              }`}>
                                {isCancelled ? 'CANCELLED' : dStatus || (isApproved ? 'Booking Confirmed' : 'Pending Approval')}
                              </span>
                            </td>
                            <td className="col-actions">
                              <div className="btn-group-row">
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-success btn-xs"
                                      onClick={() => handleApprove(s.booking_id)}
                                      disabled={processingBookingId === s.booking_id}
                                      title="Approve booking"
                                    >
                                      {processingBookingId === s.booking_id ? '...' : 'Approve'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-danger btn-xs"
                                      onClick={() => handleReject(s.booking_id)}
                                      disabled={processingBookingId === s.booking_id}
                                      title="Reject booking"
                                    >
                                      {processingBookingId === s.booking_id ? '...' : 'Reject'}
                                    </button>
                                  </>
                                )}
                                {isApproved && !isDelivered && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-secondary btn-xs"
                                      onClick={() => handleOpenDispatchModal(s)}
                                      title="Advance to next sequential milestone"
                                    >
                                      Update Dispatch
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-outline-danger btn-xs"
                                      onClick={() => handleCancelShipment(s.booking_id)}
                                      disabled={processingBookingId === s.booking_id}
                                      title="Cancel approved shipment"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {(isApproved || isDelivered) && (
                                  <button
                                    type="button"
                                    className="btn-outline btn-xs"
                                    onClick={() => {
                                      setTrackingBookingId(s.booking_id);
                                      setTrackingModalOpen(true);
                                    }}
                                    title="View tracking timeline"
                                  >
                                    Timeline
                                  </button>
                                )}
                                {(isRejected || isCancelled) && (
                                  <button
                                    type="button"
                                    className="btn-outline btn-xs"
                                    onClick={() => {
                                      setTrackingBookingId(s.booking_id);
                                      setTrackingModalOpen(true);
                                    }}
                                    title="View shipment details"
                                  >
                                    View Details
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
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3.3: ROUTES MANAGEMENT
        ========================================================================= */}
        {activeTab === 'routes' && (
          <div className="admin-section">
            <div className="section-header-block">
              <div className="header-flex">
                <div>
                  <h2>Routes Management</h2>
                  <p className="section-desc">
                    Active shipping corridor dataset.
                  </p>
                </div>
                <button type="button" className="btn-primary" onClick={handleOpenAddRoute}>
                  + Add New Route
                </button>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="filter-bar-card">
              <div className="filter-search-box">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search Port or Route ID..."
                  value={routeSearch}
                  onChange={(e) => {
                    setRouteSearch(e.target.value);
                    setRoutesPage(1);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && loadRoutes()}
                />
                <select
                  className="input-field"
                  value={routeTypeFilter}
                  onChange={(e) => {
                    setRouteTypeFilter(e.target.value);
                    setRoutesPage(1);
                  }}
                >
                  <option value="All">All Route Types</option>
                  <option value="Standard">Standard</option>
                  <option value="Alternative">Alternative</option>
                  <option value="Direct">Direct</option>
                </select>
                <button type="button" className="btn-primary btn-sm" onClick={loadRoutes}>
                  Filter
                </button>
              </div>
            </div>

            {/* Routes Table */}
            <div className="card-box mt-3">
              {routesLoading ? (
                <div className="loading-state">Loading active route dataset...</div>
              ) : routes.length === 0 ? (
                <div className="empty-state-notice">No routes found matching search query.</div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="clean-table">
                      <thead>
                        <tr>
                          <th>Route ID</th>
                          <th>Origin Port</th>
                          <th>Destination Port</th>
                          <th>Distance (NM)</th>
                          <th>Transit Days</th>
                          <th>Transshipments</th>
                          <th>Route Type</th>
                          <th>Base Freight (USD)</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.map((r) => (
                          <tr key={r.route_id}>
                            <td className="font-mono font-bold text-navy">{r.route_id}</td>
                            <td><strong>{r.origin}</strong></td>
                            <td><strong>{r.destination}</strong></td>
                            <td>{Number(r.distance_nm).toLocaleString()} NM</td>
                            <td>{r.transit_days} Days</td>
                            <td>{r.transshipments}</td>
                            <td>
                              <span className="route-type-tag">{r.route_type}</span>
                            </td>
                            <td><strong>${Number(r.base_freight_usd).toLocaleString()}</strong></td>
                            <td>
                              <div className="btn-group-row">
                                <button
                                  type="button"
                                  className="btn-secondary btn-xs"
                                  onClick={() => handleOpenEditRoute(r)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger btn-xs"
                                  onClick={() => handleDeleteRoute(r.route_id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination-bar">
                    <span className="text-muted text-sm">
                      Showing page {routesPage} of {routesTotalPages} ({routesTotal} total routes)
                    </span>
                    <div className="pagination-buttons">
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        disabled={routesPage <= 1}
                        onClick={() => {
                          setRoutesPage((p) => Math.max(1, p - 1));
                          loadRoutes();
                        }}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        disabled={routesPage >= routesTotalPages}
                        onClick={() => {
                          setRoutesPage((p) => Math.min(routesTotalPages, p + 1));
                          loadRoutes();
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3.4: REGISTERED SHIPPERS
        ========================================================================= */}
        {activeTab === 'shippers' && (
          <div className="admin-section">
            <div className="section-header-block">
              <h2>Registered Shippers & Users</h2>
              <p className="section-desc">Commercial customer accounts and authorization governance.</p>
            </div>

            <div className="card-box mt-3">
              {shippersLoading ? (
                <div className="loading-state">Loading registered accounts...</div>
              ) : shippers.length === 0 ? (
                <div className="empty-state-notice">No registered accounts found in database.</div>
              ) : (
                <div className="table-responsive">
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Email ID</th>
                        <th>Mobile Number</th>
                        <th>Registered Address / Port Facility</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippers.map((u) => (
                        <tr key={u.id}>
                          <td className="font-mono text-muted">#{u.id}</td>
                          <td>
                            <strong>{u.full_name}</strong>
                            {u.company && <div className="text-muted text-xs">{u.company}</div>}
                          </td>
                          <td>
                            <span className={`status-badge ${u.role === 'admin' ? 'status-approved' : 'status-info'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td>{u.email}</td>
                          <td>{u.phone || '—'}</td>
                          <td>{u.address || '—'}</td>
                          <td>
                            <span className={`status-badge ${u.status === 'Active' ? 'status-approved' : 'status-deactivated'}`}>
                              {u.status === 'Active' ? 'ACTIVE' : 'DEACTIVATED'}
                            </span>
                          </td>
                          <td>
                            {u.id !== currentAdmin?.id && u.role !== 'admin' ? (
                              <div className="btn-group-row">
                                <button
                                  type="button"
                                  className={u.status === 'Active' ? 'btn-secondary btn-xs' : 'btn-success btn-xs'}
                                  onClick={() => handleToggleShipperStatus(u.id, u.full_name, u.status)}
                                  title={u.status === 'Active' ? 'Deactivate user account' : 'Activate user account'}
                                >
                                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger btn-xs"
                                  onClick={() => handleDeleteShipper(u.id, u.full_name)}
                                  title="Permanently delete user account"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted text-xs">Current Session</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT ROUTE
      ========================================================================= */}
      {showRouteModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingRouteId ? `Edit Route: ${editingRouteId}` : 'Add New Shipping Route'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowRouteModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRoute} className="modal-body">
              {routeModalError && <div className="alert-banner alert-danger">{routeModalError}</div>}

              <div className="form-group">
                <label>Route ID *</label>
                <input
                  type="text"
                  className="input-field"
                  disabled={!!editingRouteId}
                  value={routeForm.route_id}
                  onChange={(e) => setRouteForm({ ...routeForm, route_id: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Origin Port *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={routeForm.origin}
                    onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Destination Port *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={routeForm.destination}
                    onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Distance (NM) *</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={routeForm.distance_nm}
                    onChange={(e) => setRouteForm({ ...routeForm, distance_nm: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transit Days *</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={routeForm.transit_days}
                    onChange={(e) => setRouteForm({ ...routeForm, transit_days: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Transshipments *</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={routeForm.transshipments}
                    onChange={(e) => setRouteForm({ ...routeForm, transshipments: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Route Type *</label>
                  <select
                    className="input-field"
                    value={routeForm.route_type}
                    onChange={(e) => setRouteForm({ ...routeForm, route_type: e.target.value })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Alternative">Alternative</option>
                    <option value="Direct">Direct</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Base Freight (USD) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="input-field"
                    value={routeForm.base_freight_usd}
                    onChange={(e) => setRouteForm({ ...routeForm, base_freight_usd: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRouteModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={routeModalLoading}>
                  {routeModalLoading ? 'Saving...' : editingRouteId ? 'Update Route' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: UPDATE DISPATCH STATUS (CLEAN, COMPACT & PROFESSIONAL)
      ========================================================================= */}
      {updatingShipment && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) setUpdatingShipment(null); }}>
          <div className="modal-dialog modal-dialog-compact">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Update Dispatch Status</h3>
                <div className="modal-subtitle">
                  Booking ID: <span className="font-mono font-bold text-navy">{updatingShipment.booking_id}</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setUpdatingShipment(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDispatchStatus} className="modal-body">
              {statusUpdateError && <div className="alert-banner alert-danger">{statusUpdateError}</div>}

              {/* Compact Status Transition */}
              <div className="status-transition-box">
                <div className="status-transition-col">
                  <span className="status-transition-label">Current Status</span>
                  <span className="status-transition-pill current">
                    {updatingShipment.dispatch_status || 'Booking Confirmed'}
                  </span>
                </div>
                <div className="status-transition-arrow">→</div>
                <div className="status-transition-col">
                  <span className="status-transition-label">Next Status</span>
                  <span className="status-transition-pill next">
                    {newStatus}
                  </span>
                </div>
              </div>

              {/* Remarks (Optional) */}
              <div className="form-group mb-0">
                <label htmlFor="dispatch-remarks">Remarks (Optional)</label>
                <textarea
                  id="dispatch-remarks"
                  className="input-field dispatch-remarks-input"
                  rows={2}
                  placeholder="Add any relevant shipment update..."
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                />
              </div>

              {/* Footer Buttons: Cancel & Confirm Update */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setUpdatingShipment(null)}
                  disabled={statusUpdateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={statusUpdateLoading}
                >
                  {statusUpdateLoading ? 'Updating...' : `Confirm Update to ${newStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Timeline Modal */}
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
