import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, apiFetch } from '../api.jsx';

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
        if (data) setStats(data);
      } catch (err) {
        console.warn('Could not fetch stats:', err.message);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchPublicStats();
  }, []);

  return (
    <div style={{ padding: '40px 0 80px 0' }}>
      {/* Hero Section */}
      <section className="container" style={{ textAlign: 'center', maxWidth: '960px', marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: '20px' }}>
          <span className="radar-pulse cyan"></span>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-cyan)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Next-Gen Urban Waste Telemetry
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontFamily: 'var(--font-heading)', fontWeight: '800', lineHeight: '1.15', color: '#fff', letterSpacing: '-0.03em', marginBottom: '18px' }}>
          Autonomous Smart Bin <br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Monitoring &amp; Dynamic Dispatch
          </span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)', maxWidth: '720px', margin: '0 auto 32px auto', lineHeight: '1.7' }}>
          Transforming municipal sanitation from delayed public grievances into an intelligent, closed-loop telemetry platform with real-time IoT fill prediction, 1-tap citizen geo-reporting, and shortest-path driver routing.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '50px' }}>
          <Link to="/report" className="btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            📸 Report an Overflowing Bin
          </Link>
          <Link to="/dashboard" className="btn-cyan" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            🏛️ Open Command Center
          </Link>
          <Link to="/tasks" className="btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem' }}>
            🚛 Driver HUD
          </Link>
        </div>

        {/* Live Counters Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)' }}>
              {loadingStats ? '18' : stats.totalComplaints}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>
              Incidents Logged
            </div>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-emerald)' }}>
              {loadingStats ? '7' : stats.collectedComplaints}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>
              Cleared &amp; Certified
            </div>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-amber)' }}>
              {loadingStats ? '12' : stats.totalBins}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>
              IoT Smart Sensors
            </div>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-purple)' }}>
              &lt; 30m
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>
              Duplicate Proximity Radar
            </div>
          </div>
        </div>
      </section>

      {/* Role Personas Quick Access Cards */}
      <section className="container" style={{ marginBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '6px' }}>
            Built for Three Synchronized Operations Roles
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem' }}>
            Explore the specialized workflows built for citizens, municipal officers, and sanitation drivers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Persona 1: Citizen */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
                👤
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Citizen Engagement</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
                Report overflowing bins in under 45 seconds with in-browser WebP compression (&lt;150 KB), live GPS map pinning, and proximity duplicate alerts. Track status via an Uber-style vertical timeline.
              </p>
            </div>
            <Link to="/report" className="btn-primary" style={{ width: '100%' }}>
              Launch Citizen Portal →
            </Link>
          </div>

          {/* Persona 2: Authority */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
                🏛️
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Operations Command Center</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
                Split-screen GIS operations room displaying live CartoDB dark maps, real-time pulsing IoT radar markers, overflow forecast countdowns, and 1-click driver dispatching.
              </p>
            </div>
            <Link to="/dashboard" className="btn-cyan" style={{ width: '100%' }}>
              Launch Command Center →
            </Link>
          </div>

          {/* Persona 3: Collector */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
                🚛
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Driver Field Cockpit</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
                Mobile-first driver HUD with TSP shortest-path stop sequences, 1-tap Google Maps turn-by-turn routing, and verifiable before/after clearance proof logging.
              </p>
            </div>
            <Link to="/tasks" className="btn-secondary" style={{ width: '100%' }}>
              Launch Driver HUD →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export const About = () => {
  return (
    <div className="container" style={{ maxWidth: '880px', padding: '40px 20px 80px 20px' }}>
      <div className="glass-card">
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '12px' }}>
          About the Smart Bin System
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '24px' }}>
          Urban solid waste management poses acute challenges for municipal corporations across India. Public bins frequently overflow, attracting street animals and choking stormwater drains during monsoons. This Full Stack Development project demonstrates how modern web engineering, IoT sensor emulation, and GIS mapping unite to solve urban waste bottlenecks.
        </p>

        <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)', marginBottom: '10px' }}>
          Core Technological Innovations
        </h3>
        <ul style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '24px' }}>
          <li><strong>In-Browser Photo Compression:</strong> HTML5 Canvas dynamic scaling reduces images to &lt;150 KB WebP before upload, ensuring lightning-fast uploads even on 3G network conditions.</li>
          <li><strong>Proximity Duplicate Prevention:</strong> Prevents duplicate tickets within 30 meters using Haversine geospatial proximity math.</li>
          <li><strong>Predictive Telemetry Gauges:</strong> Linear fill rate forecasting calculates time-to-overflow countdowns (~38 mins remaining).</li>
          <li><strong>Verifiable Audit Chain:</strong> Complete timestamped log with user identity, state transitions, and clearance proof.</li>
        </ul>
      </div>
    </div>
  );
};

export const NotFound = () => {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '120px 20px' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--accent-rose)', fontFamily: 'var(--font-heading)' }}>404</h1>
      <h2 style={{ color: '#fff', marginBottom: '12px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>
        The command sector you requested does not exist or has been relocated.
      </p>
      <Link to="/" className="btn-primary">
        Return to Command Center
      </Link>
    </div>
  );
};
