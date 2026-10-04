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

  const handleSubmit = async (confirmDuplicate = false) => {
    setError('');

    if (!description.trim()) {
      setError('Please provide a brief description of the overflowing bin.');
      return;
    }

    if (lat === undefined || lng === undefined) {
      setError('Please select the bin location on the map.');
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

      // Redirect to complaint detail view
      navigate(`/complaints/${newComplaint._id}`);
    } catch (err) {
      if (err.status === 409 && err.data?.duplicate) {
        setDuplicateWarning(err.data);
      } else {
        setError(err.message || 'Failed to submit report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(false);
  };

  return (
    <div className="container" style={{ maxWidth: '780px', padding: '20px 20px 60px 20px' }}>
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--navy)' }}>Report an Overflowing Bin</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Help keep your neighborhood clean. Capture a photo, pin the location, and alert the municipal authority.
          </p>
        </div>

        {error && <div className="alert-box alert-danger">{error}</div>}

        {/* Duplicate Warning Modal / Card */}
        {duplicateWarning && (
          <div className="alert-box alert-warning" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <strong>Duplicate Report Detected Nearby</strong>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
              An open report already exists within 30 meters of this location:
            </p>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', width: '100%', marginBottom: '14px', border: '1px solid #FCD34D' }}>
              <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--text-dark)' }}>
                "{duplicateWarning.complaint?.description}"
              </p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Status: <strong>{duplicateWarning.complaint?.status}</strong> | Logged on: {new Date(duplicateWarning.complaint?.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
              Would you like to proceed and submit your report anyway?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                onClick={() => {
                  setDuplicateWarning(null);
                  handleSubmit(true);
                }}
                disabled={loading}
              >
                Yes, Report Anyway
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                onClick={() => setDuplicateWarning(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          {/* Photo Upload with Browser Compression */}
          <PhotoUpload onPhotoSelected={(file) => setPhoto(file)} />

          {/* Description */}
          <div className="form-group">
            <label htmlFor="complaint-desc">Description of the Issue *</label>
            <textarea
              id="complaint-desc"
              className="form-control"
              placeholder="e.g. Municipal bin near bus shelter is overflowing onto pedestrian walkway..."
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <div className="char-counter">{description.length} / 500 characters</div>
          </div>

          {/* Severity */}
          <div className="form-group">
            <label htmlFor="complaint-severity">Severity Level</label>
            <select
              id="complaint-severity"
              className="form-control"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="low">Low (Litter around bin)</option>
              <option value="medium">Medium (Bin 100% full, minor spill)</option>
              <option value="high">High (Severe overflow blocking street / foul smell)</option>
            </select>
          </div>

          {/* Interactive Map Picker */}
          <div className="form-group">
            <label>Pin Location on Map *</label>
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
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Submitting Report...' : '🚀 Submit Bin Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Report;
