import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api.jsx';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';

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
    <div className="container" style={{ maxWidth: '960px', padding: '40px 20px 80px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>
            My Incident Reports
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            Track live resolution audit history and sanitation truck dispatches.
          </p>
        </div>
        <Link to="/report" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
          + New Report
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading your active reports...
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🌱</span>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No Active Incident Reports</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Your neighborhood is clean! If you spot an overflowing public bin, submit a report to alert GCC.
          </p>
          <Link to="/report" className="btn-primary">
            Report an Overflowing Bin
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {complaints.map((c) => (
            <Link
              key={c._id}
              to={`/complaints/${c._id}`}
              className="glass-card"
              style={{ display: 'block', padding: '20px', transition: 'var(--transition-fast)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className={`status-chip ${c.status.toLowerCase().replace(' ', '-')}`}>
                  {c.status}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Logged on {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontWeight: '600', fontSize: '1.05rem', color: '#fff', marginBottom: '6px' }}>
                "{c.description}"
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                📍 Near: {c.bin?.address || 'Chennai'} ({c.bin?.area || 'Ward Area'})
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
      <div className="container" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Retrieving incident audit trail...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ color: '#fff' }}>Incident Report Not Found</h2>
        <Link to="/my-complaints" className="btn-secondary" style={{ marginTop: '16px' }}>
          Back to Reports
        </Link>
      </div>
    );
  }

  const steps = [
    { label: 'Reported', done: true },
    { label: 'Verified by GCC', done: ['Verified', 'Assigned', 'In Progress', 'Collected'].includes(complaint.status) },
    { label: 'Truck Dispatched', done: ['Assigned', 'In Progress', 'Collected'].includes(complaint.status) },
    { label: 'Cleaned & Certified', done: complaint.status === 'Collected' }
  ];

  const pos = complaint.location?.coordinates ? [complaint.location.coordinates[1], complaint.location.coordinates[0]] : [13.0827, 80.2707];

  return (
    <div className="container" style={{ maxWidth: '860px', padding: '40px 20px 80px 20px' }}>
      <Link to="/my-complaints" style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', display: 'inline-block', marginBottom: '16px' }}>
        ← Back to Incident List
      </Link>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        {/* Progress Tracker Bar */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '10px' }}>
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '20px',
                right: '20px',
                height: '3px',
                background: 'rgba(255,255,255,0.08)',
                zIndex: 1
              }}
            ></div>
            {steps.map((st, i) => (
              <div key={st.label} style={{ zIndex: 2, textAlign: 'center', width: '90px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: st.done ? 'var(--accent-emerald)' : 'var(--bg-dark)',
                    border: `2px solid ${st.done ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px auto',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    boxShadow: st.done ? '0 0 12px rgba(16,185,129,0.5)' : 'none'
                  }}
                >
                  {st.done ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '0.72rem', color: st.done ? '#fff' : 'var(--text-muted)', fontWeight: st.done ? '600' : '400' }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '4px' }}>
              "{complaint.description}"
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              📍 {complaint.bin?.address} ({complaint.bin?.area})
            </div>
          </div>
          <span className={`status-chip ${complaint.status.toLowerCase().replace(' ', '-')}`}>
            {complaint.status}
          </span>
        </div>

        {/* Photo & Map Pin Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {complaint.photo && (
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', height: '180px' }}>
              <img src={complaint.photo} alt="Field Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', height: '180px' }}>
            <MapContainer center={pos} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <CircleMarker center={pos} radius={10} pathOptions={{ color: '#fff', fillColor: '#06B6D4', fillOpacity: 0.9, weight: 2 }} />
            </MapContainer>
          </div>
        </div>

        {/* Vertical Audit Trail */}
        <div style={{ marginTop: '28px' }}>
          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px' }}>
            Live Audit History &amp; Chain of Custody
          </h4>
          <div className="timeline-track">
            {(complaint.history || []).map((h, idx) => (
              <div key={idx} className="timeline-node">
                <div className={`timeline-dot ${idx === 0 ? 'done' : ''}`}></div>
                <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>
                  {h.status}: {h.note || 'State transition recorded'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  By: {h.by?.name || 'Municipal Officer'} · {new Date(h.at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
