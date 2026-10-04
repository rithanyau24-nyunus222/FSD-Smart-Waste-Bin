import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, apiFetch } from '../api.jsx';

/* =====================================================
   HOME PAGE
   ===================================================== */
export const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalComplaints: 18,
    collectedComplaints: 7,
    totalBins: 12
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const data = await apiFetch('/stats/public');
        if (data) {
          setStats(data);
        }
      } catch (err) {
        console.warn('Could not fetch public stats:', err.message);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchPublicStats();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section container">
        <div className="hero-mascot-box">
          <span role="img" aria-label="bin">🗑️</span>
        </div>
        <h1 className="hero-title">Smart Waste Bin Monitoring</h1>
        <p className="hero-subtitle">Keep It Clean, Keep It Smart.</p>
        <p className="hero-desc">
          Empowering citizens and municipal sanitation teams across Indian cities to report, track,
          and clear overflowing waste bins with real-time sensor intelligence and complete transparency.
        </p>

        <div className="hero-cta">
          {user ? (
            user.role === 'citizen' ? (
              <Link to="/report" className="btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
                📸 Report an Overflowing Bin
              </Link>
            ) : user.role === 'authority' ? (
              <Link to="/dashboard" className="btn-accent" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
                🏛️ Open Authority Dashboard
              </Link>
            ) : (
              <Link to="/tasks" className="btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
                🚛 View My Collection Tasks
              </Link>
            )
          ) : (
            <>
              <Link to="/report" className="btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
                📸 Report an Overflowing Bin
              </Link>
              <Link to="/login" className="btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
                🔑 Sign In / Register
              </Link>
            </>
          )}
        </div>

        {/* Live Counters */}
        <div className="stats-grid" style={{ maxWidth: '900px', margin: '0 auto 60px auto' }}>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">📊</div>
            <div className="stat-data">
              <span className="stat-value">{loadingStats ? '...' : stats.totalComplaints}</span>
              <span className="stat-label">Total Reports Logged</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">✨</div>
            <div className="stat-data">
              <span className="stat-value">{loadingStats ? '...' : stats.collectedComplaints}</span>
              <span className="stat-label">Bins Cleared &amp; Collected</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-gold">📡</div>
            <div className="stat-data">
              <span className="stat-value">{loadingStats ? '...' : stats.totalBins}</span>
              <span className="stat-label">Monitored Smart Bins</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="container" style={{ marginBottom: '70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>The Urban Waste Challenge</h2>
          <p style={{ color: 'var(--text-muted)' }}>Why traditional public bin management systems fail urban neighborhoods</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ borderTop: '4px solid var(--red)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>⏳</span>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Delayed Reporting</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Citizens who notice an overflowing public bin face tedious phone calls or simply ignore it, leaving waste to rot for days.
            </p>
          </div>
          <div className="card" style={{ borderTop: '4px solid var(--gold)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>👁️</span>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Zero Live Visibility</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Municipal authorities have no real-time telemetry on which bins are full, creating blind spots in daily urban operations.
            </p>
          </div>
          <div className="card" style={{ borderTop: '4px solid var(--primary-blue)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>🚚</span>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Rigid Fixed Routes</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Garbage trucks blindly follow fixed schedules, frequently visiting half-empty bins while overflowing hotspots remain unserved.
            </p>
          </div>
          <div className="card" style={{ borderTop: '4px solid var(--navy)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>🕳️</span>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>The "Black Hole" Effect</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Once a complaint is filed, citizens receive no status updates or timeline visibility, resulting in a breakdown of civic trust.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Flow */}
      <section className="container" style={{ marginBottom: '70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>How It Works: 5-Step Resolution Loop</h2>
          <p style={{ color: 'var(--text-muted)' }}>From citizen notification to verified collection in a traceable loop</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ background: '#DCFCE7', color: 'var(--primary-green)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800' }}>1</div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Report</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Citizen uploads a compressed photo and drops a precise map pin.</p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ background: '#E0E7FF', color: 'var(--primary-blue)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800' }}>2</div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Verify</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Authority validates the report, checks fill level, and sets priority.</p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ background: '#F3E8FF', color: 'var(--purple)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800' }}>3</div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Assign</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Task is dispatched to the closest available sanitation collector.</p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ background: '#E0F2FE', color: 'var(--teal)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800' }}>4</div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Collect</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Collector uses map navigation, arrives on-site, and marks it collected.</p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ background: '#FEF3C7', color: 'var(--gold)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontWeight: '800' }}>5</div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Reset &amp; Close</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bin fill level resets to 5%, and citizen receives instant notification.</p>
          </div>
        </div>
      </section>

      {/* The 3 Roles Section */}
      <section className="container" style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Built For Everyone Involved</h2>
          <p style={{ color: 'var(--text-muted)' }}>Connecting the community, administration, and ground sanitation workforce</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="card">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>👤</span>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>The Citizen</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary-green)', fontWeight: '600', marginBottom: '12px' }}>E.g. Priya in Adyar</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Take a quick photo, adjust the map pin, and submit in under 60 seconds. Track your complaints with full history and notifications.
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🏛️</span>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>The Municipal Authority</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: '600', marginBottom: '12px' }}>E.g. Officer Karthik at HQ</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Monitor live sensor fill levels on the city map. Verify, prioritize, and assign overflowing bins to collectors with one click.
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🚛</span>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>The Sanitation Collector</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--teal)', fontWeight: '600', marginBottom: '12px' }}>E.g. Murugan on Mobile</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Open dynamic task queue on phone, tap Google Maps directions to the bin, clear the waste, and mark collected effortlessly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

/* =====================================================
   ABOUT PAGE
   ===================================================== */
export const About = () => {
  return (
    <div className="about-page container" style={{ padding: '20px 20px 60px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>About The System</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto', fontSize: '1.05rem' }}>
          Smart Waste Bin Monitoring &amp; Collection System is a College Full Stack Development project
          designed to optimize municipal waste management in Indian smart cities through transparent tracking and smart heuristics.
        </p>
      </div>

      {/* Before vs After Comparison */}
      <div className="card" style={{ marginBottom: '48px', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Before vs After Comparison</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Aspect</th>
                <th style={{ color: 'var(--red)' }}>Traditional System</th>
                <th style={{ color: 'var(--primary-green)' }}>SmartBin Platform</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Citizen Reporting</strong></td>
                <td>Clunky phone calls, physical complaints, or ignored</td>
                <td>Under 60 seconds with compressed photo and auto-GPS pin</td>
              </tr>
              <tr>
                <td><strong>Collection Schedule</strong></td>
                <td>Fixed routes regardless of actual bin fill status</td>
                <td>Dynamic need-based dispatch prioritizing critical bins (&gt;80%)</td>
              </tr>
              <tr>
                <td><strong>Citizen Transparency</strong></td>
                <td>No visibility into whether action was taken</td>
                <td>Full vertical audit timeline with actor stamps and notifications</td>
              </tr>
              <tr>
                <td><strong>Fill Level Telemetry</strong></td>
                <td>Blind guesswork until complaints accumulate</td>
                <td>Simulated sensor telemetry with color-coded interactive city map</td>
              </tr>
              <tr>
                <td><strong>Accountability</strong></td>
                <td>Hard to track which team is responsible for clearing</td>
                <td>Assigned directly to dedicated collectors with timestamps</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Future Scope */}
      <div className="card" style={{ background: '#F8FAFC' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Future Scope &amp; Hardware Integration</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          While this prototype leverages smart software simulation for college demonstration, the architecture is designed for production expansion:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--primary-green)', marginBottom: '8px' }}>📡 Hardware IoT Ultrasonic Sensors</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Installing HC-SR04 ultrasonic sensors and ESP32 / NB-IoT microcontrollers inside bin lids to transmit continuous millimeter-level fill readings directly to the database.
            </p>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--primary-blue)', marginBottom: '8px' }}>🧠 AI Image Waste Categorization</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Automated computer vision models to inspect uploaded citizen photos, verifying whether waste is dry, wet, e-waste, or hazardous construction debris.
            </p>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--purple)', marginBottom: '8px' }}>🗺️ Traveling Salesperson Route Optimization</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Computing the mathematically optimal driving path for municipal compacting trucks to visit all critical bins with minimum fuel consumption and emissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   404 NOT FOUND PAGE
   ===================================================== */
export const NotFound = () => {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <span style={{ fontSize: '5rem', display: 'block', marginBottom: '16px' }}>🚯</span>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Oops! Looks like this page got swept away or never existed.
      </p>
      <Link to="/" className="btn-primary">
        🏠 Return to Home
      </Link>
    </div>
  );
};
