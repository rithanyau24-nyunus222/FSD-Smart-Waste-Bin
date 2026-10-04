import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api.jsx';
import { CityMap, PredictiveGauge } from '../components.jsx';

export const Dashboard = () => {
  const [bins, setBins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter & tab controls
  const [activeTab, setActiveTab] = useState('incidents'); // incidents | bins | fleet
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Modals
  const [verifyModal, setVerifyModal] = useState({ open: false, complaint: null, priority: 'high' });
  const [rejectModal, setRejectModal] = useState({ open: false, complaint: null, reason: '' });
  const [dispatchModal, setDispatchModal] = useState({ open: false, complaint: null, collectorId: '' });

  // Simulation state
  const [simLevel, setSimLevel] = useState(50);
  const [simulating, setSimulating] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [statsData, binsData, complaintsData, collectorsData] = await Promise.all([
        apiFetch('/stats'),
        apiFetch('/bins'),
        apiFetch('/complaints'),
        apiFetch('/users/collectors')
      ]);

      setStats(statsData);
      setBins(binsData || []);
      setComplaints(complaintsData || []);
      setCollectors(collectorsData || []);
      if (binsData && binsData.length > 0) {
        setSelectedItem(binsData[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Run IoT Sensor Simulation
  const handleSimulate = async (multiplier = 1) => {
    try {
      setSimulating(true);
      const res = await apiFetch('/bins/simulate', { method: 'POST' });
      if (res?.bins) {
        setBins(res.bins);
      }
      const updatedStats = await apiFetch('/stats');
      setStats(updatedStats);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Action: Verify complaint
  const handleVerify = async () => {
    if (!verifyModal.complaint) return;
    try {
      const updated = await apiFetch(`/complaints/${verifyModal.complaint._id}/verify`, {
        method: 'PATCH',
        body: { priority: verifyModal.priority }
      });
      setComplaints((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      setVerifyModal({ open: false, complaint: null, priority: 'high' });
      const updatedStats = await apiFetch('/stats');
      setStats(updatedStats);
    } catch (err) {
      alert('Verification failed: ' + err.message);
    }
  };

  // Action: Reject complaint
  const handleReject = async () => {
    if (!rejectModal.complaint || !rejectModal.reason.trim()) {
      alert('Please specify a rejection reason');
      return;
    }
    try {
      const updated = await apiFetch(`/complaints/${rejectModal.complaint._id}/reject`, {
        method: 'PATCH',
        body: { reason: rejectModal.reason }
      });
      setComplaints((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      setRejectModal({ open: false, complaint: null, reason: '' });
      const updatedStats = await apiFetch('/stats');
      setStats(updatedStats);
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    }
  };

  // Action: Dispatch task to collector
  const handleDispatch = async () => {
    if (!dispatchModal.complaint || !dispatchModal.collectorId) {
      alert('Please select a collection officer');
      return;
    }
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: {
          complaintId: dispatchModal.complaint._id,
          collectorId: dispatchModal.collectorId
        }
      });
      // Refresh complaints list
      const fresh = await apiFetch('/complaints');
      setComplaints(fresh || []);
      setDispatchModal({ open: false, complaint: null, collectorId: '' });
      const updatedStats = await apiFetch('/stats');
      setStats(updatedStats);
    } catch (err) {
      alert('Dispatch failed: ' + err.message);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (priorityFilter !== 'All' && c.priority?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const addr = (c.bin?.address || '').toLowerCase();
      const area = (c.bin?.area || '').toLowerCase();
      if (!desc.includes(q) && !addr.includes(q) && !area.includes(q)) return false;
    }
    return true;
  });

  const criticalCount = bins.filter((b) => b.fillLevel >= 80).length;
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const activeCount = complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length;
  const collectedCount = complaints.filter((c) => c.status === 'Collected').length;

  return (
    <div className="command-viewport">
      {/* LEFT SIDEBAR: OPERATIONS & TELEMETRY STREAM */}
      <aside className="command-sidebar">
        {/* KPI Telemetry Header */}
        <div className="telemetry-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                Command &amp; Dispatch OS
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Live Stream · Greater Chennai Corporation
              </span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.72rem',
                fontWeight: '700'
              }}
            >
              <span className="radar-pulse green"></span> LIVE TELEMETRY
            </span>
          </div>

          <div className="telemetry-row">
            <div className="stat-metric">
              <div className="stat-metric-num" style={{ color: 'var(--accent-rose)' }}>{criticalCount}</div>
              <div className="stat-metric-label">Critical &gt;80%</div>
            </div>
            <div className="stat-metric">
              <div className="stat-metric-num" style={{ color: 'var(--accent-amber)' }}>{pendingCount}</div>
              <div className="stat-metric-label">Pending Triage</div>
            </div>
            <div className="stat-metric">
              <div className="stat-metric-num" style={{ color: 'var(--accent-purple)' }}>{activeCount}</div>
              <div className="stat-metric-label">In Transit</div>
            </div>
            <div className="stat-metric">
              <div className="stat-metric-num" style={{ color: 'var(--accent-emerald)' }}>{collectedCount}</div>
              <div className="stat-metric-label">Resolved</div>
            </div>
          </div>
        </div>

        {/* IoT Simulation Control Card */}
        <div className="sim-controls-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
              ⚡ IoT Sensor Simulation Hub
            </span>
            <button
              type="button"
              onClick={() => handleSimulate()}
              disabled={simulating}
              className="btn-cyan"
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: 'var(--radius-full)' }}
            >
              {simulating ? 'Pulsing...' : '📡 Inject Telemetry'}
            </button>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
            Test live triggers, overflow alarms, and map radar pings across all 12 smart sensors:
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleSimulate(0.8)}
              className="btn-secondary"
              style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
            >
              🟢 Normal Load
            </button>
            <button
              type="button"
              onClick={() => handleSimulate(1.3)}
              className="btn-secondary"
              style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
            >
              🟡 Rush Hour (+25%)
            </button>
            <button
              type="button"
              onClick={() => handleSimulate(2.0)}
              className="btn-secondary"
              style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
            >
              🔴 Monsoon Overflow
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('incidents')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'incidents' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'incidents' ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.84rem'
            }}
          >
            🚨 Incident Queue ({filteredComplaints.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bins')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'bins' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'bins' ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.84rem'
            }}
          >
            🗑️ 12 Smart Bins
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'fleet' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'fleet' ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.84rem'
            }}
          >
            🚛 Sanitation Fleet ({collectors.length})
          </button>
        </div>

        {/* TAB 1: INCIDENTS QUEUE */}
        {activeTab === 'incidents' && (
          <>
            {/* Search & Filter Controls */}
            <div style={{ padding: '14px 24px 8px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search incidents by address or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Collected">Collected</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="form-select"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <option value="All">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Incident List */}
            <div className="incident-list">
              {filteredComplaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No reports matching filter criteria
                </div>
              ) : (
                filteredComplaints.map((c) => {
                  const isSelected = selectedItem?._id === c._id;
                  return (
                    <div
                      key={c._id}
                      className={`incident-card ${isSelected ? 'active-selected' : ''}`}
                      onClick={() => setSelectedItem(c)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className={`status-chip ${c.status.toLowerCase().replace(' ', '-')}`}>
                          {c.status}
                        </span>
                        {c.priority && (
                          <span className={`priority-pill ${c.priority.toLowerCase()}`}>
                            {c.priority}
                          </span>
                        )}
                      </div>

                      <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#fff', marginBottom: '6px', lineHeight: '1.4' }}>
                        "{c.description}"
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                        📍 {c.bin?.address || 'Reported Location'} ({c.bin?.area || 'Chennai'})
                      </div>

                      {/* Quick Action Buttons for Authority */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {c.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              className="btn-cyan"
                              style={{ flex: 1, padding: '5px', fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setVerifyModal({ open: true, complaint: c, priority: 'high' });
                              }}
                            >
                              ✓ Verify
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ flex: 1, padding: '5px', fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectModal({ open: true, complaint: c, reason: '' });
                              }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        {c.status === 'Verified' && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', padding: '6px', fontSize: '0.78rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDispatchModal({ open: true, complaint: c, collectorId: collectors[0]?._id || '' });
                            }}
                          >
                            🚛 Dispatch Sanitation Truck
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: SMART BINS TELEMETRY */}
        {activeTab === 'bins' && (
          <div className="incident-list">
            {bins.map((bin) => {
              const isSelected = selectedItem?._id === bin._id;
              const isCritical = bin.fillLevel >= 80;
              return (
                <div
                  key={bin._id}
                  className={`incident-card ${isSelected ? 'active-selected' : ''}`}
                  onClick={() => setSelectedItem(bin)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`radar-pulse ${isCritical ? 'red' : bin.fillLevel >= 50 ? 'amber' : 'green'}`}></span>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{bin.code}</strong>
                    </div>
                    <span
                      style={{
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        color: isCritical ? 'var(--accent-rose)' : bin.fillLevel >= 50 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                      }}
                    >
                      {bin.fillLevel}% FULL
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    {bin.address} ({bin.area})
                  </div>

                  <PredictiveGauge fillLevel={bin.fillLevel} />
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SANITATION FLEET */}
        {activeTab === 'fleet' && (
          <div className="incident-list">
            {collectors.map((col) => (
              <div key={col._id} className="incident-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    🚛
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>{col.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Area: {col.area}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)' }}>
                  ● Active On Shift · Route Proximity Optimized
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* RIGHT WORKSPACE: FULL GIS CITY MAP */}
      <main className="command-map-area">
        <CityMap
          bins={bins}
          complaints={complaints}
          selectedItem={selectedItem}
          onSelectBin={(item) => setSelectedItem(item)}
        />
      </main>

      {/* VERIFY MODAL */}
      {verifyModal.open && (
        <div className="modal-backdrop" onClick={() => setVerifyModal({ open: false, complaint: null, priority: 'high' })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>Verify Incident &amp; Assign Priority</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
              "{verifyModal.complaint?.description}"
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Priority Classification:
              </label>
              <select
                value={verifyModal.priority}
                onChange={(e) => setVerifyModal((prev) => ({ ...prev, priority: e.target.value }))}
                className="form-select"
              >
                <option value="critical">🔴 Critical (Immediate Hazard / Blockage)</option>
                <option value="high">🟡 High (Commercial &amp; High Footfall)</option>
                <option value="medium">🔵 Medium (Standard Ward Overflow)</option>
                <option value="low">🟢 Low (Routine Clearance)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVerifyModal({ open: false, complaint: null, priority: 'high' })}
              >
                Cancel
              </button>
              <button type="button" className="btn-cyan" onClick={handleVerify}>
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal.open && (
        <div className="modal-backdrop" onClick={() => setRejectModal({ open: false, complaint: null, reason: '' })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-rose)', marginBottom: '10px' }}>Reject Incident Report</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
              "{rejectModal.complaint?.description}"
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Mandatory Rejection Rationale (Visible to Citizen):
              </label>
              <textarea
                rows="3"
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Debris is private property demolition waste. Please contact GCC C&D toll-free."
                className="form-textarea"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRejectModal({ open: false, complaint: null, reason: '' })}
              >
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleReject}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL */}
      {dispatchModal.open && (
        <div className="modal-backdrop" onClick={() => setDispatchModal({ open: false, complaint: null, collectorId: '' })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>Dispatch Sanitation Truck</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
              Assign incident at <strong>{dispatchModal.complaint?.bin?.address || 'Chennai'}</strong> to a sanitation worker:
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Select Sanitation Officer:
              </label>
              <select
                value={dispatchModal.collectorId}
                onChange={(e) => setDispatchModal((prev) => ({ ...prev, collectorId: e.target.value }))}
                className="form-select"
              >
                {collectors.map((col) => (
                  <option key={col._id} value={col._id}>
                    🚛 {col.name} — Area: {col.area}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDispatchModal({ open: false, complaint: null, collectorId: '' })}
              >
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleDispatch}>
                Dispatch Truck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
