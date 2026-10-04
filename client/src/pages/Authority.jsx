import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Logo, StatusBadge, Alerts, BackToHomeButton, CHENNAI_AREAS } from '../components.jsx';
import api from '../api.js';

function getBinMarkerColor(fillLevel) {
  if (fillLevel > 80) return 'var(--pink)';
  if (fillLevel >= 50) return 'var(--blue)';
  return 'var(--sprout)';
}

function MapAddBinHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function Authority() {
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'complaints' | 'photos' | 'bins' | 'alerts'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('All areas');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('This week');
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // -------------------------------------------------------------
  // DASHBOARD STATE
  // -------------------------------------------------------------
  const [stats, setStats] = useState(null);
  const [dashboardBins, setDashboardBins] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [galleryTab, setGalleryTab] = useState('before'); // 'before' | 'after'

  // -------------------------------------------------------------
  // COMPLAINTS STATE
  // -------------------------------------------------------------
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [collectors, setCollectors] = useState([]);

  // Modals
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifySeverity, setVerifySeverity] = useState('medium');
  const [verifyPriority, setVerifyPriority] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // -------------------------------------------------------------
  // PHOTOS GALLERY STATE
  // -------------------------------------------------------------
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [photoAreaFilter, setPhotoAreaFilter] = useState('');
  const [photoKindFilter, setPhotoKindFilter] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // -------------------------------------------------------------
  // BINS TAB STATE
  // -------------------------------------------------------------
  const [binsList, setBinsList] = useState([]);
  const [newBinCode, setNewBinCode] = useState('');
  const [newBinArea, setNewBinArea] = useState('');
  const [newBinLocation, setNewBinLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [addBinSuccess, setAddBinSuccess] = useState('');
  const [addBinError, setAddBinError] = useState('');
  const [addingBin, setAddingBin] = useState(false);

  // Fetch unread count for sidebar
  const loadUnreadCount = async () => {
    try {
      const data = await api.get('/notifications');
      if (data && data.unreadCount !== undefined) {
        setUnreadAlertsCount(data.unreadCount);
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

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const [statsData, binsData, complaintsData] = await Promise.all([
        api.get('/stats'),
        api.get('/bins'),
        api.get('/complaints')
      ]);

      setStats(statsData);
      setDashboardBins(binsData || []);

      const open = (complaintsData?.items || [])
        .filter((c) => !['Collected', 'Rejected'].includes(c.status))
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 6);
      setPriorityQueue(open);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Load Complaints List
  const loadComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (areaFilter) params.set('area', areaFilter);

      const [res, colList] = await Promise.all([
        api.get(`/complaints?${params.toString()}`),
        api.get('/users?role=collector')
      ]);

      setComplaints(res.items || []);
      setCollectors(colList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Load Photos Gallery
  const loadGallery = async () => {
    try {
      setLoadingPhotos(true);
      const params = new URLSearchParams();
      if (photoAreaFilter) params.set('area', photoAreaFilter);
      if (photoKindFilter) params.set('kind', photoKindFilter);

      const data = await api.get(`/photos-gallery?${params.toString()}`);
      setGalleryPhotos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Load Bins List
  const loadBins = async () => {
    try {
      const data = await api.get('/bins');
      setBinsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'complaints') {
      loadComplaints();
    } else if (tab === 'photos') {
      loadGallery();
    } else if (tab === 'bins') {
      loadBins();
    }
  }, [tab, statusFilter, areaFilter, photoAreaFilter, photoKindFilter]);

  // Actions
  const handleVerify = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);

    try {
      const payload = {
        action: 'verify',
        severity: verifySeverity,
        priority: verifyPriority ? Number(verifyPriority) : undefined
      };
      await api.patch(`/complaints/${verifyModal._id}`, payload);
      setVerifyModal(null);
      if (tab === 'dashboard') loadDashboard();
      else loadComplaints();
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      setActionError(err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!rejectReason.trim()) {
      setActionError('Reason is required to reject a complaint');
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/complaints/${rejectModal._id}`, {
        action: 'reject',
        reason: rejectReason.trim()
      });
      setRejectModal(null);
      setRejectReason('');
      if (tab === 'dashboard') loadDashboard();
      else loadComplaints();
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      setActionError(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!selectedCollectorId) {
      setActionError('Please select a collector to assign');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/tasks', {
        complaintId: assignModal._id,
        collectorId: selectedCollectorId
      });
      setAssignModal(null);
      setSelectedCollectorId('');
      if (tab === 'dashboard') loadDashboard();
      else loadComplaints();
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      setActionError(err.message || 'Task assignment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateFill = async (binId) => {
    try {
      await api.patch(`/bins/${binId}/simulate`);
      loadBins();
    } catch (err) {
      alert('Could not simulate fill level: ' + err.message);
    }
  };

  const handleAddBin = async (e) => {
    e.preventDefault();
    setAddBinError('');
    setAddBinSuccess('');

    if (!newBinCode.trim() || !newBinArea.trim()) {
      setAddBinError('Bin code and area name are required');
      return;
    }

    setAddingBin(true);
    try {
      await api.post('/bins', {
        code: newBinCode.trim(),
        area: newBinArea.trim(),
        lat: newBinLocation.lat,
        lng: newBinLocation.lng
      });
      setAddBinSuccess(`Bin ${newBinCode.toUpperCase()} added successfully!`);
      setNewBinCode('');
      setNewBinArea('');
      loadBins();
    } catch (err) {
      setAddBinError(err.message || 'Failed to add bin');
    } finally {
      setAddingBin(false);
    }
  };

  // Nav item list
  const navTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      )
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
      )
    },
    {
      id: 'bins',
      label: 'Bins',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      )
    },
    {
      id: 'alerts',
      label: 'Alerts',
      count: unreadAlertsCount,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    }
  ];

  // Hotspot maximum for proportional fill
  const maxHotspotCount = (stats?.topAreas && stats.topAreas[0]?.count) || 1;

  // Placeholder photos cycling for Dashboard Photo Gallery
  const defaultGalleryTiles = [
    { area: 'Velachery', bg: 'var(--pink)' },
    { area: 'T. Nagar', bg: 'var(--sprout)' },
    { area: 'Adyar', bg: 'var(--blue)' },
    { area: 'Guindy', bg: 'var(--green)' },
    { area: 'Porur', bg: 'var(--pink)' },
    { area: 'Egmore', bg: 'var(--sprout)' }
  ];

  return (
    <div className="authority-shell">
      {/* ========================================================= */}
      {/* SIDEBAR (220px, background var(--green), sticky, height 100vh) */}
      {/* ========================================================= */}
      <aside className="authority-sidebar">
        {/* Logo (light variant) at 22px with padding 4px 10px 22px */}
        <div style={{ padding: '4px 10px 22px' }}>
          <Link to="/authority" style={{ textDecoration: 'none' }}>
            <Logo variant="light" iconHeight={28} textSize={22} />
          </Link>
        </div>

        {/* Nav Items */}
        {navTabs.map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`authority-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.count > 0 && (
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--pink)',
                    border: '1.5px solid var(--green)',
                    color: 'var(--green)',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Bottom chip: background var(--blue), colour Green House, border-radius 20px, padding 14px */}
        <div className="authority-user-chip" style={{ marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: '20px', lineHeight: 1.1, color: 'var(--green)' }}>
            hello,
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>
            Authority desk
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <BackToHomeButton label="Exit to Home" style={{ width: '100%', justifyContent: 'center' }} />
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <main className="authority-main">
        {/* Top bar: Search pill (flex 1), Sprout pill "All areas", ghost pill "This week" */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div
            style={{
              flex: 1,
              minWidth: '220px',
              backgroundColor: 'var(--card)',
              border: '2px solid var(--green)',
              borderRadius: '999px',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search complaints or bins"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="t11"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                color: 'var(--green)',
                fontFamily: 'var(--font-body)'
              }}
            />
          </div>

          <select
            value={selectedAreaFilter}
            onChange={(e) => setSelectedAreaFilter(e.target.value)}
            className="pill pill-sprout t11"
            style={{
              outline: 'none',
              cursor: 'pointer',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              border: '2px solid var(--green)',
              backgroundColor: 'var(--sprout)',
              color: 'var(--green)'
            }}
          >
            <option value="All areas">All Chennai Areas (100+)</option>
            {CHENNAI_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <button
            type="button"
            className="pill pill-ghost"
            style={{ fontSize: '13px' }}
            onClick={() => setSelectedTimeFilter(selectedTimeFilter === 'This week' ? 'Today' : 'This week')}
          >
            {selectedTimeFilter}
          </button>

          <BackToHomeButton label="Home Portal" />
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD (Exact Bento Grid Matching Image 3)      */}
        {/* ========================================================= */}
        {tab === 'dashboard' && (
          <div className="authority-bento">
            {/* 1. Live bins map: grid-column span 2, grid-row span 2, .card with background var(--blue) */}
            <div
              className="card"
              style={{
                gridColumn: 'span 2',
                gridRow: 'span 2',
                backgroundColor: 'var(--blue)',
                padding: '16px',
                minHeight: '380px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                border: '2px solid var(--green)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-peace)', fontSize: '22px', margin: '0 0 10px', color: 'var(--green)' }}>
                Live bins
              </h2>

              <div style={{ flex: 1, minHeight: '280px', borderRadius: '18px', overflow: 'hidden', border: '2px solid var(--green)', position: 'relative' }}>
                <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {dashboardBins.map((bin) => {
                    const coords = bin.location?.coordinates;
                    if (!coords || coords.length < 2) return null;
                    const isOver80 = bin.fillLevel > 80;
                    const isOver50 = bin.fillLevel >= 50;
                    const fillColor = isOver80 ? '#ffc2ef' : isOver50 ? '#acc6c1' : '#b6cc58';
                    const radius = isOver80 ? 14 : isOver50 ? 11 : 9;

                    return (
                      <CircleMarker
                        key={bin._id}
                        center={[coords[1], coords[0]]}
                        radius={radius}
                        pathOptions={{
                          fillColor,
                          color: '#294237',
                          weight: 2.5,
                          fillOpacity: 1
                        }}
                      >
                        <Popup>
                          <strong>Bin {bin.code}</strong> &mdash; {bin.area}
                          <br />
                          Fill Level: {bin.fillLevel}%
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {/* Legend chip at bottom left: Paper White pill, T7 with three small dots (Sprout, Blue, Pink) and labels "Under 50%", "50 to 80%", "Over 80%" */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    zIndex: 1000,
                    backgroundColor: 'var(--paper)',
                    border: '2px solid var(--green)',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    pointerEvents: 'none'
                  }}
                  className="t7"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--sprout)', border: '1px solid var(--green)' }} />
                    <span>Under 50%</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--blue)', border: '1px solid var(--green)' }} />
                    <span>50 to 80%</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--pink)', border: '1px solid var(--green)' }} />
                    <span>Over 80%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Four stat tiles: wrapped in a 2 by 2 sub-grid */}
            <div
              className="authority-stats-subgrid"
              style={{
                gridColumn: 'span 2',
                gridRow: 'span 2',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '14px'
              }}
            >
              {/* Tile A: Pending (Pink) */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--pink)',
                  padding: '16px',
                  borderRadius: '24px',
                  border: '2px solid var(--green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <span className="caption" style={{ color: 'var(--green)' }}>( pending )</span>
                <div className="t9" style={{ color: 'var(--green)' }}>
                  {stats?.statusCounts?.Pending ?? 12}
                </div>
              </div>

              {/* Tile B: In progress (Sprout) */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--sprout)',
                  padding: '16px',
                  borderRadius: '24px',
                  border: '2px solid var(--green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <span className="caption" style={{ color: 'var(--green)' }}>( in progress )</span>
                <div className="t9" style={{ color: 'var(--green)' }}>
                  {stats?.statusCounts?.['In Progress'] ?? 5}
                </div>
              </div>

              {/* Tile C: Collected today (Green House bg, Paper White caption, Pink number) */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--green)',
                  color: 'var(--paper)',
                  padding: '16px',
                  borderRadius: '24px',
                  border: '2px solid var(--green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <span className="caption" style={{ color: 'var(--paper)' }}>( collected today )</span>
                <div className="t9" style={{ color: 'var(--pink)' }}>
                  {stats?.collectedToday ?? 18}
                </div>
              </div>

              {/* Tile D: Avg resolution (var(--card) bg, number with "h") */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--card)',
                  padding: '16px',
                  borderRadius: '24px',
                  border: '2px solid var(--green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <span className="caption" style={{ color: 'var(--green)' }}>( avg resolution )</span>
                <div className="t9" style={{ color: 'var(--green)' }}>
                  {stats?.avgResolutionHours ? `${stats.avgResolutionHours}h` : '3.4h'}
                </div>
              </div>
            </div>

            {/* 3. Hotspot areas: span 2, .card var(--card). Title in Caprasimo 24px */}
            <div
              className="card"
              style={{
                gridColumn: 'span 2',
                backgroundColor: 'var(--card)',
                borderRadius: '24px',
                border: '2px solid var(--green)',
                padding: '20px'
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-script)',
                  fontSize: '24px',
                  color: 'var(--green)',
                  marginBottom: '16px'
                }}
              >
                hotspot areas
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(stats?.topAreas && stats.topAreas.length > 0
                  ? stats.topAreas.slice(0, 3)
                  : [
                      { area: 'Velachery', count: 9 },
                      { area: 'T. Nagar', count: 6 },
                      { area: 'Adyar', count: 4 }
                    ]
                ).map((row, idx) => {
                  const colors = ['var(--pink)', 'var(--sprout)', 'var(--blue)'];
                  const fillColor = colors[idx % 3];
                  const pct = Math.max(15, Math.min(100, Math.round((row.count / maxHotspotCount) * 100)));

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="t7" style={{ width: '96px', flexShrink: 0, color: 'var(--green)' }}>
                        {row.area}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: '14px',
                          backgroundColor: 'var(--paper)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          border: '1px solid rgba(41,66,55,0.1)'
                        }}
                      >
                        <div
                          style={{
                            height: '14px',
                            borderRadius: '999px',
                            border: '2px solid var(--green)',
                            backgroundColor: fillColor,
                            width: `${pct}%`,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Priority queue: span 2, .card var(--card). Title in Peace Sans 22px */}
            <div
              className="card"
              style={{
                gridColumn: 'span 2',
                backgroundColor: 'var(--card)',
                borderRadius: '24px',
                border: '2px solid var(--green)',
                padding: '20px'
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-peace)', fontSize: '22px', margin: '0 0 12px', color: 'var(--green)' }}>
                Priority queue
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(priorityQueue.length > 0
                  ? priorityQueue.slice(0, 3)
                  : [
                      { _id: '1', binCode: 'BIN-004', area: 'Velachery', description: '3 reports', status: 'Verified' },
                      { _id: '2', binCode: 'BIN-011', area: 'T. Nagar', description: 'spill', status: 'Pending' },
                      { _id: '3', binCode: 'BIN-007', area: 'Adyar', description: 'near school', status: 'Assigned' }
                    ]
                ).map((c, idx) => (
                  <div
                    key={c._id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 0',
                      borderTop: idx > 0 ? '1px solid rgba(41,66,55,0.2)' : 'none'
                    }}
                    className="t7"
                  >
                    <span style={{ color: 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.binCode} {c.area} &middot; {c.description}
                    </span>

                    <div style={{ flexShrink: 0 }}>
                      {c.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="pill pill-blue"
                            style={{ fontSize: '12px', padding: '4px 12px' }}
                            onClick={() => {
                              setVerifyModal(c);
                              setVerifySeverity(c.severity || 'medium');
                              setVerifyPriority(c.priority || '');
                            }}
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            className="pill pill-ghost"
                            style={{ fontSize: '12px', padding: '4px 12px' }}
                            onClick={() => setRejectModal(c)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : c.status === 'Verified' ? (
                        <button
                          type="button"
                          className="pill pill-dark"
                          style={{ fontSize: '12px', padding: '4px 14px' }}
                          onClick={() => {
                            setAssignModal(c);
                            loadComplaints();
                          }}
                        >
                          Assign
                        </button>
                      ) : (
                        <span className="pill pill-pink" style={{ fontSize: '12px', padding: '4px 12px', cursor: 'default' }}>
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Photo gallery: grid-column span 4, .card var(--card). Header row: title "Photo gallery" in Peace Sans 22px and pills "Before" and "After" */}
            <div
              className="card"
              style={{
                gridColumn: 'span 4',
                backgroundColor: 'var(--card)',
                borderRadius: '24px',
                border: '2px solid var(--green)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-peace)', fontSize: '22px', margin: 0, color: 'var(--green)' }}>
                  Photo gallery
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`pill ${galleryTab === 'before' ? 'pill-dark active' : 'pill-ghost'}`}
                    style={{ fontSize: '13px' }}
                    onClick={() => setGalleryTab('before')}
                  >
                    Before
                  </button>
                  <button
                    type="button"
                    className={`pill ${galleryTab === 'after' ? 'pill-dark active' : 'pill-ghost'}`}
                    style={{ fontSize: '13px' }}
                    onClick={() => setGalleryTab('after')}
                  >
                    After
                  </button>
                </div>
              </div>

              {/* 6 columns of square tiles (aspect-ratio 1, radius 16px, padding 8px, flex, align-items flex-end) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                  gap: '12px'
                }}
              >
                {defaultGalleryTiles.map((tile, idx) => (
                  <div
                    key={idx}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '16px',
                      backgroundColor: tile.bg,
                      border: '2px solid var(--green)',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <span
                      className="t8"
                      style={{
                        backgroundColor: 'var(--paper)',
                        border: '1.5px solid var(--green)',
                        borderRadius: '999px',
                        padding: '3px 10px',
                        color: 'var(--green)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tile.area}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* OTHER TABS: COMPLAINTS, PHOTOS, BINS, ALERTS              */}
        {/* ========================================================= */}

        {/* TAB 2: COMPLAINTS */}
        {tab === 'complaints' && (
          <div>
            <div
              style={{
                backgroundColor: 'var(--blue)',
                padding: '28px var(--pad-x)',
                borderBottom: '2px solid var(--green)',
                margin: '0 calc(-1 * var(--pad-x)) 20px',
                borderTop: '2px solid var(--green)'
              }}
            >
              <div className="t5" style={{ color: 'var(--green)', opacity: 0.85 }}>
                ( complaints )
              </div>
              <h1 className="t2" style={{ color: 'var(--green)', margin: '4px 0 0', fontSize: 'clamp(32px, 3.5vw, 48px)' }}>
                Complaints
              </h1>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['', 'Pending', 'Verified', 'Assigned', 'In Progress', 'Collected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`pill ${statusFilter === st ? 'pill-dark active' : 'pill-ghost'}`}
                  style={{ fontSize: '13px' }}
                  onClick={() => setStatusFilter(st)}
                >
                  {st || 'All'}
                </button>
              ))}
            </div>

            {loadingComplaints && complaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="loading-spinner" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <p className="t6" style={{ margin: 0 }}>No complaints match the selected filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {complaints.map((c) => {
                  const mainPhoto = c.photos?.find((p) => p.kind === 'before') || c.photos?.[0];
                  return (
                    <div
                      key={c._id}
                      className="card"
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        borderRadius: '20px',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '14px',
                          backgroundColor: 'var(--paper)',
                          border: '2px solid var(--green)',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {mainPhoto?.photo ? (
                          <img
                            src={`/api/photos/${mainPhoto.photo}?thumb=1`}
                            alt="Bin"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="t8">No pic</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="t3" style={{ color: 'var(--green)' }}>{c.binCode || 'BIN'} &middot; {c.area}</span>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="t7" style={{ margin: '4px 0 0', opacity: 0.85 }}>{c.description}</p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {c.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              className="pill pill-blue"
                              onClick={() => {
                                setVerifyModal(c);
                                setVerifySeverity(c.severity || 'medium');
                                setVerifyPriority(c.priority || '');
                              }}
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              className="pill pill-ghost"
                              onClick={() => setRejectModal(c)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {c.status === 'Verified' && (
                          <button
                            type="button"
                            className="pill pill-dark"
                            onClick={() => setAssignModal(c)}
                          >
                            Assign
                          </button>
                        )}
                        <Link to={`/complaint/${c._id}`} className="pill pill-ghost" style={{ textDecoration: 'none' }}>
                          View &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PHOTOS */}
        {tab === 'photos' && (
          <div>
            <div
              style={{
                backgroundColor: 'var(--blue)',
                padding: '28px var(--pad-x)',
                borderBottom: '2px solid var(--green)',
                margin: '0 calc(-1 * var(--pad-x)) 20px',
                borderTop: '2px solid var(--green)'
              }}
            >
              <div className="t5" style={{ color: 'var(--green)', opacity: 0.85 }}>
                ( gallery )
              </div>
              <h1 className="t2" style={{ color: 'var(--green)', margin: '4px 0 0', fontSize: 'clamp(32px, 3.5vw, 48px)' }}>
                Photos
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['', 'before', 'after'].map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`pill ${photoKindFilter === k ? 'pill-dark active' : 'pill-ghost'}`}
                  onClick={() => setPhotoKindFilter(k)}
                >
                  {k ? k.toUpperCase() : 'ALL'}
                </button>
              ))}
            </div>

            {loadingPhotos && galleryPhotos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="loading-spinner" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {galleryPhotos.map((p, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{ padding: '10px', cursor: 'pointer' }}
                    onClick={() => setSelectedPhotoUrl(`/api/photos/${p.photoId}`)}
                  >
                    <div style={{ height: '160px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--green)' }}>
                      <img
                        src={`/api/photos/${p.photoId}?thumb=1`}
                        alt="Bin capture"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="t7" style={{ fontWeight: 600 }}>{p.area}</span>
                      <span className="t8" style={{ opacity: 0.7 }}>{p.kind}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BINS */}
        {tab === 'bins' && (
          <div>
            <div
              style={{
                backgroundColor: 'var(--blue)',
                padding: '28px var(--pad-x)',
                borderBottom: '2px solid var(--green)',
                margin: '0 calc(-1 * var(--pad-x)) 20px',
                borderTop: '2px solid var(--green)'
              }}
            >
              <div className="t5" style={{ color: 'var(--green)', opacity: 0.85 }}>
                ( infrastructure )
              </div>
              <h1 className="t2" style={{ color: 'var(--green)', margin: '4px 0 0', fontSize: 'clamp(32px, 3.5vw, 48px)' }}>
                Bins Fleet
              </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {/* Add Bin Form */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="t3" style={{ margin: '0 0 8px' }}>Add Smart Bin</h3>
                <p className="t7" style={{ opacity: 0.8, marginBottom: '14px' }}>
                  Tap map below to set GPS coordinates, then provide bin code and locality.
                </p>

                {addBinError && <div className="t7" style={{ color: 'var(--pink)', marginBottom: '10px' }}>{addBinError}</div>}
                {addBinSuccess && <div className="t7" style={{ color: 'var(--sprout)', marginBottom: '10px' }}>{addBinSuccess}</div>}

                <form onSubmit={handleAddBin}>
                  <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--green)', marginBottom: '12px' }}>
                    <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapAddBinHandler onLocationSelect={(lat, lng) => setNewBinLocation({ lat, lng })} />
                      <CircleMarker center={[newBinLocation.lat, newBinLocation.lng]} radius={10} pathOptions={{ color: '#294237', fillColor: '#b6cc58', fillOpacity: 1, weight: 3 }} />
                    </MapContainer>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      required
                      placeholder="BIN-015"
                      className="form-input-brand"
                      style={{ flex: 1 }}
                      value={newBinCode}
                      onChange={(e) => setNewBinCode(e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Area name (100+ Chennai areas)"
                      className="form-input-brand"
                      style={{ flex: 1 }}
                      list="authority-chennai-areas"
                      value={newBinArea}
                      onChange={(e) => setNewBinArea(e.target.value)}
                    />
                    <datalist id="authority-chennai-areas">
                      {CHENNAI_AREAS.map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', minHeight: '48px' }} disabled={addingBin}>
                    {addingBin ? <span className="loading-spinner" /> : 'Deploy Bin'}
                  </button>
                </form>
              </div>

              {/* Bins List with Fill Level Bar */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="t3" style={{ margin: '0 0 14px' }}>Active Bins ({binsList.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
                  {binsList.map((b) => {
                    const fillColor = b.fillLevel > 80 ? 'var(--pink)' : b.fillLevel >= 50 ? 'var(--blue)' : 'var(--sprout)';
                    return (
                      <div key={b._id} className="card" style={{ padding: '12px 16px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span className="t7" style={{ fontWeight: 600 }}>{b.code} &mdash; {b.area}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="t7" style={{ fontWeight: 700 }}>{b.fillLevel}%</span>
                            <button
                              type="button"
                              className="pill pill-ghost"
                              style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px' }}
                              onClick={() => handleSimulateFill(b._id)}
                            >
                              Simulate fill
                            </button>
                          </div>
                        </div>

                        {/* Fill level bar: 14px, pill radius, 2px border, fill colour by level */}
                        <div
                          style={{
                            height: '14px',
                            backgroundColor: 'var(--paper)',
                            borderRadius: '999px',
                            border: '2px solid var(--green)',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${b.fillLevel}%`,
                              backgroundColor: fillColor
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ALERTS */}
        {tab === 'alerts' && <Alerts />}
      </main>

      {/* ========================================================= */}
      {/* MODALS: VERIFY, REJECT, ASSIGN, PHOTO VIEWER             */}
      {/* ========================================================= */}
      {verifyModal && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ borderRadius: '24px', padding: '24px', maxWidth: '440px' }}>
            <h3 className="t3" style={{ margin: '0 0 6px' }}>Verify Complaint</h3>
            <p className="t7" style={{ opacity: 0.8, marginBottom: '16px' }}>
              #{verifyModal._id.slice(-6)}: {verifyModal.description}
            </p>

            {actionError && <div className="t7" style={{ color: 'var(--pink)', marginBottom: '10px' }}>{actionError}</div>}

            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: '12px' }}>
                <label className="caption">Severity</label>
                <select
                  className="form-input-brand"
                  value={verifySeverity}
                  onChange={(e) => setVerifySeverity(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="caption">Priority override (optional)</label>
                <input
                  type="number"
                  placeholder={`Current: ${verifyModal.priority || 5}`}
                  className="form-input-brand"
                  value={verifyPriority}
                  onChange={(e) => setVerifyPriority(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="pill pill-ghost" onClick={() => setVerifyModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ minHeight: '44px' }} disabled={actionLoading}>
                  {actionLoading ? <span className="loading-spinner" /> : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ borderRadius: '24px', padding: '24px', maxWidth: '440px' }}>
            <h3 className="t3" style={{ margin: '0 0 6px', color: 'var(--green)' }}>Reject Complaint</h3>
            <p className="t7" style={{ opacity: 0.8, marginBottom: '16px' }}>
              Provide a clear reason for the citizen explaining why this report was rejected.
            </p>

            {actionError && <div className="t7" style={{ color: 'var(--pink)', marginBottom: '10px' }}>{actionError}</div>}

            <form onSubmit={handleReject}>
              <div style={{ marginBottom: '16px' }}>
                <label className="caption">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  className="form-input-brand"
                  placeholder="e.g. Duplicate report, invalid photo, or private property."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="pill pill-ghost" onClick={() => setRejectModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-dark" style={{ minHeight: '44px', color: 'var(--pink)' }} disabled={actionLoading}>
                  {actionLoading ? <span className="loading-spinner" /> : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ borderRadius: '24px', padding: '24px', maxWidth: '440px' }}>
            <h3 className="t3" style={{ margin: '0 0 6px' }}>Assign Task to Collector</h3>
            <p className="t7" style={{ opacity: 0.8, marginBottom: '16px' }}>
              Assign Complaint #{assignModal._id.slice(-6)} in <strong>{assignModal.area}</strong> to a field collector.
            </p>

            {actionError && <div className="t7" style={{ color: 'var(--pink)', marginBottom: '10px' }}>{actionError}</div>}

            <form onSubmit={handleAssign}>
              <div style={{ marginBottom: '16px' }}>
                <label className="caption">Select Field Collector *</label>
                <select
                  required
                  className="form-input-brand"
                  value={selectedCollectorId}
                  onChange={(e) => setSelectedCollectorId(e.target.value)}
                >
                  <option value="" disabled>-- Select a Collector --</option>
                  {collectors.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.area || 'All Chennai'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="pill pill-ghost" onClick={() => setAssignModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ minHeight: '44px' }} disabled={actionLoading}>
                  {actionLoading ? <span className="loading-spinner" /> : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPhotoUrl && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
            <img
              src={selectedPhotoUrl}
              alt="Full size view"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px', border: '2px solid var(--green)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
