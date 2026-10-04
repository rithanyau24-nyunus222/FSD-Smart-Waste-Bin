import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../api.jsx';

const redirectByRole = (role, navigate) => {
  if (role === 'authority') navigate('/dashboard');
  else if (role === 'collector') navigate('/tasks');
  else navigate('/report');
};

/* =====================================================
   LOGIN PAGE
   ===================================================== */
export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      redirectByRole(user.role, navigate);
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
    setError('');
  };

  return (
    <div className="container" style={{ maxWidth: '460px', padding: '40px 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '2.5rem' }}>🔐</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sign in to access your portal
          </p>
        </div>

        {error && <div className="alert-box alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="e.g. citizen@demo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast-Login Strip for College Presentation */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px' }}>
            ⚡ <strong>Quick Demo Credentials (Password: Demo@123)</strong>
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              onClick={() => handleDemoFill('citizen@demo.com')}
            >
              Citizen
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              onClick={() => handleDemoFill('authority@demo.com')}
            >
              Authority
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              onClick={() => handleDemoFill('collector@demo.com')}
            >
              Collector
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register">Register as Citizen</Link>
        </p>
      </div>
    </div>
  );
};

/* =====================================================
   REGISTER PAGE (CITIZEN ONLY)
   ===================================================== */
export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const user = await register(name, email, password, area);
      redirectByRole(user.role, navigate);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '40px 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '2.5rem' }}>🌱</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '8px' }}>Citizen Registration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Join the community keeping our city clean and smart
          </p>
        </div>

        {error && <div className="alert-box alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              className="form-control"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address *</label>
            <input
              id="reg-email"
              type="email"
              className="form-control"
              placeholder="e.g. priya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password (min 6 characters) *</label>
            <input
              id="reg-password"
              type="password"
              className="form-control"
              placeholder="Choose a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-area">Residential Area / Locality</label>
            <input
              id="reg-area"
              type="text"
              className="form-control"
              placeholder="e.g. Adyar, Chennai"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register as Citizen'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
