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
   CLEAN MINIMALIST TOP NAVBAR
   ===================================================== */
export const Navbar = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const switchRole = async (email) => {
    try {
      await login(email, 'Demo@123');
      if (email.includes('authority')) navigate('/dashboard');
      else if (email.includes('collector')) navigate('/tasks');
      else navigate('/report');
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const resetData = () => {
    if (window.confirm('Reset demo database to fresh initial state?')) {
      localStorage.removeItem('clean_chennai_waste_v3');
      window.location.reload();
    }
  };

  return (
    <header className="top-navbar">
      {/* Brand */}
      <NavLink to="/" className="navbar-brand">
        <div className="navbar-logo-badge">🗑️</div>
        <div>
          <div className="navbar-title">CleanChennai</div>
          <div className="navbar-subtitle">Smart Municipal Grid</div>
        </div>
      </NavLink>

      {/* Mode Tabs (The 3 Core Steps + Overview) */}
      <nav className="navbar-tabs">
        <NavLink to="/" end className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          <span>📊</span>
          <span>Overview</span>
        </NavLink>

        <NavLink to="/report" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          <span>📸</span>
          <span>1. Report Waste</span>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          <span>🏛️</span>
          <span>2. Admin &amp; Duplicates</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          <span>🚛</span>
          <span>3. Driver Tasks</span>
        </NavLink>
      </nav>

      {/* Right Controls: Quick Role Switcher */}
      <div className="navbar-right">
        <div className="role-pill-group">
          <button
            type="button"
            className={`role-pill-btn ${user?.role === 'citizen' ? 'active' : ''}`}
            onClick={() => switchRole('citizen@demo.com')}
            title="Switch to Citizen Persona"
          >
            👤 Citizen
          </button>
          <button
            type="button"
            className={`role-pill-btn ${user?.role === 'authority' ? 'active' : ''}`}
            onClick={() => switchRole('authority@demo.com')}
            title="Switch to Corporation Admin"
          >
            🏛️ Admin
          </button>
          <button
            type="button"
            className={`role-pill-btn ${user?.role === 'collector' ? 'active' : ''}`}
            onClick={() => switchRole('collector@demo.com')}
            title="Switch to Sanitation Driver"
          >
            🚛 Driver
          </button>
        </div>

        <button
          type="button"
          onClick={resetData}
          className="btn-secondary btn-sm"
          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          title="Reset Seed Data"
        >
          🔄 Reset
        </button>
      </div>
    </header>
  );
};

// Aliases for backwards compatibility if needed
export const Sidebar = () => null;
export const Header = () => null;
export const RightPanel = () => null;


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
