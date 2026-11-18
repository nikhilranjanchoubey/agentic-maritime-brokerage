import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminActivity,
  fetchAdminRoutes,
  addAdminRoute,
  updateAdminRoute,
  deleteAdminRoute,
} from '../services/api';
import {
  ShieldCheckIcon,
  CompassIcon,
  ContainerIcon,
  BookmarkIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  CheckCircleIcon,
  LogoutIcon,
  ShipLogo,
} from './Icons';

export default function AdminDashboard({ ports = [], onBackToHome }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'routes', 'users', 'ports', 'activity'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Routes Management state
  const [routesData, setRoutesData] = useState({ routes: [], total_records: 0, total_pages: 1, page: 1 });
  const [routeSearch, setRouteSearch] = useState('');
  const [routeTypeFilter, setRouteTypeFilter] = useState('All');
  const [routePage, setRoutePage] = useState(1);
  const [routeLoading, setRouteLoading] = useState(false);

  // Modal states for Route CRUD
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [formData, setFormData] = useState({
    route_id: '',
    origin: '',
    destination: '',
    distance_nm: 2000,
    transit_days: 7,
    transshipments: 0,
    route_type: 'Standard',
    base_freight_usd: 1200,
  });
  const [actionSuccess, setActionSuccess] = useState('');

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sData, uData, aData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminActivity(),
      ]);
      setStats(sData);
      setUsers(uData);
      setActivity(aData);
    } catch (err) {
      setError(err.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    setRouteLoading(true);
    try {
      const res = await fetchAdminRoutes({
        page: routePage,
        limit: 15,
        search: routeSearch,
        route_type: routeTypeFilter,
      });
      setRoutesData(res);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'routes') {
      loadRoutes();
    }
  }, [activeTab, routePage, routeSearch, routeTypeFilter]);

  // Handle Add Route
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await addAdminRoute({
        origin: formData.origin,
        destination: formData.destination,
        distance_nm: parseInt(formData.distance_nm, 10),
        transit_days: parseInt(formData.transit_days, 10),
        transshipments: parseInt(formData.transshipments, 10),
        route_type: formData.route_type,
        base_freight_usd: parseFloat(formData.base_freight_usd),
        route_id: formData.route_id || undefined,
      });
      setAddModalOpen(false);
      setActionSuccess('Route added to dataset successfully.');
      loadRoutes();
      fetchAdminStats().then(setStats);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to add route');
    }
  };

  // Handle Edit Route
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoute) return;
    try {
      await updateAdminRoute(selectedRoute.route_id, {
        distance_nm: parseInt(formData.distance_nm, 10),
        transit_days: parseInt(formData.transit_days, 10),
        transshipments: parseInt(formData.transshipments, 10),
        route_type: formData.route_type,
        base_freight_usd: parseFloat(formData.base_freight_usd),
      });
      setEditModalOpen(false);
      setActionSuccess(`Route ${selectedRoute.route_id} updated successfully.`);
      loadRoutes();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update route');
    }
  };

  // Handle Delete Route
  const handleDeleteConfirm = async () => {
    if (!selectedRoute) return;
    try {
      await deleteAdminRoute(selectedRoute.route_id);
      setDeleteModalOpen(false);
      setActionSuccess(`Route ${selectedRoute.route_id} deleted from dataset.`);
      loadRoutes();
      fetchAdminStats().then(setStats);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete route');
    }
  };

  const openEditModal = (r) => {
    setSelectedRoute(r);
    setFormData({
      route_id: r.route_id,
      origin: r.origin,
      destination: r.destination,
      distance_nm: r.distance_nm,
      transit_days: r.transit_days,
      transshipments: r.transshipments,
      route_type: r.route_type,
      base_freight_usd: r.base_freight_usd,
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (r) => {
    setSelectedRoute(r);
    setDeleteModalOpen(true);
  };

  return (
    <div className="dashboard-layout">
      {/* Admin Sidebar */}
      <aside className="dashboard-sidebar admin-sidebar">
        <div className="sidebar-brand-box" onClick={onBackToHome}>
          <div className="sidebar-logo-dot">
            <ShipLogo size={26} className="text-cyan" />
          </div>
          <div className="sidebar-brand-info">
            <span className="sidebar-brand-name">AGENTIC MARITIME</span>
            <span className="sidebar-brand-badge admin-badge">ADMINISTRATION</span>
          </div>
        </div>

        <nav className="sidebar-nav-list">
          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <ShieldCheckIcon className="w-5 h-5 mr-3" />
            <span>Platform Overview</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <CompassIcon className="w-5 h-5 mr-3" />
            <span>Route Management (CSV)</span>
            {stats?.total_routes && (
              <span className="sidebar-counter-pill">{stats.total_routes}</span>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <BookmarkIcon className="w-5 h-5 mr-3" />
            <span>User Management</span>
            {users.length > 0 && (
              <span className="sidebar-counter-pill">{users.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'ports' ? 'active' : ''}`}
            onClick={() => setActiveTab('ports')}
          >
            <ContainerIcon className="w-5 h-5 mr-3" />
            <span>Port Master Directory</span>
            <span className="sidebar-counter-pill">{ports.length}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <CheckCircleIcon className="w-5 h-5 mr-3" />
            <span>System Activity Stream</span>
          </button>
        </nav>

        <div className="sidebar-footer-box">
          <div className="sidebar-user-pill">
            <div className="sidebar-avatar admin-avatar">A</div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.full_name || 'Admin Director'}</span>
              <span className="sidebar-user-email">Super Administrator</span>
            </div>
          </div>
          <div className="sidebar-actions-row">
            <button
              type="button"
              className="btn-sidebar-home"
              onClick={onBackToHome}
            >
              Public Home
            </button>
            <button
              type="button"
              className="btn-sidebar-logout"
              onClick={logout}
              title="Sign Out"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="dashboard-main-content">
        <header className="dashboard-header-bar admin-header">
          <div>
            <div className="admin-status-indicator">
              <span className="admin-status-dot"></span>
              <span>SYSTEM STATUS: {stats?.platform_status || 'OPERATIONAL'}</span>
            </div>
            <h1 className="dashboard-title">Maritime Administration Panel</h1>
            <p className="dashboard-subtitle">
              Dataset management, authentication governance, and routing engine supervision
            </p>
          </div>
          <button
            type="button"
            className="btn-hero-primary"
            onClick={() => {
              setFormData({
                route_id: '',
                origin: ports[0]?.name || 'Chennai',
                destination: ports[1]?.name || 'Rotterdam',
                distance_nm: 3500,
                transit_days: 12,
                transshipments: 0,
                route_type: 'Standard',
                base_freight_usd: 1500,
              });
              setAddModalOpen(true);
            }}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            <span>Add New Route Record</span>
          </button>
        </header>

        {actionSuccess && (
          <div className="admin-success-banner">
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading-state">
            <span className="loading-spinner"></span>
            <p>Loading administration data...</p>
          </div>
        ) : error ? (
          <div className="dashboard-error-banner">{error}</div>
        ) : (
          <div className="dashboard-tabs-wrapper">
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="admin-overview-tab">
                <div className="stats-cards-grid">
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">REGISTERED USERS</span>
                      <BookmarkIcon className="w-5 h-5 text-ocean" />
                    </div>
                    <div className="stat-number">{stats?.total_users || 0}</div>
                    <div className="stat-sub">Brokers and administrators</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">TOTAL ROUTES (CSV)</span>
                      <CompassIcon className="w-5 h-5 text-cyan" />
                    </div>
                    <div className="stat-number">{stats?.total_routes || 0}</div>
                    <div className="stat-sub">Verified trade corridors</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">ROUTE SEARCHES</span>
                      <ContainerIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="stat-number">{stats?.total_searches || 0}</div>
                    <div className="stat-sub">AI queries processed</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">ACTIVE PORTS</span>
                      <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="stat-number">{stats?.active_ports || ports?.length || 47}</div>
                    <div className="stat-sub">Global commercial hubs</div>
                  </div>
                </div>

                {/* System Specs & Engine Config Box */}
                <div className="dashboard-section-box">
                  <h3 className="section-heading">Routing Engine Configuration</h3>
                  <div className="engine-specs-grid">
                    <div className="spec-item">
                      <span className="spec-label">Engine Framework</span>
                      <span className="spec-val">Agentic Maritime RouteAgent v2</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Scoring Weights</span>
                      <span className="spec-val">Transit: 40% • Distance: 25% • Transshipment: 35%</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Database Engine</span>
                      <span className="spec-val">SQLite 3 (ACID Persistent)</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Security Hashing</span>
                      <span className="spec-val">PBKDF2-HMAC-SHA256 (100k iters)</span>
                    </div>
                  </div>
                </div>

                {/* Recent Users preview */}
                <div className="dashboard-section-box">
                  <div className="dashboard-section-header">
                    <div>
                      <h3 className="section-heading">Recent User Registrations</h3>
                      <p className="section-subtext">Access control records</p>
                    </div>
                    <button
                      type="button"
                      className="link-view-all"
                      onClick={() => setActiveTab('users')}
                    >
                      View All Users →
                    </button>
                  </div>

                  <div className="table-responsive-box">
                    <table className="dashboard-data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Full Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Company</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 5).map((u) => (
                          <tr key={u.id}>
                            <td>#{u.id}</td>
                            <td className="font-semibold text-primary">{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`table-role-tag ${u.role === 'admin' ? 'role-admin' : 'role-broker'}`}>
                                {u.role?.toUpperCase()}
                              </span>
                            </td>
                            <td>{u.company || '—'}</td>
                            <td className="text-muted text-xs">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ROUTE MANAGEMENT (FULL CSV CRUD) */}
            {activeTab === 'routes' && (
              <div className="admin-routes-tab">
                <div className="admin-filter-bar">
                  <div className="filter-search-box">
                    <SearchIcon size={16} className="mr-2 text-muted" />
                    <input
                      type="text"
                      className="admin-filter-input"
                      placeholder="Filter by origin, destination, or route ID..."
                      value={routeSearch}
                      onChange={(e) => {
                        setRouteSearch(e.target.value);
                        setRoutePage(1);
                      }}
                    />
                  </div>

                  <div className="filter-select-box">
                    <label>Route Type:</label>
                    <select
                      className="admin-filter-select"
                      value={routeTypeFilter}
                      onChange={(e) => {
                        setRouteTypeFilter(e.target.value);
                        setRoutePage(1);
                      }}
                    >
                      <option value="All">All Route Types</option>
                      <option value="Standard">Standard</option>
                      <option value="Alternative">Alternative</option>
                      <option value="Express Direct">Express Direct</option>
                      <option value="Direct Feeder">Direct Feeder</option>
                    </select>
                  </div>
                </div>

                {routeLoading ? (
                  <div className="dashboard-loading-state">
                    <span className="loading-spinner"></span>
                    <p>Loading routes dataset...</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive-box">
                      <table className="dashboard-data-table">
                        <thead>
                          <tr>
                            <th>Route ID</th>
                            <th>Origin Port</th>
                            <th>Destination Port</th>
                            <th>Distance</th>
                            <th>Transit</th>
                            <th>Transshipments</th>
                            <th>Route Type</th>
                            <th>Base Freight</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {routesData.routes.map((r) => (
                            <tr key={r.route_id}>
                              <td className="font-mono font-bold text-cyan">{r.route_id}</td>
                              <td className="font-semibold">{r.origin}</td>
                              <td className="font-semibold">{r.destination}</td>
                              <td>{r.distance_nm?.toLocaleString()} NM</td>
                              <td>{r.transit_days} Days</td>
                              <td>{r.transshipments === 0 ? '0 (Direct)' : `${r.transshipments} stop`}</td>
                              <td>
                                <span className="table-route-type-pill">{r.route_type}</span>
                              </td>
                              <td className="font-semibold text-emerald-400">
                                ${r.base_freight_usd?.toLocaleString()}
                              </td>
                              <td>
                                <div className="table-actions-cell">
                                  <button
                                    type="button"
                                    className="btn-table-edit"
                                    onClick={() => openEditModal(r)}
                                    title="Edit Route"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-table-delete"
                                    onClick={() => openDeleteModal(r)}
                                    title="Delete Route"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="pagination-bar">
                      <span className="pagination-info">
                        Showing {(routePage - 1) * 15 + 1} to {Math.min(routePage * 15, routesData.total_records)} of {routesData.total_records} routes
                      </span>
                      <div className="pagination-controls">
                        <button
                          type="button"
                          className="btn-page"
                          disabled={routePage <= 1}
                          onClick={() => setRoutePage((p) => p - 1)}
                        >
                          Previous
                        </button>
                        <span className="page-counter">
                          Page {routePage} of {routesData.total_pages}
                        </span>
                        <button
                          type="button"
                          className="btn-page"
                          disabled={routePage >= routesData.total_pages}
                          onClick={() => setRoutePage((p) => p + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="admin-users-tab">
                <div className="tab-title-row">
                  <div>
                    <h2>Registered Users & Access Roles</h2>
                    <p className="text-muted">Role-Based Access Control directory</p>
                  </div>
                </div>

                <div className="table-responsive-box">
                  <table className="dashboard-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Organization</th>
                        <th>Account Created</th>
                        <th>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>#{u.id}</td>
                          <td className="font-semibold text-primary">{u.full_name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`table-role-tag ${u.role === 'admin' ? 'role-admin' : 'role-broker'}`}>
                              {u.role?.toUpperCase()}
                            </span>
                          </td>
                          <td>{u.company || '—'}</td>
                          <td className="text-muted text-xs">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="text-muted text-xs">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: PORT DIRECTORY */}
            {activeTab === 'ports' && (
              <div className="admin-ports-tab">
                <div className="tab-title-row">
                  <div>
                    <h2>Master Ports Dataset (47 Global Hubs)</h2>
                    <p className="text-muted">Standard UN/LOCODE, country, and coordinate mappings</p>
                  </div>
                </div>

                <div className="table-responsive-box">
                  <table className="dashboard-data-table">
                    <thead>
                      <tr>
                        <th>Port Name</th>
                        <th>UN/LOCODE</th>
                        <th>Country</th>
                        <th>Region</th>
                        <th>Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ports.map((p) => (
                        <tr key={p.id || p.code || p.name}>
                          <td className="font-semibold text-primary">{p.name}</td>
                          <td>
                            <span className="port-locode-pill">{p.code}</span>
                          </td>
                          <td>{p.country}</td>
                          <td>{p.region || 'International Hub'}</td>
                          <td className="font-mono text-xs text-muted">
                            {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SYSTEM ACTIVITY */}
            {activeTab === 'activity' && (
              <div className="admin-activity-tab">
                <div className="tab-title-row">
                  <div>
                    <h2>Live Route Searches Activity Stream</h2>
                    <p className="text-muted">Audit trail of route requests and freight computations</p>
                  </div>
                </div>

                <div className="table-responsive-box">
                  <table className="dashboard-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Corridor</th>
                        <th>User</th>
                        <th>Cargo</th>
                        <th>TEU</th>
                        <th>Best Route ID</th>
                        <th>Transit</th>
                        <th>Freight</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((a) => (
                        <tr key={a.id}>
                          <td>#{a.id}</td>
                          <td className="font-semibold text-primary">{a.origin} → {a.destination}</td>
                          <td>{a.user_email || <span className="text-muted italic">Guest Shipper</span>}</td>
                          <td>{a.cargo_type}</td>
                          <td>{a.containers}</td>
                          <td><span className="table-route-id">{a.best_route_id}</span></td>
                          <td>{a.transit_days}d</td>
                          <td className="font-semibold text-emerald-400">${a.total_freight_usd?.toLocaleString()}</td>
                          <td className="text-muted text-xs">{new Date(a.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ADD ROUTE MODAL */}
      {addModalOpen && (
        <div className="modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="inquiry-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Route to routes.csv</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAddModalOpen(false)}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="admin-modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Origin Port</label>
                  <select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    required
                  >
                    {ports.map((p) => (
                      <option key={p.name} value={p.name}>{p.name} ({p.country})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Destination Port</label>
                  <select
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                  >
                    {ports.map((p) => (
                      <option key={p.name} value={p.name}>{p.name} ({p.country})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Distance (Nautical Miles)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.distance_nm}
                    onChange={(e) => setFormData({ ...formData, distance_nm: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Transit Days</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.transit_days}
                    onChange={(e) => setFormData({ ...formData, transit_days: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Transshipments (0 for Direct)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transshipments}
                    onChange={(e) => setFormData({ ...formData, transshipments: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Route Type Classification</label>
                  <select
                    value={formData.route_type}
                    onChange={(e) => setFormData({ ...formData, route_type: e.target.value })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Alternative">Alternative</option>
                    <option value="Express Direct">Express Direct</option>
                    <option value="Direct Feeder">Direct Feeder</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Base Freight (USD per container)</label>
                <input
                  type="number"
                  min="50"
                  step="0.01"
                  value={formData.base_freight_usd}
                  onChange={(e) => setFormData({ ...formData, base_freight_usd: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-hero-primary">
                  Append Route to Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROUTE MODAL */}
      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="inquiry-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Route {selectedRoute?.route_id}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditModalOpen(false)}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="admin-modal-form">
              <div className="corridor-banner">
                {selectedRoute?.origin} → {selectedRoute?.destination}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Distance (NM)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.distance_nm}
                    onChange={(e) => setFormData({ ...formData, distance_nm: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Transit Days</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.transit_days}
                    onChange={(e) => setFormData({ ...formData, transit_days: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Transshipments</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transshipments}
                    onChange={(e) => setFormData({ ...formData, transshipments: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Route Type</label>
                  <select
                    value={formData.route_type}
                    onChange={(e) => setFormData({ ...formData, route_type: e.target.value })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Alternative">Alternative</option>
                    <option value="Express Direct">Express Direct</option>
                    <option value="Direct Feeder">Direct Feeder</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Base Freight (USD)</label>
                <input
                  type="number"
                  min="50"
                  step="0.01"
                  value={formData.base_freight_usd}
                  onChange={(e) => setFormData({ ...formData, base_freight_usd: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-hero-primary">
                  Save Changes to CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ROUTE CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
          <div className="inquiry-modal-box danger-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-red-500">Confirm Route Deletion</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteModalOpen(false)}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="danger-modal-body">
              <p>
                Are you sure you want to permanently delete route <strong>{selectedRoute?.route_id}</strong> ({selectedRoute?.origin} → {selectedRoute?.destination}) from <code>routes.csv</code>?
              </p>
              <p className="danger-subnote">
                ⚠️ This will reload the routing dataset immediately and cannot be undone.
              </p>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-delete-confirm"
                  onClick={handleDeleteConfirm}
                >
                  Confirm & Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
