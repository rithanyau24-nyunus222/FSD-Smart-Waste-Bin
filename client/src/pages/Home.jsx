import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api.jsx';
import { CityMap, RiskBadge, StatusBadge } from '../components.jsx';

export const Home = () => {
  const [stats, setStats] = useState({
    totalComplaints: 6,
    collectedComplaints: 2,
    totalBins: 10,
    highRiskHazards: 2
  });
  const [bins, setBins] = useState([]);
  const [complaints, setComplaints] = useState([]);

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
      }
    };
    loadHomeData();
  }, []);

  return (
    <div>
      {/* Editorial Rustic Hero Card */}
      <div className="editorial-hero">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '700', color: 'var(--moss)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            <span>🍃</span> Greater Chennai Corporation
          </div>
          <h1 className="editorial-hero-title">
            Smart Waste &amp; Collection Grid
          </h1>
          <p className="editorial-hero-sub">
            Citizen overflow reporting, proximity duplicate elimination, and verified sanitation collection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <Link to="/report" className="btn-primary">
            📸 Report Waste
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            🏛️ Municipal Admin
          </Link>
        </div>
      </div>

      {/* 3 Clean Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="white-card" style={{ padding: '18px 22px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
            Total Incidents Logged
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            {stats.totalComplaints}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--moss)', marginTop: '4px', fontWeight: '700' }}>
            Across Chennai Zones
          </div>
        </div>

        <div className="white-card" style={{ padding: '18px 22px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
            Critical Hazards
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--terracotta)', fontFamily: 'var(--font-serif)' }}>
            {stats.highRiskHazards}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--terracotta)', marginTop: '4px', fontWeight: '700' }}>
            Monsoon drainage threats
          </div>
        </div>

        <div className="white-card" style={{ padding: '18px 22px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
            Incidents Resolved
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--moss)', fontFamily: 'var(--font-serif)' }}>
            {stats.collectedComplaints}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--moss)', marginTop: '4px', fontWeight: '700' }}>
            Verified with photo proof
          </div>
        </div>
      </div>

      {/* Realistic Smart Bin IoT Telemetry Stream */}
      <div className="iot-telemetry-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.6rem' }}>📡</span>
          <div>
            <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.9rem' }}>
              Live Smart Bin IoT Telemetry
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              BIN-AD-01 · Adyar L.B. Road Signal (Ward 174)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '130px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: '700', marginBottom: '3px' }}>
              <span>Ultrasonic Sensor</span>
              <strong style={{ color: 'var(--terracotta)' }}>94% FULL</strong>
            </div>
            <div className="iot-gauge-bar" style={{ width: '130px' }}>
              <div className="iot-gauge-fill" style={{ width: '94%', backgroundColor: 'var(--terracotta)' }} />
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Distance: <strong style={{ color: 'var(--text-main)' }}>6.2 cm</strong> · Temp: <strong style={{ color: 'var(--text-main)' }}>31°C</strong>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--moss)', fontWeight: '700' }}>
            ☀️ Solar Li-Ion: 88%
          </div>

          <span className="ink-stamp ink-stamp-ochre" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
            OVERFLOW CRITICAL 🚨
          </span>
        </div>
      </div>

      {/* Chennai Live Map (100% Free OpenStreetMap) */}
      <div className="white-card" style={{ padding: '22px' }}>
        <div className="white-card-header" style={{ marginBottom: '14px' }}>
          <div>
            <h2 className="white-card-title">
              <span>🗺️</span>
              <span>Chennai Spatial Map</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
              Green pins = normal bins · Yellow = warning · Red = overflown bins and citizen reports.
            </p>
          </div>
        </div>

        <CityMap
          complaints={complaints}
          bins={bins}
          height="420px"
        />
      </div>

      {/* Recent Incident Reports */}
      <div className="white-card">
        <div className="white-card-header">
          <h2 className="white-card-title">
            <span>📋</span>
            <span>Recent Incident Reports</span>
          </h2>
          <Link to="/report" style={{ fontSize: '0.82rem', color: 'var(--terracotta)', fontWeight: '700' }}>
            + Report New Spot →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                border: '1px solid var(--border-rustic)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={c.photo}
                  alt="Waste thumbnail"
                  style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.92rem' }}>
                    {c.areaName || c.bin?.area || 'Chennai Locality'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiskBadge level={c.riskLevel} />
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const About = () => (
  <div style={{ maxWidth: '720px', margin: '0 auto' }}>
    <div className="white-card">
      <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', marginBottom: '12px' }}>
        About CleanChennai
      </h1>
      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
        CleanChennai is a municipal solid waste monitoring and grievance redressal platform.
        It connects citizens with municipal supervisors and sanitation drivers to keep streets and storm drains clean.
      </p>
    </div>
  </div>
);

export const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', marginBottom: '8px' }}>
      404
    </h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Page not found</p>
    <Link to="/" className="btn-primary">
      Return Home
    </Link>
  </div>
);
