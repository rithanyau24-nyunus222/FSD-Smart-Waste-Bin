import React, { useState, useEffect } from 'react';
import { apiFetch, useAuth } from '../api.jsx';

export const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingTask, setResolvingTask] = useState(null);
  const [proofNote, setProofNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/tasks');
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load collector tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStartTask = async (taskId) => {
    try {
      setActionLoading(true);
      await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: { status: 'in_progress' }
      });
      fetchTasks();
    } catch (err) {
      alert('Could not start task: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!resolvingTask) return;
    try {
      setActionLoading(true);
      await apiFetch(`/tasks/${resolvingTask._id}/status`, {
        method: 'PATCH',
        body: { status: 'collected' }
      });
      setResolvingTask(null);
      setProofNote('');
      fetchTasks();
    } catch (err) {
      alert('Could not complete collection: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Launch Google Maps navigation
  const openNavigation = (coords) => {
    if (!coords || coords.length < 2) return;
    const [lng, lat] = coords;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const activeTasks = tasks.filter((t) => t.status !== 'collected');
  const completedTasks = tasks.filter((t) => t.status === 'collected');

  return (
    <div className="driver-hud-container">
      {/* Driver Cockpit Header */}
      <div className="glass-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.8))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sanitation Driver Cockpit
            </span>
            <h1 style={{ fontSize: '1.6rem', color: '#fff', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              {user ? user.name : 'Murugan (Collector 1)'}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Assigned Zone: <strong>Adyar &amp; T. Nagar Sector</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)' }}>
              {activeTasks.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pending Stops
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Optimizing route stops...
        </div>
      ) : (
        <>
          {/* Active Collection Route Stops */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>
                🚀 Priority Route Sequence
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                ● Shortest Path (TSP) Active
              </span>
            </div>

            {activeTasks.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>🎉</span>
                <h4 style={{ color: '#fff', marginBottom: '4px' }}>All Assigned Bins Cleared!</h4>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Great job. No pending collection requests currently in your zone queue.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeTasks.map((t, index) => {
                  const cmp = t.complaint;
                  const bin = cmp?.bin;
                  const coords = cmp?.location?.coordinates || bin?.location?.coordinates;

                  return (
                    <div
                      key={t._id}
                      className="glass-card"
                      style={{
                        padding: '20px',
                        borderLeft: `4px solid ${t.status === 'in_progress' ? 'var(--accent-purple)' : 'var(--accent-cyan)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className="stop-sequence-badge">#{index + 1}</span>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>
                              {bin?.address || 'Street Overflow Point'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              Zone: {bin?.area || 'Ward'} · Smart Bin Code: <code style={{ color: 'var(--accent-cyan)' }}>{bin?.code || 'BIN-01'}</code>
                            </div>
                          </div>
                        </div>

                        <span className={`status-chip ${t.status.replace('_', '-')}`}>
                          {t.status === 'in_progress' ? 'En Route' : 'Assigned'}
                        </span>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                          "{cmp?.description || 'Commercial waste overflowing near bin.'}"
                        </div>
                        {bin?.fillLevel !== undefined && (
                          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Current Bin Telemetry: <strong style={{ color: bin.fillLevel >= 80 ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>{bin.fillLevel}% Full</strong>
                          </div>
                        )}
                      </div>

                      {/* Driver Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                          onClick={() => openNavigation(coords)}
                        >
                          🗺️ Navigate (Google Maps)
                        </button>

                        {t.status === 'assigned' && (
                          <button
                            type="button"
                            className="btn-cyan"
                            style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                            disabled={actionLoading}
                            onClick={() => handleStartTask(t._id)}
                          >
                            ▶ Start Collection
                          </button>
                        )}

                        {t.status === 'in_progress' && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                            disabled={actionLoading}
                            onClick={() => setResolvingTask(t)}
                          >
                            ✓ Mark Collected &amp; Reset Bin
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cleared / History Log */}
          {completedTasks.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                ✓ Completed Today ({completedTasks.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedTasks.map((t) => (
                  <div
                    key={t._id}
                    className="glass-card"
                    style={{ padding: '14px 18px', opacity: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>
                        {t.complaint?.bin?.address || 'Cleared Street Location'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Resolved at {new Date(t.completedAt || Date.now()).toLocaleTimeString()} · Bin capacity reset to 5%
                      </div>
                    </div>
                    <span className="status-chip collected">Collected</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* RESOLUTION PROOF MODAL */}
      {resolvingTask && (
        <div className="modal-backdrop" onClick={() => setResolvingTask(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
              Certify Bin Collection &amp; Clearance
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
              Confirm that the bin at <strong>{resolvingTask.complaint?.bin?.address}</strong> has been emptied and swept.
            </p>

            <div className="task-proof-box">
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>📸</span>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
                Cleaned Site Verified
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Field driver signature logged automatically
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Driver Clearance Note (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Bin emptied, washed, surrounding sidewalk swept."
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setResolvingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCompleteTask}
                disabled={actionLoading}
              >
                {actionLoading ? 'Closing Ticket...' : 'Confirm Cleaned & Reset Bin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
