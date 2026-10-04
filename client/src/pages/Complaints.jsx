import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge, PriorityBadge, Timeline } from '../components.jsx';
import { apiFetch } from '../api.jsx';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

/* =====================================================
   MY COMPLAINTS (CITIZEN LIST VIEW)
   ===================================================== */
export const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyComplaints = async () => {
      try {
        const data = await apiFetch('/complaints');
        setComplaints(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };
    fetchMyComplaints();
  }, []);

  return (
    <div className="container" style={{ padding: '20px 20px 60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>My Reported Bins</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track real-time progress and collection history</p>
        </div>
        <Link to="/report" className="btn-primary">
          ➕ New Report
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p>Loading your reports...</p>
        </div>
      ) : error ? (
        <div className="alert-box alert-danger">{error}</div>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🌿</span>
          <h3>No Reports Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            You haven't reported any overflowing bins yet. Help keep the city clean!
          </p>
          <Link to="/report" className="btn-primary">
            Report an Overflowing Bin
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {complaints.map((item) => (
            <Link key={item._id} to={`/complaints/${item._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0', overflow: 'hidden' }}>
                {item.photo ? (
                  <img src={item.photo} alt="Reported bin" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '140px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                    🗑️
                  </div>
                )}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--navy)', marginBottom: '10px', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>{item.bin?.code || 'Nearby Bin'}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* =====================================================
   COMPLAINT DETAIL (WITH VERTICAL TIMELINE)
   ===================================================== */
export const ComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await apiFetch(`/complaints/${id}`);
        setComplaint(data);
      } catch (err) {
        setError(err.message || 'Failed to load complaint detail');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p>Loading complaint details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '40px 20px' }}>
        <div className="alert-box alert-danger">{error || 'Complaint not found.'}</div>
        <Link to="/my-complaints" className="btn-secondary">
          ← Back to Reports
        </Link>
      </div>
    );
  }

  const [lng, lat] = complaint.location?.coordinates || [80.2707, 13.0827];

  return (
    <div className="container" style={{ maxWidth: '860px', padding: '20px 20px 60px 20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/my-complaints" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ← Back to My Reports
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        {/* Header Badges & Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Logged on: {new Date(complaint.createdAt).toLocaleString()}
          </span>
        </div>

        <h1 style={{ fontSize: '1.6rem', color: 'var(--navy)', marginBottom: '16px' }}>
          {complaint.description}
        </h1>

        {/* Photo Display */}
        {complaint.photo ? (
          <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '380px' }}>
            <img src={complaint.photo} alt="Reported Bin" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '20px', border: '1px dashed var(--border-color)' }}>
            📷 No photo attached for this report
          </div>
        )}

        {/* Rejection notice if rejected */}
        {complaint.status === 'Rejected' && (
          <div className="alert-box alert-danger" style={{ marginBottom: '20px' }}>
            <div>
              <strong>Report Rejected by Municipal Authority</strong>
              <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>Reason: {complaint.rejectReason}</p>
            </div>
          </div>
        )}

        {/* Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Reported By</span>
            <strong>{complaint.reporter?.name}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Severity</span>
            <strong style={{ textTransform: 'capitalize' }}>{complaint.severity}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Linked Smart Bin</span>
            <strong>{complaint.bin ? `${complaint.bin.code} (${complaint.bin.area})` : 'Independent Location'}</strong>
          </div>
          {complaint.bin && (
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Bin Fill Status</span>
              <strong>{complaint.bin.fillLevel}% full</strong>
            </div>
          )}
        </div>

        {/* Map Location Preview */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Location Pin</h3>
          <div style={{ height: '240px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <MapContainer
              center={[lat, lng]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={[lat, lng]}
                radius={10}
                pathOptions={{ color: '#1B0A4F', fillColor: '#D6455D', fillOpacity: 0.9, weight: 2 }}
              >
                <Popup>
                  <strong>Report Location</strong>
                  <br />
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>

        {/* Vertical Audit Timeline */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Resolution Timeline</h3>
          <Timeline history={complaint.history} />
        </div>
      </div>
    </div>
  );
};
