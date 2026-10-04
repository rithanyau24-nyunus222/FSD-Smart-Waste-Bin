import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useAuth, apiFetch } from './api.jsx';

/* =====================================================
   NAVBAR COMPONENT
   ===================================================== */
export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar container">
        <Link to="/" className="brand-logo" onClick={() => setMenuOpen(false)}>
          <span className="brand-mascot" role="img" aria-label="bin">🗑️</span>
          <div className="brand-text">
            <span className="brand-title">SmartBin</span>
            <span className="brand-tagline">Keep Clean &amp; Smart</span>
          </div>
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Navigation Links */}
        <div className={`nav-menu ${menuOpen ? 'is-active' : ''}`}>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
              About
            </NavLink>

            {user?.role === 'citizen' && (
              <>
                <NavLink to="/report" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
                  Report Bin
                </NavLink>
                <NavLink to="/my-complaints" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
                  My Reports
                </NavLink>
              </>
            )}

            {user?.role === 'authority' && (
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
                Dashboard
              </NavLink>
            )}

            {user?.role === 'collector' && (
              <NavLink to="/tasks" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMenuOpen(false)}>
                My Tasks
              </NavLink>
            )}
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="notification-center">
                  <button
                    className="notif-bell-btn"
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      if (!notifOpen && unreadCount > 0) {
                        handleMarkAsRead();
                      }
                    }}
                    aria-label="Notifications"
                  >
                    🔔
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                  </button>

                  {notifOpen && (
                    <div className="notif-dropdown">
                      <div className="notif-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                          <button className="text-btn" onClick={handleMarkAsRead}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="notif-list">
                        {notifications.length === 0 ? (
                          <p className="empty-notif">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                              <p className="notif-msg">{n.message}</p>
                              <span className="notif-time">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown / Profile Section */}
                <div className="user-profile-menu">
                  <div className="user-info-chip">
                    <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                    <div className="user-details">
                      <span className="user-name">{user.name}</span>
                      <span className={`user-role-badge role-${user.role}`}>{user.role}</span>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="btn-logout" title="Sign out">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-nav-buttons">
                <Link to="/login" className="btn-secondary" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn-primary" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

/* =====================================================
   FOOTER COMPONENT
   ===================================================== */
export const Footer = () => {
  const { isDemoMode, resetData } = useAuth();
  return (
    <footer className="footer-wrapper">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <span>🗑️</span>
            <h3>SmartBin System</h3>
          </div>
          <p className="footer-tagline">Keep It Clean, Keep It Smart.</p>
          <p className="footer-sub">Full Stack Development Project for Urban Sanitation Management</p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: isDemoMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: isDemoMode ? '#059669' : '#2563EB',
              fontSize: '0.78rem',
              fontWeight: '600'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDemoMode ? '#10B981' : '#3B82F6' }}></span>
              {isDemoMode ? 'Live Interactive Mode (Client DB)' : 'Connected to Backend API'}
            </span>
            {isDemoMode && (
              <button
                type="button"
                onClick={resetData}
                style={{
                  background: 'none',
                  border: '1px solid #D1D5DB',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#4B5563'
                }}
                title="Restore all 12 initial bins and 18 demo complaints"
              >
                🔄 Reset Demo Data
              </button>
            )}
          </div>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h5>Quick Links</h5>
            <Link to="/">Home</Link>
            <Link to="/about">About &amp; Scope</Link>
            <Link to="/report">Report an Issue</Link>
          </div>
          <div className="footer-col">
            <h5>Role Access</h5>
            <Link to="/login">Citizen Access</Link>
            <Link to="/login">Authority Portal</Link>
            <Link to="/login">Collector Queue</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Smart Waste Bin Monitoring &amp; Collection System. Built with MERN Stack.</p>
      </div>
    </footer>
  );
};

/* =====================================================
   FLOATING DECOR (WHIMSICAL)
   ===================================================== */
export const FloatingDecor = () => {
  return (
    <div className="floating-decor-layer" aria-hidden="true">
      <div className="decor-item item-1">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#1F7A5A" opacity="0.35">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
        </svg>
      </div>
      <div className="decor-item item-2">
        <span style={{ fontSize: '28px', opacity: 0.35 }}>🫧</span>
      </div>
      <div className="decor-item item-3">
        <span style={{ fontSize: '32px', opacity: 0.3 }}>🌱</span>
      </div>
      <div className="decor-item item-4">
        <span style={{ fontSize: '26px', opacity: 0.25 }}>🗑️</span>
      </div>
      <div className="decor-item item-5">
        <span style={{ fontSize: '24px', opacity: 0.35 }}>🫧</span>
      </div>
      <div className="decor-item item-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#1E4FB3" opacity="0.25">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div className="decor-item item-7">
        <span style={{ fontSize: '30px', opacity: 0.3 }}>🍃</span>
      </div>
      <div className="decor-item item-8">
        <span style={{ fontSize: '34px', opacity: 0.2 }}>🫧</span>
      </div>
    </div>
  );
};

/* =====================================================
   STATUS & PRIORITY BADGES
   ===================================================== */
export const StatusBadge = ({ status }) => {
  const norm = (status || 'Pending').toLowerCase().replace(/\s+/g, '-');
  return <span className={`status-badge badge-${norm}`}>{status}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const norm = (priority || 'medium').toLowerCase();
  return <span className={`priority-badge priority-${norm}`}>{norm.toUpperCase()}</span>;
};

/* =====================================================
   VERTICAL TIMELINE COMPONENT
   ===================================================== */
export const Timeline = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-muted">No timeline records available.</p>;
  }

  return (
    <div className="timeline-container">
      {history.map((step, idx) => (
        <div key={idx} className="timeline-item">
          <div className="timeline-marker">
            <span className="marker-dot"></span>
            {idx < history.length - 1 && <span className="marker-line"></span>}
          </div>
          <div className="timeline-content">
            <div className="timeline-header">
              <StatusBadge status={step.status} />
              <span className="timeline-date">
                {new Date(step.at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {step.by && (
              <p className="timeline-actor">
                <strong>By:</strong> {step.by.name} ({step.by.role})
              </p>
            )}
            {step.note && <p className="timeline-note">{step.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

/* =====================================================
   PHOTO UPLOAD (WITH BROWSER CANVAS COMPRESSION)
   ===================================================== */
export const PhotoUpload = ({ onPhotoSelected }) => {
  const [preview, setPreview] = useState(null);
  const [sizeInfo, setSizeInfo] = useState('');
  const fileInputRef = useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 1024;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas compression failed'));
                return;
              }
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      const kbSize = Math.round(compressed.size / 1024);
      setSizeInfo(`Compressed: ~${kbSize} KB`);

      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);
      onPhotoSelected(compressed);
    } catch (err) {
      console.error('Image compression error:', err);
      alert('Could not compress image. Please select a valid JPEG/PNG photo.');
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setSizeInfo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onPhotoSelected(null);
  };

  return (
    <div className="photo-upload-container">
      <label className="upload-label">
        <span className="label-text">Take / Upload Bin Photo</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden-file-input"
        />
        {!preview && (
          <div className="upload-dropzone">
            <span className="upload-icon">📷</span>
            <p className="upload-prompt">Click or tap to capture/select a photo</p>
            <span className="upload-help">Automatically compressed in browser (&lt; 150 KB)</span>
          </div>
        )}
      </label>

      {preview && (
        <div className="photo-preview-box">
          <img src={preview} alt="Compressed preview" className="photo-preview-img" />
          <div className="preview-overlay">
            <span className="size-badge">{sizeInfo}</span>
            <button type="button" onClick={handleRemove} className="btn-remove-photo">
              ✕ Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* =====================================================
   MAP PICKER COMPONENT (LEAFLET WITH CIRCLE MARKER)
   ===================================================== */
const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    }
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);

  return position ? (
    <CircleMarker
      center={position}
      radius={12}
      pathOptions={{
        color: '#1B0A4F',
        fillColor: '#D6455D',
        fillOpacity: 0.9,
        weight: 3
      }}
    >
      <Popup>
        <strong>Selected Location</strong>
        <br />
        {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </Popup>
    </CircleMarker>
  ) : null;
};

export const MapPicker = ({ lat, lng, onLocationChange }) => {
  const defaultPos = [lat || 13.0827, lng || 80.2707];
  const [pos, setPos] = useState([lat || 13.0827, lng || 80.2707]);
  const [locating, setLocating] = useState(false);

  const handleSetPosition = (newPos) => {
    setPos(newPos);
    onLocationChange(newPos[0], newPos[1]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const userPos = [position.coords.latitude, position.coords.longitude];
        handleSetPosition(userPos);
      },
      (error) => {
        setLocating(false);
        alert(`Location error: ${error.message}. Please tap on the map to set location.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="map-picker-box">
      <div className="map-picker-header">
        <span className="map-hint">Tap on the map to pinpoint the exact location</span>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="btn-locate"
        >
          {locating ? 'Locating...' : '📍 Use My Location'}
        </button>
      </div>

      <div className="map-container-frame">
        <MapContainer
          center={pos}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '320px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={pos} setPosition={handleSetPosition} />
        </MapContainer>
      </div>

      <div className="coord-bar">
        <span>Lat: {pos[0].toFixed(5)}</span>
        <span>Lng: {pos[1].toFixed(5)}</span>
      </div>
    </div>
  );
};

/* =====================================================
   MAP VIEW COMPONENT (SHOWS BINS & COMPLAINTS)
   ===================================================== */
export const MapView = ({ bins = [], complaints = [], height = '450px' }) => {
  const chennaiCenter = [13.0418, 80.2341];

  const getBinColor = (fill) => {
    if (fill > 80) return '#D6455D'; // Red
    if (fill > 50) return '#E0A100'; // Amber
    return '#1F7A5A'; // Green
  };

  return (
    <div className="map-view-wrapper" style={{ height }}>
      <MapContainer
        center={chennaiCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '16px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render Bins */}
        {bins.map((bin) => {
          if (!bin.location?.coordinates) return null;
          const [lng, lat] = bin.location.coordinates;
          const color = getBinColor(bin.fillLevel);

          return (
            <CircleMarker
              key={bin._id}
              center={[lat, lng]}
              radius={10}
              pathOptions={{
                color: '#FFFFFF',
                fillColor: color,
                fillOpacity: 0.9,
                weight: 2
              }}
            >
              <Popup>
                <div className="popup-bin">
                  <strong>🗑️ {bin.code}</strong>
                  <p className="popup-area">{bin.area}</p>
                  <p className="popup-address">{bin.address}</p>
                  <div className="fill-progress-box">
                    <div className="fill-progress-label">
                      <span>Fill Level:</span>
                      <strong>{bin.fillLevel}%</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${bin.fillLevel}%`, backgroundColor: color }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Render Complaints */}
        {complaints.map((c) => {
          if (!c.location?.coordinates) return null;
          const [lng, lat] = c.location.coordinates;
          return (
            <CircleMarker
              key={c._id}
              center={[lat, lng]}
              radius={6}
              pathOptions={{
                color: '#1B0A4F',
                fillColor: '#1E4FB3',
                fillOpacity: 0.8,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="popup-complaint">
                  <strong>⚠️ Incident Report</strong>
                  <p>{c.description}</p>
                  <div className="popup-meta">
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
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
