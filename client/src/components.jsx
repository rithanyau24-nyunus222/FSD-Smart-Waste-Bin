import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useAuth, apiFetch } from './api.jsx';

export const FloatingDecor = () => null;

/* ==========================================================================
   NAVBAR COMPONENT WITH QUICK PERSONA SWITCHER
   ========================================================================== */
export const Navbar = () => {
  const { user, login, logout, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
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
      setPersonaOpen(false);
      setMenuOpen(false);
      if (email.includes('authority')) navigate('/dashboard');
      else if (email.includes('collector')) navigate('/tasks');
      else navigate('/report');
    } catch (e) {
      console.error('Persona switch error:', e);
    }
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar container">
        <Link to="/" className="brand-logo" onClick={() => setMenuOpen(false)}>
          <div className="brand-icon-wrap">
            <span>🗑️</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-title">SmartBin</span>
              <span className="brand-badge">Command OS</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
              GCC Smart Waste Governance
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className={`nav-links ${menuOpen ? 'is-active' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
            Overview
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
            Architecture
          </NavLink>

          {user?.role === 'citizen' && (
            <>
              <NavLink to="/report" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
                Report Overflow
              </NavLink>
              <NavLink to="/my-complaints" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
                Track Reports
              </NavLink>
            </>
          )}

          {user?.role === 'authority' && (
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
              Command Center
            </NavLink>
          )}

          {user?.role === 'collector' && (
            <NavLink to="/tasks" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
              Collection Route
            </NavLink>
          )}
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Quick Demo Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setPersonaOpen(!personaOpen)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}
              title="Switch demo persona instantly"
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></span>
              Persona: <strong>{user ? user.role : 'Guest'}</strong> ▾
            </button>

            {personaOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '240px',
                  background: '#0e1524',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '8px',
                  zIndex: 1100
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  1-Click Role Switch
                </div>
                <button
                  type="button"
                  onClick={() => switchPersona('citizen@demo.com')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <span>👤 Priya (Citizen)</span>
                  <span className="role-badge citizen">Citizen</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchPersona('authority@demo.com')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <span>🏛️ Officer Karthik</span>
                  <span className="role-badge authority">Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchPersona('collector@demo.com')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <span>🚛 Murugan (Driver)</span>
                  <span className="role-badge collector">Driver</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Center */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="notif-bell-btn"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen && unreadCount > 0) handleMarkAsRead();
                }}
                aria-label="Notifications"
              >
                <span>🔔</span>
                {unreadCount > 0 && <span className="notif-count-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Telemetry &amp; Alerts</h4>
                    {unreadCount > 0 && (
                      <button type="button" onClick={handleMarkAsRead} style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                        Mark read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '10px 0' }}>All clear, no active alerts</p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div key={n._id} className={`notif-item ${n.read ? 'read' : ''}`}>
                        <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#fff', marginBottom: '2px' }}>{n.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate('/');
              }}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
              Launch OS
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

/* ==========================================================================
   FOOTER COMPONENT
   ========================================================================== */
export const Footer = () => {
  const { isDemoMode, resetData } = useAuth();
  return (
    <footer className="footer-wrapper">
      <div className="container footer-content">
        <div style={{ maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🗑️</span>
            <strong style={{ color: '#fff', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
              SmartBin Command System
            </strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
            Greater Chennai Corporation (GCC) Autonomous Waste Telemetry &amp; Field Routing Platform.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: isDemoMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                color: isDemoMode ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                border: `1px solid ${isDemoMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              <span className={`radar-pulse ${isDemoMode ? 'green' : 'cyan'}`}></span>
              {isDemoMode ? 'Live Interactive Mode (Client DB)' : 'Connected to GCC API Node'}
            </span>
            {isDemoMode && (
              <button
                type="button"
                onClick={resetData}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  cursor: 'pointer'
                }}
                title="Restore all 12 smart bins and 18 demo incidents"
              >
                🔄 Reset Demo Data
              </button>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>MERN Stack College Full Stack Development Project</div>
          <div style={{ marginTop: '4px' }}>
            Demo Passwords: <code style={{ color: 'var(--accent-cyan)' }}>Demo@123</code>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ==========================================================================
   CITY GIS MAP COMPONENT (DARK TILES + RADAR CIRCLES)
   ========================================================================== */
const MapFlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { animate: true, duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

export const CityMap = ({ bins = [], complaints = [], selectedItem = null, onSelectBin, height = '100%' }) => {
  // Center of Chennai
  const defaultCenter = [13.0418, 80.2450];
  const activeCenter = selectedItem?.location?.coordinates
    ? [selectedItem.location.coordinates[1], selectedItem.location.coordinates[0]]
    : defaultCenter;

  const getMarkerColor = (fill) => {
    if (fill >= 80) return '#F43F5E'; // Red/Rose
    if (fill >= 50) return '#F59E0B'; // Amber
    return '#10B981'; // Emerald
  };

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%', background: '#070b13' }}
        zoomControl={false}
      >
        {/* Dark Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapFlyTo center={activeCenter} zoom={selectedItem ? 15 : 12} />

        {/* Smart Bin Circle Markers */}
        {bins.map((bin) => {
          if (!bin.location?.coordinates) return null;
          const [lng, lat] = bin.location.coordinates;
          const isSelected = selectedItem?._id === bin._id;
          const color = getMarkerColor(bin.fillLevel);
          const isCritical = bin.fillLevel >= 80;

          return (
            <React.Fragment key={bin._id}>
              {/* Outer pulsing ring for critical bins */}
              {isCritical && (
                <CircleMarker
                  center={[lat, lng]}
                  radius={20}
                  pathOptions={{
                    color: '#F43F5E',
                    fillColor: '#F43F5E',
                    fillOpacity: 0.15,
                    weight: 1
                  }}
                />
              )}

              <CircleMarker
                center={[lat, lng]}
                radius={isSelected ? 13 : isCritical ? 10 : 8}
                pathOptions={{
                  color: isSelected ? '#ffffff' : color,
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: isSelected ? 3 : 2
                }}
                eventHandlers={{
                  click: () => onSelectBin && onSelectBin(bin)
                }}
              >
                <Popup>
                  <div style={{ padding: '6px', minWidth: '180px', color: '#1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{bin.code}</strong>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: color,
                          color: '#fff'
                        }}
                      >
                        {bin.fillLevel}% FILL
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '8px' }}>
                      {bin.address} ({bin.area})
                    </div>
                    <div className="fill-meter-container" style={{ height: '6px', background: '#e2e8f0', marginBottom: '8px' }}>
                      <div className="fill-meter-fill" style={{ width: `${bin.fillLevel}%`, background: color }}></div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Last Cleared: {bin.lastCollectedAt ? new Date(bin.lastCollectedAt).toLocaleDateString() : 'Active'}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Citizen Reported Overflow Pins */}
        {complaints.map((cmp) => {
          if (!cmp.location?.coordinates || cmp.status === 'Collected') return null;
          const [lng, lat] = cmp.location.coordinates;
          const isSelected = selectedItem?._id === cmp._id;

          return (
            <CircleMarker
              key={cmp._id}
              center={[lat, lng]}
              radius={isSelected ? 11 : 7}
              pathOptions={{
                color: '#fff',
                fillColor: '#06B6D4',
                fillOpacity: 0.85,
                weight: 2
              }}
              eventHandlers={{
                click: () => onSelectBin && onSelectBin(cmp)
              }}
            >
              <Popup>
                <div style={{ padding: '6px', color: '#1e293b' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0891b2' }}>🚨 Citizen Incident</div>
                  <div style={{ fontSize: '0.8rem', margin: '4px 0' }}>"{cmp.description}"</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Status: {cmp.status}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

/* ==========================================================================
   MAP PICKER COMPONENT (FOR CITIZEN PIN DROPS)
   ========================================================================== */
const MapClickDetector = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

export const MapPicker = ({ lat, lng, onLocationChange }) => {
  const [pos, setPos] = useState([lat || 13.0827, lng || 80.2707]);
  const [locating, setLocating] = useState(false);

  const handlePick = (newLat, newLng) => {
    setPos([newLat, newLng]);
    onLocationChange(newLat, newLng);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handlePick(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        console.warn('GPS error, using fallback:', err.message);
        setLocating(false);
        alert('Could not retrieve GPS coordinates. Please click on the map to pin.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          Click anywhere on the map or use GPS to pin location:
        </span>
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={locating}
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
        >
          {locating ? '📡 Locating...' : '📍 Auto-Detect GPS'}
        </button>
      </div>

      <div style={{ height: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <MapContainer center={pos} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapClickDetector onPick={handlePick} />
          <CircleMarker center={pos} radius={10} pathOptions={{ color: '#fff', fillColor: '#06B6D4', fillOpacity: 0.9, weight: 2 }} />
        </MapContainer>
      </div>
      <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Selected GPS: <code style={{ color: 'var(--accent-cyan)' }}>{pos[0].toFixed(5)}, {pos[1].toFixed(5)}</code>
      </div>
    </div>
  );
};

/* ==========================================================================
   PHOTO UPLOAD COMPONENT (COMPRESSION IN BROWSER)
   ========================================================================== */
export const PhotoUpload = ({ onPhotoSelected }) => {
  const [preview, setPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [sizeInfo, setSizeInfo] = useState('');
  const fileInputRef = useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
                type: 'image/webp'
              });
              resolve(compressedFile);
            },
            'image/webp',
            0.75
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompressing(true);
    try {
      const originalKB = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      const compressedKB = Math.round(compressed.size / 1024);

      setSizeInfo(`${originalKB} KB → ${compressedKB} KB (-${Math.round((1 - compressedKB / originalKB) * 100)}%)`);
      setPreview(URL.createObjectURL(compressed));
      onPhotoSelected(compressed);
    } catch (err) {
      console.error('Compression error:', err);
      onPhotoSelected(file);
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.02)',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📷</span>
          <div style={{ fontWeight: '600', color: '#fff' }}>
            {compressing ? 'Optimizing photo...' : 'Click or Tap to Upload Photo'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            In-browser WebP compression (&lt; 150 KB)
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <img src={preview} alt="Bin overflow preview" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>⚡ {sizeInfo}</span>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onPhotoSelected(null);
              }}
              style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', fontWeight: '600' }}
            >
              ✕ Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   PREDICTIVE OVERFLOW GAUGE
   ========================================================================== */
export const PredictiveGauge = ({ fillLevel = 50 }) => {
  // Compute estimated time to overflow assuming ~2.2% fill per hour
  const remaining = Math.max(0, 100 - fillLevel);
  const minutesLeft = Math.round((remaining / 2.2) * 60);
  const hoursLeft = (minutesLeft / 60).toFixed(1);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Overflow Forecast</span>
          <span style={{ fontWeight: '700', color: fillLevel >= 80 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
            {fillLevel >= 95 ? 'CRITICAL SPILL' : `~${hoursLeft}h (${minutesLeft}m)`}
          </span>
        </div>
        <div className="fill-meter-container" style={{ height: '4px' }}>
          <div
            className="fill-meter-fill"
            style={{
              width: `${fillLevel}%`,
              background: fillLevel >= 80 ? 'var(--accent-rose)' : fillLevel >= 50 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
