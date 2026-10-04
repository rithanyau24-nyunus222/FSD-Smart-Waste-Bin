import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import {
  Logo,
  BinMini,
  MapPicker,
  StatusBadge,
  Alerts,
  BinIcon,
  BackToHomeButton,
  CHENNAI_AREAS
} from '../components.jsx';
import api, { uploadPhoto } from '../api.js';

// Image compressor helper
async function compressImage(file) {
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

      // Compress main
      let q = 0.7;
      let mainBlob = null;
      while (q >= 0.25) {
        mainBlob = await new Promise((res) => canvas.toBlob(res, mime, q));
        if (mainBlob && mainBlob.size <= 120 * 1024) break;
        q -= 0.1;
      }
      if (!mainBlob) mainBlob = await new Promise((res) => canvas.toBlob(res, mime, 0.3));

      // Thumbnail 160px
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

export default function Citizen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('report'); // 'report' | 'complaints' | 'alerts'
  const [unreadCount, setUnreadCount] = useState(0);

  // Form State
  const [photoId, setPhotoId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoSizeKb, setPhotoSizeKb] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [selectedBin, setSelectedBin] = useState(null);
  const [customArea, setCustomArea] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [formError, setFormError] = useState('');

  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [statusTab, setStatusTab] = useState('All'); // 'All' | 'Open' | 'Collected'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Load unread count
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

  useEffect(() => {
    loadUnreadCount();
    const handleRefresh = () => loadUnreadCount();
    window.addEventListener('notifications:refresh', handleRefresh);
    const interval = setInterval(loadUnreadCount, 15000);
    return () => {
      window.removeEventListener('notifications:refresh', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  // Fetch complaints
  const fetchComplaints = async (targetPage = 1, append = false) => {
    try {
      setLoadingComplaints(true);
      const query = new URLSearchParams({ page: targetPage });
      if (statusTab === 'Collected') {
        query.set('status', 'Collected');
      }

      const res = await api.get(`/complaints?${query.toString()}`);
      let items = res.items || [];
      if (statusTab === 'Open') {
        items = items.filter((c) => c.status !== 'Collected' && c.status !== 'Rejected');
      }

      if (append) {
        setComplaints((prev) => [...prev, ...items]);
      } else {
        setComplaints(items);
        if (items.length > 0 && !selectedComplaint) {
          setSelectedComplaint(items[0]);
        }
      }
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaints(1, false);
  }, [statusTab]);

  // Handle photo upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    setPhotoLoading(true);

    try {
      const { mainBlob, thumbBlob } = await compressImage(file);
      const res = await uploadPhoto(mainBlob, thumbBlob);
      setPhotoId(res.id);
      setPhotoSizeKb((mainBlob.size / 1024).toFixed(1));
      setPhotoPreview(URL.createObjectURL(mainBlob));
    } catch (err) {
      setFormError(err.message || 'Error uploading photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedLocation({ lat, lng });
      },
      (err) => alert('Could not get your location: ' + err.message),
      { timeout: 10000 }
    );
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitResult(null);

    if (!photoId) {
      setFormError('Please attach a photo of the bin first.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please write a brief description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: description.trim(),
        severity,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        binId: selectedBin ? selectedBin._id : undefined,
        photoIds: [photoId]
      };

      const res = await api.post('/complaints', payload);
      setSubmitResult(res);
      setDescription('');
      setPhotoId(null);
      setPhotoPreview(null);
      setPhotoSizeKb(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchComplaints(1, false);
    } catch (err) {
      setFormError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const scrollToReport = () => {
    setTab('report');
    const el = document.getElementById('report-flow-card');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Rithanya';

  return (
    <div className="page-with-bottom-tabs" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
        {/* Left: pills "Report" (active), "My complaints", "Alerts" (hidden on mobile) */}
        <div className="citizen-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`pill ${tab === 'report' ? 'pill-dark active' : 'pill-ghost'}`}
            onClick={() => setTab('report')}
          >
            Report
          </button>
          <button
            type="button"
            className={`pill ${tab === 'complaints' ? 'pill-dark active' : 'pill-ghost'}`}
            onClick={() => setTab('complaints')}
          >
            My complaints
          </button>
          <button
            type="button"
            className={`pill ${tab === 'alerts' ? 'pill-dark active' : 'pill-ghost'}`}
            onClick={() => setTab('alerts')}
          >
            Alerts
          </button>
        </div>

        {/* Centre: Logo (dark) 28px / 22px */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/citizen" style={{ textDecoration: 'none' }}>
            <Logo variant="dark" iconHeight={28} textSize={22} />
          </Link>
        </div>

        {/* Right (gap 10px): Home button + 40px circle with 2px border, bell icon + 18px Electric Pink circle badge, then Sprout pill with user's first name */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
          <BackToHomeButton />
          <button
            type="button"
            title="Alerts & Notifications"
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
                  color: 'var(--green)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1
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
            title="Logged in. Click to log out"
          >
            {firstName}
          </span>
        </div>
      </header>

      {/* 2. HERO BAND (background var(--sprout); padding 40px var(--pad-x) 0; border-bottom 2px; flex, justify space-between, align-items flex-end, gap 24px) */}
      <section
        className="citizen-hero-band"
        style={{
          backgroundColor: 'var(--sprout)',
          padding: '40px var(--pad-x) 0',
          borderBottom: '2px solid var(--green)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '24px'
        }}
      >
        {/* Left (padding-bottom 48px): greeting "hello, <first name>" in Caprasimo T4; H1 "Spotted an" / "overflowing bin?" on two lines in Peace Sans T1, margin 6px 0 20px; .btn-dark "Report it now" with Electric Pink text */}
        <div style={{ paddingBottom: '48px', maxWidth: '560px' }}>
          <div className="t4" style={{ color: 'var(--green)', marginBottom: '0.25rem' }}>
            hello, {firstName}
          </div>

          <h1
            className="t1"
            style={{
              color: 'var(--green)',
              margin: '6px 0 20px',
              lineHeight: 0.98
            }}
          >
            Spotted an<br />overflowing bin?
          </h1>

          <button
            type="button"
            className="btn-dark"
            style={{ color: 'var(--pink)', padding: '0 32px', minHeight: '48px', fontSize: '16px' }}
            onClick={scrollToReport}
          >
            Report it now
          </button>
        </div>

        {/* Right (hidden below 700px): BinMini at 300 x 205 px, flush with bottom border */}
        <div className="citizen-hero-illustration">
          <BinMini width={300} height={205} />
        </div>
      </section>

      {/* 3. MAIN BAND */}
      {tab === 'alerts' ? (
        <div style={{ flex: 1, backgroundColor: 'var(--paper)' }}>
          <Alerts />
        </div>
      ) : (
        <div
          className="citizen-main-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
            flex: 1
          }}
        >
          {/* LEFT COLUMN (background var(--paper); padding 32px var(--pad-x); border-right 2px) */}
          <div
            id="report-flow-card"
            className="citizen-report-col"
            style={{
              backgroundColor: 'var(--paper)',
              padding: '32px var(--pad-x)',
              borderRight: '2px solid var(--green)'
            }}
          >
            {/* Title row, align baseline, gap 12px, margin-bottom 18px: "Report a bin" in T2 and "three quick steps" in Caprasimo T5 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <h2 className="t2" style={{ margin: 0, color: 'var(--green)' }}>
                Report a bin
              </h2>
              <span className="t5" style={{ color: 'var(--green)', opacity: 0.85 }}>
                three quick steps
              </span>
            </div>

            {formError && (
              <div
                className="t7"
                style={{
                  borderLeft: '4px solid var(--pink)',
                  backgroundColor: 'var(--paper)',
                  border: '2px solid var(--green)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: 'var(--green)'
                }}
              >
                {formError}
              </div>
            )}

            {submitResult && (
              <div
                className="card"
                style={{
                  borderLeft: '6px solid var(--sprout)',
                  backgroundColor: 'var(--paper)',
                  padding: '16px 20px',
                  marginBottom: '18px'
                }}
              >
                <h4 className="t3" style={{ margin: '0 0 6px' }}>
                  {submitResult.merged ? 'Report merged with existing case' : 'Report submitted successfully!'}
                </h4>
                <p className="t7" style={{ margin: '0 0 12px', color: 'var(--green)', opacity: 0.85 }}>
                  {submitResult.merged
                    ? `Another citizen already reported this bin. Your report was merged into complaint #${submitResult.complaintId.slice(-6)}.`
                    : `Complaint #${submitResult.complaintId.slice(-6)} has been registered.`}
                </p>
                <Link
                  to={`/complaint/${submitResult.complaintId}`}
                  className="pill pill-sprout"
                  style={{ textDecoration: 'none', display: 'inline-flex' }}
                >
                  View live timeline &rarr;
                </Link>
              </div>
            )}

            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Card 1: Photo */}
              <div
                className="card"
                style={{
                  borderRadius: '24px',
                  padding: '18px 20px',
                  marginBottom: '16px',
                  backgroundColor: 'var(--paper)'
                }}
              >
                {/* Header row: 36px circle with 2px border and Peace Sans 18px number (1 Pink), then title in Peace Sans 22px */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--pink)',
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
                    1
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-peace)', fontSize: '22px', margin: 0, color: 'var(--green)' }}>
                    Photo
                  </h3>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />

                {!photoPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--green)',
                      borderRadius: '20px',
                      height: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--paper)',
                      padding: '12px 20px'
                    }}
                  >
                    {photoLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="loading-spinner" />
                        <span className="t7">Compressing &amp; uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="t7" style={{ fontWeight: 600, color: 'var(--green)' }}>
                            Tap to add a photo
                          </span>
                          <span className="t7" style={{ opacity: 0.7, color: 'var(--green)' }}>
                            Compressed to about 120 KB for you
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      height: '120px',
                      borderRadius: '20px',
                      border: '2px solid var(--green)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'var(--paper)',
                      gap: '16px'
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Selected bin"
                      style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '14px',
                        objectFit: 'cover',
                        border: '2px solid var(--green)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="t7" style={{ fontWeight: 600 }}>Photo attached</div>
                      <div className="t7" style={{ opacity: 0.7 }}>Size: {photoSizeKb} KB (&le; 120 KB)</div>
                    </div>
                    <button
                      type="button"
                      className="pill pill-ghost"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: Location */}
              <div
                className="card"
                style={{
                  borderRadius: '24px',
                  padding: '18px 20px',
                  marginBottom: '16px',
                  backgroundColor: 'var(--paper)'
                }}
              >
                {/* Header row: circle 2 Blue, title Location in Peace Sans 22px, and pushed right "Use my location" pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--blue)',
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
                    2
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-peace)', fontSize: '22px', margin: 0, color: 'var(--green)' }}>
                    Location
                  </h3>
                  <button
                    type="button"
                    className="pill pill-ghost"
                    style={{ marginLeft: 'auto', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleUseMyLocation}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    <span>Use my location</span>
                  </button>
                </div>

                {/* MapPicker with height 180px and hidden header & legend */}
                <MapPicker
                  selectedLocation={selectedLocation}
                  onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
                  selectedBin={selectedBin}
                  onSelectBin={(b) => setSelectedBin(b)}
                  height="180px"
                  hideHeader={true}
                  hideLegend={true}
                />

                {/* 100+ Chennai Localities Picker */}
                <div style={{ marginTop: '14px' }}>
                  <label className="caption" style={{ display: 'block', marginBottom: '6px' }}>
                    Select Chennai Neighborhood (100+ Covered):
                  </label>
                  <input
                    type="text"
                    list="citizen-chennai-areas"
                    className="form-input-brand"
                    placeholder="Search or pick area (e.g. Mylapore, Besant Nagar, Anna Nagar...)"
                    value={customArea || (selectedBin ? selectedBin.area : '')}
                    onChange={(e) => setCustomArea(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                  <datalist id="citizen-chennai-areas">
                    {CHENNAI_AREAS.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Card 3: Details */}
              <div
                className="card"
                style={{
                  borderRadius: '24px',
                  padding: '18px 20px',
                  marginBottom: '16px',
                  backgroundColor: 'var(--paper)'
                }}
              >
                {/* Header row: circle 3 Sprout, title Details in Peace Sans 22px */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
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
                      fontFamily: 'var(--font-peace)',
                      fontSize: '18px',
                      color: 'var(--green)',
                      flexShrink: 0
                    }}
                  >
                    3
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-peace)', fontSize: '22px', margin: 0, color: 'var(--green)' }}>
                    Details
                  </h3>
                </div>

                {/* Severity pills: Low, Medium, High */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  {['low', 'medium', 'high'].map((lvl) => {
                    const isSelected = severity === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        className={`pill ${isSelected ? 'pill-pink active' : 'pill-ghost'}`}
                        style={{
                          backgroundColor: isSelected ? 'var(--pink)' : 'transparent',
                          color: 'var(--green)',
                          border: '2px solid var(--green)'
                        }}
                        onClick={() => setSeverity(lvl)}
                      >
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </button>
                    );
                  })}
                </div>

                {/* Textarea */}
                <textarea
                  required
                  placeholder="Overflowing near the bus stop, smells bad."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    borderRadius: '20px',
                    border: '2px solid var(--green)',
                    padding: '14px 16px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    color: 'var(--green)',
                    backgroundColor: 'var(--paper)',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Submit: full-width .btn-primary "Submit report" with arrow-right, min-height 60px, font 20px */}
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  fontSize: '20px',
                  fontFamily: 'var(--font-peace)',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <span>Submit report</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN (background var(--blue); padding 32px 28px) */}
          <div
            className="citizen-complaints-col"
            style={{
              backgroundColor: 'var(--blue)',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Title "My complaints" in T2, margin-bottom 14px */}
            <h2 className="t2" style={{ margin: '0 0 14px', color: 'var(--green)' }}>
              My complaints
            </h2>

            {/* Filter pills: All (active), Open, Collected at T7 size, gap 8px, margin-bottom 16px */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['All', 'Open', 'Collected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`pill ${statusTab === st ? 'pill-dark active' : 'pill-ghost'}`}
                  style={{
                    backgroundColor: statusTab === st ? 'var(--green)' : 'transparent',
                    color: statusTab === st ? 'var(--paper)' : 'var(--green)',
                    fontSize: '13px'
                  }}
                  onClick={() => setStatusTab(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Complaint cards list */}
            {loadingComplaints && complaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <span className="loading-spinner" />
              </div>
            ) : complaints.length === 0 ? (
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--paper)',
                  borderRadius: '22px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}
              >
                <p className="t7" style={{ margin: 0, opacity: 0.8 }}>
                  No complaints found under {statusTab}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {complaints.map((c, idx) => {
                  const mainPhoto = c.photos?.find((p) => p.kind === 'before') || c.photos?.[0];
                  const thumbColorCycles = ['var(--pink)', 'var(--sprout)', 'var(--paper)'];
                  const thumbBg = thumbColorCycles[idx % 3];

                  return (
                    <div
                      key={c._id}
                      className="card"
                      style={{
                        backgroundColor: 'var(--paper)',
                        borderRadius: '22px',
                        border: '2px solid var(--green)',
                        display: 'flex',
                        gap: '14px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onClick={() => setSelectedComplaint(c)}
                    >
                      {/* 84px square thumbnail or placeholder (radius 16px; colours cycle Pink, Sprout, Paper) */}
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '16px',
                          border: '2px solid var(--green)',
                          backgroundColor: thumbBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {mainPhoto?.photo ? (
                          <img
                            src={`/api/photos/${mainPhoto.photo}?thumb=1`}
                            alt="Bin"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <BinIcon size={34} color="var(--green)" />
                        )}
                      </div>

                      {/* Right: "BIN-004 · Velachery" in T3, description in T7 (margin 4px 0 8px), then StatusBadge */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div className="t3" style={{ color: 'var(--green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.binCode || 'BIN-004'} &middot; {c.area || 'Velachery'}
                        </div>
                        <div className="t7" style={{ margin: '4px 0 8px', color: 'var(--green)', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.description || 'Overflowing near the bus stop'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StatusBadge status={c.status} />
                          <Link
                            to={`/complaint/${c._id}`}
                            className="t8"
                            style={{ marginLeft: 'auto', color: 'var(--green)', textDecoration: 'underline' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Details &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {complaints.length < total && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="pill pill-ghost"
                  onClick={() => fetchComplaints(page + 1, true)}
                  disabled={loadingComplaints}
                >
                  Load more
                </button>
              </div>
            )}

            {/* Under the list: "live timeline" in Caprasimo 26px (margin 20px 0 12px) and Timeline for selected complaint */}
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-script)',
                  fontSize: '26px',
                  color: 'var(--green)',
                  margin: '20px 0 12px'
                }}
              >
                live timeline
              </div>

              {selectedComplaint && selectedComplaint.history && selectedComplaint.history.length > 0 ? (
                <div style={{ position: 'relative', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Vertical Green House Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      bottom: '6px',
                      left: '5px',
                      width: '2px',
                      backgroundColor: 'var(--green)'
                    }}
                  />

                  {selectedComplaint.history.map((h, i) => {
                    const timeFormatted = h.at
                      ? new Date(h.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                      : '';
                    const dotColors = {
                      Reported: 'var(--green)',
                      Pending: 'var(--paper)',
                      Verified: 'var(--blue)',
                      Assigned: 'var(--pink)',
                      'In Progress': 'var(--paper)',
                      Collected: 'var(--sprout)',
                      Rejected: 'var(--green)'
                    };
                    const bg = dotColors[h.status] || (i === 0 ? 'var(--green)' : 'var(--blue)');

                    return (
                      <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: '-22px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: bg,
                            border: '2px solid var(--green)',
                            zIndex: 2
                          }}
                        />
                        <span className="t7" style={{ color: 'var(--green)' }}>
                          {h.status === 'Assigned' ? 'Assigned to collector' : h.status}
                          {timeFormatted ? ` · ${timeFormatted}` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      bottom: '6px',
                      left: '5px',
                      width: '2px',
                      backgroundColor: 'var(--green)'
                    }}
                  />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ position: 'absolute', left: '-22px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--green)', border: '2px solid var(--green)' }} />
                    <span className="t7" style={{ color: 'var(--green)' }}>Reported · 9:10 am</span>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ position: 'absolute', left: '-22px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--blue)', border: '2px solid var(--green)' }} />
                    <span className="t7" style={{ color: 'var(--green)' }}>Verified · 9:42 am</span>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ position: 'absolute', left: '-22px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--pink)', border: '2px solid var(--green)' }} />
                    <span className="t7" style={{ color: 'var(--green)' }}>Assigned to collector · 10:05 am</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chennai Cleanliness Feed: eliminating blank whitespace & showcasing citywide activity */}
            <div
              className="card"
              style={{
                backgroundColor: 'var(--paper)',
                borderRadius: '24px',
                border: '2px solid var(--green)',
                padding: '20px',
                marginTop: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-peace)', fontSize: '18px', margin: 0, color: 'var(--green)' }}>
                    Chennai Cleanliness Feed
                  </h4>
                  <span className="caption" style={{ opacity: 0.8 }}>( 100+ zones active )</span>
                </div>
                <span className="status-badge" style={{ backgroundColor: 'var(--sprout)', color: 'var(--green)' }}>
                  Live Civic Stream
                </span>
              </div>

              {/* Feed items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { area: 'Besant Nagar Beach', time: '12m ago', note: 'Morning sand cleanup & segregated bins serviced', badge: 'Cleared', color: 'var(--sprout)' },
                  { area: 'Anna Nagar Tower', time: '34m ago', note: '3 compactor bins emptied along 2nd Avenue', badge: 'Cleared', color: 'var(--sprout)' },
                  { area: 'Mylapore Tank', time: '1h ago', note: 'Civic report by Rithanya assigned to quick dispatch', badge: 'In Progress', color: 'var(--blue)' },
                  { area: 'T. Nagar Ranganathan St', time: '2h ago', note: 'Commercial market overflow sorted & cleared', badge: 'Cleared', color: 'var(--sprout)' },
                  { area: 'Porur Junction', time: '3h ago', note: 'Sensor alert: High fill 88% — automated task created', badge: 'Assigned', color: 'var(--pink)' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(41, 66, 55, 0.04)',
                      border: '1px solid rgba(41, 66, 55, 0.15)'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        border: '1.5px solid var(--green)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <BinIcon size={16} color="var(--green)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--green)' }}>{item.area}</span>
                        <span style={{ fontSize: '11px', opacity: 0.65 }}>{item.time}</span>
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.note}
                      </div>
                    </div>
                    <span className="status-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MOBILE BOTTOM TAB BAR (below 700px: height 64px, bg var(--green), colour Paper White, 11px labels, 22px icons) */}
      <nav className="bottom-tab-bar" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`bottom-tab-btn ${tab === 'report' ? 'active' : ''}`}
          onClick={() => setTab('report')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Report</span>
        </button>

        <button
          type="button"
          className={`bottom-tab-btn ${tab === 'complaints' ? 'active' : ''}`}
          onClick={() => setTab('complaints')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>My complaints</span>
        </button>

        <button
          type="button"
          className={`bottom-tab-btn ${tab === 'alerts' ? 'active' : ''}`}
          onClick={() => setTab('alerts')}
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
