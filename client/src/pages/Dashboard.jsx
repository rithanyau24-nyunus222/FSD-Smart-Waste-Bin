import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api.jsx';
import { CityMap, RiskBadge, StatusBadge } from '../components.jsx';

export const Dashboard = () => {
  const [bins, setBins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [riskModal, setRiskModal] = useState({ open: false, complaint: null, riskLevel: 'high' });
  const [dispatchModal, setDispatchModal] = useState({ open: false, complaint: null, collectorId: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, binsData, complaintsData, collectorsData, duplicatesData] = await Promise.all([
        apiFetch('/stats'),
        apiFetch('/bins'),
        apiFetch('/complaints'),
        apiFetch('/users/collectors'),
        apiFetch('/complaints/duplicates')
      ]);

      setStats(statsData);
      setBins(binsData || []);
      setComplaints(complaintsData || []);
      setCollectors(collectorsData || []);
      setDuplicates(duplicatesData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Save Risk Assessment
  const handleSaveRisk = async () => {
    if (!riskModal.complaint) return;
    try {
      setActionLoading(true);
      await apiFetch(`/complaints/${riskModal.complaint._id}/risk`, {
        method: 'PATCH',
        body: { riskLevel: riskModal.riskLevel }
      });
      setRiskModal({ open: false, complaint: null, riskLevel: 'high' });
      fetchDashboardData();
    } catch (err) {
      alert('Could not update risk level: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Merge Duplicate Report
  const handleMergeDuplicate = async (primaryId, duplicateId) => {
    if (!window.confirm('Merge this duplicate report into the master ticket? This avoids sending two trucks to the same spot.')) return;
    try {
      setActionLoading(true);
      await apiFetch('/complaints/merge-duplicates', {
        method: 'POST',
        body: { primaryId, duplicateId }
      });
      alert('Duplicate merged successfully! A single consolidated task will be maintained for field drivers.');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to merge duplicate: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch Daily Task to Driver
  const handleDispatchTask = async () => {
    if (!dispatchModal.complaint || !dispatchModal.collectorId) return;
    try {
      setActionLoading(true);
      await apiFetch('/tasks', {
        method: 'POST',
        body: {
          complaintId: dispatchModal.complaint._id,
          collectorId: dispatchModal.collectorId,
          notes: `Morning dispatch. Priority: ${(dispatchModal.complaint.riskLevel || 'high').toUpperCase()}`
        }
      });
      setDispatchModal({ open: false, complaint: null, collectorId: '' });
      alert('Daily Task successfully assigned and sent to driver queue!');
      fetchDashboardData();
    } catch (err) {
      alert('Dispatch failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const descMatch = (c.description || '').toLowerCase().includes(q);
      const areaMatch = (c.areaName || c.bin?.area || '').toLowerCase().includes(q);
      if (!descMatch && !areaMatch) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Clean Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          🏛️ Municipal Corporation Admin Portal
        </div>
        <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Incident Review &amp; Dispatch Operations
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Review citizen photos, resolve proximity duplicate reports within 50m, evaluate hazard risk, and dispatch daily collection tasks.
        </p>
      </div>

      {/* DUPLICATE DETECTION & REMOVAL TOOL */}
      {duplicates.length > 0 && (
        <div className="duplicate-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔍 Proximity Duplicate Detected</span>
              <span style={{ fontSize: '0.72rem', background: '#b45309', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {duplicates.length} CLUSTER
              </span>
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '14px' }}>
            Multiple citizens reported waste at the same spot ({duplicates[0]?.distanceMeters}m apart). Merge them to combine citizen feedback into 1 ticket and prevent duplicate driver dispatches.
          </p>

          {duplicates.map((pair, idx) => (
            <div key={idx} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Location: {pair.primary.areaName || 'Chennai Spot'} ({pair.distanceMeters} meters apart)
                </span>

                <button
                  type="button"
                  className="btn-warning btn-sm"
                  disabled={actionLoading}
                  onClick={() => handleMergeDuplicate(pair.primary._id, pair.duplicate._id)}
                >
                  🔗 Merge &amp; Remove Duplicate
                </button>
              </div>

              <div className="duplicate-grid">
                {/* Primary */}
                <div className="duplicate-card-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-verified">Primary Report (#{pair.primary._id.slice(-5)})</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(pair.primary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="waste-photo-thumb" style={{ height: '140px', marginBottom: '8px' }}>
                    <img src={pair.primary.photo} alt="Primary" />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    {pair.primary.description}
                  </div>
                </div>

                {/* Duplicate */}
                <div className="duplicate-card-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-high">Potential Duplicate (#{pair.duplicate._id.slice(-5)})</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(pair.duplicate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="waste-photo-thumb" style={{ height: '140px', marginBottom: '8px' }}>
                    <img src={pair.duplicate.photo} alt="Duplicate" />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    {pair.duplicate.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHENNAI LIVE GIS MAP (100% FREE OPENSTREETMAP) */}
      <div className="white-card">
        <div className="white-card-header">
          <div>
            <h2 className="white-card-title">
              <span>🗺️</span>
              <span>Chennai Corporation Live Incident Map</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
              OpenStreetMap coverage across Chennai zones. Pins indicate reported waste locations and municipal bins.
            </p>
          </div>
        </div>

        <CityMap
          complaints={complaints}
          bins={bins}
          height="400px"
        />
      </div>

      {/* STORED REPORTS FEED & TASK DISPATCH TABLE */}
      <div className="white-card">
        <div className="white-card-header">
          <div>
            <h2 className="white-card-title">
              <span>📸</span>
              <span>Review Stored Reports &amp; Dispatch</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
              Inspect photographic proof, update hazard risk, and assign to daily collection routes.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['All', 'Pending', 'Verified', 'Assigned', 'In Progress', 'Collected'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn-secondary btn-sm ${statusFilter === st ? 'active' : ''}`}
                style={{
                  backgroundColor: statusFilter === st ? 'var(--primary)' : 'var(--bg-input)',
                  color: statusFilter === st ? '#fff' : 'var(--text-secondary)'
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Report Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredComplaints.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              No reports found matching criteria.
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <div
                key={c._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Photo frame */}
                <div className="waste-photo-thumb" style={{ height: '170px', marginBottom: '12px' }}>
                  <img src={c.photo} alt="Reported waste" />
                  <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '6px' }}>
                    <RiskBadge level={c.riskLevel} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>

                {/* Details */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    📍 {c.areaName || c.bin?.area || 'Chennai'} · {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    {c.description}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setRiskModal({ open: true, complaint: c, riskLevel: c.riskLevel || 'high' })}
                  >
                    ⚖️ Set Risk
                  </button>

                  {['Pending', 'Verified'].includes(c.status) && (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => setDispatchModal({ open: true, complaint: c, collectorId: collectors[0]?._id || '' })}
                    >
                      🚛 Dispatch Task
                    </button>
                  )}

                  {['Assigned', 'In Progress'].includes(c.status) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--blue)', fontWeight: '700' }}>
                      Driver On Route
                    </span>
                  )}

                  {c.status === 'Collected' && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: '700' }}>
                      ✅ Cleaned &amp; Verified
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RISK ASSESSMENT MODAL */}
      {riskModal.open && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
              ⚖️ Assess Municipal Hazard Risk
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Select risk level for ticket #{riskModal.complaint?._id.slice(-6)}:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
              {[
                { level: 'critical', title: '🔴 Critical Hazard', desc: 'Blocked storm drain, medical waste, or immediate flood/traffic threat' },
                { level: 'high', title: '🟡 High Risk', desc: 'Commercial vegetable crates, animal scatter, foul odor near pedestrians' },
                { level: 'low', title: '🟢 Low Risk', desc: 'Regular public bin fill, dry leaves, routine pickup schedule' }
              ].map((r) => (
                <label
                  key={r.level}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: riskModal.riskLevel === r.level ? 'var(--primary-light)' : '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="risk"
                    checked={riskModal.riskLevel === r.level}
                    onChange={() => setRiskModal({ ...riskModal, riskLevel: r.level })}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setRiskModal({ open: false, complaint: null, riskLevel: 'high' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={actionLoading}
                onClick={handleSaveRisk}
              >
                {actionLoading ? 'Saving...' : 'Save Risk Level'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH TASK MODAL */}
      {dispatchModal.open && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
              🚛 Assign to Daily Task Queue
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Dispatch a sanitation driver to clear <strong>{dispatchModal.complaint?.areaName || 'this spot'}</strong>:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                Select Sanitation Driver:
              </label>
              <select
                value={dispatchModal.collectorId}
                onChange={(e) => setDispatchModal({ ...dispatchModal, collectorId: e.target.value })}
              >
                {collectors.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.area})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setDispatchModal({ open: false, complaint: null, collectorId: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={actionLoading}
                onClick={handleDispatchTask}
              >
                {actionLoading ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
