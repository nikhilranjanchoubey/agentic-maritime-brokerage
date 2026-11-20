/**
 * API Service for Agentic Maritime Brokerage Platform.
 * Communicates with FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('maritime_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/`);
    return await res.json();
  } catch (err) {
    console.error('API health check error:', err);
    return null;
  }
}

export async function fetchPorts() {
  const res = await fetch(`${API_BASE_URL}/ports`);
  if (!res.ok) throw new Error('Failed to load ports');
  const data = await res.json();
  return data.ports || [];
}

export async function fetchPopularRoutes() {
  const res = await fetch(`${API_BASE_URL}/popular-routes`);
  if (!res.ok) throw new Error('Failed to load popular routes');
  const data = await res.json();
  return data.popular_routes || [];
}

export async function analyzeRoute({ origin, destination, cargo_type = 'Standard Dry', containers = 1 }) {
  const res = await fetch(`${API_BASE_URL}/analyze-route`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      origin,
      destination,
      cargo_type,
      containers: parseInt(containers, 10) || 1,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Route analysis failed');
  }
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Login failed');
  }
  return data;
}

export async function fetchRouteOrigins() {
  const res = await fetch(`${API_BASE_URL}/routes/origins`);
  if (!res.ok) throw new Error('Failed to load route origins');
  const data = await res.json();
  return data.origins || [];
}

export async function fetchRouteDestinations(origin) {
  if (!origin) return [];
  const res = await fetch(`${API_BASE_URL}/routes/destinations?origin=${encodeURIComponent(origin)}`);
  if (!res.ok) throw new Error('Failed to load route destinations');
  const data = await res.json();
  return data.destinations || [];
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  return data;
}

export async function fetchUserProfile() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const data = await res.json();
  return data.user;
}

// User Dashboard APIs
export async function fetchUserDashboard() {
  const res = await fetch(`${API_BASE_URL}/user/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return await res.json();
}

export async function fetchSavedRoutes() {
  const res = await fetch(`${API_BASE_URL}/user/saved-routes`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch saved routes');
  const data = await res.json();
  return data.saved_routes || [];
}

export async function saveRouteRecommendation(routeData) {
  const res = await fetch(`${API_BASE_URL}/user/saved-routes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(routeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to save route');
  return data;
}

export async function deleteSavedRoute(savedId) {
  const res = await fetch(`${API_BASE_URL}/user/saved-routes/${savedId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete saved route');
  return await res.json();
}

export async function updateUserProfile(profileData) {
  const res = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update profile');
  return data;
}

export async function changeUserPassword({ current_password, new_password }) {
  const res = await fetch(`${API_BASE_URL}/user/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update password');
  return data;
}

// Admin Dashboard APIs
export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return await res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch registered users');
  const data = await res.json();
  return data.users || [];
}

export async function createAdminUser(userData) {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to create user');
  return data;
}

export async function updateAdminUser(userId, userData) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update user');
  return data;
}

export async function toggleAdminUserStatus(userId) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to toggle status');
  return data;
}

export async function deleteAdminUser(userId) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to delete user');
  return data;
}

export async function fetchAdminActivity() {
  const res = await fetch(`${API_BASE_URL}/admin/activity`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch activity stream');
  const data = await res.json();
  return data.activity || [];
}

export async function fetchAdminRoutes({ page = 1, limit = 20, search = '', route_type = 'All' } = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append('search', search);
  if (route_type && route_type !== 'All') params.append('route_type', route_type);

  const res = await fetch(`${API_BASE_URL}/admin/routes?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch routes');
  return await res.json();
}

export async function addAdminRoute(routeData) {
  const res = await fetch(`${API_BASE_URL}/admin/routes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(routeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to add route');
  return data;
}

export async function updateAdminRoute(routeId, routeData) {
  const res = await fetch(`${API_BASE_URL}/admin/routes/${routeId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(routeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update route');
  return data;
}

export async function deleteAdminRoute(routeId) {
  const res = await fetch(`${API_BASE_URL}/admin/routes/${routeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to delete route');
  return data;
}

// Shipment Booking & Tracking APIs
export async function createShipmentBooking(bookingData) {
  const res = await fetch(`${API_BASE_URL}/shipments/book`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bookingData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Shipment booking failed');
  return data;
}

export async function fetchUserBookings() {
  const res = await fetch(`${API_BASE_URL}/shipments/my-bookings`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  return data.bookings || [];
}

export async function fetchShipmentDetails(bookingId) {
  const res = await fetch(`${API_BASE_URL}/shipments/${encodeURIComponent(bookingId)}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch shipment details');
  return data;
}

export async function fetchAdminShipments({
  search = '',
  status = 'All',
  booking_status = 'All',
  dispatch_status = 'All'
} = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (booking_status && booking_status !== 'All') params.append('booking_status', booking_status);
  if (dispatch_status && dispatch_status !== 'All') params.append('dispatch_status', dispatch_status);
  if (status && status !== 'All' && !params.has('booking_status') && !params.has('dispatch_status')) {
    params.append('status', status);
  }

  const url = `${API_BASE_URL}/admin/shipments${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin shipments');
  const data = await res.json();
  return data.bookings || [];
}

export async function fetchPendingAdminShipments() {
  const res = await fetch(`${API_BASE_URL}/admin/shipments/pending`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch pending shipments');
  const data = await res.json();
  return data.pending_shipments || [];
}

export async function approveAdminShipment(bookingId) {
  const res = await fetch(`${API_BASE_URL}/admin/shipments/${encodeURIComponent(bookingId)}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to approve shipment');
  return data;
}

export async function rejectAdminShipment(bookingId, reason = '') {
  const res = await fetch(`${API_BASE_URL}/admin/shipments/${encodeURIComponent(bookingId)}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to reject shipment');
  return data;
}

export async function updateAdminShipmentStatus(bookingId, updateData) {
  const res = await fetch(`${API_BASE_URL}/admin/shipments/${encodeURIComponent(bookingId)}/update-status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update shipment status');
  return data;
}

export async function cancelAdminShipment(bookingId, reason = '') {
  const res = await fetch(`${API_BASE_URL}/admin/shipments/${encodeURIComponent(bookingId)}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to cancel shipment');
  return data;
}

export async function deleteAdminShipment(bookingId) {
  const res = await fetch(`${API_BASE_URL}/admin/shipments/${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to delete shipment');
  return data;
}

export async function cancelUserShipment(bookingId) {
  const res = await fetch(`${API_BASE_URL}/shipments/${encodeURIComponent(bookingId)}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to cancel consignment');
  return data;
}

export async function deleteUserShipment(bookingId) {
  return cancelUserShipment(bookingId);
}
