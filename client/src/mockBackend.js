import { initialUsers, initialBins, initialComplaints, initialTasks, initialNotifications, samplePhotos } from './mockData.js';

const STORAGE_KEY = 'clean_chennai_waste_v3';

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

// Distance between two points in meters (Haversine formula)
export const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
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

export const handleMockApi = async (endpoint, options = {}) => {
  const db = loadDb();
  const method = (options.method || 'GET').toUpperCase();
  const token = localStorage.getItem('token');
  const currentUser = db.users.find((u) => u._id === token || u.email === token) || db.users[0];

  // Parse endpoint and query parameters
  const [path, queryString] = endpoint.replace(/^\/api/, '').split('?');
  const params = new URLSearchParams(queryString || '');

  // Simulate realistic snappy network latency
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

    if (password !== 'Demo@123' && user.password && user.password !== password) {
      const err = new Error('Invalid credentials. (Demo password is Demo@123)');
      err.status = 401;
      throw err;
    }

    return { token: user._id, user };
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
    return { token: newUser._id, user: newUser };
  }

  if (path === '/auth/me') {
    if (!token) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    const user = db.users.find((u) => u._id === token) || db.users[0];
    return { user };
  }

  /* ---------------- STATS ---------------- */
  if (path === '/stats/public') {
    return {
      totalComplaints: db.complaints.filter((c) => c.status !== 'Merged').length,
      collectedComplaints: db.complaints.filter((c) => c.status === 'Collected').length,
      totalBins: db.bins.length,
      highRiskHazards: db.complaints.filter((c) => c.riskLevel === 'critical' && c.status !== 'Collected').length
    };
  }

  if (path === '/stats') {
    const counts = {
      total: db.complaints.filter((c) => c.status !== 'Merged').length,
      pending: db.complaints.filter((c) => c.status === 'Pending').length,
      verified: db.complaints.filter((c) => c.status === 'Verified').length,
      inProgress: db.complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length,
      collected: db.complaints.filter((c) => c.status === 'Collected').length,
      criticalHazards: db.complaints.filter((c) => c.riskLevel === 'critical' && c.status !== 'Collected').length,
      criticalBins: db.bins.filter((b) => b.fillLevel >= 80).length
    };

    const activityTrend = [
      { day: 'Mon', count: 5 },
      { day: 'Tue', count: 8 },
      { day: 'Wed', count: 6 },
      { day: 'Thu', count: 11 },
      { day: 'Fri', count: 7 },
      { day: 'Sat', count: 12 },
      { day: 'Sun', count: 4 }
    ];

    return { counts, activityTrend };
  }

  /* ---------------- BINS ---------------- */
  if (path === '/bins' && method === 'GET') {
    return db.bins;
  }

  if (path === '/bins/simulate' && method === 'POST') {
    db.bins = db.bins.map((bin) => {
      const delta = (Math.random() - 0.25) * 20;
      const newLevel = Math.max(5, Math.min(100, Math.round(bin.fillLevel + delta)));
      return { ...bin, fillLevel: newLevel };
    });
    saveDb(db);
    return { message: 'Sensor telemetry updated across Chennai smart bins', bins: db.bins };
  }

  /* ---------------- USERS (COLLECTORS) ---------------- */
  if (path === '/users/collectors') {
    return db.users.filter((u) => u.role === 'collector');
  }

  /* ---------------- DUPLICATE DETECTION & MERGE ---------------- */
  if (path === '/complaints/duplicates' && method === 'GET') {
    const openComplaints = db.complaints.filter((c) => ['Pending', 'Verified'].includes(c.status));
    const duplicatePairs = [];
    const pairedIds = new Set();

    for (let i = 0; i < openComplaints.length; i++) {
      for (let j = i + 1; j < openComplaints.length; j++) {
        const c1 = openComplaints[i];
        const c2 = openComplaints[j];

        if (c1.location?.coordinates && c2.location?.coordinates) {
          const [lon1, lat1] = c1.location.coordinates;
          const [lon2, lat2] = c2.location.coordinates;
          const dist = getDistanceMeters(lat1, lon1, lat2, lon2);

          // Within 50 meters counts as a duplicate candidate
          if (dist <= 50) {
            duplicatePairs.push({
              primary: c1,
              duplicate: c2,
              distanceMeters: Math.round(dist)
            });
            pairedIds.add(c1._id);
            pairedIds.add(c2._id);
          }
        }
      }
    }

    return duplicatePairs;
  }

  if (path === '/complaints/merge-duplicates' && method === 'POST') {
    const { primaryId, duplicateId, note } =
      typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};

    const primary = db.complaints.find((c) => c._id === primaryId);
    const duplicate = db.complaints.find((c) => c._id === duplicateId);

    if (!primary || !duplicate) {
      const err = new Error('Primary or duplicate complaint not found');
      err.status = 404;
      throw err;
    }

    // Mark duplicate as merged
    duplicate.status = 'Merged';
    duplicate.history.push({
      status: 'Merged',
      by: currentUser,
      note: `Merged into Master Ticket #${primary._id.slice(-6)} by Municipal Authority. ${note || ''}`,
      at: new Date().toISOString()
    });

    // Update primary complaint
    primary.duplicateCount = (primary.duplicateCount || 0) + 1;
    primary.history.push({
      status: primary.status,
      by: currentUser,
      note: `Linked duplicate report #${duplicate._id.slice(-6)} submitted by ${duplicate.reporter?.name || 'citizen'}. Combined into single dispatch ticket.`,
      at: new Date().toISOString()
    });

    // Add audit notification
    db.notifications.unshift({
      _id: `notif_${Date.now()}`,
      user: currentUser._id,
      type: 'duplicate_merged',
      title: 'Duplicate Reports Merged',
      message: `Merged 2 nearby reports at ${primary.areaName || primary.bin?.area || 'Chennai'}. Single task maintained.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    return { success: true, primary, duplicate };
  }

  /* ---------------- COMPLAINTS ---------------- */
  if (path === '/complaints' && method === 'GET') {
    let result = [...db.complaints];

    // Citizen sees only own, authority/collector sees all
    if (currentUser?.role === 'citizen') {
      result = result.filter(
        (c) =>
          (c.reporter?._id || c.reporter) === currentUser._id ||
          (typeof c.reporter === 'object' && c.reporter?.email === currentUser?.email)
      );
    }

    const statusFilter = params.get('status');
    if (statusFilter && statusFilter !== 'All') {
      result = result.filter((c) => c.status.toLowerCase() === statusFilter.toLowerCase());
    } else {
      // By default hide merged from normal list unless requested
      result = result.filter((c) => c.status !== 'Merged');
    }

    const riskFilter = params.get('risk');
    if (riskFilter && riskFilter !== 'All') {
      result = result.filter((c) => (c.riskLevel || '').toLowerCase() === riskFilter.toLowerCase());
    }

    const search = params.get('search');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.description.toLowerCase().includes(s) ||
          (c.areaName && c.areaName.toLowerCase().includes(s)) ||
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

  // Create new citizen complaint with photo & AI analysis
  if (path === '/complaints' && method === 'POST') {
    let description = '';
    let severity = 'medium';
    let riskLevel = 'medium';
    let lat = 13.0827;
    let lng = 80.2707;
    let areaName = 'Chennai Central';
    let photoUrl = samplePhotos.bin_overflow;
    let analysis = {
      category: 'General Waste Overflow',
      estimatedWeight: '50-70 kg',
      spillRadius: '3 meters',
      drainageThreat: 'Moderate'
    };

    if (options.body instanceof FormData) {
      description = options.body.get('description') || '';
      severity = options.body.get('severity') || 'medium';
      riskLevel = options.body.get('riskLevel') || severity;
      lat = parseFloat(options.body.get('lat') || '13.0827');
      lng = parseFloat(options.body.get('lng') || '80.2707');
      areaName = options.body.get('areaName') || 'Chennai Central';

      const photoFile = options.body.get('photo');
      if (photoFile && photoFile.size > 0 && photoFile instanceof Blob) {
        try {
          photoUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = () => res(samplePhotos.bin_overflow);
            reader.readAsDataURL(photoFile);
          });
        } catch (e) {
          photoUrl = samplePhotos.bin_overflow;
        }
      }
    } else {
      const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      description = parsed.description || '';
      severity = parsed.severity || 'medium';
      riskLevel = parsed.riskLevel || severity;
      lat = parsed.lat || 13.0827;
      lng = parsed.lng || 80.2707;
      areaName = parsed.areaName || 'Chennai Central';
      if (parsed.photo) photoUrl = parsed.photo;
      if (parsed.analysis) analysis = parsed.analysis;
    }

    // Auto-detect nearest smart bin
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

    // Dynamic AI Analysis derivation if not supplied
    if (!analysis.category || analysis.category === 'General Waste Overflow') {
      const descLower = description.toLowerCase();
      if (descLower.includes('drain') || descLower.includes('flood') || descLower.includes('water')) {
        analysis = {
          category: 'Drainage Hazard / Plastic Blockage',
          estimatedWeight: '60 kg',
          spillRadius: '3.5 meters',
          drainageThreat: 'CRITICAL (Immediate Monsoon Flood Threat)'
        };
        riskLevel = 'critical';
      } else if (descLower.includes('market') || descLower.includes('crate') || descLower.includes('commercial')) {
        analysis = {
          category: 'Commercial Crates & Packaging',
          estimatedWeight: '130 kg',
          spillRadius: '5 meters',
          drainageThreat: 'Moderate'
        };
        riskLevel = 'high';
      } else if (descLower.includes('dog') || descLower.includes('animal') || descLower.includes('smell')) {
        analysis = {
          category: 'Organic Food Waste & Animal Hazard',
          estimatedWeight: '80 kg',
          spillRadius: '4 meters',
          drainageThreat: 'High Sanitation Hazard'
        };
        riskLevel = 'high';
      }
    }

    const newComplaint = {
      _id: `cmp_${Date.now()}`,
      reporter: currentUser,
      bin: nearestBin,
      description,
      severity,
      riskLevel,
      priority: riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'high' : 'medium',
      photo: photoUrl,
      analysis,
      location: { type: 'Point', coordinates: [lng, lat] },
      areaName,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      history: [
        {
          status: 'Pending',
          by: currentUser,
          note: `Citizen photo uploaded. Automated image analysis: ${analysis.category}, Risk: ${riskLevel.toUpperCase()}`,
          at: new Date().toISOString()
        }
      ]
    };

    db.complaints.unshift(newComplaint);

    // Notify authority
    const authUser = db.users.find((u) => u.role === 'authority');
    if (authUser) {
      db.notifications.unshift({
        _id: `notif_${Date.now()}`,
        user: authUser._id,
        type: 'new_complaint',
        title: 'New Waste Report Logged in Chennai',
        message: `Report logged at ${areaName}. Risk level assessed as ${riskLevel.toUpperCase()}.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    saveDb(db);
    return newComplaint;
  }

  /* ---------------- RISK LEVEL ASSESSMENT ---------------- */
  if (path.match(/^\/complaints\/([a-zA-Z0-9_-]+)\/risk$/) && method === 'PATCH') {
    const id = path.split('/')[2];
    const { riskLevel, note } = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
    const complaint = db.complaints.find((c) => c._id === id);

    if (!complaint) {
      const err = new Error('Complaint not found');
      err.status = 404;
      throw err;
    }

    complaint.riskLevel = riskLevel || 'medium';
    complaint.priority = riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'high' : 'medium';
    complaint.status = 'Verified';
    complaint.history.push({
      status: 'Verified',
      by: currentUser,
      note: `Municipal Authority assessed risk as: ${complaint.riskLevel.toUpperCase()}. ${note || ''}`,
      at: new Date().toISOString()
    });

    saveDb(db);
    return complaint;
  }

  /* ---------------- VERIFY / REJECT ---------------- */
  if (path.match(/^\/complaints\/([a-zA-Z0-9_-]+)\/verify$/) && method === 'PATCH') {
    const id = path.split('/')[2];
    const { priority, riskLevel, note } =
      typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
    const complaint = db.complaints.find((c) => c._id === id);

    if (!complaint) {
      const err = new Error('Complaint not found');
      err.status = 404;
      throw err;
    }

    complaint.status = 'Verified';
    if (riskLevel) complaint.riskLevel = riskLevel;
    complaint.priority = priority || complaint.priority || 'high';
    complaint.history.push({
      status: 'Verified',
      by: currentUser,
      note: note || `Verified by Municipal Authority with risk ${complaint.riskLevel?.toUpperCase() || 'HIGH'}`,
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
      note: `Rejected: ${reason || 'Not deemed an actionable hazard'}`,
      at: new Date().toISOString()
    });

    saveDb(db);
    return complaint;
  }

  /* ---------------- TASKS & DAILY SCHEDULE ---------------- */
  if (path === '/tasks' && method === 'GET') {
    let tasks = [...db.tasks];
    if (currentUser?.role === 'collector') {
      tasks = tasks.filter((t) => (t.assignedTo?._id || t.assignedTo) === currentUser._id);
    }
    return tasks.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
  }

  if (path === '/tasks' && method === 'POST') {
    const { complaintId, collectorId, notes } =
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
      note: `Added to Daily Route for driver ${collector.name}. Priority: ${complaint.priority?.toUpperCase() || 'HIGH'}`,
      at: new Date().toISOString()
    });

    const newTask = {
      _id: `tsk_${Date.now()}`,
      complaint,
      assignedTo: collector,
      status: 'assigned',
      stopNumber: db.tasks.filter((t) => t.assignedTo?._id === collector._id && t.status !== 'collected').length + 1,
      priority: complaint.priority || 'high',
      assignedAt: new Date().toISOString(),
      notes: notes || 'Assigned in daily morning municipal dispatch'
    };

    db.tasks.unshift(newTask);

    db.notifications.unshift({
      _id: `notif_${Date.now()}`,
      user: collector._id,
      type: 'task_assigned',
      title: 'New Daily Task Assigned',
      message: `Stop assigned at ${complaint.areaName || complaint.bin?.area || 'Chennai'}. Risk: ${complaint.riskLevel?.toUpperCase() || 'HIGH'}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    return newTask;
  }

  /* ---------------- CLOSED VERIFICATION LOOP ---------------- */
  if (path.match(/^\/tasks\/([a-zA-Z0-9_-]+)\/status$/) && method === 'PATCH') {
    const id = path.split('/')[2];
    const { status, proofNote, proofPhoto } =
      typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
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
          note: `Driver ${currentUser.name} en route / initiated collection at location.`,
          at: new Date().toISOString()
        });
      }
    } else if (status === 'collected') {
      task.completedAt = new Date().toISOString();
      task.proofNote = proofNote || 'Waste cleared, pavement swept, disinfectant applied.';
      task.proofPhoto = proofPhoto || samplePhotos.cleaned_proof;

      if (complaint) {
        complaint.status = 'Collected';
        complaint.photoProof = task.proofPhoto;
        complaint.history.push({
          status: 'Collected',
          by: currentUser,
          note: `CLOSED-LOOP VERIFIED: ${task.proofNote}`,
          at: new Date().toISOString()
        });

        // Reset bin fill level
        const binId = complaint.bin?._id || complaint.bin;
        const bin = db.bins.find((b) => b._id === binId);
        if (bin) {
          bin.fillLevel = 5;
          bin.lastCollectedAt = new Date().toISOString();
        }

        // Notify citizen
        const reporterId = complaint.reporter?._id || complaint.reporter;
        if (reporterId) {
          db.notifications.unshift({
            _id: `notif_${Date.now()}`,
            user: reporterId,
            type: 'complaint_collected',
            title: 'Your Report Has Been Closed-Loop Verified! ✅',
            message: `The waste reported at ${complaint.areaName || 'your reported location'} has been completely cleared by the sanitation team.`,
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

  const err = new Error(`Route ${method} ${path} not found`);
  err.status = 404;
  throw err;
};
