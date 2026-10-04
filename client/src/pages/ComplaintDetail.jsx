import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Logo, StatusBadge, Timeline, BinIcon, BackToHomeButton } from '../components.jsx';
import api from '../api.js';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalPhotoUrl, setModalPhotoUrl] = useState(null);

  useEffect(() => {
    async function loadComplaint() {
      try {
        setLoading(true);
        const data = await api.get(`/complaints/${id}`);
        setComplaint(data);
      } catch (err) {
        setError(err.message || 'Unable to load complaint details');
      } finally {
        setLoading(false);
      }
    }
    loadComplaint();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '16px var(--pad-x)', borderBottom: '2px solid var(--green)', display: 'flex', justifyContent: 'center' }}>
          <Logo variant="dark" iconHeight={28} textSize={22} />
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '16px var(--pad-x)', borderBottom: '2px solid var(--green)', display: 'flex', justifyContent: 'center' }}>
          <Logo variant="dark" iconHeight={28} textSize={22} />
        </header>
        <main style={{ padding: '40px var(--pad-x)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="t2" style={{ margin: '0 0 10px' }}>Unable to View Complaint</h2>
            <p className="t6" style={{ margin: '0 0 20px', opacity: 0.8 }}>
              {error || 'The requested complaint could not be found.'}
            </p>
            <button type="button" className="btn-dark" onClick={() => navigate(-1)}>
              &larr; Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const coordinates = complaint.location?.coordinates;
  const lat = coordinates && coordinates[1] ? coordinates[1] : 13.0827;
  const lng = coordinates && coordinates[0] ? coordinates[0] : 80.2707;

  const beforePhotos = complaint.photos?.filter((p) => p.kind === 'before') || [];
  const afterPhotos = complaint.photos?.filter((p) => p.kind === 'after') || [];

  // Header band background color by status:
  // Pending Paper, Verified Blue, Assigned Pink, In Progress Sprout, Collected Sprout, Rejected Green House with Paper White text
  const getHeaderBandStyle = (status) => {
    switch (status) {
      case 'Verified':
        return { bg: 'var(--blue)', text: 'var(--green)' };
      case 'Assigned':
        return { bg: 'var(--pink)', text: 'var(--green)' };
      case 'In Progress':
      case 'Collected':
        return { bg: 'var(--sprout)', text: 'var(--green)' };
      case 'Rejected':
        return { bg: 'var(--green)', text: 'var(--paper)' };
      case 'Pending':
      default:
        return { bg: 'var(--paper)', text: 'var(--green)' };
    }
  };

  const bandStyle = getHeaderBandStyle(complaint.status);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)' }}>
      {/* Nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--paper)',
          padding: '16px var(--pad-x)',
          borderBottom: '2px solid var(--green)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="pill pill-ghost"
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => navigate(-1)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back</span>
          </button>
          <BackToHomeButton label="Home" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo variant="dark" iconHeight={28} textSize={22} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="t7" style={{ opacity: 0.7 }}>
            Case #{complaint._id.slice(-6)}
          </span>
        </div>
      </header>

      {/* HEADER BAND: coloured by status, padding 28px var(--pad-x), border-bottom 2px */}
      <section
        style={{
          backgroundColor: bandStyle.bg,
          color: bandStyle.text,
          padding: '28px var(--pad-x)',
          borderBottom: '2px solid var(--green)'
        }}
      >
        <span className="caption" style={{ color: 'inherit' }}>( complaint )</span>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-peace)',
                fontSize: 'clamp(40px, 5.5vw, 72px)',
                lineHeight: 1,
                margin: '4px 0 8px',
                color: 'inherit'
              }}
            >
              {complaint.binCode || 'BIN-004'}
            </h1>
            <div className="t6" style={{ color: 'inherit', opacity: 0.9 }}>
              {complaint.area || 'Velachery'} &middot; {complaint.description}
            </div>
          </div>

          <StatusBadge status={complaint.status} />
        </div>
      </section>

      {/* BODY: grid of two columns (minmax(0,1.2fr) minmax(0,1fr), gap 24px, padding 28px var(--pad-x); one col on mobile) */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          padding: '28px var(--pad-x)',
          flex: 1
        }}
      >
        {/* LEFT COLUMN: Before & After photo cards, then map container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Photo Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {/* Before Photo Card */}
            <div className="card" style={{ padding: '16px', borderRadius: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="caption" style={{ margin: 0 }}>( before )</span>
                <span className="pill pill-ghost" style={{ fontSize: '11px', padding: '2px 8px' }}>Citizen</span>
              </div>

              {beforePhotos.length > 0 && beforePhotos[0].photo ? (
                <div
                  style={{
                    height: '180px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '2px solid var(--green)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const pid = beforePhotos[0].photo._id || beforePhotos[0].photo;
                    setModalPhotoUrl(`/api/photos/${pid}`);
                  }}
                >
                  <img
                    src={`/api/photos/${beforePhotos[0].photo._id || beforePhotos[0].photo}?thumb=1`}
                    alt="Before collection"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: '180px',
                    borderRadius: '16px',
                    border: '2px dashed var(--green)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--paper)'
                  }}
                >
                  <BinIcon size={28} color="var(--green)" />
                  <span className="t7" style={{ opacity: 0.7 }}>Photo expired</span>
                </div>
              )}
            </div>

            {/* After Photo Card */}
            <div className="card" style={{ padding: '16px', borderRadius: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="caption" style={{ margin: 0 }}>( after )</span>
                <span className="pill pill-sprout" style={{ fontSize: '11px', padding: '2px 8px' }}>Collector</span>
              </div>

              {afterPhotos.length > 0 && afterPhotos[0].photo ? (
                <div
                  style={{
                    height: '180px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '2px solid var(--green)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const pid = afterPhotos[0].photo._id || afterPhotos[0].photo;
                    setModalPhotoUrl(`/api/photos/${pid}`);
                  }}
                >
                  <img
                    src={`/api/photos/${afterPhotos[0].photo._id || afterPhotos[0].photo}?thumb=1`}
                    alt="After collection"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: '180px',
                    borderRadius: '16px',
                    border: '2px dashed var(--green)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--paper)'
                  }}
                >
                  <BinIcon size={28} color="var(--green)" />
                  <span className="t7" style={{ opacity: 0.7 }}>Awaiting pickup</span>
                </div>
              )}
            </div>
          </div>

          {/* Map Container (height 220px, radius 20px) */}
          <div
            className="card"
            style={{
              padding: 0,
              height: '220px',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '2px solid var(--green)',
              position: 'relative'
            }}
          >
            <MapContainer center={[lat, lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker
                center={[lat, lng]}
                radius={12}
                pathOptions={{
                  color: '#294237',
                  fillColor: '#ffc2ef',
                  fillOpacity: 1,
                  weight: 3.5
                }}
              >
                <Popup>{complaint.binCode || 'Bin Location'}</Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>

        {/* RIGHT COLUMN: Info .card and Timeline in a .card below */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Info Card: area, severity, priority, reporter, report count in T6 rows with 1px dividers */}
          <div className="card" style={{ padding: '20px', borderRadius: '22px' }}>
            <h3 className="t3" style={{ margin: '0 0 14px', color: 'var(--green)' }}>
              Report Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(41,66,55,0.15)' }} className="t6">
                <span style={{ opacity: 0.75 }}>Area</span>
                <span style={{ fontWeight: 600 }}>{complaint.area}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(41,66,55,0.15)' }} className="t6">
                <span style={{ opacity: 0.75 }}>Severity</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{complaint.severity || 'Medium'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(41,66,55,0.15)' }} className="t6">
                <span style={{ opacity: 0.75 }}>Priority Score</span>
                <span style={{ fontWeight: 600 }}>{complaint.priority || 5}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(41,66,55,0.15)' }} className="t6">
                <span style={{ opacity: 0.75 }}>Reporter</span>
                <span style={{ fontWeight: 600 }}>{complaint.citizen?.name || 'Citizen'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }} className="t6">
                <span style={{ opacity: 0.75 }}>Report Count</span>
                <span style={{ fontWeight: 600 }}>{complaint.reportCount || 1} report(s)</span>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="card" style={{ padding: '20px', borderRadius: '22px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-script)',
                fontSize: '22px',
                color: 'var(--green)',
                margin: '0 0 10px'
              }}
            >
              live timeline
            </h3>

            <Timeline history={complaint.history} />
          </div>
        </div>
      </main>

      {/* Full Photo Modal */}
      {modalPhotoUrl && (
        <div
          className="modal-overlay"
          onClick={() => setModalPhotoUrl(null)}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
            <img
              src={modalPhotoUrl}
              alt="Full size view"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px', border: '2px solid var(--green)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
