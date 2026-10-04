import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, apiFetch } from '../api.jsx';
import { CityMap } from '../components.jsx';

export const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalComplaints: 6,
    collectedComplaints: 2,
    totalBins: 10,
    highRiskHazards: 2
  });
  const [bins, setBins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [statsData, binsData, complaintsData] = await Promise.all([
          apiFetch('/stats/public'),
          apiFetch('/bins'),
          apiFetch('/complaints')
        ]);
        if (statsData) setStats(statsData);
        setBins(binsData || []);
        setComplaints(complaintsData || []);
      } catch (err) {
        console.warn('Could not load public stats:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const userName = user?.name ? user.name.split(' ')[0] : 'Citizen';

  return (
    <div>
      {/* PURPLE HERO BANNER (MATCHING REFERENCE IMAGE) */}
      <div className="welcome-banner">
        <span className="banner-tag">Greater Chennai Corporation</span>
        <h1 className="banner-title">
          Good Day, {userName}! 🌿
        </h1>
        <p className="banner-subtitle">
          Transforming Chennai's urban waste management into a transparent, closed-loop collection workflow.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {user?.role === 'citizen' ? (
            <Link to="/report" className="banner-btn">
              📸 Report an Overflowing Spot
            </Link>
          ) : user?.role === 'authority' ? (
            <Link to="/dashboard" className="banner-btn">
              🏛️ Open Corporation Command Hub
            </Link>
          ) : user?.role === 'collector' ? (
            <Link to="/tasks" className="banner-btn">
              🚛 View Today's Daily Stops
            </Link>
          ) : (
            <>
              <Link to="/report" className="banner-btn">
                📸 Report Waste
              </Link>
              <Link to="/login" className="banner-btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                🔑 Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 3 METRIC CHIPS ROW (MATCHING REFERENCE IMAGE) */}
      <div className="metric-chips-row">
        <div className="metric-chip">
          <div className="metric-chip-icon icon-purple">📑</div>
          <div>
            <div className="metric-chip-val">{stats.totalComplaints}</div>
            <div className="metric-chip-label">Reports Logged</div>
          </div>
        </div>

        <div className="metric-chip">
          <div className="metric-chip-icon icon-rose">⚠️</div>
          <div>
            <div className="metric-chip-val">{stats.highRiskHazards}</div>
            <div className="metric-chip-label">Critical Risk Spots</div>
          </div>
        </div>

        <div className="metric-chip">
          <div className="metric-chip-icon icon-emerald">✅</div>
          <div>
            <div className="metric-chip-val">{stats.collectedComplaints}</div>
            <div className="metric-chip-label">Closed-Loop Verified</div>
          </div>
        </div>
      </div>

      {/* CHENNAI LIVE MAP SECTION (OPENSTREETMAP - NO API KEY REQUIRED) */}
      <div className="white-card">
        <div className="white-card-header">
          <div>
            <h2 className="white-card-title">
              <span>🗺️</span>
              <span>Live Chennai Waste &amp; Hotspot Map</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
              Real-time spatial visualization across Chennai Corporation zones. Click pins for photo previews.
            </p>
          </div>

          <Link to="/report" className="btn-primary btn-sm">
            + New Incident Pin
          </Link>
        </div>

        <CityMap
          complaints={complaints}
          bins={bins}
          height="420px"
        />
      </div>

      {/* RECENT REPORTS QUICK LIST (CLEAN TABLE) */}
      <div className="white-card">
        <div className="white-card-header">
          <h2 className="white-card-title">
            <span>📋</span>
            <span>Recent Incident Reports</span>
          </h2>
          <Link to="/my-complaints" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '700' }}>
            View All Reports →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {complaints.slice(0, 4).map((c) => (
            <div
              key={c._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={c.photo}
                  alt="Waste thumbnail"
                  style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                    {c.areaName || c.bin?.area || 'Chennai Incident'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {c.description.slice(0, 65)}...
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: c.riskLevel === 'critical' ? 'var(--rose-light)' : 'var(--amber-light)',
                    color: c.riskLevel === 'critical' ? 'var(--rose)' : '#b45309'
                  }}
                >
                  {(c.riskLevel || 'medium').toUpperCase()} RISK
                </span>

                <Link to={`/complaints/${c._id}`} className="btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
                  Track →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const About = () => <Home />;
export const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '100px 20px' }}>
    <h1 style={{ fontSize: '3rem', color: 'var(--text-main)', marginBottom: '12px' }}>404</h1>
    <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Page not found.</p>
    <Link to="/" className="btn-primary">Return to CleanChennai Home</Link>
  </div>
);
