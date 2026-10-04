import React, { useState, useEffect, useCallback } from 'react';
import { PriorityBadge, StatusBadge } from '../components.jsx';
import { apiFetch } from '../api.jsx';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active' or 'all'

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/tasks');
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      setActionLoading(taskId);
      await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      await fetchTasks();
    } catch (err) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return t.status === 'assigned' || t.status === 'in_progress';
    return true;
  });

  return (
    <div className="container" style={{ padding: '20px 20px 60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem' }}>Sanitation Task Queue</h1>
          <p style={{ color: 'var(--text-muted)' }}>Assigned collection routes and clearance operations</p>
        </div>

        {/* Tab Filter */}
        <div style={{ display: 'flex', gap: '8px', background: '#E2E8F0', padding: '4px', borderRadius: '9999px' }}>
          <button
            onClick={() => setFilter('active')}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '0.85rem',
              background: filter === 'active' ? '#fff' : 'transparent',
              color: filter === 'active' ? 'var(--navy)' : 'var(--text-muted)',
              boxShadow: filter === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Active Work ({tasks.filter((t) => t.status !== 'collected').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '0.85rem',
              background: filter === 'all' ? '#fff' : 'transparent',
              color: filter === 'all' ? 'var(--navy)' : 'var(--text-muted)',
              boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            All History ({tasks.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p>Loading assigned tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '40px auto' }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>🎉</span>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No pending tasks!</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            All assigned collection tasks are completed. Enjoy the clean streets!
          </p>
        </div>
      ) : (
        <div className="task-grid">
          {filteredTasks.map((t) => {
            const complaint = t.complaint;
            if (!complaint) return null;
            const [lng, lat] = complaint.location?.coordinates || [80.2707, 13.0827];
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

            return (
              <div key={t._id} className="task-card">
                {complaint.photo ? (
                  <img src={complaint.photo} alt="Task incident" className="task-photo" />
                ) : (
                  <div className="task-photo-placeholder">🗑️</div>
                )}

                <div className="task-body">
                  <div>
                    <div className="task-top">
                      <span className="task-area">
                        {complaint.bin?.code ? `${complaint.bin.code} (${complaint.bin.area})` : 'Pinned Spot'}
                      </span>
                      <PriorityBadge priority={complaint.priority} />
                    </div>

                    <p className="task-desc">{complaint.description}</p>

                    <div style={{ marginBottom: '12px' }}>
                      <StatusBadge status={t.status === 'in_progress' ? 'In Progress' : t.status === 'assigned' ? 'Assigned' : 'Collected'} />
                    </div>

                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="task-maps-link">
                      📍 Open in Google Maps ↗
                    </a>
                  </div>

                  <div className="task-actions">
                    {t.status === 'assigned' && (
                      <button
                        className="btn-accent"
                        style={{ width: '100%' }}
                        disabled={actionLoading === t._id}
                        onClick={() => handleUpdateStatus(t._id, 'in_progress')}
                      >
                        {actionLoading === t._id ? 'Updating...' : '▶ Start Collection'}
                      </button>
                    )}

                    {t.status === 'in_progress' && (
                      <button
                        className="btn-primary"
                        style={{ width: '100%' }}
                        disabled={actionLoading === t._id}
                        onClick={() => handleUpdateStatus(t._id, 'collected')}
                      >
                        {actionLoading === t._id ? 'Completing...' : '✓ Mark as Collected'}
                      </button>
                    )}

                    {t.status === 'collected' && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary-green)', fontWeight: '700', padding: '6px 0' }}>
                        ✓ Cleared on {new Date(t.completedAt || t.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
