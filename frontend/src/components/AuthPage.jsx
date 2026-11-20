import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateMobileNumber, validateEmailAddress } from '../utils/validation';

export default function AuthPage({ initialMode = 'login', onBrowseRoutes }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Registration State
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [address, setAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail || !loginPassword) {
      setLoginError('Please enter both your Email Address and Password.');
      return;
    }

    setLoginLoading(true);
    try {
      await login(cleanEmail, loginPassword);
      // AuthContext will update state and App.jsx redirects based on role!
    } catch (err) {
      setLoginError(err.message || 'Invalid email address or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Shipper Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    // Field Validations
    const cleanFirst = firstName.trim();
    const cleanLast = surname.trim();
    const cleanMobile = mobileNumber.trim();
    const cleanEmail = regEmail.trim();
    const cleanAddress = address.trim();

    // First Name validation: letters only, no numbers or digits
    if (!cleanFirst) {
      setRegError('First Name is required.');
      return;
    }
    if (/\d/.test(cleanFirst)) {
      setRegError('First Name must contain letters only (no numbers or digits allowed).');
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(cleanFirst)) {
      setRegError('First Name must contain letters only.');
      return;
    }

    // Surname validation: letters only, no numbers or digits
    if (!cleanLast) {
      setRegError('Surname is required.');
      return;
    }
    if (/\d/.test(cleanLast)) {
      setRegError('Surname must contain letters only (no numbers or digits allowed).');
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(cleanLast)) {
      setRegError('Surname must contain letters only.');
      return;
    }

    // Mobile Number validation (Strict 10 digits starting with 6, 7, 8, or 9)
    const mobileError = validateMobileNumber(cleanMobile);
    if (mobileError) {
      setRegError(mobileError);
      return;
    }

    // Email ID validation (Strict format, single @, no consecutive dots, valid domain extension)
    const emailError = validateEmailAddress(cleanEmail);
    if (emailError) {
      setRegError(emailError);
      return;
    }

    // Full Address validation
    if (!cleanAddress) {
      setRegError('Full Address / Port Facility is required.');
      return;
    }
    if (cleanAddress.length < 5) {
      setRegError('Full Address or Port Facility must be at least 5 characters in length.');
      return;
    }

    // Password validations: minimum 6 characters
    if (!regPassword) {
      setRegError('Password is required (minimum 6 characters).');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters in length.');
      return;
    }
    if (!confirmPassword) {
      setRegError('Please re-enter your password in Confirm Password.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setRegError('Confirm password does not match password.');
      return;
    }

    setRegLoading(true);
    try {
      await register({
        first_name: cleanFirst,
        surname: cleanLast,
        full_name: `${cleanFirst} ${cleanLast}`,
        email: cleanEmail,
        mobile_number: cleanMobile,
        address: cleanAddress,
        password: regPassword,
        confirm_password: confirmPassword,
      });
      setRegSuccess('Shipper account created successfully! Redirecting...');
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Brand Header */}
      <div className="auth-header-card">
        <div className="auth-brand-badge">
          <img src="/searoute-logo.jpg" alt="SeaRoute Logo" className="brand-logo-img" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
          <div>
            <h1 className="auth-brand-heading">SeaRoute</h1>
            <p className="auth-brand-tagline">Global Maritime Freight & Route Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="auth-card-panel">
        {/* Tab Selector */}
        <div className="auth-tab-row">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setLoginError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setRegError('');
              setRegSuccess('');
            }}
          >
            Shipper Registration
          </button>
        </div>

        {/* =====================================================================
            LOGIN FORM
        ===================================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form-content">
            <h2 className="auth-form-title">Account Sign In</h2>
            <p className="auth-form-sub">
              Access your maritime brokerage workspace, routes, and shipment orders.
            </p>

            {loginError && <div className="alert-banner alert-danger">{loginError}</div>}

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

            <div className="auth-btn-row">
              <button type="submit" className="btn-primary btn-block" disabled={loginLoading}>
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <button
                type="button"
                className="btn-secondary btn-block"
                onClick={() => setMode('register')}
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* =====================================================================
            SHIPPER REGISTRATION FORM
        ===================================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form-content" noValidate>
            <h2 className="auth-form-title">Shipper Registration</h2>
            <p className="auth-form-sub">
              Register as a commercial shipper to query optimal maritime routes and book cargo consignments.
            </p>

            {regError && <div className="alert-banner alert-danger">{regError}</div>}
            {regSuccess && <div className="alert-banner alert-success">{regSuccess}</div>}

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

            <div className="auth-btn-row">
              <button type="submit" className="btn-primary btn-block" disabled={regLoading}>
                {regLoading ? 'Creating Account...' : 'Create Shipper Account'}
              </button>
              <button
                type="button"
                className="btn-secondary btn-block"
                onClick={() => setMode('login')}
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {onBrowseRoutes && (
        <div className="auth-footer-prompt">
          <button type="button" className="btn-link" onClick={onBrowseRoutes}>
            ← Browse Public Route Engine as Guest
          </button>
        </div>
      )}
    </div>
  );
}
