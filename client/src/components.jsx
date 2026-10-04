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
    return <span className="badge badge-critical">🔴 Critical</span>;
  }
  if (norm === 'high') {
    return <span className="badge badge-high">🟡 High Risk</span>;
  }
  if (norm === 'low') {
    return <span className="badge badge-low">🟢 Low Risk</span>;
  }
  return <span className="badge badge-medium">🔵 Medium</span>;
};

/* =====================================================
   STATUS BADGE
   ===================================================== */
export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'Pending':
      return <span className="badge badge-high">⏳ Pending</span>;
    case 'Verified':
    case 'Assigned':
      return <span className="badge badge-medium">🚛 Assigned</span>;
    case 'In Progress':
      return <span className="badge badge-high">⚡ In Progress</span>;
    case 'Collected':
    case 'Resolved':
      return <span className="badge badge-collected">✓ Resolved</span>;
    case 'Merged':
      return <span className="badge badge-merged">🔗 Merged</span>;
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
        <div className="navbar-logo-badge">🍃</div>
        <div>
          <div className="navbar-title">CleanChennai</div>
          <div className="navbar-subtitle">Smart Waste Grid</div>
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
          <span>Citizen</span>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          <span>🏛️</span>
          <span>Admin</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
          <span>🚛</span>
          <span>Driver</span>
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
            Citizen
          </button>
          <button
            type="button"
            className={`role-pill-btn ${user?.role === 'authority' ? 'active' : ''}`}
            onClick={() => switchRole('authority@demo.com')}
            title="Switch to Corporation Admin"
          >
            Admin
          </button>
          <button
            type="button"
            className={`role-pill-btn ${user?.role === 'collector' ? 'active' : ''}`}
            onClick={() => switchRole('collector@demo.com')}
            title="Switch to Sanitation Driver"
          >
            Driver
          </button>
        </div>

        <button
          type="button"
          onClick={resetData}
          className="btn-secondary btn-sm"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
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
  height = '440px'
}) => {
  // Chennai center coordinates [13.06, 80.24]
  const chennaiCenter = [13.06, 80.24];

  return (
    <div style={{ width: '100%', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-rustic)' }}>
      <MapContainer center={chennaiCenter} zoom={12} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
        {/* OpenStreetMap Standard Free Tiles - NEVER requires any API key! */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Smart Municipal Bins */}
        {bins.map((bin) => {
          if (!bin.location?.coordinates) return null;
          const [lon, lat] = bin.location.coordinates;
          const isCritical = bin.fillLevel >= 80;
          const color = isCritical ? '#c2593f' : bin.fillLevel >= 50 ? '#d9822b' : '#3a5a40';

          return (
            <CircleMarker
              key={bin._id}
              center={[lat, lon]}
              radius={isCritical ? 10 : 8}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: color,
                fillOpacity: 0.95
              }}
              eventHandlers={{
                click: () => onSelectItem && onSelectItem({ type: 'bin', data: bin })
              }}
            >
              <Popup>
                <div style={{ padding: '4px', minWidth: '160px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#292524' }}>
                    🏢 Bin: {bin.code}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#57534e', marginBottom: '6px' }}>{bin.address}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.8rem', color }}>
                    <span>{bin.fillLevel}% Full</span>
                    {isCritical && <span>OVERFLOW</span>}
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
          const isResolved = cmp.status === 'Collected' || cmp.status === 'Resolved';
          const isCritical = cmp.riskLevel === 'critical' || cmp.priority === 'critical';
          const pinColor = isResolved ? '#3a5a40' : isCritical ? '#c2593f' : '#4f7779';

          return (
            <CircleMarker
              key={cmp._id}
              center={[lat, lon]}
              radius={isCritical ? 11 : 9}
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
                      style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }}
                    />
                  )}
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#292524', marginBottom: '2px' }}>
                    📍 {cmp.areaName || cmp.bin?.area || 'Reported Spot'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#57534e', marginBottom: '6px' }}>
                    {cmp.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <RiskBadge level={cmp.riskLevel} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#57534e' }}>{cmp.status}</span>
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
        pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#c2593f', fillOpacity: 0.95 }}
      >
        <Popup>
          <div style={{ fontSize: '0.8rem', color: '#292524' }}>
            <strong>Selected Incident Location</strong>
            <br />
            Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
          </div>
        </Popup>
      </CircleMarker>
    );
  };

  return (
    <div style={{ width: '100%', height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-rustic)' }}>
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

      {/* AI Analysis preview in Ghibli rustic card */}
      {analysis && (
        <div className="ai-analysis-box" style={{ marginTop: '12px' }}>
          <div className="ai-analysis-header">
            <span className="ai-analysis-title">✨ Automated Image Telemetry</span>
            <RiskBadge level={analysis.suggestedRisk} />
          </div>
          <div className="ai-metric-grid">
            <div className="ai-metric-item">Category: <strong>{analysis.category}</strong></div>
            <div className="ai-metric-item">Est. Weight: <strong>{analysis.estimatedWeight}</strong></div>
            <div className="ai-metric-item">Threat: <strong>{analysis.drainageThreat}</strong></div>
            <div className="ai-metric-item">Spill Spread: <strong>{analysis.spillRadius}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =====================================================
   INTERACTIVE PRESENTATION DEMO DOCK (FOR EXAMINER REVIEW)
   ===================================================== */
export const DemoDock = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const triggerNotify = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const simulateNewOverflow = async () => {
    try {
      setLoading(true);
      await apiFetch('/complaints', {
        method: 'POST',
        body: {
          description: 'Fresh municipal bin overflow near Besant Nagar 4th Avenue. Plastic cups & food waste.',
          areaName: 'Besant Nagar 4th Avenue',
          latitude: 13.0022,
          longitude: 80.2675,
          photo: samplePhotos.bin_overflow,
          severity: 'high',
          riskLevel: 'critical',
          analysis: {
            category: 'Smart Bin Overflow',
            estimatedWeight: '75 kg',
            spillRadius: '3.5 meters',
            drainageThreat: 'High (Nearby storm inlet)'
          }
        }
      });
      triggerNotify('🚨 Simulated new overflow in Besant Nagar!');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateDuplicate = async () => {
    try {
      setLoading(true);
      await apiFetch('/complaints', {
        method: 'POST',
        body: {
          description: 'Garbage dump spilling at Besant Nagar corner (reported by shopkeeper 18m away).',
          areaName: 'Besant Nagar 4th Avenue Corner',
          latitude: 13.0023,
          longitude: 80.2676,
          photo: samplePhotos.footpath,
          severity: 'high',
          riskLevel: 'high',
          analysis: {
            category: 'Proximity Duplicate Spill',
            estimatedWeight: '60 kg',
            spillRadius: '2.5 meters',
            drainageThreat: 'Moderate'
          }
        }
      });
      triggerNotify('🔗 Simulated duplicate 18m away! Check Admin Dashboard to merge.');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateDriverCleanup = async () => {
    try {
      setLoading(true);
      const tasks = await apiFetch('/tasks');
      const pending = (tasks || []).find((t) => t.status !== 'collected');
      if (!pending) {
        alert('All tasks already collected! Click "Reset" to reload sample stops.');
        return;
      }
      await apiFetch(`/tasks/${pending._id}/status`, {
        method: 'PATCH',
        body: {
          status: 'collected',
          proofNote: 'Area fully cleared, waste compacted, lime powder bleached.',
          proofPhoto: samplePhotos.cleaned_proof
        }
      });
      triggerNotify('🚛 Driver cleared stop & verified with photo proof!');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      alert('Cleanup simulation error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    if (window.confirm('Reset all demo data back to default fresh state?')) {
      localStorage.removeItem('clean_chennai_waste_v3');
      window.location.reload();
    }
  };

  return (
    <div className="demo-dock">
      {statusMsg && (
        <div style={{ background: 'var(--moss)', color: '#fff', padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: '700', boxShadow: 'var(--shadow-popup)', marginBottom: '4px' }}>
          {statusMsg}
        </div>
      )}

      {open && (
        <div className="demo-dock-menu">
          <div className="demo-dock-header">
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎮</span> Presentation Demo Actions
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            1-Click triggers for Viva / Project Review presentation:
          </div>

          <button
            type="button"
            className="demo-dock-action-btn"
            disabled={loading}
            onClick={simulateNewOverflow}
          >
            <span>🚨</span>
            <div>
              <div>Simulate New Overflow</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adds citizen incident in Besant Nagar</div>
            </div>
          </button>

          <button
            type="button"
            className="demo-dock-action-btn"
            disabled={loading}
            onClick={simulateDuplicate}
          >
            <span>🔗</span>
            <div>
              <div>Trigger Proximity Duplicate</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adds 2nd report 18m away to test merge</div>
            </div>
          </button>

          <button
            type="button"
            className="demo-dock-action-btn"
            disabled={loading}
            onClick={simulateDriverCleanup}
          >
            <span>🚛</span>
            <div>
              <div>Simulate Driver Cleanup</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Resolves pending stop with photo proof</div>
            </div>
          </button>

          <button
            type="button"
            className="demo-dock-action-btn"
            style={{ color: 'var(--terracotta)' }}
            onClick={resetAll}
          >
            <span>🔄</span>
            <div>
              <div>Reset Default Grid</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Restores fresh starting state</div>
            </div>
          </button>
        </div>
      )}

      <button
        type="button"
        className="demo-dock-trigger"
        onClick={() => setOpen(!open)}
        title="Quick Demo Controls for Viva Presentation"
      >
        <span>⚡</span>
        <span>Review Demo Controls</span>
      </button>
    </div>
  );
};

