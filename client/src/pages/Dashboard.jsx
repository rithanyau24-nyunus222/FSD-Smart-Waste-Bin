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

  // Tabs: 'map' | 'reports' | 'duplicates' | 'tasks'
  const [activeTab, setActiveTab] = useState('reports');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [riskModal, setRiskModal] = useState({ open: false, complaint: null, riskLevel: 'high' });
  const [dispatchModal, setDispatchModal] = useState({ open: false, complaint: null, collectorId: '' });
  const [selectedItem, setSelectedItem] = useState(null);
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

  // 1-Click Assess Risk
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

  // 1-Click Merge & Remove Duplicate
  const handleMergeDuplicate = async (primaryId, duplicateId) => {
    if (!window.confirm('Merge this duplicate report into the primary ticket to prevent double truck dispatch?')) return;
    try {
      setActionLoading(true);
      await apiFetch('/complaints/merge-duplicates', {
        method: 'POST',
        body: { primaryId, duplicateId }
      });
      alert('Duplicate merged successfully! A single consolidated collection task will be maintained.');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to merge duplicate: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Add to Daily Tasks
  const handleDispatchTask = async () => {
    if (!dispatchModal.complaint || !dispatchModal.collectorId) return;
    try {
      setActionLoading(true);
      await apiFetch('/tasks', {
        method: 'POST',
        body: {
          complaintId: dispatchModal.complaint._id,
          collectorId: dispatchModal.collectorId,
          notes: `Assigned in morning dispatch. Priority: ${(dispatchModal.complaint.riskLevel || 'high').toUpperCase()}`
        }
      });
      setDispatchModal({ open: false, complaint: null, collectorId: '' });
      alert('Report converted into a Daily Task and dispatched to the driver!');
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
    <div className="container" style={{ padding: '36px 20px 80px 20px' }}>
      {/* Top Municipal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald-500)', fontSize: '0.78rem', fontWeight: '700', marginBottom: '8px' }}>
            🏛️ GREATER CHENNAI CORPORATION (GCC) OPERATIONS
          </div>
          <h1 style={{ fontSize: '1.9rem', fontFamily: 'var(--font-heading)', color: '#fff', letterSpacing: '-0.02em' }}>
            Municipal Review &amp; Dispatch Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Review citizen incident photos, eliminate duplicate reports, assess hazard risk, and assign daily collection tasks.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          🔄 Refresh Live Feed
        </button>
      </div>

      {/* KPI Counters */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-icon">📬</div>
          <div>
            <div className="stat-box-num">{stats ? stats.counts.pending : '...'}</div>
            <div className="stat-box-label">Pending Verification</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-icon" style={{ color: 'var(--rose-500)' }}>⚠️</div>
          <div>
            <div className="stat-box-num">{stats ? stats.counts.criticalHazards : '...'}</div>
            <div className="stat-box-label">Critical Risk Hazards</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-icon" style={{ color: 'var(--amber-500)' }}>🔗</div>
          <div>
            <div className="stat-box-num">{duplicates.length}</div>
            <div className="stat-box-label">Duplicate Clusters</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-icon" style={{ color: 'var(--blue-500)' }}>🚛</div>
          <div>
            <div className="stat-box-num">{stats ? stats.counts.inProgress : '...'}</div>
            <div className="stat-box-label">Daily Tasks in Field</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-box-icon" style={{ color: 'var(--emerald-500)' }}>✅</div>
          <div>
            <div className="stat-box-num">{stats ? stats.counts.collected : '...'}</div>
            <div className="stat-box-label">Closed-Loop Verified</div>
          </div>
        </div>
      </div>

      {/* Clean Operations Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
          style={{ fontSize: '0.95rem', padding: '10px 18px', borderBottom: activeTab === 'reports' ? '2px solid var(--emerald-500)' : 'none' }}
          onClick={() => setActiveTab('reports')}
        >
          📸 Review Stored Reports ({filteredComplaints.length})
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === 'map' ? 'active' : ''}`}
          style={{ fontSize: '0.95rem', padding: '10px 18px', borderBottom: activeTab === 'map' ? '2px solid var(--emerald-500)' : 'none' }}
          onClick={() => setActiveTab('map')}
        >
          🗺️ Live Chennai Waste Map
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === 'duplicates' ? 'active' : ''}`}
          style={{ fontSize: '0.95rem', padding: '10px 18px', borderBottom: activeTab === 'duplicates' ? '2px solid var(--emerald-500)' : 'none' }}
          onClick={() => setActiveTab('duplicates')}
        >
          🔍 Duplicate Detection &amp; Removal
          {duplicates.length > 0 && (
            <span style={{ marginLeft: '6px', background: 'var(--amber-500)', color: '#000', fontSize: '11px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px' }}>
              {duplicates.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: REVIEW STORED REPORTS */}
      {activeTab === 'reports' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Pending', 'Verified', 'Assigned', 'In Progress', 'Collected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn-secondary btn-sm ${statusFilter === st ? 'active' : ''}`}
                  style={{
                    background: statusFilter === st ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: statusFilter === st ? 'var(--emerald-500)' : 'var(--border-subtle)',
                    color: statusFilter === st ? '#fff' : 'var(--text-secondary)'
                  }}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ width: '280px' }}>
              <input
                type="text"
                placeholder="Search by area or waste type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Reports Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredComplaints.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                No reports found matching your filter criteria.
              </div>
            ) : (
              filteredComplaints.map((c) => (
                <div key={c._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Photo with Overlay Badge */}
                  <div className="waste-photo-frame" style={{ height: '200px', marginBottom: '14px' }}>
                    <img src={c.photo} alt="Reported waste" />
                    <div className="photo-badge-overlay" style={{ display: 'flex', gap: '6px' }}>
                      <RiskBadge level={c.riskLevel || 'medium'} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  {/* Header info */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      📍 {c.areaName || c.bin?.area || 'Chennai Location'} · Reported {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem', lineHeight: '1.4' }}>
                      {c.description}
                    </div>
                  </div>

                  {/* AI Analysis Pill */}
                  {c.analysis && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      <strong>AI Analysis:</strong> {c.analysis.category} · {c.analysis.estimatedWeight}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Assess Risk button */}
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setRiskModal({ open: true, complaint: c, riskLevel: c.riskLevel || 'high' })}
                      title="Update risk assessment for this report"
                    >
                      ⚖️ Set Risk
                    </button>

                    {/* Dispatch to Driver button */}
                    {['Pending', 'Verified'].includes(c.status) && (
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => setDispatchModal({ open: true, complaint: c, collectorId: collectors[0]?._id || '' })}
                      >
                        🚛 Assign to Daily Task
                      </button>
                    )}

                    {['Assigned', 'In Progress'].includes(c.status) && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--blue-500)', fontWeight: '600' }}>
                        Driver Dispatched
                      </span>
                    )}

                    {c.status === 'Collected' && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--emerald-500)', fontWeight: '600' }}>
                        ✅ Verified Cleaned
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE CHENNAI CITY MAP */}
      {activeTab === 'map' && (
        <div>
          <div style={{ marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Interactive Chennai GIS grid. Red pins indicate critical risk hazards, amber pins indicate open complaints, and green pins indicate completed collections. Click any pin to inspect the photo and details.
          </div>
          <CityMap
            complaints={complaints}
            bins={bins}
            selectedItem={selectedItem}
            onSelectItem={(item) => setSelectedItem(item)}
            height="560px"
          />
        </div>
      )}

      {/* TAB 3: DUPLICATE DETECTION & REMOVAL */}
      {activeTab === 'duplicates' && (
        <div>
          <div className="duplicate-banner" style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--amber-500)', fontSize: '1.1rem', marginBottom: '6px' }}>
              🔍 Intelligent Proximity Duplicate Detection
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              When multiple citizens report the same overflowing bin from different angles, our system flags them based on proximity (within 50 meters). Merging duplicates combines them into a single master ticket, saving municipal fuel and preventing double truck dispatches.
            </p>
          </div>

          {duplicates.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              🎉 No duplicate reports detected! All open complaints are geographically distinct.
            </div>
          ) : (
            duplicates.map((pair, idx) => (
              <div key={idx} className="duplicate-pair-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'var(--amber-500)', color: '#000', fontWeight: '800', fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      PROXIMITY: {pair.distanceMeters} METERS APART
                    </span>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                      Duplicate Cluster #{idx + 1}: {pair.primary.areaName || pair.primary.bin?.area}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="btn-warning btn-sm"
                    disabled={actionLoading}
                    onClick={() => handleMergeDuplicate(pair.primary._id, pair.duplicate._id)}
                  >
                    🔗 Merge &amp; Remove Duplicate
                  </button>
                </div>

                {/* Side-by-side comparison */}
                <div className="duplicate-columns">
                  {/* Primary Report */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-verified">Primary Report (#{pair.primary._id.slice(-5)})</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(pair.primary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="waste-photo-frame" style={{ height: '180px', marginBottom: '10px' }}>
                      <img src={pair.primary.photo} alt="Primary report" />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '4px' }}>
                      {pair.primary.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Reported by: {pair.primary.reporter?.name || 'Citizen'}
                    </div>
                  </div>

                  {/* Duplicate Report */}
                  <div style={{ background: 'rgba(245, 158, 11, 0.04)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-high">Potential Duplicate (#{pair.duplicate._id.slice(-5)})</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(pair.duplicate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="waste-photo-frame" style={{ height: '180px', marginBottom: '10px' }}>
                      <img src={pair.duplicate.photo} alt="Duplicate report" />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '4px' }}>
                      {pair.duplicate.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Reported by: {pair.duplicate.reporter?.name || 'Citizen'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: ASSESS RISK LEVEL */}
      {riskModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>
              ⚖️ Assess Municipal Hazard Risk
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Set the priority and health hazard risk for ticket #{riskModal.complaint?._id.slice(-6)}:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: riskModal.riskLevel === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: riskModal.riskLevel === 'critical' ? '1px solid var(--rose-500)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="risk"
                  checked={riskModal.riskLevel === 'critical'}
                  onChange={() => setRiskModal({ ...riskModal, riskLevel: 'critical' })}
                />
                <div>
                  <strong style={{ color: '#fca5a5' }}>🔴 Critical Hazard</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Storm drain blockage, medical waste, or severe obstacle near hospitals/schools.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: riskModal.riskLevel === 'high' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: riskModal.riskLevel === 'high' ? '1px solid var(--amber-500)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="risk"
                  checked={riskModal.riskLevel === 'high'}
                  onChange={() => setRiskModal({ ...riskModal, riskLevel: 'high' })}
                />
                <div>
                  <strong style={{ color: '#fcd34d' }}>🟡 High Risk</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Commercial market garbage spilling onto pavement, attracting stray animals.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: riskModal.riskLevel === 'low' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: riskModal.riskLevel === 'low' ? '1px solid var(--emerald-500)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="risk"
                  checked={riskModal.riskLevel === 'low'}
                  onChange={() => setRiskModal({ ...riskModal, riskLevel: 'low' })}
                />
                <div>
                  <strong style={{ color: '#6ee7b7' }}>🟢 Low Risk / Regular</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Bin near full capacity, routine collection scheduled within normal hours.
                  </div>
                </div>
              </label>
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
                {actionLoading ? 'Saving...' : 'Save Risk Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TO DAILY TASKS */}
      {dispatchModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>
              🚛 Assign to Daily Collection Tasks
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Dispatch a sanitation driver to clear the reported waste at <strong>{dispatchModal.complaint?.areaName || 'Chennai'}</strong>:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Select Field Sanitation Driver:
              </label>
              <select
                value={dispatchModal.collectorId}
                onChange={(e) => setDispatchModal({ ...dispatchModal, collectorId: e.target.value })}
              >
                {collectors.map((col) => (
                  <option key={col._id} value={col._id}>
                    {col.name} ({col.area})
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
                {actionLoading ? 'Assigning...' : 'Dispatch Daily Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
