import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../api.jsx';

const redirectByRole = (role, navigate) => {
  if (role === 'authority') navigate('/dashboard');
  else if (role === 'collector') navigate('/tasks');
  else navigate('/report');
};

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
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
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    try {
      setLoading(true);
      setError('');
      const user = await login(demoEmail, 'Demo@123');
      redirectByRole(user.role, navigate);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '60px 20px 80px 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔐</span>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>
            Sign In to CleanChennai
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Select a role below for 1-click evaluation access
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: '#fca5a5', marginBottom: '16px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* 1-Click Role Access Buttons */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
            ⚡ 1-Click Instant Demo Access
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              onClick={() => handleQuickLogin('citizen@demo.com')}
            >
              <span style={{ fontSize: '1.2rem' }}>👤</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.88rem' }}>Citizen Portal (Priya)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Report waste, photo AI analysis &amp; timeline tracking</div>
              </div>
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              onClick={() => handleQuickLogin('authority@demo.com')}
            >
              <span style={{ fontSize: '1.2rem' }}>🏛️</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.88rem' }}>Corporation Admin (Karthik)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Review stored photos, remove duplicates &amp; assess risk</div>
              </div>
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              onClick={() => handleQuickLogin('collector@demo.com')}
            >
              <span style={{ fontSize: '1.2rem' }}>🚛</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.88rem' }}>Sanitation Driver (Murugan)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily tasks queue &amp; closed-loop verification</div>
              </div>
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-card)', padding: '0 12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            OR EMAIL SIGN IN
          </span>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleLoginSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. citizen@demo.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--emerald-500)', fontWeight: '600' }}>
            Register as a Citizen
          </Link>
        </div>
      </div>
    </div>
  );
};

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [area, setArea] = useState('Adyar, Chennai');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, area);
      navigate('/report');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '60px 20px 80px 20px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>📝</span>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>
            Citizen Registration
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Create an account to report overflowing waste in your locality
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: '#fca5a5', marginBottom: '16px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya@gmail.com"
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Chennai Locality / Ward
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Adyar, T. Nagar, Anna Nagar"
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Register as Citizen'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--emerald-500)', fontWeight: '600' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
