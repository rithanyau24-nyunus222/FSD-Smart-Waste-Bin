import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, apiFetch } from '../api.jsx';
import { CityMap, RiskBadge, StatusBadge } from '../components.jsx';

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

  return (
    <div>
      {/* Clean Top Header & Direct Flow Links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            <span>🌿</span> Greater Chennai Corporation
          </div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Municipal Waste &amp; Collection Grid
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Real-time citizen reporting, automated duplicate elimination, and verified driver collection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/report" className="btn-primary">
            📸 Report Waste
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            🏛️ Municipal Admin
          </Link>
        </div>
      </div>

      {/* 3 Clean Stat Cards (Minimalist, No Loud Gradients) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="white-card" style={{ padding: '16px 20px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
            Total Incidents Logged
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {stats.totalComplaints}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', fontWeight: '600' }}>
            Across 5 Chennai Zones
          </div>
        </div>

        <div className="white-card" style={{ padding: '16px 20px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
            Critical Risk Hazards
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--rose)', fontFamily: 'var(--font-heading)' }}>
            {stats.highRiskHazards}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--rose)', marginTop: '4px', fontWeight: '600' }}>
            Storm drain blockage threat
          </div>
        </div>

        <div className="white-card" style={{ padding: '16px 20px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
            Closed-Loop Verified
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--emerald)', fontFamily: 'var(--font-heading)' }}>
            {stats.collectedComplaints}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '4px', fontWeight: '600' }}>
            Cleaned with photo proof
          </div>
        </div>
      </div>

      {/* Chennai Live Map (100% Free OpenStreetMap - Full Breathing Room) */}
      <div className="white-card" style={{ padding: '20px' }}>
        <div className="white-card-header" style={{ marginBottom: '14px' }}>
          <div>
            <h2 className="white-card-title">
              <span>🗺️</span>
              <span>Chennai Spatial Waste Grid</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
              Pins represent IoT municipal bins and citizen waste reports. Click pins for photo previews.
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
          <Link to="/report" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '700' }}>
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
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={c.photo}
                  alt="Waste thumbnail"
                  style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
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
      <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', marginBottom: '12px' }}>
        About CleanChennai
      </h1>
      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
        CleanChennai is a municipal solid waste monitoring and collection platform developed for the Greater Chennai Corporation.
        It bridges the gap between citizens, corporation ward supervisors, and sanitation truck drivers through an automated 4-step closed-loop workflow.
      </p>
    </div>
  </div>
);

export const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', marginBottom: '8px' }}>
      404
    </h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Page not found</p>
    <Link to="/" className="btn-primary">
      Return Home
    </Link>
  </div>
);
