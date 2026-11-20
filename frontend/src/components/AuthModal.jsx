import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateMobileNumber, validateEmailAddress } from '../utils/validation';

// Professional realistic maritime vector icons
const VesselIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 20c1.2.5 2.5.5 4 0s2.8-.5 4 0 2.5.5 4 0 2.8-.5 4 0 2.5.5 4 0" />
    <path d="M3.5 17.5L5 11h14l1.5 6.5c-2.5 1-5 .5-8 .5s-6 .5-9-.5z" />
    <rect x="7" y="6" width="4" height="5" rx="0.5" />
    <rect x="13" y="6" width="4" height="5" rx="0.5" />
    <path d="M11 3h2v3h-2z" />
  </svg>
);

const AnchorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="22" x2="12" y2="8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </svg>
);

const CompassIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(255,255,255,0.25)" />
  </svg>
);

const LightningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(255,255,255,0.2)" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const BoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [address, setAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setLoginEmail('');
    setLoginPassword('');
    setFirstName('');
    setSurname('');
    setMobileNumber('');
    setRegEmail('');
    setAddress('');
    setRegPassword('');
    setConfirmPassword('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      const cleanFirst = firstName.trim();
      const cleanLast = surname.trim();
      const cleanMobile = mobileNumber.trim();
      const cleanEmail = regEmail.trim();
      const cleanAddress = address.trim();

      // First Name validation: string/letters only, no numbers or digits
      if (!cleanFirst) {
        setError('First Name is required.');
        return;
      }
      if (/\d/.test(cleanFirst)) {
        setError('First Name must contain letters only (no numbers or digits allowed).');
        return;
      }
      if (!/^[a-zA-Z\s'-]+$/.test(cleanFirst)) {
        setError('First Name must contain letters only.');
        return;
      }

      // Surname validation: string/letters only, no numbers or digits
      if (!cleanLast) {
        setError('Surname is required.');
        return;
      }
      if (/\d/.test(cleanLast)) {
        setError('Surname must contain letters only (no numbers or digits allowed).');
        return;
      }
      if (!/^[a-zA-Z\s'-]+$/.test(cleanLast)) {
        setError('Surname must contain letters only.');
        return;
      }

      // Mobile Number validation (Strict 10 digits starting with 6, 7, 8, or 9)
      const mobileError = validateMobileNumber(cleanMobile);
      if (mobileError) {
        setError(mobileError);
        return;
      }

      // Email ID validation (Strict format, single @, no consecutive dots, valid domain extension)
      const emailError = validateEmailAddress(cleanEmail);
      if (emailError) {
        setError(emailError);
        return;
      }

      // Full address validation
      if (!cleanAddress) {
        setError('Full Address / Port Facility is required.');
        return;
      }
      if (cleanAddress.length < 5) {
        setError('Full Address / Port Facility must be at least 5 characters in length.');
        return;
      }

      // Password validations: minimum 6 characters
      if (!regPassword) {
        setError('Password is required (minimum 6 characters).');
        return;
      }
      if (regPassword.length < 6) {
        setError('Password must be at least 6 characters in length.');
        return;
      }
      if (!confirmPassword) {
        setError('Please re-enter your password in Confirm Password.');
        return;
      }
      if (regPassword !== confirmPassword) {
        setError('Confirm Password does not match Password.');
        return;
      }

      setLoading(true);
      try {
        const newUser = await register({
          first_name: cleanFirst,
          surname: cleanLast,
          full_name: `${cleanFirst} ${cleanLast}`,
          email: cleanEmail,
          mobile_number: cleanMobile,
          address: cleanAddress,
          password: regPassword,
          confirm_password: confirmPassword,
        });
        if (onSuccess) onSuccess(newUser);
        onClose();
      } catch (err) {
        setError(err.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!loginEmail.trim() || !loginPassword) {
        setError('Please enter both email and password.');
        return;
      }
      setLoading(true);
      try {
        const logged = await login(loginEmail.trim(), loginPassword);
        if (onSuccess) onSuccess(logged);
        onClose();
      } catch (err) {
        setError(err.message || 'Invalid email address or password.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`auth-card-modal ${mode === 'signup' ? 'auth-modal-signup' : 'auth-modal-login'}`}>
        {/* Left Side: Maritime Branding & Journey Info */}
        <div className="auth-modal-sidebar">
          <div className="auth-sidebar-brand">
            <img src="/searoute-logo.jpg" alt="SeaRoute Logo" className="auth-sidebar-logo" />
            <span className="auth-sidebar-title">SeaRoute</span>
          </div>

          <div className="auth-sidebar-body">
            {mode === 'login' ? (
              <>
                <div className="auth-sidebar-badge">Shipper Portal</div>
                <h3 className="auth-sidebar-heading">Welcome Back!</h3>
                <p className="auth-sidebar-desc">
                  Log in to access your maritime freight workspace, monitor active consignments, and explore optimal ocean routes.
                </p>

                <div className="auth-sidebar-features">
                  <div className="auth-sidebar-feature-item">
                    <span className="feature-icon"><VesselIcon /></span>
                    <div>
                      <strong>Live Milestones</strong>
                      <p>Track real-time shipment progress from POL to POD.</p>
                    </div>
                  </div>
                  <div className="auth-sidebar-feature-item">
                    <span className="feature-icon"><CompassIcon /></span>
                    <div>
                      <strong>Route Intelligence</strong>
                      <p>Compare sailing distance, transit days, and transshipments.</p>
                    </div>
                  </div>
                  <div className="auth-sidebar-feature-item">
                    <span className="feature-icon"><LightningIcon /></span>
                    <div>
                      <strong>Instant Freight</strong>
                      <p>Transparent benchmark pricing for commercial containers.</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="auth-sidebar-badge">New Shipper</div>
                <h3 className="auth-sidebar-heading">Begin Your Journey</h3>
                <p className="auth-sidebar-desc">
                  Join SeaRoute to find optimal maritime trade corridors, book verified cargo consignments, and streamline your supply chain.
                </p>

                <div className="auth-sidebar-features">
                  <div className="auth-sidebar-feature-item">
                    <span className="feature-icon"><GlobeIcon /></span>
                    <div>
                      <strong>Global Corridors</strong>
                      <p>Access direct and transshipment options across major world ports.</p>
                    </div>
                  </div>
                  <div className="auth-sidebar-feature-item">
                    <span className="feature-icon"><BoxIcon /></span>
                    <div>
                      <strong>Fast Booking</strong>
                      <p>Request container bookings with automated reference IDs.</p>
                    </div>
                  </div>
                  <div className="auth-sidebar-feature-item">
                    <span className="feature-icon"><ShieldCheckIcon /></span>
                    <div>
                      <strong>Verified Tracking</strong>
                      <p>End-to-end status verification by port administration.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="auth-sidebar-footer">
            <span className="auth-footer-tag">
              <img
                src="/searoute-ship-logo.jpg"
                alt="SeaRoute Maritime Emblem"
                className="auth-footer-ship-logo"
              />
              <span>Trusted Maritime Logistics</span>
            </span>
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="auth-modal-main">
          <div className="modal-header">
            <div>
              <h2 className="modal-title">
                {mode === 'login' ? 'Sign In to SeaRoute' : 'Create Your Shipper Account'}
              </h2>
              <p className="modal-subtitle-text">
                {mode === 'login'
                  ? 'Enter your registered email and password to access your shipper dashboard.'
                  : 'Register to access maritime route analysis, compare freight options, and manage your shipment bookings.'}
              </p>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body auth-modal-form" noValidate>
            {error && <div className="alert-banner alert-danger">{error}</div>}

            {mode === 'signup' ? (
              <>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Surname *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter surname"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email ID *</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="shipper@maritime.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Address / Port Facility *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Port Terminal 3, Container Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </>
            )}

            <div className="auth-modal-actions mt-3">
              <button type="submit" className="btn-primary btn-block" disabled={loading}>
                {loading
                  ? mode === 'login'
                    ? 'Signing In...'
                    : 'Registering...'
                  : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
              </button>
            </div>

            <div className="auth-switch-prompt mt-3">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
