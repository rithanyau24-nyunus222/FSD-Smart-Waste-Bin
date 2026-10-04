import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
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
      return <span className="badge badge-medium">🚛 Task Assigned</span>;
    case 'In Progress':
      return <span className="badge badge-medium">⚡ In Progress</span>;
    case 'Collected':
      return <span className="badge badge-collected">✅ Cleaned &amp; Verified</span>;
    case 'Merged':
      return <span className="badge badge-merged">🔗 Duplicate Merged</span>;
    case 'Rejected':
      return <span className="badge badge-critical">✕ Rejected</span>;
    default:
      return <span className="badge badge-medium">{status}</span>;
  }
};

/* =====================================================
   LEFT SIDEBAR (PERMANENT DESKTOP NAV)
   ===================================================== */
export const Sidebar = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const switchRole = async (email) => {
    try {
      await login(email, 'Demo@123');
      if (email.includes('authority')) navigate('/dashboard');
      else if (email.includes('collector')) navigate('/tasks');
      else navigate('/');
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div className="sidebar-logo">
        <div className="logo-badge">🗑️</div>
        <span className="logo-title">CleanChennai</span>
      </div>

      <div className="sidebar-section-title">Navigation</div>
      <nav className="sidebar-menu">
        <NavLink to="/" end className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon">📊</span>
          <span>Home / Overview</span>
        </NavLink>

        <NavLink to="/report" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon">📸</span>
          <span>Report Waste</span>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon">🏛️</span>
          <span>Corporation Hub</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon">🚛</span>
          <span>Daily Tasks</span>
        </NavLink>

        <NavLink to="/my-complaints" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <span className="sidebar-item-icon">📑</span>
          <span>My Reports</span>
        </NavLink>
      </nav>

      {/* Quick 1-Click Role Switcher */}
      <div className="sidebar-roles-box">
        <div className="sidebar-roles-title">
          <span>⚡ Instant Persona Switch</span>
        </div>
        <button
          type="button"
          className={`sidebar-role-btn ${user?.role === 'citizen' ? 'active' : ''}`}
          onClick={() => switchRole('citizen@demo.com')}
        >
          <span>👤</span>
          <span>Citizen (Priya)</span>
        </button>
        <button
          type="button"
          className={`sidebar-role-btn ${user?.role === 'authority' ? 'active' : ''}`}
          onClick={() => switchRole('authority@demo.com')}
        >
          <span>🏛️</span>
          <span>Admin (Karthik)</span>
        </button>
        <button
          type="button"
          className={`sidebar-role-btn ${user?.role === 'collector' ? 'active' : ''}`}
          onClick={() => switchRole('collector@demo.com')}
        >
          <span>🚛</span>
          <span>Driver (Murugan)</span>
        </button>
      </div>

      {/* Footer controls */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-item"
          style={{ fontSize: '0.82rem', padding: '8px 12px', color: 'var(--text-muted)' }}
          onClick={() => {
            if (window.confirm('Reset demo database to fresh seed state?')) {
              localStorage.removeItem('clean_chennai_waste_v3');
              window.location.reload();
            }
          }}
        >
          <span className="sidebar-item-icon">🔄</span>
          <span>Reset Demo Data</span>
        </button>

        {user ? (
          <button
            type="button"
            className="sidebar-item"
            style={{ fontSize: '0.82rem', padding: '8px 12px', color: 'var(--rose)' }}
            onClick={logout}
          >
            <span className="sidebar-item-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        ) : (
          <NavLink to="/login" className="sidebar-item" style={{ color: 'var(--primary)' }}>
            <span className="sidebar-item-icon">🔑</span>
            <span>Sign In</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
};

/* =====================================================
   TOP HEADER BAR
   ===================================================== */
export const Header = () => {
  const { user } = useAuth();
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
      const interval = setInterval(fetchNotifications, 15000);
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

  return (
    <header className="top-header">
      {/* Search Input */}
      <div className="header-search">
        <span className="header-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search Chennai waste reports, wards, bins..."
        />
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen && unreadCount > 0) handleMarkAsRead();
            }}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && <span className="header-badge-dot" />}
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '320px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-popup)',
                zIndex: 1000,
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Notifications</strong>
                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAsRead} style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: n.read ? '#fff' : 'var(--primary-light)',
                        marginBottom: '6px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>{n.title || 'Update'}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        {user && (
          <div className="user-profile-pill">
            <div className="user-avatar-circle">
              {user.name ? user.name[0] : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="user-pill-name">{user.name}</span>
            </div>
            <span className="user-pill-role">
              {user.role === 'authority' ? 'Admin' : user.role === 'collector' ? 'Driver' : 'Citizen'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

/* =====================================================
   RIGHT STATS PANEL (MATCHING REFERENCE IMAGE)
   ===================================================== */
export const RightPanel = () => {
  const { user } = useAuth();

  return (
    <aside className="right-panel">
      {/* Profile Snapshot & Circular Cleanliness Score */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 12px auto' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'conic-gradient(var(--primary) 0% 88%, #e2e8f0 88% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}
            >
              {user?.role === 'authority' ? '🏛️' : user?.role === 'collector' ? '🚛' : '👤'}
            </div>
          </div>
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '-4px',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            88%
          </span>
        </div>

        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '2px' }}>
          Hello, {user?.name ? user.name.split(' ')[0] : 'Citizen'}! 🌿
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Zone: {user?.area || 'Chennai Central'}
        </p>
      </div>

      {/* Weekly Activity Mini-Bar Chart (Matching Reference Image) */}
      <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>Weekly Dispatches</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last 7 Days</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '80px', padding: '0 6px' }}>
          {[
            { day: 'Mon', h: 40 },
            { day: 'Tue', h: 65 },
            { day: 'Wed', h: 30 },
            { day: 'Thu', h: 80 },
            { day: 'Fri', h: 55 },
            { day: 'Sat', h: 90 },
            { day: 'Sun', h: 35 }
          ].map((bar, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '16px',
                  height: `${bar.h}px`,
                  backgroundColor: i === 5 ? 'var(--primary)' : '#cbd5e1',
                  borderRadius: '4px'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Zone Drivers on Duty */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>Sanitation Drivers</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '700' }}>Active Now</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { name: 'Murugan', zone: 'Zone 13 Adyar', status: 'On Route' },
            { name: 'Suresh', zone: 'Zone 9 T. Nagar', status: 'En Route' },
            { name: 'Venkatesh', zone: 'Zone 8 Anna Nagar', status: 'Standby' }
          ].map((driver, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🚛</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>{driver.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{driver.zone}</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--emerald)' }}>{driver.status}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

/* =====================================================
   LIVE CHENNAI CITY MAP (100% FREE OPENSTREETMAP - NO API KEY!)
   ===================================================== */
export const CityMap = ({
  complaints = [],
  bins = [],
  selectedItem = null,
  onSelectItem = null,
  height = '460px'
}) => {
  // Chennai center coordinates [13.06, 80.24]
  const chennaiCenter = [13.06, 80.24];

  return (
    <div style={{ width: '100%', height, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
      <MapContainer center={chennaiCenter} zoom={12} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
        {/* OpenStreetMap Standard Free Tiles - NEVER requires any API key! */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              radius={isCritical ? 10 : 8}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9
              }}
              eventHandlers={{
                click: () => onSelectItem && onSelectItem({ type: 'bin', data: bin })
              }}
            >
              <Popup>
                <div style={{ padding: '4px', minWidth: '170px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1e293b' }}>
                    🏢 Smart Bin: {bin.code}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>{bin.address}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.8rem', color }}>
                    <span>{bin.fillLevel}% Full</span>
                    {isCritical && <span style={{ color: '#ef4444' }}>OVERFLOW</span>}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Reported Waste Spots */}
        {complaints.map((cmp) => {
          if (!cmp.location?.coordinates || cmp.status === 'Merged') return null;
          const [lon, lat] = cmp.location.coordinates;
          const isCollected = cmp.status === 'Collected';
          const isCritical = cmp.riskLevel === 'critical' || cmp.priority === 'critical';
          const pinColor = isCollected ? '#10b981' : isCritical ? '#ef4444' : '#5b50e5';

          return (
            <CircleMarker
              key={cmp._id}
              center={[lat, lon]}
              radius={isCritical ? 12 : 9}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: pinColor,
                fillOpacity: 0.95
              }}
              eventHandlers={{
                click: () => onSelectItem && onSelectItem({ type: 'complaint', data: cmp })
              }}
            >
              <Popup>
                <div style={{ padding: '4px', maxWidth: '220px' }}>
                  {cmp.photo && (
                    <img
                      src={cmp.photo}
                      alt="Waste capture"
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
                    />
                  )}
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b', marginBottom: '2px' }}>
                    📍 {cmp.areaName || cmp.bin?.area || 'Reported Spot'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '6px' }}>
                    {cmp.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <RiskBadge level={cmp.riskLevel} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>{cmp.status}</span>
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
   MAP PICKER FOR CITIZENS (100% FREE OPENSTREETMAP)
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
        radius={11}
        pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#5b50e5', fillOpacity: 0.95 }}
      >
        <Popup>
          <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>
            <strong>Selected Incident Location</strong>
            <br />
            Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
          </div>
        </Popup>
      </CircleMarker>
    );
  };

  return (
    <div style={{ width: '100%', height: '220px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

/* =====================================================
   PHOTO UPLOAD WITH CLEAN AI ANALYSIS PREVIEW
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
        drainageThreat: 'CRITICAL (Monsoon Flood Threat)',
        suggestedRisk: 'critical'
      });
    } else if (key === 'commercial') {
      setAnalysis({
        category: 'Market Vegetable Crates & Packaging',
        estimatedWeight: '120 kg',
        spillRadius: '6 meters',
        drainageThreat: 'Moderate',
        suggestedRisk: 'high'
      });
    } else if (key === 'footpath') {
      setAnalysis({
        category: 'Footpath Dump & Stray Animal Hazard',
        estimatedWeight: '50 kg',
        spillRadius: '2.5 meters',
        drainageThreat: 'Public Hygiene Hazard',
        suggestedRisk: 'high'
      });
    } else {
      setAnalysis({
        category: 'Municipal Smart Bin Overflow',
        estimatedWeight: '80-100 kg',
        spillRadius: '4 meters',
        drainageThreat: 'Moderate Overflow',
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
          drainageThreat: 'Pavement Obstruction',
          suggestedRisk: 'high'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
          📸 Incident Photograph
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose demo preset or upload</span>
      </div>

      {/* Preset demo photo selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
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
          🌊 Clogged Drain
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
          🚶 Footpath Dump
        </button>
      </div>

      {/* Photo frame */}
      <div className="waste-photo-thumb" style={{ height: '200px', marginBottom: '12px' }}>
        <img src={photo || samplePhotos.bin_overflow} alt="Incident capture" />
      </div>

      <label className="btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
        📁 Upload Custom Photo from Device
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>

      {/* AI Analysis preview */}
      {analysis && (
        <div style={{ marginTop: '12px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
              ✨ Automated Visual Analysis
            </span>
            <RiskBadge level={analysis.suggestedRisk} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div>Category: <strong>{analysis.category}</strong></div>
            <div>Est. Weight: <strong>{analysis.estimatedWeight}</strong></div>
            <div>Threat: <strong>{analysis.drainageThreat}</strong></div>
            <div>Spill Spread: <strong>{analysis.spillRadius}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
