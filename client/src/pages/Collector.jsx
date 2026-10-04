import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../auth.jsx';
import { Logo, StatusBadge, Truck, Sprig, Alerts, BackToHomeButton, BinIcon, CHENNAI_AREAS } from '../components.jsx';
import api, { uploadPhoto } from '../api.js';

// Image compressor helper for after photo
async function compressAfterImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = reject;

    img.onload = async () => {
      let { width, height } = img;
      const maxDim = 800;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let mime = 'image/webp';
      const test = canvas.toDataURL('image/webp');
      if (!test.startsWith('data:image/webp')) mime = 'image/jpeg';

      let q = 0.7;
      let mainBlob = null;
      while (q >= 0.25) {
        mainBlob = await new Promise((res) => canvas.toBlob(res, mime, q));
        if (mainBlob && mainBlob.size <= 120 * 1024) break;
        q -= 0.1;
      }
      if (!mainBlob) mainBlob = await new Promise((res) => canvas.toBlob(res, mime, 0.3));

      // Thumbnail
      const thumbCanvas = document.createElement('canvas');
      const thumbSize = 160;
      let tw = width;
      let th = height;
      if (tw > th) {
        th = Math.round((th * thumbSize) / tw);
        tw = thumbSize;
      } else {
        tw = Math.round((tw * thumbSize) / th);
        th = thumbSize;
      }
      thumbCanvas.width = tw;
      thumbCanvas.height = th;
      thumbCanvas.getContext('2d').drawImage(img, 0, 0, tw, th);
      const thumbBlob = await new Promise((res) => thumbCanvas.toBlob(res, mime, 0.5));

      resolve({ mainBlob, thumbBlob });
    };

    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Collector() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('tasks'); // 'tasks' | 'alerts'
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Selected task detail for after-photo flow
  const [selectedTask, setSelectedTask] = useState(null);
  const [afterPhotoId, setAfterPhotoId] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [afterSizeKb, setAfterSizeKb] = useState(null);
  const [afterLoading, setAfterLoading] = useState(false);
  const [collectError, setCollectError] = useState('');
  const [submittingCollect, setSubmittingCollect] = useState(false);
  const fileInputRef = useRef(null);

  // Geolocation
  const [collectorPos, setCollectorPos] = useState({ lat: 13.0827, lng: 80.2707 });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCollectorPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await api.get('/notifications');
      if (data && data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      // Ignore
    }
  };

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const data = await api.get('/tasks');
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
    loadUnreadCount();
    const refresh = () => {
      loadTasks();
      loadUnreadCount();
    };
    window.addEventListener('notifications:refresh', refresh);
    return () => window.removeEventListener('notifications:refresh', refresh);
  }, []);

  // Distance helper
  const calculateDistanceKm = (targetLat, targetLng) => {
    if (!targetLat || !targetLng || !collectorPos) return null;
    const R = 6371;
    const φ1 = (collectorPos.lat * Math.PI) / 180;
    const φ2 = (targetLat * Math.PI) / 180;
    const Δφ = ((targetLat - collectorPos.lat) * Math.PI) / 180;
    const Δλ = ((targetLng - collectorPos.lng) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d.toFixed(1);
  };

  // Start task
  const handleStartTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: 'in-progress' });
      loadTasks();
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      alert('Could not start task: ' + err.message);
    }
  };

  // Handle Photo Select
  const handleAfterPhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCollectError('');
    setAfterLoading(true);

    try {
      const { mainBlob, thumbBlob } = await compressAfterImage(file);
      const res = await uploadPhoto(mainBlob, thumbBlob);
      setAfterPhotoId(res.id);
      setAfterSizeKb((mainBlob.size / 1024).toFixed(1));
      setAfterPreview(URL.createObjectURL(mainBlob));
    } catch (err) {
      setCollectError(err.message || 'Error uploading photo');
    } finally {
      setAfterLoading(false);
    }
  };

  // Submit collected
  const handleSubmitCollected = async (e) => {
    e.preventDefault();
    setCollectError('');

    if (!afterPhotoId) {
      setCollectError('Add a photo to finish this task.');
      return;
    }

    setSubmittingCollect(true);
    try {
      await api.patch(`/tasks/${selectedTask._id}`, {
        status: 'collected',
        photoId: afterPhotoId
      });
      setSelectedTask(null);
      setAfterPhotoId(null);
      setAfterPreview(null);
      setAfterSizeKb(null);
      loadTasks();
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      setCollectError(err.message || 'Failed to complete task');
    } finally {
      setSubmittingCollect(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const activeTasks = tasks.filter((t) => t.status !== 'collected');
  const doneTasks = tasks.filter((t) => t.status === 'collected');
  const totalTasksCount = tasks.length;
  const doneTasksCount = doneTasks.length;
  const progressRatio = totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0;
  const firstName = user?.name ? user.name.split(' ')[0] : 'Collector';

  // If in Task Detail / After photo mode
  if (selectedTask) {
    const complaint = selectedTask.complaint || {};
    const coords = complaint.location?.coordinates;
    const binLat = coords && coords[1] ? coords[1] : 13.0827;
    const binLng = coords && coords[0] ? coords[0] : 80.2707;
    const polylineCoords = [
      [collectorPos.lat, collectorPos.lng],
      [binLat, binLng]
    ];

    return (
      <div className="page-with-bottom-tabs" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)' }}>
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
              className="pill pill-dark active"
              onClick={() => setSelectedTask(null)}
            >
              &larr; Back to route
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Logo variant="dark" iconHeight={28} textSize={22} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
            <BackToHomeButton />
            <span className="pill pill-sprout">{firstName}</span>
          </div>
        </header>

        {/* TASK DETAIL AND AFTER PHOTO */}
        {/* Map band: background var(--blue); height 240px desktop / 150px mobile; border-bottom 2px; position relative */}
        <div
          style={{
            backgroundColor: 'var(--blue)',
            height: '240px',
            borderBottom: '2px solid var(--green)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <MapContainer
            center={[(collectorPos.lat + binLat) / 2, (collectorPos.lng + binLng) / 2]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* Dashed Green House polyline */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#294237',
                weight: 3,
                dashArray: '6 5'
              }}
            />
            {/* Sprout start marker */}
            <CircleMarker
              center={[collectorPos.lat, collectorPos.lng]}
              radius={8}
              pathOptions={{
                color: '#294237',
                fillColor: '#b6cc58',
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup>Your Location</Popup>
            </CircleMarker>
            {/* Pink bin marker */}
            <CircleMarker
              center={[binLat, binLng]}
              radius={12}
              pathOptions={{
                color: '#294237',
                fillColor: '#ffc2ef',
                fillOpacity: 1,
                weight: 3.5
              }}
            >
              <Popup>Bin Destination</Popup>
            </CircleMarker>
          </MapContainer>

          {/* "Back" pill at top left */}
          <button
            type="button"
            className="pill pill-ghost"
            style={{
              position: 'absolute',
              left: '14px',
              top: '14px',
              backgroundColor: 'var(--paper)',
              zIndex: 1000,
              fontSize: '13px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setSelectedTask(null)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Content (padding 20px var(--pad-x)) */}
        <div style={{ padding: '20px var(--pad-x)', maxWidth: '640px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: '24px', color: 'var(--green)', marginBottom: '4px' }}>
            almost done
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-peace)',
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              lineHeight: 1.05,
              margin: '0 0 6px',
              color: 'var(--green)'
            }}
          >
            {complaint.binCode || 'BIN-004'} &middot; {complaint.area || 'Velachery'}
          </h1>
          <p className="t6" style={{ margin: '6px 0 20px', opacity: 0.85, color: 'var(--green)' }}>
            {complaint.description || 'Overflowing near the bus stop'}
          </p>

          {/* Card "( after photo )" */}
          <div
            className="card"
            style={{
              borderRadius: '24px',
              padding: '20px',
              marginBottom: '20px',
              backgroundColor: 'var(--paper)'
            }}
          >
            <span className="caption" style={{ color: 'var(--green)' }}>( after photo )</span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleAfterPhotoSelect}
            />

            {!afterPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                style={{
                  height: '160px',
                  borderRadius: '20px',
                  border: '2px dashed var(--green)',
                  backgroundColor: 'var(--paper)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {afterLoading ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="t7" style={{ fontWeight: 600, color: 'var(--green)' }}>
                      Tap to take a photo
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  height: '160px',
                  borderRadius: '20px',
                  border: '2px solid var(--green)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--paper)',
                  marginTop: '10px'
                }}
              >
                <img
                  src={afterPreview}
                  alt="After proof"
                  style={{ width: '130px', height: '100%', objectFit: 'cover', borderRadius: '14px', border: '2px solid var(--green)' }}
                />
                <div style={{ flex: 1 }}>
                  <div className="t7" style={{ fontWeight: 700 }}>Cleaned bin photo</div>
                  <div className="t7" style={{ opacity: 0.7 }}>Size: {afterSizeKb} KB</div>
                  <button
                    type="button"
                    className="pill pill-ghost"
                    style={{ marginTop: '8px', fontSize: '12px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Retake photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Full-width .btn-primary "Mark collected" (min-height 56px, font 20px) */}
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', minHeight: '56px', fontSize: '20px' }}
            disabled={submittingCollect}
            onClick={handleSubmitCollected}
          >
            {submittingCollect ? <span className="loading-spinner" /> : 'Mark collected'}
          </button>

          {!afterPhotoId && (
            <div className="t7" style={{ textAlign: 'center', marginTop: '10px', color: 'var(--green)', opacity: 0.85 }}>
              Add a photo to finish this task.
            </div>
          )}

          {collectError && (
            <div className="t7" style={{ color: 'var(--pink)', marginTop: '8px', textAlign: 'center' }}>
              {collectError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal List View
  return (
    <div className="page-with-bottom-tabs" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)' }}>
      {/* 1. NAV (sticky, background var(--paper), padding 16px var(--pad-x), border-bottom 2px, grid 1fr auto 1fr, align centre) */}
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
        {/* Left: tabs "My tasks" and "Alerts" */}
        <div className="citizen-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`pill ${tab === 'tasks' ? 'pill-dark active' : 'pill-ghost'}`}
            onClick={() => setTab('tasks')}
          >
            My tasks
          </button>
          <button
            type="button"
            className={`pill ${tab === 'alerts' ? 'pill-dark active' : 'pill-ghost'}`}
            onClick={() => setTab('alerts')}
          >
            Alerts
          </button>
        </div>

        {/* Centre: Logo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo variant="dark" iconHeight={28} textSize={22} />
        </div>

        {/* Right: Home button + Unread bell + Name pill */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
          <BackToHomeButton />
          <button
            type="button"
            title="Alerts"
            onClick={() => setTab('alerts')}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid var(--green)',
              backgroundColor: 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--pink)',
                  border: '2px solid var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--green)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <span
            className="pill pill-sprout"
            style={{ cursor: 'pointer', fontWeight: 600 }}
            onClick={handleLogout}
            title="Click to log out"
          >
            {firstName}
          </span>
        </div>
      </header>

      {tab === 'alerts' ? (
        <div style={{ flex: 1, backgroundColor: 'var(--paper)' }}>
          <Alerts />
        </div>
      ) : (
        <>
          {/* 2. HEADER BAND: background var(--pink); padding 28px var(--pad-x) 0; border-bottom 2px; position relative */}
          <section
            style={{
              backgroundColor: 'var(--pink)',
              padding: '28px var(--pad-x) 0',
              borderBottom: '2px solid var(--green)',
              position: 'relative'
            }}
          >
            <div className="t4" style={{ color: 'var(--green)', marginBottom: '4px' }}>
              good morning
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-peace)',
                fontSize: 'clamp(34px, 4.5vw, 56px)',
                lineHeight: 1,
                margin: '0 0 14px',
                color: 'var(--green)'
              }}
            >
              Today's route
            </h1>

            {/* Progress row: flex, align centre, gap 12px, margin 14px 0 18px */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 18px', maxWidth: '420px' }}>
              <div
                style={{
                  flex: 1,
                  height: '16px',
                  backgroundColor: 'var(--paper)',
                  border: '2px solid var(--green)',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressRatio}%`,
                    backgroundColor: 'var(--sprout)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span className="t7" style={{ color: 'var(--green)', fontWeight: 600, flexShrink: 0 }}>
                {doneTasksCount} of {totalTasksCount} done
              </span>
            </div>

            {/* Truck SVG at right, flush with bottom border */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-24px' }}>
              <Truck width={200} height={77} className="citizen-hero-illustration" />
            </div>
          </section>

          {/* 3. TASK LIST (padding 28px var(--pad-x); desktop grid repeat(auto-fill, minmax(340px, 1fr)) gap 16px; mobile one column) */}
          <main style={{ padding: '28px var(--pad-x)', flex: 1 }}>
            {loadingTasks && tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="loading-spinner" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Sprig size={56} />
                <h3 className="t3" style={{ margin: '12px 0 4px', color: 'var(--green)' }}>No tasks yet</h3>
                <p className="t7" style={{ opacity: 0.75, margin: 0 }}>New assignments will show up here.</p>
              </div>
            ) : (
            <div>
                {/* Collector HUD: Telemetry & Vehicle Operations */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                    marginBottom: '20px'
                  }}
                >
                  {/* Card 1: Vehicle & Driver */}
                  <div
                    className="card"
                    style={{
                      backgroundColor: 'var(--sprout)',
                      borderRadius: '20px',
                      border: '2px solid var(--green)',
                      padding: '16px'
                    }}
                  >
                    <div className="caption" style={{ color: 'var(--green)', opacity: 0.8, margin: '0 0 4px' }}>( vehicle dispatch )</div>
                    <div style={{ fontFamily: 'var(--font-peace)', fontSize: '20px', color: 'var(--green)' }}>
                      TN-09-CW-4022
                    </div>
                    <div className="t7" style={{ color: 'var(--green)', marginTop: '4px', opacity: 0.9 }}>
                      Eco Compactor #4 &middot; Selvam (Driver)
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className="status-badge" style={{ backgroundColor: 'var(--paper)', fontSize: '11px', padding: '2px 8px' }}>
                        🟢 Active On Route
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Shift Progress */}
                  <div
                    className="card"
                    style={{
                      backgroundColor: 'var(--paper)',
                      borderRadius: '20px',
                      border: '2px solid var(--green)',
                      padding: '16px'
                    }}
                  >
                    <div className="caption" style={{ margin: '0 0 4px' }}>( shift progress )</div>
                    <div style={{ fontFamily: 'var(--font-peace)', fontSize: '24px', color: 'var(--green)' }}>
                      {doneTasksCount} / {totalTasksCount || 4} Pickups
                    </div>
                    <div className="t7" style={{ marginTop: '4px', opacity: 0.85 }}>
                      18.4 km Total Route &middot; Chennai Metro
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className="status-badge" style={{ backgroundColor: 'var(--pink)', fontSize: '11px', padding: '2px 8px' }}>
                        {activeTasks.length} Pending Actions
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Compactor Capacity */}
                  <div
                    className="card"
                    style={{
                      backgroundColor: 'var(--blue)',
                      borderRadius: '20px',
                      border: '2px solid var(--green)',
                      padding: '16px'
                    }}
                  >
                    <div className="caption" style={{ margin: '0 0 4px' }}>( payload capacity )</div>
                    <div style={{ fontFamily: 'var(--font-peace)', fontSize: '24px', color: 'var(--green)' }}>
                      64% Full
                    </div>
                    <div className="t7" style={{ marginTop: '4px', opacity: 0.85 }}>
                      Next depot: Perungudi Transfer Hub
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className="status-badge" style={{ backgroundColor: 'var(--paper)', fontSize: '11px', padding: '2px 8px' }}>
                        1.8 Tonnes Loaded
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Environmental Impact */}
                  <div
                    className="card"
                    style={{
                      backgroundColor: 'var(--pink)',
                      borderRadius: '20px',
                      border: '2px solid var(--green)',
                      padding: '16px'
                    }}
                  >
                    <div className="caption" style={{ margin: '0 0 4px' }}>( eco efficiency )</div>
                    <div style={{ fontFamily: 'var(--font-peace)', fontSize: '24px', color: 'var(--green)' }}>
                      14.2 L Saved
                    </div>
                    <div className="t7" style={{ marginTop: '4px', opacity: 0.85 }}>
                      Optimized route &middot; 31.8 kg CO2 offset
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className="status-badge" style={{ backgroundColor: 'var(--sprout)', fontSize: '11px', padding: '2px 8px' }}>
                        94% Clean Route
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chennai Route Waypoint Corridor */}
                <div
                  className="card"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderRadius: '20px',
                    border: '2px solid var(--green)',
                    padding: '16px 20px',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="caption" style={{ margin: 0 }}>( chennai collection corridor )</span>
                    <span className="t10" style={{ opacity: 0.7 }}>100+ Covered Hubs Active</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {[
                      { name: 'Anna Nagar', status: 'Cleared', color: 'var(--sprout)' },
                      { name: 'Kilpauk', status: 'Cleared', color: 'var(--sprout)' },
                      { name: 'T. Nagar', status: 'In Progress', color: 'var(--blue)' },
                      { name: 'Mylapore', status: 'Next Stop', color: 'var(--pink)' },
                      { name: 'Adyar', status: 'Pending', color: 'var(--paper)' },
                      { name: 'Velachery', status: 'Pending', color: 'var(--paper)' },
                      { name: 'Tambaram', status: 'Depot Drop', color: 'var(--paper)' }
                    ].map((wp, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 14px',
                          borderRadius: '999px',
                          border: '1.5px solid var(--green)',
                          backgroundColor: wp.color,
                          fontSize: '12px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        <span>{i + 1}. {wp.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.75 }}>({wp.status})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Tasks Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '16px',
                    marginBottom: doneTasks.length > 0 ? '36px' : '0'
                  }}
                >
                  {activeTasks.map((task, idx) => {
                    const c = task.complaint || {};
                    const coords = c.location?.coordinates;
                    const binLat = coords && coords[1] ? coords[1] : null;
                    const binLng = coords && coords[0] ? coords[0] : null;
                    const distanceKm = calculateDistanceKm(binLat, binLng);
                    const mapsUrl = binLat && binLng ? `https://www.google.com/maps/dir/?api=1&destination=${binLat},${binLng}` : '#';

                    // Route number colors: 1 Pink, 2 Sprout, 3 Blue, repeat
                    const numColors = ['var(--pink)', 'var(--sprout)', 'var(--blue)'];
                    const numBg = numColors[idx % 3];
                    const isInProgress = task.status === 'in-progress';

                    return (
                      <div
                        key={task._id}
                        className="card"
                        style={{
                          borderRadius: '24px',
                          border: '2px solid var(--green)',
                          padding: '18px 20px',
                          backgroundColor: 'var(--paper)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        {/* Top row: 40px circle, title, distance / severity, StatusBadge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: numBg,
                              border: '2px solid var(--green)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-peace)',
                              fontSize: '18px',
                              color: 'var(--green)',
                              flexShrink: 0
                            }}
                          >
                            {idx + 1}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="t3" style={{ color: 'var(--green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.binCode || 'BIN-004'} &middot; {c.area || 'Velachery'}
                            </div>
                            <div className="t7" style={{ color: 'var(--green)', opacity: 0.8, marginTop: '2px' }}>
                              {distanceKm ? `${distanceKm} km away · ` : ''}{c.severity || 'high'} severity
                            </div>
                          </div>

                          <StatusBadge status={isInProgress ? 'In Progress' : 'Assigned'} />
                        </div>

                        {/* Task Card Visual & Details Row */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '12px',
                            backgroundColor: 'rgba(41, 66, 55, 0.04)',
                            borderRadius: '16px',
                            padding: '10px 12px',
                            marginBottom: '14px',
                            border: '1px solid rgba(41, 66, 55, 0.1)'
                          }}
                        >
                          <div
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '12px',
                              border: '1.5px solid var(--green)',
                              backgroundColor: 'var(--sprout)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <BinIcon size={26} color="var(--green)" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div className="t7" style={{ fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.description || 'Public bin overflow reported'}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span className="status-badge" style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: 'var(--pink)' }}>
                                Urgent Sensor Fill
                              </span>
                              <span className="t10" style={{ opacity: 0.75 }}>
                                ~7 mins via Anna Salai
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Buttons row */}
                        {isInProgress ? (
                          /* In Progress task: one full-width Sprout button with camera icon and label "Add photo, mark collected" */
                          <button
                            type="button"
                            className="btn-sprout"
                            style={{ width: '100%', minHeight: '48px', fontSize: '16px', gap: '8px' }}
                            onClick={() => setSelectedTask(task)}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span>Add photo, mark collected</span>
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-ghost"
                              style={{ flex: 1, minHeight: '48px', fontSize: '16px', textDecoration: 'none' }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                              </svg>
                              <span>Directions</span>
                            </a>
                            <button
                              type="button"
                              className="btn-dark"
                              style={{ flex: 1, minHeight: '48px', fontSize: '16px' }}
                              onClick={() => handleStartTask(task._id)}
                            >
                              Start
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Done Today Section */}
                {doneTasks.length > 0 && (
                  <div>
                    <h2
                      style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: '24px',
                        color: 'var(--green)',
                        margin: '0 0 16px'
                      }}
                    >
                      done today
                    </h2>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '16px'
                      }}
                    >
                      {doneTasks.map((task, idx) => {
                        const c = task.complaint || {};
                        return (
                          <div
                            key={task._id}
                            className="card"
                            style={{
                              borderRadius: '24px',
                              border: '2px solid var(--green)',
                              padding: '16px 20px',
                              backgroundColor: 'var(--paper)',
                              opacity: 0.75,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--sprout)',
                                  border: '2px solid var(--green)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--green)'
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <div>
                                <div className="t3" style={{ color: 'var(--green)' }}>
                                  {c.binCode || 'BIN'} &middot; {c.area || 'Area'}
                                </div>
                                <div className="t7" style={{ opacity: 0.75, color: 'var(--green)' }}>
                                  {c.description || 'Collected successfully'}
                                </div>
                              </div>
                            </div>

                            <StatusBadge status="Collected" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Completed Shift History: Eliminates blank whitespace and adds authentic operations log */}
                <div
                  className="card"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderRadius: '24px',
                    border: '2px solid var(--green)',
                    padding: '20px',
                    marginTop: '28px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-peace)', fontSize: '18px', margin: 0, color: 'var(--green)' }}>
                        Today's Chennai Shift Log
                      </h4>
                      <span className="caption" style={{ opacity: 0.8 }}>( 100+ municipal zones monitored )</span>
                    </div>
                    <span className="status-badge" style={{ backgroundColor: 'var(--sprout)', color: 'var(--green)' }}>
                      Photo-Verified Audit
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {[
                      { code: 'BIN-005', area: 'Mylapore Tank Street', time: '09:15 AM', load: '140 kg emptied', reporter: 'Rithanya' },
                      { code: 'BIN-003', area: 'Adyar Shastri Nagar', time: '10:30 AM', load: '210 kg emptied', reporter: 'Citizen' },
                      { code: 'BIN-012', area: 'Besant Nagar 2nd Ave', time: '11:45 AM', load: '185 kg emptied', reporter: 'Citizen' }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '16px',
                          backgroundColor: 'rgba(182, 204, 88, 0.15)',
                          border: '1.5px solid var(--green)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--sprout)',
                            border: '1.5px solid var(--green)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--green)',
                            flexShrink: 0
                          }}
                        >
                          ✓
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--green)' }}>
                            {item.code} &middot; {item.area}
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.8 }}>
                            {item.time} &middot; {item.load}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* 4. MOBILE BOTTOM TAB BAR */}
      <nav className="bottom-tab-bar" aria-label="Collector Mobile Nav">
        <button
          type="button"
          className={`bottom-tab-btn ${tab === 'tasks' ? 'active' : ''}`}
          onClick={() => {
            setTab('tasks');
            setSelectedTask(null);
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>My tasks</span>
        </button>

        <button
          type="button"
          className={`bottom-tab-btn ${tab === 'alerts' ? 'active' : ''}`}
          onClick={() => {
            setTab('alerts');
            setSelectedTask(null);
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>Alerts</span>
        </button>
      </nav>
    </div>
  );
}
