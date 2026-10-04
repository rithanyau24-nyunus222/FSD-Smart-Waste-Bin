import { initialUsers, initialBins, initialComplaints, initialTasks, initialNotifications } from './mockData.js';

const STORAGE_KEY = 'smart_waste_db_v2';

const loadDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse localStorage db, resetting to seed:', e);
  }

  const initial = {
    users: initialUsers,
    bins: initialBins,
    complaints: initialComplaints,
    tasks: initialTasks,
    notifications: initialNotifications
  };
  saveDb(initial);
  return initial;
};

const saveDb = (db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

export const resetMockDb = () => {
  localStorage.removeItem(STORAGE_KEY);
  return loadDb();
};

// Helper: distance between two lat/lng in meters (Haversine formula)
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Generate an SVG placeholder waste bin photo
const getMockPhotoUrl = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="100%" height="100%" fill="#1B0A4F"/>
    <circle cx="300" cy="180" r="90" fill="#D6455D" opacity="0.8"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="64" fill="#fff">🗑️</text>
    <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-size="20" font-family="sans-serif" font-weight="bold" fill="#FCEE21">SMART BIN REPORT INCIDENT</text>
    <text x="50%" y="82%" dominant-baseline="middle" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#A9B6C4">Live Field Capture · Greater Chennai Corporation</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const handleMockApi = async (endpoint, options = {}) => {
  const db = loadDb();
  const method = (options.method || 'GET').toUpperCase();
  const token = localStorage.getItem('token');
  const currentUser = db.users.find((u) => u._id === token || u.email === token) || db.users[0];

  // Parse endpoint and query parameters
  const [path, queryString] = endpoint.replace(/^\/api/, '').split('?');
  const params = new URLSearchParams(queryString || '');

  // Simulate realistic network latency for fluid UX
  await new Promise((resolve) => setTimeout(resolve, 80));

  /* ---------------- AUTH ---------------- */
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // Default password check
    if (password !== 'Demo@123' && user.password && user.password !== password) {
      const err = new Error('Invalid email or password. (Demo password: Demo@123)');
      err.status = 401;
      throw err;
    }

    return {
      token: user._id,
      user
    };
  }

  if (path === '/auth/register' && method === 'POST') {
    const { name, email, area } = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      const err = new Error('Email is already registered');
      err.status = 400;
      throw err;
    }

    const newUser = {
      _id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      role: 'citizen',
      area: area || 'Chennai'
    };

    db.users.push(newUser);
    saveDb(db);

    return {
      token: newUser._id,
      user: newUser
    };
  }

  if (path === '/auth/me') {
    if (!token) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    const user = db.users.find((u) => u._id === token);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return { user };
  }

  /* ---------------- STATS ---------------- */
  if (path === '/stats/public') {
    return {
      totalComplaints: db.complaints.length,
      collectedComplaints: db.complaints.filter((c) => c.status === 'Collected').length,
      totalBins: db.bins.length
    };
  }

  if (path === '/stats') {
    const counts = {
      pending: db.complaints.filter((c) => c.status === 'Pending').length,
      verified: db.complaints.filter((c) => c.status === 'Verified').length,
      inProgress: db.complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length,
      collected: db.complaints.filter((c) => c.status === 'Collected').length,
      criticalBins: db.bins.filter((b) => b.fillLevel >= 80).length
    };

    // 7-day complaint activity
    const activityTrend = [
      { day: 'Mon', count: 4 },
      { day: 'Tue', count: 7 },
      { day: 'Wed', count: 5 },
      { day: 'Thu', count: 9 },
      { day: 'Fri', count: 6 },
      { day: 'Sat', count: 8 },
      { day: 'Sun', count: 3 }
    ];

    return {
      counts,
      activityTrend
    };
  }

  /* ---------------- BINS ---------------- */
  if (path === '/bins' && method === 'GET') {
    return db.bins;
  }

  if (path === '/bins/simulate' && method === 'POST') {
    // Randomize fill levels realistically
    db.bins = db.bins.map((bin) => {
      const delta = (Math.random() - 0.3) * 20; // tendency to increase
      const newLevel = Math.max(5, Math.min(100, Math.round(bin.fillLevel + delta)));
      return {
        ...bin,
        fillLevel: newLevel
      };
    });
    saveDb(db);
    return {
      message: 'Sensor telemetry simulation completed',
      bins: db.bins
    };
  }

  /* ---------------- USERS (COLLECTORS) ---------------- */
  if (path === '/users/collectors') {
    return db.users.filter((u) => u.role === 'collector');
  }

  /* ---------------- COMPLAINTS ---------------- */
  if (path === '/complaints' && method === 'GET') {
    let result = [...db.complaints];

    // Filter by role: citizen sees own, authority/collector sees all
    if (currentUser?.role === 'citizen') {
      result = result.filter(
        (c) =>
          (c.reporter?._id || c.reporter) === currentUser._id ||
          (typeof c.reporter === 'object' && c.reporter?.email === currentUser?.email)
      );
    }

    const statusFilter = params.get('status');
    if (statusFilter) {
      result = result.filter((c) => c.status.toLowerCase() === statusFilter.toLowerCase());
    }

    const priorityFilter = params.get('priority');
    if (priorityFilter) {
      result = result.filter((c) => c.priority?.toLowerCase() === priorityFilter.toLowerCase());
    }

    const search = params.get('search');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.description.toLowerCase().includes(s) ||
          c.bin?.area?.toLowerCase().includes(s) ||
          c.bin?.address?.toLowerCase().includes(s)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (path.match(/^\/complaints\/([a-zA-Z0-9_-]+)$/) && method === 'GET') {
    const id = path.split('/')[2];
    const complaint = db.complaints.find((c) => c._id === id);
    if (!complaint) {
      const err = new Error('Complaint not found');
      err.status = 404;
      throw err;
    }
    return complaint;
  }

  if (path === '/complaints' && method === 'POST') {
    let description = '';
    let severity = 'medium';
    let lat = 13.0827;
    let lng = 80.2707;
    let confirmDuplicate = false;
    let photoUrl = getMockPhotoUrl();

    if (options.body instanceof FormData) {
      description = options.body.get('description') || '';
      severity = options.body.get('severity') || 'medium';
      lat = parseFloat(options.body.get('lat') || '13.0827');
      lng = parseFloat(options.body.get('lng') || '80.2707');
      confirmDuplicate = options.body.get('confirmDuplicate') === 'true';

      const photoFile = options.body.get('photo');
      if (photoFile && photoFile.size > 0 && photoFile instanceof Blob) {
        try {
          photoUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = () => res(getMockPhotoUrl());
            reader.readAsDataURL(photoFile);
          });
        } catch (e) {
          photoUrl = getMockPhotoUrl();
        }
      }
    } else {
      const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      description = parsed.description || '';
      severity = parsed.severity || 'medium';
      lat = parsed.lat || 13.0827;
      lng = parsed.lng || 80.2707;
      confirmDuplicate = parsed.confirmDuplicate === true;
    }

    // Duplicate detection within 30 meters
    if (!confirmDuplicate) {
      const openReports = db.complaints.filter((c) => ['Pending', 'Verified', 'Assigned'].includes(c.status));
      for (const open of openReports) {
        if (open.location?.coordinates) {
          const [cLng, cLat] = open.location.coordinates;
          const dist = getDistanceMeters(lat, lng, cLat, cLng);
          if (dist <= 30) {
            const err = new Error('A duplicate report has already been logged nearby.');
            err.status = 409;
            err.data = {
              duplicate: true,
              complaint: open,
              distanceMeters: Math.round(dist)
            };
            throw err;
          }
        }
      }
    }

    // Find nearest bin
    let nearestBin = db.bins[0];
    let minDistance = Infinity;
    for (const b of db.bins) {
      if (b.location?.coordinates) {
        const [bLng, bLat] = b.location.coordinates;
        const d = getDistanceMeters(lat, lng, bLat, bLng);
        if (d < minDistance) {
          minDistance = d;
          nearestBin = b;
        }
      }
    }

    const newComplaint = {
      _id: `cmp_${Date.now()}`,
      reporter: currentUser,
      bin: nearestBin,
      description,
      severity,
      priority: severity === 'high' ? 'high' : 'medium',
      photo: photoUrl,
      location: { type: 'Point', coordinates: [lng, lat] },
      status: 'Pending',
      createdAt: new Date().toISOString(),
      history: [
        {
          status: 'Pending',
          by: currentUser,
          note: 'Report submitted by citizen via web application',
          at: new Date().toISOString()
        }
      ]
    };

    db.complaints.unshift(newComplaint);

    // Push notification to authority
    const authUser = db.users.find((u) => u.role === 'authority');
    if (authUser) {
      db.notifications.unshift({
        _id: `notif_${Date.now()}`,
        user: authUser._id,
        type: 'new_complaint',
        title: 'New Bin Report Logged',
        message: `A new report has been logged near ${nearestBin.area} (${nearestBin.code}).`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    saveDb(db);
    return newComplaint;
  }

  if (path.match(/^\/complaints\/([a-zA-Z0-9_-]+)\/verify$/) && method === 'PATCH') {
    const id = path.split('/')[2];
    const { priority } = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
    const complaint = db.complaints.find((c) => c._id === id);

    if (!complaint) {
      const err = new Error('Complaint not found');
      err.status = 404;
      throw err;
    }

    complaint.status = 'Verified';
    complaint.priority = priority || complaint.priority || 'high';
    complaint.history.push({
      status: 'Verified',
      by: currentUser,
      note: `Verified by Municipal Authority with priority ${complaint.priority.toUpperCase()}`,
      at: new Date().toISOString()
    });

    saveDb(db);
    return complaint;
  }

  if (path.match(/^\/complaints\/([a-zA-Z0-9_-]+)\/reject$/) && method === 'PATCH') {
    const id = path.split('/')[2];
    const { reason } = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
    const complaint = db.complaints.find((c) => c._id === id);

    if (!complaint) {
      const err = new Error('Complaint not found');
      err.status = 404;
      throw err;
    }

    complaint.status = 'Rejected';
    complaint.history.push({
      status: 'Rejected',
      by: currentUser,
      note: `Rejected: ${reason || 'Does not qualify as a municipal hazard'}`,
      at: new Date().toISOString()
    });

    saveDb(db);
    return complaint;
  }

  /* ---------------- TASKS ---------------- */
  if (path === '/tasks' && method === 'GET') {
    let tasks = [...db.tasks];
    if (currentUser?.role === 'collector') {
      tasks = tasks.filter((t) => (t.assignedTo?._id || t.assignedTo) === currentUser._id);
    }
    return tasks.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
  }

  if (path === '/tasks' && method === 'POST') {
    const { complaintId, collectorId } =
      typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
    const complaint = db.complaints.find((c) => c._id === complaintId);
    const collector = db.users.find((u) => u._id === collectorId);

    if (!complaint || !collector) {
      const err = new Error('Complaint or Collector not found');
      err.status = 400;
      throw err;
    }

    complaint.status = 'Assigned';
    complaint.history.push({
      status: 'Assigned',
      by: currentUser,
      note: `Dispatched to sanitation worker ${collector.name}`,
      at: new Date().toISOString()
    });

    const newTask = {
      _id: `tsk_${Date.now()}`,
      complaint,
      assignedTo: collector,
      status: 'assigned',
      assignedAt: new Date().toISOString()
    };

    db.tasks.unshift(newTask);

    // Notification to collector
    db.notifications.unshift({
      _id: `notif_${Date.now()}`,
      user: collector._id,
      type: 'task_assigned',
      title: 'New Collection Task',
      message: `You have been assigned to clear bin at ${complaint.bin?.address || 'Chennai'}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    return newTask;
  }

  if (path.match(/^\/tasks\/([a-zA-Z0-9_-]+)\/status$/) && method === 'PATCH') {
    const id = path.split('/')[2];
    const { status } = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
    const task = db.tasks.find((t) => t._id === id);

    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }

    task.status = status;
    const complaint = db.complaints.find((c) => c._id === (task.complaint?._id || task.complaint));

    if (status === 'in_progress') {
      task.startedAt = new Date().toISOString();
      if (complaint) {
        complaint.status = 'In Progress';
        complaint.history.push({
          status: 'In Progress',
          by: currentUser,
          note: `Collector ${currentUser.name} has initiated collection`,
          at: new Date().toISOString()
        });
      }
    } else if (status === 'collected') {
      task.completedAt = new Date().toISOString();
      if (complaint) {
        complaint.status = 'Collected';
        complaint.history.push({
          status: 'Collected',
          by: currentUser,
          note: `Waste cleared and collected. Smart bin reset to 5% capacity.`,
          at: new Date().toISOString()
        });

        // Reset bin fill level
        const binId = complaint.bin?._id || complaint.bin;
        const bin = db.bins.find((b) => b._id === binId);
        if (bin) {
          bin.fillLevel = 5;
          bin.lastCollectedAt = new Date().toISOString();
        }

        // Notification to citizen
        const reporterId = complaint.reporter?._id || complaint.reporter;
        if (reporterId) {
          db.notifications.unshift({
            _id: `notif_${Date.now()}`,
            user: reporterId,
            type: 'complaint_collected',
            title: 'Your Report Has Been Resolved!',
            message: `The overflowing waste at ${complaint.bin?.address || 'your reported location'} has been cleared.`,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    saveDb(db);
    return task;
  }

  /* ---------------- NOTIFICATIONS ---------------- */
  if (path === '/notifications' && method === 'GET') {
    return db.notifications
      .filter((n) => !n.user || n.user === currentUser?._id)
      .slice(0, 15);
  }

  if (path === '/notifications/read' && method === 'PATCH') {
    db.notifications.forEach((n) => {
      if (!n.user || n.user === currentUser?._id) {
        n.read = true;
      }
    });
    saveDb(db);
    return { success: true };
  }

  // Fallback 404
  const err = new Error(`Route ${method} ${path} not found`);
  err.status = 404;
  throw err;
};
