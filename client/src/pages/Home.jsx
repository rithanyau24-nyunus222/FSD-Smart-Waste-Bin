import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, apiFetch } from '../api.jsx';
import { CityMap } from '../components.jsx';

export const Home = () => {
  const { user, login } = useAuth();
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

  return (
    <div style={{ padding: '40px 0 80px 0' }}>
      {/* Hero Section */}
      <section className="container" style={{ textAlign: 'center', maxWidth: '900px', marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '20px' }}>
          <span style={{ fontSize: '13px' }}>🌿</span>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--emerald-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Greater Chennai Corporation · Smart Waste Monitoring
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontFamily: 'var(--font-heading)', fontWeight: '800', lineHeight: '1.2', color: '#fff', letterSpacing: '-0.02em', marginBottom: '18px' }}>
          Real-Time Waste Mapping &amp; <br />
          <span style={{ color: 'var(--emerald-500)' }}>Closed-Loop Collection</span> for Chennai
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.7', maxWidth: '780px', margin: '0 auto 32px auto' }}>
          Connecting citizens, municipal corporation officers, and sanitation drivers into an efficient, closed-loop workflow: from citizen photo analysis to duplicate removal, risk-based dispatch, and verified cleanup.
        </p>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <Link to="/report" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            📸 Report Overflowing Waste
          </Link>
          <Link to="/dashboard" className="btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            🏛️ Open Municipal Hub
          </Link>
          <Link to="/tasks" className="btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            🚛 View Driver Tasks
          </Link>
        </div>

        {/* Live Stat Badges */}
        <div className="stats-grid" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="stat-box">
            <div className="stat-box-icon">📊</div>
            <div>
              <div className="stat-box-num">{stats.totalComplaints}</div>
              <div className="stat-box-label">Incidents Logged</div>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-box-icon" style={{ color: 'var(--rose-500)' }}>⚠️</div>
            <div>
              <div className="stat-box-num">{stats.highRiskHazards}</div>
              <div className="stat-box-label">Critical Risk Spots</div>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-box-icon" style={{ color: 'var(--blue-500)' }}>🏢</div>
            <div>
              <div className="stat-box-num">{stats.totalBins}</div>
              <div className="stat-box-label">Smart Telemetry Bins</div>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-box-icon" style={{ color: 'var(--emerald-500)' }}>✅</div>
            <div>
              <div className="stat-box-num">{stats.collectedComplaints}</div>
              <div className="stat-box-label">Closed-Loop Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step Closed Loop Pipeline */}
      <section className="container" style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '8px' }}>
            How the Closed-Loop System Works
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Replacing delayed manual complaints with automated visual intelligence and verifiable municipal accountability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {/* Step 1 */}
          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              1
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '6px' }}>
              📸 Photo &amp; AI Analysis
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Citizens photograph waste overflows. The system analyzes the photo to categorize waste type (plastic, organic, drain hazard) and estimate volume.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--blue-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              2
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '6px' }}>
              🗺️ Live Chennai Mapping
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              The incident is plotted live on the Chennai municipal GIS map, alerting authorities to hot spots in Adyar, T. Nagar, Anna Nagar, and Velachery.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              3
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '6px' }}>
              🔍 Duplicate Removal &amp; Risk
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Corporation officers review stored photos, eliminate duplicate reports within 50m to avoid double dispatch, and assess hazard risk (Critical, High, Low).
            </p>
          </div>

          {/* Step 4 */}
          <div className="card">
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              4
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '6px' }}>
              ✅ Closed Verification Loop
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Drivers receive prioritized daily tasks with turn-by-turn navigation. Once cleared, they submit proof to close the loop and notify the citizen.
            </p>
          </div>
        </div>
      </section>

      {/* Live Map Preview on Home */}
      <section className="container">
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '2px' }}>
                🗺️ Live Chennai Waste Telemetry Map
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Real-time spatial visualization across Chennai Corporation zones.
              </p>
            </div>
            <Link to="/dashboard" className="btn-secondary btn-sm">
              Open Full Command Map ↗
            </Link>
          </div>

          <CityMap
            complaints={complaints}
            bins={bins}
            height="440px"
          />
        </div>
      </section>
    </div>
  );
};

export const About = () => <Home />;
export const NotFound = () => (
  <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
    <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '12px' }}>404</h1>
    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Page not found.</p>
    <Link to="/" className="btn-primary">Return to CleanChennai Home</Link>
  </div>
);
