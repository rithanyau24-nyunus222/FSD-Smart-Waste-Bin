import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useAuth, apiFetch } from './api.jsx';
import { samplePhotos } from './mockData.js';

export const FloatingDecor = () => null;

/* =====================================================
   RISK LEVEL BADGE
   ===================================================== */
export const RiskBadge = ({ level = 'medium' }) => {
  const norm = (level || 'medium').toLowerCase();
  if (norm === 'critical') {
    return <span className="badge badge-critical">🔴 Critical Hazard</span>;
  }
  if (norm === 'high') {
    return <span className="badge badge-high">🟡 High Risk</span>;
  }
  if (norm === 'low') {
    return <span className="badge badge-low">🟢 Low Risk</span>;
  }
  return <span className="badge badge-medium">🔵 Medium Risk</span>;
};

/* =====================================================
   STATUS BADGE
   ===================================================== */
export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'Pending':
      return <span className="badge badge-high">⏳ Pending Review</span>;
    case 'Verified':
      return <span className="badge badge-verified">✓ Verified</span>;
    case 'Assigned':
      return <span className="badge badge-in-progress">🚛 Task Assigned</span>;
    case 'In Progress':
      return <span className="badge badge-in-progress">⚡ In Progress</span>;
    case 'Collected':
      return <span className="badge badge-collected">✅ Closed-Loop Verified</span>;
    case 'Merged':
      return <span className="badge badge-merged">🔗 Duplicate Merged</span>;
    case 'Rejected':
      return <span className="badge badge-critical">✕ Rejected</span>;
    default:
      return <span className="badge badge-medium">{status}</span>;
  }
};

/* =====================================================
   NAVBAR & PERSONA SWITCHER
   ===================================================== */
export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.read).length);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async () => {
    try {
      await apiFetch('/notifications/read', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark read:', err.message);
    }
  };

  // Quick 1-click persona switch for evaluators and testers
  const switchPersona = async (email) => {
    try {
      await login(email, 'Demo@123');
      if (email.includes('authority')) navigate('/dashboard');
      else if (email.includes('collector')) navigate('/tasks');
      else navigate('/report');
    } catch (err) {
      console.error('Persona switch error:', err);
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        {/* Brand */}
        <Link to="/" className="brand-link">
          <span className="brand-icon">🗑️</span>
          <div className="brand-text">
            <span className="brand-title">CleanChennai</span>
            <span className="brand-tag">Smart Waste &amp; Closed-Loop Collection</span>
          </div>
        </Link>

        {/* 1-Click Persona Switcher */}
        <div className="role-switcher-bar" title="Quick Role Switcher for Testing">
          <button
            type="button"
            className={`role-pill ${user?.role === 'citizen' ? 'active' : ''}`}
            onClick={() => switchPersona('citizen@demo.com')}
          >
            👤 Citizen
          </button>
          <button
            type="button"
            className={`role-pill ${user?.role === 'authority' ? 'active' : ''}`}
            onClick={() => switchPersona('authority@demo.com')}
          >
            🏛️ Corporation Admin
          </button>
          <button
            type="button"
            className={`role-pill ${user?.role === 'collector' ? 'active' : ''}`}
            onClick={() => switchPersona('collector@demo.com')}
          >
            🚛 Driver
          </button>
        </div>

        {/* Navigation items */}
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Report Waste
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Corporation Hub
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Daily Tasks
          </NavLink>

          {/* Notification Button */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen && unreadCount > 0) handleMarkAsRead();
                }}
                style={{ position: 'relative', padding: '7px 12px' }}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--rose-500)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: '800',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '320px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-hover)',
                    zIndex: 1000,
                    padding: '14px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '8px'
                    }}
                  >
                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAsRead}
                        style={{ fontSize: '0.75rem', color: 'var(--cyan-500)' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                        No notifications
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          style={{
                            padding: '8px',
                            borderRadius: 'var(--radius-sm)',
                            background: n.read ? 'transparent' : 'rgba(16, 185, 129, 0.08)',
                            marginBottom: '6px',
                            fontSize: '0.8rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#fff', marginBottom: '2px' }}>{n.title || 'Alert'}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={logout}
              style={{ color: 'var(--text-muted)' }}
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

/* =====================================================
   LIVE CHENNAI CITY MAP COMPONENT
   ===================================================== */
export const CityMap = ({
  complaints = [],
  bins = [],
  selectedItem = null,
  onSelectItem = null,
  height = '500px'
}) => {
  // Center of Chennai
  const chennaiCenter = [13.05, 80.245];

  return (
    <div style={{ width: '100%', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      <MapContainer center={chennaiCenter} zoom={12} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Smart Municipal Bins */}
        {bins.map((bin) => {
          if (!bin.location?.coordinates) return null;
          const [lon, lat] = bin.location.coordinates;
          const isCritical = bin.fillLevel >= 80;
          const color = isCritical ? '#ef4444' : bin.fillLevel >= 50 ? '#f59e0b' : '#10b981';

          return (
            <CircleMarker
              key={bin._id}
              center={[lat, lon]}
              radius={isCritical ? 11 : 8}
              pathOptions={{
                color: '#fff',
                weight: 1.5,
                fillColor: color,
                fillOpacity: 0.85
              }}
              eventHandlers={{
                click: () => onSelectItem && onSelectItem({ type: 'bin', data: bin })
              }}
            >
              <Popup>
                <div style={{ padding: '6px', minWidth: '180px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111827', marginBottom: '2px' }}>
                    🏢 Smart Bin: {bin.code}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '6px' }}>{bin.address}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color }}>{bin.fillLevel}% Full</span>
                    {isCritical && <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '700' }}>OVERFLOW ALERT</span>}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Reported Waste Incidents */}
        {complaints.map((cmp) => {
          if (!cmp.location?.coordinates || cmp.status === 'Merged') return null;
          const [lon, lat] = cmp.location.coordinates;
          const isCollected = cmp.status === 'Collected';
          const isCritical = cmp.riskLevel === 'critical' || cmp.priority === 'critical';
          const pinColor = isCollected ? '#10b981' : isCritical ? '#dc2626' : '#f59e0b';

          return (
            <CircleMarker
              key={cmp._id}
              center={[lat, lon]}
              radius={isCritical ? 14 : 10}
              pathOptions={{
                color: isCritical ? '#fee2e2' : '#fff',
                weight: 2,
                fillColor: pinColor,
                fillOpacity: 0.95
              }}
              eventHandlers={{
                click: () => onSelectItem && onSelectItem({ type: 'complaint', data: cmp })
              }}
            >
              <Popup>
                <div style={{ padding: '6px', maxWidth: '240px' }}>
                  {cmp.photo && (
                    <img
                      src={cmp.photo}
                      alt="Reported waste spot"
                      style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                    />
                  )}
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#111827', marginBottom: '4px' }}>
                    📍 {cmp.areaName || cmp.bin?.area || 'Reported Incident'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '6px', lineHeight: '1.4' }}>
                    {cmp.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: pinColor,
                        padding: '2px 6px',
                        background: '#f3f4f6',
                        borderRadius: '4px'
                      }}
                    >
                      Risk: {(cmp.riskLevel || 'medium').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151' }}>{cmp.status}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

/* =====================================================
   MAP PICKER COMPONENT (FOR CITIZEN GEO-TAGGING)
   ===================================================== */
export const MapPicker = ({ lat, lng, onChange }) => {
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    });

    return (
      <CircleMarker
        center={[lat, lng]}
        radius={12}
        pathOptions={{ color: '#fff', weight: 2, fillColor: '#10b981', fillOpacity: 0.9 }}
      >
        <Popup>
          <div style={{ fontSize: '0.82rem', color: '#111' }}>
            <strong>Selected Incident Location</strong>
            <br />
            Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
          </div>
        </Popup>
      </CircleMarker>
    );
  };

  return (
    <div style={{ width: '100%', height: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

/* =====================================================
   PHOTO UPLOAD WITH INSTANT AI ANALYSIS PREVIEW
   ===================================================== */
export const PhotoUpload = ({ photo, setPhoto, analysis, setAnalysis }) => {
  const [selectedDemo, setSelectedDemo] = useState('bin_overflow');

  const handleDemoSelect = (key) => {
    setSelectedDemo(key);
    setPhoto(samplePhotos[key]);

    if (key === 'drain_block') {
      setAnalysis({
        category: 'Plastic Storm Drain Blockage',
        estimatedWeight: '60 kg',
        spillRadius: '3.5 meters',
        drainageThreat: 'CRITICAL (Immediate Monsoon Flood Threat)',
        suggestedRisk: 'critical'
      });
    } else if (key === 'commercial') {
      setAnalysis({
        category: 'Market Vegetable Crates & Sacks',
        estimatedWeight: '120 kg',
        spillRadius: '6 meters',
        drainageThreat: 'Moderate',
        suggestedRisk: 'high'
      });
    } else if (key === 'footpath') {
      setAnalysis({
        category: 'Pedestrian Walkway Waste Heap',
        estimatedWeight: '50 kg',
        spillRadius: '2.5 meters',
        drainageThreat: 'High Public Hygiene Hazard',
        suggestedRisk: 'high'
      });
    } else {
      setAnalysis({
        category: 'Municipal Smart Bin Overflow',
        estimatedWeight: '80-100 kg',
        spillRadius: '4 meters',
        drainageThreat: 'Moderate Hazard',
        suggestedRisk: 'high'
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result);
        setAnalysis({
          category: 'Citizen Live Camera Capture',
          estimatedWeight: '~65 kg estimated',
          spillRadius: '3.0 meters',
          drainageThreat: 'Potential Obstruction',
          suggestedRisk: 'high'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        📸 Incident Photograph (Live Capture / Upload)
      </label>

      {/* Preset demo photo selector for quick evaluation */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          type="button"
          className={`btn-secondary btn-sm ${selectedDemo === 'bin_overflow' ? 'active' : ''}`}
          onClick={() => handleDemoSelect('bin_overflow')}
        >
          🗑️ Overflowing Bin
        </button>
        <button
          type="button"
          className={`btn-secondary btn-sm ${selectedDemo === 'drain_block' ? 'active' : ''}`}
          onClick={() => handleDemoSelect('drain_block')}
        >
          🌊 Clogged Storm Drain
        </button>
        <button
          type="button"
          className={`btn-secondary btn-sm ${selectedDemo === 'commercial' ? 'active' : ''}`}
          onClick={() => handleDemoSelect('commercial')}
        >
          📦 Market Crates
        </button>
        <button
          type="button"
          className={`btn-secondary btn-sm ${selectedDemo === 'footpath' ? 'active' : ''}`}
          onClick={() => handleDemoSelect('footpath')}
        >
          🚶 Walkway Heap
        </button>
      </div>

      {/* Photo Frame */}
      <div className="waste-photo-frame" style={{ height: '240px', marginBottom: '12px' }}>
        <img src={photo || samplePhotos.bin_overflow} alt="Incident capture" />
        <div className="photo-badge-overlay">
          <span className="badge badge-medium">📷 Visual Proof</span>
        </div>
      </div>

      {/* File Upload Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label className="btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
          📁 Upload From Device
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          JPG, PNG or live smartphone photo
        </span>
      </div>

      {/* Instant AI Waste Analysis Result */}
      {analysis && (
        <div className="ai-analysis-box">
          <div className="ai-analysis-header">
            <span className="ai-analysis-title">✨ Automated Waste Visual Analysis</span>
            <RiskBadge level={analysis.suggestedRisk || 'high'} />
          </div>
          <div className="ai-metric-grid">
            <div className="ai-metric-item">
              Detected Waste: <strong>{analysis.category}</strong>
            </div>
            <div className="ai-metric-item">
              Estimated Weight: <strong>{analysis.estimatedWeight}</strong>
            </div>
            <div className="ai-metric-item">
              Spill Spread: <strong>{analysis.spillRadius}</strong>
            </div>
            <div className="ai-metric-item">
              Drainage Threat: <strong>{analysis.drainageThreat}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =====================================================
   FOOTER
   ===================================================== */
export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <strong>CleanChennai</strong> · Smart Waste Bin Monitoring &amp; Closed-Loop Collection System
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            College Full Stack Development Project · Greater Chennai Corporation Simulation
          </div>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => {
              if (window.confirm('Reset local demo database to initial state?')) {
                localStorage.removeItem('clean_chennai_waste_v3');
                window.location.reload();
              }
            }}
          >
            🔄 Reset Demo Data
          </button>
        </div>
      </div>
    </footer>
  );
};
