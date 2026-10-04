import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge, MapView } from '../components.jsx';
import { apiFetch } from '../api.jsx';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [bins, setBins] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [verifyModal, setVerifyModal] = useState({ open: false, complaint: null, priority: 'medium' });
  const [rejectModal, setRejectModal] = useState({ open: false, complaint: null, reason: '' });
  const [assignModal, setAssignModal] = useState({ open: false, complaint: null, collectorId: '' });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, binsData, collectorsData] = await Promise.all([
        apiFetch('/stats'),
        apiFetch('/bins'),
        apiFetch('/users/collectors')
      ]);

      setStats(statsData);
      setBins(binsData || []);
      setCollectors(collectorsData || []);
    } catch (err) {
      console.error('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const data = await apiFetch(`/complaints?${params.toString()}`);
      setComplaints(data || []);
    } catch (err) {
      console.error('Complaints load error:', err.message);
    }
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Simulate Sensor readings
  const handleSimulate = async () => {
    try {
      setSimulating(true);
      const res = await apiFetch('/bins/simulate', { method: 'POST' });
      setToastMsg(res.message || 'Sensor readings simulated successfully!');
      loadDashboardData();
      loadComplaints();
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Verify complaint
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModal.complaint) return;
    try {
      await apiFetch(`/complaints/${verifyModal.complaint._id}/verify`, {
        method: 'PATCH',
        body: { priority: verifyModal.priority }
      });
      setVerifyModal({ open: false, complaint: null, priority: 'medium' });
      loadDashboardData();
      loadComplaints();
    } catch (err) {
      alert(`Verify error: ${err.message}`);
    }
  };

  // Reject complaint
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.complaint || !rejectModal.reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    try {
      await apiFetch(`/complaints/${rejectModal.complaint._id}/reject`, {
        method: 'PATCH',
        body: { reason: rejectModal.reason.trim() }
      });
      setRejectModal({ open: false, complaint: null, reason: '' });
      loadDashboardData();
      loadComplaints();
    } catch (err) {
      alert(`Reject error: ${err.message}`);
    }
  };

  // Assign task
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.complaint || !assignModal.collectorId) {
      alert('Please select a collector.');
      return;
    }
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: {
          complaintId: assignModal.complaint._id,
          collectorId: assignModal.collectorId
        }
      });
      setAssignModal({ open: false, complaint: null, collectorId: '' });
      loadDashboardData();
      loadComplaints();
    } catch (err) {
      alert(`Assign error: ${err.message}`);
    }
  };

  if (loading && !stats) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p>Loading Authority Operations Dashboard...</p>
      </div>
    );
  }

  // Max value calculation for CSS bar chart
  const maxDayCount = Math.max(...(stats?.last7Days?.map((d) => d.count) || [1]), 1);

  return (
    <div className="container" style={{ padding: '20px 20px 60px 20px' }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div className="alert-box alert-success" style={{ position: 'sticky', top: '80px', zIndex: 999 }}>
          📡 {toastMsg}
        </div>
      )}

      {/* Header with Title and Simulate Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem' }}>Municipal Command Center</h1>
          <p style={{ color: 'var(--text-muted)' }}>City-wide bin fill telemetry, report verification &amp; task dispatch</p>
        </div>

        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="btn-accent"
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          {simulating ? 'Simulating...' : '📡 Simulate Sensor Fill Readings'}
        </button>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-gold">⏳</div>
          <div className="stat-data">
            <span className="stat-value">{stats?.statusCounts?.pending || 0}</span>
            <span className="stat-label">Pending Verification</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">✓</div>
          <div className="stat-data">
            <span className="stat-value">{stats?.statusCounts?.verified || 0}</span>
            <span className="stat-label">Verified (Unassigned)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">🚛</div>
          <div className="stat-data">
            <span className="stat-value">{stats?.statusCounts?.inProgress || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">✨</div>
          <div className="stat-data">
            <span className="stat-value">{stats?.statusCounts?.collected || 0}</span>
            <span className="stat-label">Cleared &amp; Collected</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-red">🚨</div>
          <div className="stat-data">
            <span className="stat-value">{stats?.fullBins || 0}</span>
            <span className="stat-label">Critical Bins (&gt;80%)</span>
          </div>
        </div>
      </div>

      {/* 7-Day Activity Bar Chart (CSS-Only) */}
      <div className="chart-card" style={{ marginBottom: '32px' }}>
        <div className="chart-header">
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Complaints Activity (Last 7 Days)</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Daily volume of citizen reports logged</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-green)' }}>Real-Time Log</span>
        </div>

        <div className="chart-bars-container">
          {(stats?.last7Days || []).map((day, idx) => {
            const heightPercent = Math.max((day.count / maxDayCount) * 100, 6);
            return (
              <div key={idx} className="chart-bar-col">
                <span className="chart-bar-value">{day.count}</span>
                <div className="chart-bar" style={{ height: `${heightPercent}%` }}></div>
                <span className="chart-bar-label">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Map View */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem' }}>Live City Waste &amp; Sensor Telemetry Map</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Bins: <span style={{ color: '#D6455D', fontWeight: '700' }}>● Red (&gt;80%)</span>,{' '}
              <span style={{ color: '#E0A100', fontWeight: '700' }}>● Amber (&gt;50%)</span>,{' '}
              <span style={{ color: '#1F7A5A', fontWeight: '700' }}>● Green (&lt;50%)</span> | Incident Reports: 🔵 Blue
            </p>
          </div>
        </div>
        <MapView bins={bins} complaints={complaints} height="420px" />
      </div>

      {/* Complaints Management Table & Filter Strip */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '1.3rem' }}>Complaints Ledger &amp; Dispatch Queue</h3>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Collected">Collected</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <input
              type="text"
              className="form-control"
              style={{ width: '180px', padding: '8px 12px', fontSize: '0.85rem' }}
              placeholder="Search description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="desktop-table-view table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Location / Area</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    No complaints match current filters.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c._id}>
                    <td style={{ maxWidth: '280px' }}>
                      <Link to={`/complaints/${c._id}`} style={{ fontWeight: '600', color: 'var(--navy)' }}>
                        {c.description.slice(0, 70)}
                        {c.description.length > 70 ? '...' : ''}
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {c.bin ? `${c.bin.code} (${c.bin.area})` : 'Pinned Location'}
                      </span>
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {c.status === 'Pending' && (
                          <>
                            <button
                              className="btn-action btn-verify"
                              onClick={() => setVerifyModal({ open: true, complaint: c, priority: c.priority })}
                            >
                              Verify
                            </button>
                            <button
                              className="btn-action btn-reject"
                              onClick={() => setRejectModal({ open: true, complaint: c, reason: '' })}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {c.status === 'Verified' && (
                          <button
                            className="btn-action btn-assign"
                            onClick={() => setAssignModal({ open: true, complaint: c, collectorId: collectors[0]?._id || '' })}
                          >
                            Assign Collector
                          </button>
                        )}
                        <Link to={`/complaints/${c._id}`} className="btn-action" style={{ background: '#F1F5F9', color: 'var(--navy)' }}>
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (<768px) */}
        <div className="mobile-cards-view">
          {complaints.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No complaints match current filters.</p>
          ) : (
            complaints.map((c) => (
              <div key={c._id} className="mobile-table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <Link to={`/complaints/${c._id}`} style={{ fontWeight: '600', color: 'var(--navy)' }}>
                  {c.description}
                </Link>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {c.bin ? `${c.bin.code} (${c.bin.area})` : 'Pinned Location'} • {new Date(c.createdAt).toLocaleDateString()}
                </div>
                <div className="action-buttons" style={{ marginTop: '8px' }}>
                  {c.status === 'Pending' && (
                    <>
                      <button
                        className="btn-action btn-verify"
                        onClick={() => setVerifyModal({ open: true, complaint: c, priority: c.priority })}
                      >
                        Verify
                      </button>
                      <button
                        className="btn-action btn-reject"
                        onClick={() => setRejectModal({ open: true, complaint: c, reason: '' })}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {c.status === 'Verified' && (
                    <button
                      className="btn-action btn-assign"
                      onClick={() => setAssignModal({ open: true, complaint: c, collectorId: collectors[0]?._id || '' })}
                    >
                      Assign
                    </button>
                  )}
                  <Link to={`/complaints/${c._id}`} className="btn-action" style={{ background: '#F1F5F9', color: 'var(--navy)' }}>
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {verifyModal.open && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Verify Complaint</h3>
              <button className="btn-close-modal" onClick={() => setVerifyModal({ open: false, complaint: null, priority: 'medium' })}>
                ✕
              </button>
            </div>
            <form onSubmit={handleVerifySubmit}>
              <p style={{ fontSize: '0.9rem', marginBottom: '14px' }}>
                Confirm verification for report: <strong>"{verifyModal.complaint?.description}"</strong>
              </p>
              <div className="form-group">
                <label>Assign / Override Priority</label>
                <select
                  className="form-control"
                  value={verifyModal.priority}
                  onChange={(e) => setVerifyModal({ ...verifyModal, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setVerifyModal({ open: false, complaint: null, priority: 'medium' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Reject Complaint</h3>
              <button className="btn-close-modal" onClick={() => setRejectModal({ open: false, complaint: null, reason: '' })}>
                ✕
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <p style={{ fontSize: '0.9rem', marginBottom: '14px' }}>
                State why this report cannot be addressed (will be sent to citizen):
              </p>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  className="form-control"
                  placeholder="e.g. Duplicate report, private plot debris, or not municipal waste..."
                  required
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRejectModal({ open: false, complaint: null, reason: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-danger">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal.open && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Assign Task to Sanitation Collector</h3>
              <button className="btn-close-modal" onClick={() => setAssignModal({ open: false, complaint: null, collectorId: '' })}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <p style={{ fontSize: '0.9rem', marginBottom: '14px' }}>
                Dispatch task for: <strong>"{assignModal.complaint?.description}"</strong>
              </p>
              <div className="form-group">
                <label>Select Sanitation Worker</label>
                <select
                  className="form-control"
                  required
                  value={assignModal.collectorId}
                  onChange={(e) => setAssignModal({ ...assignModal, collectorId: e.target.value })}
                >
                  <option value="">-- Choose Collector --</option>
                  {collectors.map((col) => (
                    <option key={col._id} value={col._id}>
                      {col.name} ({col.area || 'Zone Worker'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAssignModal({ open: false, complaint: null, collectorId: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
