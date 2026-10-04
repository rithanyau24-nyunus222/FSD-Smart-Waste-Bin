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
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(16,185,129,0.2))', border: '1px solid rgba(6,182,212,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '12px' }}>
            🔐
          </div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '4px' }}>
            Sign In to SmartBin OS
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Select a verified demo persona or enter your credentials.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '8px', color: 'var(--accent-rose)', marginBottom: '18px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* 1-Click Demo Persona Fill & Login */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
            1-Click Instant Persona Sign-In:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@demo.com')}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '8px 6px', textAlign: 'center', fontSize: '0.78rem' }}
            >
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>👤</div>
              <strong style={{ color: 'var(--accent-emerald)', display: 'block' }}>Citizen</strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Priya</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('authority@demo.com')}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '8px 6px', textAlign: 'center', fontSize: '0.78rem' }}
            >
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>🏛️</div>
              <strong style={{ color: 'var(--accent-cyan)', display: 'block' }}>Officer</strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Karthik</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('collector@demo.com')}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '8px 6px', textAlign: 'center', fontSize: '0.78rem' }}
            >
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>🚛</div>
              <strong style={{ color: 'var(--accent-amber)', display: 'block' }}>Driver</strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Murugan</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or sign in manually</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
        </div>

        <form onSubmit={handleLoginSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Email Address:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. citizen@demo.com"
              className="form-input"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Register as Citizen
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
  const [area, setArea] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please provide name, email, and password.');
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
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '4px' }}>
            Create Citizen Account
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Join the Greater Chennai Corporation Civic Waste Network.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '8px', color: 'var(--accent-rose)', marginBottom: '18px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Full Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="form-input"
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Email Address:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya@gmail.com"
              className="form-input"
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Area / Ward:
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Adyar, T. Nagar, Anna Nagar"
              className="form-input"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
