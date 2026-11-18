import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShipLogo,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  CompassIcon,
  ShieldCheckIcon,
  ContainerIcon,
  CheckIcon,
} from './Icons';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset inputs when modal opens or mode changes
  useEffect(() => {
    setMode(initialMode);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setCompany('');
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      const full = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!full) {
        setError('Please enter your first and last name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }

      setLoading(true);
      try {
        const newUser = await register({
          email: email.trim(),
          password,
          full_name: full,
          company: company.trim(),
        });
        if (onSuccess) onSuccess(newUser);
        onClose();
      } catch (err) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Login flow
      if (!email.trim() || !password) {
        setError('Please enter both email and password.');
        return;
      }
      setLoading(true);
      try {
        const loggedUser = await login(email.trim(), password);
        if (onSuccess) onSuccess(loggedUser);
        onClose();
      } catch (err) {
        setError(err.message || 'Invalid email address or password.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Close Button Top Right */}
        <button
          type="button"
          className="auth-modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <CloseIcon size={16} />
        </button>

        <div className="auth-split-layout">
          {/* LEFT SIDE: Commercial Maritime Showcase (Large Container Ship) */}
          <div className="auth-left-pane">
            <div className="auth-left-bg">
              <img
                src="/assets/auth-login.jpg"
                alt="Commercial container vessel navigating international shipping corridors"
                className="auth-left-img"
              />
              <div className="auth-left-overlay"></div>
            </div>

            <div className="auth-left-content">
              {/* Brand Header */}
              <div className="auth-left-brand">
                <ShipLogo size={28} className="mr-2 text-cyan" />
                <span className="auth-left-brand-text">AGENTIC MARITIME</span>
              </div>

              {/* Mode-Specific Welcome Heading & Description */}
              {mode === 'signup' ? (
                <div className="auth-left-welcome">
                  <h2>
                    Begin Your Journey.<br />
                    <span className="auth-highlight-text">Build Your Maritime Future.</span>
                  </h2>
                  <p>
                    Create your account and join a smarter maritime logistics network. Discover efficient shipping routes, explore freight opportunities and manage your shipments with confidence.
                  </p>
                </div>
              ) : (
                <div className="auth-left-welcome">
                  <h2>
                    Welcome Back,<br />
                    <span className="auth-highlight-text">Maritime Professional.</span>
                  </h2>
                  <p>
                    Access your brokerage workspace, manage shipments and explore intelligent route recommendations.
                  </p>
                </div>
              )}

              {/* Mode-Specific Feature Highlights */}
              {mode === 'signup' ? (
                <div className="auth-feature-items">
                  <div className="auth-feat-item">
                    <div className="auth-feat-icon-bubble">
                      <CompassIcon size={18} />
                    </div>
                    <div className="auth-feat-text">
                      <h4>Smarter Route Planning</h4>
                      <p>Discover optimized maritime routes and compare shipping options.</p>
                    </div>
                  </div>

                  <div className="auth-feat-item">
                    <div className="auth-feat-icon-bubble">
                      <ShieldCheckIcon size={18} />
                    </div>
                    <div className="auth-feat-text">
                      <h4>Manage Your Shipments</h4>
                      <p>Organize shipment details and track your logistics activities.</p>
                    </div>
                  </div>

                  <div className="auth-feat-item">
                    <div className="auth-feat-icon-bubble">
                      <ContainerIcon size={18} />
                    </div>
                    <div className="auth-feat-text">
                      <h4>Transparent Freight Insights</h4>
                      <p>Explore freight estimates and make informed shipping decisions.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="auth-feature-items">
                  <div className="auth-feat-item">
                    <div className="auth-feat-icon-bubble">
                      <CompassIcon size={18} />
                    </div>
                    <div className="auth-feat-text">
                      <h4>Intelligent Route Planning</h4>
                      <p>Multi-factor voyage optimization across 500+ global corridors.</p>
                    </div>
                  </div>

                  <div className="auth-feat-item">
                    <div className="auth-feat-icon-bubble">
                      <ShieldCheckIcon size={18} />
                    </div>
                    <div className="auth-feat-text">
                      <h4>Shipment Management</h4>
                      <p>Encrypted route history and saved broker bookmarks.</p>
                    </div>
                  </div>

                  <div className="auth-feat-item">
                    <div className="auth-feat-icon-bubble">
                      <ContainerIcon size={18} />
                    </div>
                    <div className="auth-feat-text">
                      <h4>Freight Benchmarking</h4>
                      <p>Transparent benchmark pricing without hidden carrier markups.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode-Specific Quote Card */}
              {mode === 'signup' ? (
                <div className="auth-quote-card">
                  <p>
                    "Every successful shipment begins with the right route and the right decision."
                  </p>
                  <span className="auth-quote-author">— Agentic Maritime Team</span>
                </div>
              ) : (
                <div className="auth-quote-card">
                  <p>
                    "Every global voyage begins with optimal routing. Let Agentic Maritime navigate your logistics."
                  </p>
                  <span className="auth-quote-author">— Commercial Maritime Brokerage Desk</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Clean White Authentication Card (SkyTech Inspiration) */}
          <div className="auth-right-pane">
            <div className="auth-form-card">
              <div className="auth-card-header">
                <h3>{mode === 'login' ? 'Sign in to Agentic Maritime' : 'Create Maritime Account'}</h3>
                <p>
                  {mode === 'login'
                    ? 'Access your brokerage workspace and route analytics.'
                    : 'Join commercial freight brokers, NVOCCs, and logistics planners.'}
                </p>
              </div>

              {error && <div className="auth-error-banner">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-main-form" autoComplete="off">
                {mode === 'signup' ? (
                  <>
                    {/* First Name & Last Name (2 Cols) */}
                    <div className="auth-form-row-2col">
                      <div className="auth-field-group">
                        <label className="auth-field-label">First Name *</label>
                        <input
                          type="text"
                          className="auth-input-control"
                          placeholder="e.g. Alexander"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="auth-field-group">
                        <label className="auth-field-label">Last Name *</label>
                        <input
                          type="text"
                          className="auth-input-control"
                          placeholder="e.g. Vance"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    {/* Email & Phone Number (2 Cols) */}
                    <div className="auth-form-row-2col">
                      <div className="auth-field-group">
                        <label className="auth-field-label">Email Address *</label>
                        <input
                          type="email"
                          className="auth-input-control"
                          placeholder="broker@maritime.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="auth-field-group">
                        <label className="auth-field-label">Phone Number (Optional)</label>
                        <input
                          type="tel"
                          className="auth-input-control"
                          placeholder="+1 555 0192"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="auth-field-group">
                      <label className="auth-field-label">Company / Brokerage (Optional)</label>
                      <input
                        type="text"
                        className="auth-input-control"
                        placeholder="e.g. Pacific Ocean Logistics Corp."
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        autoComplete="organization"
                      />
                    </div>

                    {/* Password & Confirm Password (2 Cols) */}
                    <div className="auth-form-row-2col">
                      <div className="auth-field-group">
                        <label className="auth-field-label">Password *</label>
                        <div className="auth-input-with-action">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="auth-input-control"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="auth-pw-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="auth-field-group">
                        <label className="auth-field-label">Confirm Password *</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="auth-input-control"
                          placeholder="••••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    {/* Password requirements bullets */}
                    <div className="auth-requirements-box">
                      <div className="auth-req-bullet">
                        <CheckIcon size={13} className="text-emerald" />
                        <span>At least 6 characters in length</span>
                      </div>
                      <div className="auth-req-bullet">
                        <CheckIcon size={13} className="text-emerald" />
                        <span>Secure enterprise account encryption</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* SkyTech Demo Credentials Box (Development & Testing) */}
                    <div className="skytech-demo-credentials-box">
                      <div className="skytech-demo-header">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#168BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span className="skytech-demo-title">Demo Credentials (Development only)</span>
                      </div>
                      <div className="skytech-demo-list">
                        <div className="skytech-demo-row">
                          <div className="skytech-demo-creds">
                            <span className="skytech-demo-role">Admin:</span>
                            <span className="skytech-demo-val">admin@maritime.com / Admin@12345</span>
                          </div>
                          <button
                            type="button"
                            className="skytech-demo-btn"
                            onClick={() => {
                              setEmail('admin@maritime.com');
                              setPassword('Admin@12345');
                              setError('');
                            }}
                          >
                            Use Admin
                          </button>
                        </div>
                        <div className="skytech-demo-row">
                          <div className="skytech-demo-creds">
                            <span className="skytech-demo-role">User:</span>
                            <span className="skytech-demo-val">broker@maritime.com / Broker@12345</span>
                          </div>
                          <button
                            type="button"
                            className="skytech-demo-btn"
                            onClick={() => {
                              setEmail('broker@maritime.com');
                              setPassword('Broker@12345');
                              setError('');
                            }}
                          >
                            Use Demo User
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Login Fields */}
                    <div className="auth-field-group">
                      <label className="auth-field-label">Email Address *</label>
                      <input
                        type="email"
                        className="auth-input-control"
                        placeholder="admin@maritime.com or broker@maritime.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>

                    <div className="auth-field-group">
                      <div className="auth-password-header">
                        <label className="auth-field-label">Password *</label>
                      </div>
                      <div className="auth-input-with-action">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="auth-input-control"
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="auth-pw-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="auth-remember-row">
                      <label className="auth-checkbox-label">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="auth-forgot-link"
                        onClick={() => alert('For password recovery, please contact your maritime brokerage administrator at admin@maritime.com')}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-loading-spinner"></span>
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Mode Toggle Link */}
              <div className="auth-switch-prompt">
                {mode === 'login' ? (
                  <>
                    <span>Don't have an account yet? </span>
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => {
                        setMode('signup');
                        setError('');
                      }}
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => {
                        setMode('login');
                        setError('');
                      }}
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
