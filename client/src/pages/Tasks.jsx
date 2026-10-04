import React, { useState, useEffect } from 'react';
import { apiFetch, useAuth } from '../api.jsx';
import { RiskBadge, StatusBadge } from '../components.jsx';
import { samplePhotos } from '../mockData.js';

export const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingTask, setResolvingTask] = useState(null);
  const [proofNote, setProofNote] = useState('Area cleared, pavement swept, lime powder disinfectant sprayed.');
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

  // Closed Verification Loop execution
  const handleCompleteCollection = async () => {
    if (!resolvingTask) return;
    try {
      setActionLoading(true);
      await apiFetch(`/tasks/${resolvingTask._id}/status`, {
        method: 'PATCH',
        body: {
          status: 'collected',
          proofNote,
          proofPhoto: samplePhotos.cleaned_proof
        }
      });
      alert('Closed-Loop Verification Complete! The incident has been recorded as resolved, the bin fill level reset to 5%, and the reporting citizen has been notified.');
      setResolvingTask(null);
      fetchTasks();
    } catch (err) {
      alert('Failed to complete collection: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openNavigation = (coords) => {
    if (!coords || coords.length < 2) return;
    const [lng, lat] = coords;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'collected');
  const completedTasks = tasks.filter((t) => t.status === 'collected');

  return (
    <div className="container" style={{ maxWidth: '900px', padding: '40px 20px 80px 20px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-500)', fontSize: '0.78rem', fontWeight: '700', marginBottom: '8px' }}>
          🚛 SANITATION DRIVER FIELD COCKPIT
        </div>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>
          Today's Daily Collection Tasks
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Assigned to: <strong>{user?.name || 'Sanitation Driver'}</strong> ({user?.area || 'Chennai Zone'})
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading daily tasks from Chennai dispatch...
        </div>
      ) : (
        <>
          {/* Active Tasks Queue */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡ Active Stops</span>
              <span style={{ fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {pendingTasks.length} pending
              </span>
            </h2>

            {pendingTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>🎉</span>
                <h3 style={{ color: '#fff', marginBottom: '6px' }}>All Daily Tasks Completed!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Great job! You have cleared all assigned stops for this shift.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {pendingTasks.map((t, idx) => {
                  const cmp = t.complaint;
                  const coords = cmp?.location?.coordinates;

                  return (
                    <div key={t._id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'var(--blue-500)', color: '#fff', fontWeight: '800', fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                            STOP #{idx + 1}
                          </span>
                          <strong style={{ color: '#fff', fontSize: '1rem' }}>
                            {cmp?.areaName || cmp?.bin?.area || 'Chennai Incident'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <RiskBadge level={cmp?.riskLevel || t.priority} />
                          <StatusBadge status={t.status === 'in_progress' ? 'In Progress' : 'Assigned'} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '18px', marginBottom: '16px' }}>
                        {/* Waste photo so driver recognizes it */}
                        <div className="waste-photo-frame" style={{ height: '130px' }}>
                          <img src={cmp?.photo || samplePhotos.bin_overflow} alt="Waste spot" />
                        </div>

                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '6px', lineHeight: '1.4' }}>
                            {cmp?.description || 'Municipal overflow reported by citizen'}
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            📍 {cmp?.bin?.address || 'Near Chennai main road junction'}
                          </div>

                          {t.notes && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                              Dispatcher Note: {t.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => openNavigation(coords)}
                        >
                          🧭 Open Google Maps Navigation
                        </button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          {t.status === 'assigned' && (
                            <button
                              type="button"
                              className="btn-secondary btn-sm"
                              disabled={actionLoading}
                              onClick={() => handleStartTask(t._id)}
                            >
                              ⚡ Start Collection
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            onClick={() => setResolvingTask(t)}
                          >
                            ✅ Complete &amp; Verify Collection
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed / Closed Loop History */}
          {completedTasks.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                🏁 Closed-Loop Verified Today ({completedTasks.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {completedTasks.map((t) => (
                  <div key={t._id} className="card" style={{ padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.92rem' }}>
                          ✓ {t.complaint?.areaName || t.complaint?.bin?.area || 'Cleared Spot'}
                        </strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Closed at {new Date(t.completedAt || t.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {t.proofNote || 'Waste cleared'}
                        </div>
                      </div>
                      <span className="badge badge-collected">Closed-Loop Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CLOSED VERIFICATION LOOP MODAL */}
      {resolvingTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>
              🔒 Closed-Loop Verification Confirmation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
              Confirm that the waste at <strong>{resolvingTask.complaint?.areaName || 'this location'}</strong> has been completely cleared.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Cleaned Spot Photographic Proof:
              </label>
              <div className="waste-photo-frame" style={{ height: '160px', marginBottom: '8px' }}>
                <img src={samplePhotos.cleaned_proof} alt="Cleaned proof" />
                <div className="photo-badge-overlay">
                  <span className="badge badge-collected">✅ Spot Cleaned &amp; Disinfected</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Driver Verification Field Note:
              </label>
              <textarea
                rows="2"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setResolvingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={actionLoading}
                onClick={handleCompleteCollection}
              >
                {actionLoading ? 'Closing Loop...' : 'Confirm & Close Loop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
