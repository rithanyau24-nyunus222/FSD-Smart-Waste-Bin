import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api.jsx';
import { RiskBadge, StatusBadge } from '../components.jsx';

export const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await apiFetch('/complaints');
        setComplaints(data || []);
      } catch (err) {
        console.error('Failed to fetch user complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', marginBottom: '4px' }}>
            My Reported Incidents
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Track municipal risk evaluation, driver assignments, and verified photo proof.
          </p>
        </div>
        <Link to="/report" className="btn-primary btn-sm">
          + Report New Overflow
        </Link>
      </div>

      {loading ? (
        <div className="white-card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading your reported incidents...
        </div>
      ) : complaints.length === 0 ? (
        <div className="white-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <span style={{ fontSize: '38px', display: 'block', marginBottom: '10px' }}>🌱</span>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>No Active Incident Reports</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Spot overflowing garbage in Chennai? Take a photo and report it to get it cleared.
          </p>
          <Link to="/report" className="btn-primary btn-sm">
            📸 Snap &amp; Report Waste
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {complaints.map((c) => (
            <Link
              key={c._id}
              to={`/complaints/${c._id}`}
              className="white-card"
              style={{ display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer', padding: '18px' }}
            >
              <div className="waste-photo-thumb" style={{ height: '170px', marginBottom: '14px' }}>
                <img src={c.photo} alt="Reported spot" />
                <div className="photo-badge-overlay" style={{ display: 'flex', gap: '6px' }}>
                  <RiskBadge level={c.riskLevel || 'medium'} />
                  <StatusBadge status={c.status} />
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                📍 {c.areaName || c.bin?.area || 'Chennai'} · {new Date(c.createdAt).toLocaleDateString()}
              </div>

              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '12px', lineHeight: '1.4' }}>
                {c.description}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-rustic)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--terracotta)', fontWeight: '700' }}>
                <span>Track Incident Resolution →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const ComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await apiFetch(`/complaints/${id}`);
        setComplaint(data);
      } catch (err) {
        console.error('Failed to load complaint detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading incident resolution tracker...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="white-card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Report Not Found</h2>
        <Link to="/report" className="btn-primary btn-sm">
          Report a new issue
        </Link>
      </div>
    );
  }

  const isCollected = complaint.status === 'Collected' || complaint.status === 'Resolved';
  const isAssigned = ['Assigned', 'In Progress', 'Collected', 'Resolved'].includes(complaint.status);
  const isVerified = ['Verified', 'Assigned', 'In Progress', 'Collected', 'Resolved'].includes(complaint.status);

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/my-complaints" style={{ color: 'var(--terracotta)', fontSize: '0.85rem', fontWeight: '700' }}>
          ← Back to All Reports
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
            Incident #{complaint._id.slice(-6)}: {complaint.areaName || 'Chennai Incident'}
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <RiskBadge level={complaint.riskLevel} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>
      </div>

      {/* 4-Step Resolution Stepper */}
      <div className="white-card" style={{ marginBottom: '24px' }}>
        <div className="timeline-stepper">
          <div className="stepper-item completed">
            <div className="stepper-circle">1</div>
            <span className="stepper-label">Photo Uploaded</span>
          </div>

          <div className={`stepper-item ${isVerified ? 'completed' : 'active'}`}>
            <div className="stepper-circle">2</div>
            <span className="stepper-label">Risk Evaluated</span>
          </div>

          <div className={`stepper-item ${isAssigned ? 'completed' : isVerified ? 'active' : ''}`}>
            <div className="stepper-circle">3</div>
            <span className="stepper-label">Driver Dispatched</span>
          </div>

          <div className={`stepper-item ${isCollected ? 'completed' : isAssigned ? 'active' : ''}`}>
            <div className="stepper-circle">4</div>
            <span className="stepper-label">Cleaned &amp; Verified</span>
          </div>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="white-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Before Photo */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              📸 Reported Photo (Citizen Upload)
            </div>
            <div className="waste-photo-thumb" style={{ height: '220px' }}>
              <img src={complaint.photo} alt="Reported waste" />
            </div>
          </div>

          {/* After Photo Proof if resolved */}
          {complaint.photoProof ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--moss)' }}>
                  ✅ Verified Cleanup Proof (Driver Photo)
                </span>
                <span className="ink-stamp">CLEANED ✓</span>
              </div>
              <div className="waste-photo-thumb" style={{ height: '220px', borderColor: 'var(--moss-border)' }}>
                <img src={complaint.photoProof} alt="Cleaned proof" />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                📋 Incident Summary
              </div>
              <div style={{ background: 'var(--bg-card-subtle)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-rustic)', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '12px', lineHeight: '1.4' }}>
                  {complaint.description}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Reported by: <strong style={{ color: 'var(--text-main)' }}>{complaint.reporter?.name || 'Citizen'}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Location: <strong style={{ color: 'var(--text-main)' }}>{complaint.areaName || 'Chennai'}</strong>
                </div>
                {complaint.duplicateCount > 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--ochre)', fontWeight: '700', marginTop: '10px' }}>
                    🔗 {complaint.duplicateCount} duplicate report(s) merged into this master ticket.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Details */}
        {complaint.analysis && (
          <div className="ai-analysis-box">
            <div className="ai-analysis-header">
              <span className="ai-analysis-title">✨ Automated Image Telemetry</span>
              <RiskBadge level={complaint.riskLevel} />
            </div>
            <div className="ai-metric-grid">
              <div className="ai-metric-item">
                Identified Category: <strong>{complaint.analysis.category}</strong>
              </div>
              <div className="ai-metric-item">
                Estimated Volume: <strong>{complaint.analysis.estimatedWeight}</strong>
              </div>
              <div className="ai-metric-item">
                Drainage Risk: <strong>{complaint.analysis.drainageThreat}</strong>
              </div>
              <div className="ai-metric-item">
                Spread Radius: <strong>{complaint.analysis.spillRadius}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit History Timeline */}
      <div className="white-card">
        <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-main)', marginBottom: '18px' }}>
          📜 Resolution Timeline
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(complaint.history || []).map((h, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '14px',
                paddingBottom: '14px',
                borderBottom: i < complaint.history.length - 1 ? '1px solid var(--border-rustic)' : 'none'
              }}
            >
              <div style={{ fontSize: '1.3rem', marginTop: '2px' }}>
                {h.status === 'Collected' ? '✅' : h.status === 'Assigned' ? '🚛' : h.status === 'Verified' ? '✓' : '📸'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{h.status}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{h.note}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Action by: {h.by?.name || 'System'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
