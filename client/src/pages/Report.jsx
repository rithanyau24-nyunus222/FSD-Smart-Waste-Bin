import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoUpload, MapPicker } from '../components.jsx';
import { apiFetch } from '../api.jsx';
import { samplePhotos } from '../mockData.js';

export const Report = () => {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(samplePhotos.bin_overflow);
  const [analysis, setAnalysis] = useState({
    category: 'Municipal Smart Bin Overflow',
    estimatedWeight: '80-100 kg',
    spillRadius: '4 meters',
    drainageThreat: 'Moderate Hazard',
    suggestedRisk: 'high'
  });
  const [description, setDescription] = useState('Severe bin overflow onto pedestrian walkway, dogs scattering plastic.');
  const [severity, setSeverity] = useState('high');
  const [lat, setLat] = useState(13.0013);
  const [lng, setLng] = useState(80.2566);
  const [areaName, setAreaName] = useState('Adyar Signal (L.B. Road)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Quick Chennai landmark locations for rapid testing
  const presets = [
    { name: 'Adyar Signal (L.B. Road)', lat: 13.0013, lng: 80.2566 },
    { name: 'T. Nagar (Pondy Bazaar)', lat: 13.042, lng: 80.2343 },
    { name: 'Velachery Link Road', lat: 12.9915, lng: 80.2201 },
    { name: 'Anna Nagar Tower Park', lat: 13.0884, lng: 80.2147 },
    { name: 'Marina Beach Promenade', lat: 13.05, lng: 80.282 }
  ];

  const handleSelectPreset = (p) => {
    setLat(p.lat);
    setLng(p.lng);
    setAreaName(p.name);
  };

  const handleSubmit = async (confirmDuplicate = false) => {
    setError('');

    if (!description.trim()) {
      setError('Please provide a brief description of the waste overflow.');
      return;
    }

    try {
      setLoading(true);
      const newComplaint = await apiFetch('/complaints', {
        method: 'POST',
        body: {
          photo,
          description: description.trim(),
          severity,
          riskLevel: analysis?.suggestedRisk || severity,
          lat,
          lng,
          areaName,
          analysis,
          confirmDuplicate
        }
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
    <div className="container" style={{ maxWidth: '800px', padding: '40px 20px 80px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '6px' }}>
          Report Waste Overflow
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Upload a photo of overflowing garbage or street litter. The system will analyze the issue and map it directly on the Chennai corporation grid.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: '#fca5a5', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {duplicateWarning && (
        <div className="duplicate-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <strong style={{ color: 'var(--amber-500)' }}>Nearby Report Already Logged</strong>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            A report was already registered {duplicateWarning.distanceMeters}m away at this spot. We can merge your submission with the existing municipal ticket to expedite dispatch.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-warning btn-sm"
              onClick={() => handleSubmit(true)}
            >
              Submit Anyway as Related Report
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setDuplicateWarning(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {/* Step 1: Photo & Automated Analysis */}
        <div style={{ marginBottom: '28px' }}>
          <PhotoUpload
            photo={photo}
            setPhoto={setPhoto}
            analysis={analysis}
            setAnalysis={setAnalysis}
          />
        </div>

        {/* Step 2: Chennai Map Geo-Tagging */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              📍 Location on Chennai Grid
            </label>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
            </span>
          </div>

          {/* Quick Chennai Area Presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`btn-secondary btn-sm ${areaName === p.name ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => handleSelectPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>

          <MapPicker lat={lat} lng={lng} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
          <div style={{ marginTop: '8px' }}>
            <input
              type="text"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="Locality or landmark name (e.g. Adyar Signal)"
              style={{ fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Step 3: Description & Severity */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            📝 Issue Details &amp; Notes
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what waste is overflowing (e.g. wet garbage, cardboard crates, drain blockage)..."
          ></textarea>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            🚦 Citizen Severity Assessment
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <button
              type="button"
              className={`btn-secondary ${severity === 'low' ? 'active' : ''}`}
              style={{
                borderColor: severity === 'low' ? 'var(--emerald-500)' : 'var(--border-subtle)',
                background: severity === 'low' ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
              }}
              onClick={() => setSeverity('low')}
            >
              🟢 Minor Litter
            </button>
            <button
              type="button"
              className={`btn-secondary ${severity === 'medium' ? 'active' : ''}`}
              style={{
                borderColor: severity === 'medium' ? 'var(--blue-500)' : 'var(--border-subtle)',
                background: severity === 'medium' ? 'rgba(59, 130, 246, 0.15)' : 'transparent'
              }}
              onClick={() => setSeverity('medium')}
            >
              🟡 Pavement Overflow
            </button>
            <button
              type="button"
              className={`btn-secondary ${severity === 'high' ? 'active' : ''}`}
              style={{
                borderColor: severity === 'high' ? 'var(--rose-500)' : 'var(--border-subtle)',
                background: severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'transparent'
              }}
              onClick={() => setSeverity('high')}
            >
              🔴 Severe Public Hazard
            </button>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={loading}
            onClick={() => handleSubmit(false)}
          >
            {loading ? 'Submitting to Chennai Corporation...' : '🚀 Submit Report to Chennai Corporation'}
          </button>
        </div>
      </div>
    </div>
  );
};
