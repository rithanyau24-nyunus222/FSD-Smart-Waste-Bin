import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoUpload, MapPicker } from '../components.jsx';
import { apiFetch } from '../api.jsx';

export const Report = () => {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const presets = [
    'Overflowing bin on sidewalk',
    'Commercial crates & plastic dumping',
    'Foul odor & street animal hazard',
    'Litter blocking stormwater drain'
  ];

  const handleSubmit = async (confirmDuplicate = false) => {
    setError('');

    if (!description.trim()) {
      setError('Please provide a brief description or select a quick tag.');
      return;
    }

    const formData = new FormData();
    if (photo) {
      formData.append('photo', photo);
    }
    formData.append('description', description.trim());
    formData.append('severity', severity);
    formData.append('lat', lat);
    formData.append('lng', lng);
    if (confirmDuplicate) {
      formData.append('confirmDuplicate', 'true');
    }

    try {
      setLoading(true);
      const newComplaint = await apiFetch('/complaints', {
        method: 'POST',
        body: formData
      });
      navigate(`/complaints/${newComplaint._id}`);
    } catch (err) {
      if (err.status === 409 && err.data?.duplicate) {
        setDuplicateWarning(err.data);
      } else {
        setError(err.message || 'Failed to submit incident report');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '820px', padding: '40px 20px 80px 20px' }}>
      {/* Gamification Civic Points Ribbon */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌱</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>
              GCC Clean City Civic Mission
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Earn <strong style={{ color: 'var(--accent-emerald)' }}>+50 Eco-Points</strong> for every verified overflow report.
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.2)',
            color: 'var(--accent-emerald)',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}
        >
          Guardian Level 2
        </span>
      </div>

      <div className="glass-card">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '6px' }}>
            Report an Overflowing Bin
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            Capture field proof, drop the pin, and alert the nearest Greater Chennai Corporation sanitation crew.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px', borderRadius: '8px', color: 'var(--accent-rose)', marginBottom: '18px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* Duplicate Warning Radar Banner */}
        {duplicateWarning && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: '700', marginBottom: '6px' }}>
              <span>⚠️</span>
              <span>Proximity Duplicate Detected ({duplicateWarning.distanceMeters}m away)</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
              An open report has already been logged near this exact spot:
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', borderLeft: '3px solid var(--accent-amber)' }}>
              <div style={{ fontSize: '0.85rem', color: '#fff', fontStyle: 'italic' }}>
                "{duplicateWarning.complaint?.description}"
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Status: <strong>{duplicateWarning.complaint?.status}</strong> · Logged {new Date(duplicateWarning.complaint?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-cyan"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => navigate(`/complaints/${duplicateWarning.complaint?._id}`)}
              >
                Upvote &amp; Track Existing
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => handleSubmit(true)}
              >
                Submit As Separate Incident
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
          {/* Photo Capture */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
              1. Field Photo Evidence:
            </label>
            <PhotoUpload onPhotoSelected={(f) => setPhoto(f)} />
          </div>

          {/* Quick Preset Tags */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
              2. Incident Description:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDescription(p)}
                  className="btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: description === p ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                    borderColor: description === p ? 'var(--accent-cyan)' : 'var(--border-subtle)'
                  }}
                >
                  + {p}
                </button>
              ))}
            </div>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the overflow, landmarks, or street hazards..."
              className="form-textarea"
              required
            />
          </div>

          {/* Severity Classification */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
              3. Overflow Severity Level:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSeverity('low')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${severity === 'low' ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                  background: severity === 'low' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: severity === 'low' ? 'var(--accent-emerald)' : 'var(--text-dim)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>🟢 Low</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Minor litter spill</div>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('medium')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${severity === 'medium' ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                  background: severity === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: severity === 'medium' ? 'var(--accent-amber)' : 'var(--text-dim)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>🟡 Medium</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Full bin &amp; footpath</div>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('high')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${severity === 'high' ? 'var(--accent-rose)' : 'var(--border-subtle)'}`,
                  background: severity === 'high' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: severity === 'high' ? 'var(--accent-rose)' : 'var(--text-dim)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>🔴 High Hazard</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Drain/Road blocked</div>
              </button>
            </div>
          </div>

          {/* Map Pin Picker */}
          <div style={{ marginBottom: '26px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
              4. Exact Geolocation Pin:
            </label>
            <MapPicker
              lat={lat}
              lng={lng}
              onLocationChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {loading ? 'Transmitting to Municipal Hub...' : '🚀 Submit Report to Greater Chennai Corporation'}
          </button>
        </form>
      </div>
    </div>
  );
};
