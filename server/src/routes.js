import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Bin, Complaint, Task, Notification } from './models.js';
import { protect, authorize, upload, asyncHandler } from './middleware.js';

const router = express.Router();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_waste_bin_jwt_key_2026', {
    expiresIn: '7d'
  });
};

/* =====================================================
   AUTH ROUTES
   ===================================================== */

router.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, area } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Registration ALWAYS creates citizen role
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'citizen',
      area: area ? area.trim() : ''
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area
      }
    });
  })
);

router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area
      }
    });
  })
);

router.get(
  '/auth/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

/* =====================================================
   COMPLAINTS ROUTES
   ===================================================== */

router.post(
  '/complaints',
  protect,
  authorize('citizen'),
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    const { description, severity, lat, lng, confirmDuplicate } = req.body;

    if (!description || !severity || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Description, severity, latitude, and longitude are required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ message: 'Invalid coordinates provided' });
    }

    if (!['low', 'medium', 'high'].includes(severity)) {
      return res.status(400).json({ message: 'Severity must be low, medium, or high' });
    }

    if (description.length > 500) {
      return res.status(400).json({ message: 'Description cannot exceed 500 characters' });
    }

    const coordinates = [parsedLng, parsedLat];

    // Duplicate check: within 30m, open complaints (not Collected or Rejected)
    if (confirmDuplicate !== 'true' && confirmDuplicate !== true) {
      const duplicateComplaint = await Complaint.findOne({
        status: { $nin: ['Collected', 'Rejected'] },
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates },
            $maxDistance: 30 // 30 meters
          }
        }
      });

      if (duplicateComplaint) {
        return res.status(409).json({
          duplicate: true,
          complaint: duplicateComplaint,
          message: 'A similar report already exists within 30 meters. Report anyway?'
        });
      }
    }

    // Nearest bin within 60m
    const nearestBin = await Bin.findOne({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: 60 // 60 meters
        }
      }
    });

    // Open complaints within 100m
    const openNearCount = await Complaint.countDocuments({
      status: { $nin: ['Collected', 'Rejected'] },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: 100
        }
      }
    });

    // Priority suggestion formula:
    // severity weight (low: 1, medium: 2, high: 3)
    // + 2 if bin.fillLevel > 80
    // + min(open complaints within 100m, 2)
    // score >= 6 -> critical, >= 4 -> high, >= 3 -> medium, else low
    const severityWeight = severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
    const binBonus = nearestBin && nearestBin.fillLevel > 80 ? 2 : 0;
    const nearBonus = Math.min(openNearCount, 2);
    const score = severityWeight + binBonus + nearBonus;

    let priority = 'low';
    if (score >= 6) priority = 'critical';
    else if (score >= 4) priority = 'high';
    else if (score >= 3) priority = 'medium';

    const photoPath = req.file ? `/uploads/${req.file.filename}` : '';

    const complaint = await Complaint.create({
      reporter: req.user._id,
      bin: nearestBin ? nearestBin._id : null,
      description: description.trim(),
      severity,
      priority,
      photo: photoPath,
      location: { type: 'Point', coordinates },
      status: 'Pending',
      history: [
        {
          status: 'Pending',
          by: req.user._id,
          note: 'Report submitted by citizen',
          at: new Date()
        }
      ]
    });

    await Notification.create({
      user: req.user._id,
      message: 'Your report was submitted successfully and is pending verification.'
    });

    res.status(201).json(complaint);
  })
);

router.get(
  '/complaints',
  protect,
  asyncHandler(async (req, res) => {
    let query = {};

    if (req.user.role === 'citizen') {
      query.reporter = req.user._id;
    } else if (req.user.role === 'authority') {
      const { status, priority, area, search } = req.query;

      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (search) {
        query.description = { $regex: search.trim(), $options: 'i' };
      }

      if (area) {
        // Find bins matching area
        const matchedBins = await Bin.find({ area: { $regex: area.trim(), $options: 'i' } }).select('_id');
        const binIds = matchedBins.map((b) => b._id);
        query.$or = [{ bin: { $in: binIds } }, { description: { $regex: area.trim(), $options: 'i' } }];
      }
    } else {
      // Collectors do not have access to general complaints list
      return res.status(403).json({ message: 'Forbidden: Collectors access tasks via /api/tasks' });
    }

    const complaints = await Complaint.find(query)
      .populate('reporter', 'name email area')
      .populate('bin', 'code area address fillLevel')
      .populate('history.by', 'name role')
      .sort({ createdAt: -1 });

    res.json(complaints);
  })
);

router.get(
  '/complaints/:id',
  protect,
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id)
      .populate('reporter', 'name email area')
      .populate('bin', 'code area address fillLevel location')
      .populate('history.by', 'name role');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role check: Only owner citizen or authority can view
    if (req.user.role === 'citizen' && complaint.reporter._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own complaints' });
    }

    if (req.user.role === 'collector') {
      // Check if this complaint is assigned to this collector
      const task = await Task.findOne({ complaint: complaint._id, collector: req.user._id });
      if (!task) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this complaint' });
      }
    }

    res.json(complaint);
  })
);

router.patch(
  '/complaints/:id/verify',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot verify complaint in '${complaint.status}' status. Only Pending can be verified.` });
    }

    if (req.body.priority && ['low', 'medium', 'high', 'critical'].includes(req.body.priority)) {
      complaint.priority = req.body.priority;
    }

    complaint.status = 'Verified';
    complaint.history.push({
      status: 'Verified',
      by: req.user._id,
      note: 'Report verified by authority',
      at: new Date()
    });

    await complaint.save();

    await Notification.create({
      user: complaint.reporter,
      message: 'Your report was verified.'
    });

    res.json(complaint);
  })
);

router.patch(
  '/complaints/:id/reject',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot reject complaint in '${complaint.status}' status. Only Pending can be rejected.` });
    }

    complaint.status = 'Rejected';
    complaint.rejectReason = reason.trim();
    complaint.history.push({
      status: 'Rejected',
      by: req.user._id,
      note: `Rejected: ${reason.trim()}`,
      at: new Date()
    });

    await complaint.save();

    await Notification.create({
      user: complaint.reporter,
      message: `Your report was rejected: ${reason.trim()}`
    });

    res.json(complaint);
  })
);

// Duplicate detection within 50 meters
router.get(
  '/complaints/duplicates',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const openComplaints = await Complaint.find({ status: { $in: ['Pending', 'Verified'] } })
      .populate('reporter', 'name email area')
      .populate('bin', 'code area address');

    const duplicatePairs = [];

    for (let i = 0; i < openComplaints.length; i++) {
      for (let j = i + 1; j < openComplaints.length; j++) {
        const c1 = openComplaints[i];
        const c2 = openComplaints[j];

        if (c1.location?.coordinates && c2.location?.coordinates) {
          const [lon1, lat1] = c1.location.coordinates;
          const [lon2, lat2] = c2.location.coordinates;
          // Approximate distance formula in meters
          const dLat = (lat2 - lat1) * 111320;
          const dLon = (lon2 - lon1) * 111320 * Math.cos(lat1 * (Math.PI / 180));
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);

          if (dist <= 50) {
            duplicatePairs.push({
              primary: c1,
              duplicate: c2,
              distanceMeters: Math.round(dist)
            });
          }
        }
      }
    }

    res.json(duplicatePairs);
  })
);

// Merge duplicate complaint
router.post(
  '/complaints/merge-duplicates',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const { primaryId, duplicateId } = req.body;
    const primary = await Complaint.findById(primaryId);
    const duplicate = await Complaint.findById(duplicateId);

    if (!primary || !duplicate) {
      return res.status(404).json({ message: 'Primary or duplicate complaint not found' });
    }

    duplicate.status = 'Merged';
    duplicate.history.push({
      status: 'Merged',
      by: req.user._id,
      note: `Merged into primary ticket #${primary._id} by Municipal Authority`,
      at: new Date()
    });
    await duplicate.save();

    primary.duplicateCount = (primary.duplicateCount || 0) + 1;
    primary.history.push({
      status: primary.status,
      by: req.user._id,
      note: `Linked duplicate report #${duplicate._id}. Consolidated into single dispatch.`,
      at: new Date()
    });
    await primary.save();

    res.json({ success: true, primary, duplicate });
  })
);

// Assess hazard risk level
router.patch(
  '/complaints/:id/risk',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const { riskLevel } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.riskLevel = riskLevel || 'medium';
    complaint.priority = riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'high' : 'medium';
    complaint.status = 'Verified';
    complaint.history.push({
      status: 'Verified',
      by: req.user._id,
      note: `Hazard risk assessed as ${complaint.riskLevel.toUpperCase()} by Municipal Authority`,
      at: new Date()
    });
    await complaint.save();

    res.json(complaint);
  })
);

/* =====================================================
   USERS / COLLECTORS
   ===================================================== */

router.get(
  '/users/collectors',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const collectors = await User.find({ role: 'collector' }).select('name email area');
    res.json(collectors);
  })
);

/* =====================================================
   TASKS ROUTES
   ===================================================== */

router.post(
  '/tasks',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const { complaintId, collectorId } = req.body;

    if (!complaintId || !collectorId) {
      return res.status(400).json({ message: 'complaintId and collectorId are required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!['Pending', 'Verified'].includes(complaint.status)) {
      return res.status(400).json({ message: `Cannot assign task for complaint in '${complaint.status}' status.` });
    }

    const collector = await User.findOne({ _id: collectorId, role: 'collector' });
    if (!collector) {
      return res.status(404).json({ message: 'Collector not found' });
    }

    complaint.status = 'Assigned';
    complaint.history.push({
      status: 'Assigned',
      by: req.user._id,
      note: `Assigned to collector ${collector.name}`,
      at: new Date()
    });
    await complaint.save();

    const task = await Task.create({
      complaint: complaint._id,
      collector: collector._id,
      assignedBy: req.user._id,
      status: 'assigned',
      assignedAt: new Date()
    });

    // Notify reporter & collector
    await Notification.create({
      user: complaint.reporter,
      message: `Your report has been assigned to a collector (${collector.name}).`
    });

    await Notification.create({
      user: collector._id,
      message: `New collection task assigned to you in ${complaint.description.slice(0, 30)}...`
    });

    res.status(201).json(task);
  })
);

router.get(
  '/tasks',
  protect,
  authorize('collector', 'authority'),
  asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role === 'collector') {
      query.collector = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate({
        path: 'complaint',
        populate: [
          { path: 'reporter', select: 'name email area' },
          { path: 'bin', select: 'code area address fillLevel' }
        ]
      })
      .populate('collector', 'name email area')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  })
);

router.patch(
  '/tasks/:id/status',
  protect,
  authorize('collector'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['in_progress', 'collected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'in_progress' or 'collected'" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own tasks' });
    }

    const complaint = await Complaint.findById(task.complaint);
    if (!complaint) {
      return res.status(404).json({ message: 'Linked complaint not found' });
    }

    if (status === 'in_progress') {
      if (task.status !== 'assigned') {
        return res.status(400).json({ message: `Cannot transition task from '${task.status}' to 'in_progress'` });
      }
      task.status = 'in_progress';
      complaint.status = 'In Progress';
      complaint.history.push({
        status: 'In Progress',
        by: req.user._id,
        note: 'Collector has started collection',
        at: new Date()
      });

      await Notification.create({
        user: complaint.reporter,
        message: 'Collector is on the way to collect the waste.'
      });
    } else if (status === 'collected') {
      if (task.status !== 'in_progress' && task.status !== 'assigned') {
        return res.status(400).json({ message: `Cannot transition task from '${task.status}' to 'collected'` });
      }
      task.status = 'collected';
      task.completedAt = new Date();
      task.proofNote = req.body.proofNote || 'Waste successfully collected and spot swept';
      task.proofPhoto = req.body.proofPhoto || '';

      complaint.status = 'Collected';
      complaint.photoProof = task.proofPhoto;
      complaint.history.push({
        status: 'Collected',
        by: req.user._id,
        note: `CLOSED LOOP VERIFIED: ${task.proofNote}`,
        at: new Date()
      });

      // Reset linked bin fillLevel to 5 and lastCollectedAt to now
      if (complaint.bin) {
        await Bin.findByIdAndUpdate(complaint.bin, {
          fillLevel: 5,
          lastCollectedAt: new Date()
        });
      }

      await Notification.create({
        user: complaint.reporter,
        message: 'Your report has been closed-loop verified and collected. Thank you!'
      });
    }

    await task.save();
    await complaint.save();

    res.json({ task, complaint });
  })
);

/* =====================================================
   BINS & SIMULATION ROUTES
   ===================================================== */

router.get(
  '/bins',
  protect,
  asyncHandler(async (req, res) => {
    const bins = await Bin.find({}).sort({ code: 1 });
    res.json(bins);
  })
);

router.post(
  '/bins/simulate',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const bins = await Bin.find({});
    let updatedCount = 0;

    for (const bin of bins) {
      // randomly raise about 50% of the bins by 5-30 points (max 100)
      if (Math.random() > 0.4) {
        const increment = Math.floor(Math.random() * 26) + 5; // 5 to 30
        bin.fillLevel = Math.min(100, bin.fillLevel + increment);
        await bin.save();
        updatedCount++;
      }
    }

    const updatedBins = await Bin.find({}).sort({ code: 1 });
    res.json({ message: `Simulated sensor telemetry on ${updatedCount} bins`, bins: updatedBins });
  })
);

/* =====================================================
   STATS & ANALYTICS
   ===================================================== */

router.get(
  '/stats',
  protect,
  authorize('authority'),
  asyncHandler(async (req, res) => {
    const [pending, verified, assigned, inProgress, collected, rejected] = await Promise.all([
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'Verified' }),
      Complaint.countDocuments({ status: 'Assigned' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Collected' }),
      Complaint.countDocuments({ status: 'Rejected' })
    ]);

    const [low, medium, high, critical] = await Promise.all([
      Complaint.countDocuments({ priority: 'low' }),
      Complaint.countDocuments({ priority: 'medium' }),
      Complaint.countDocuments({ priority: 'high' }),
      Complaint.countDocuments({ priority: 'critical' })
    ]);

    const totalBins = await Bin.countDocuments();
    const fullBins = await Bin.countDocuments({ fillLevel: { $gt: 80 } });

    // Last 7 days complaints activity
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const count = await Complaint.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      last7Days.push({
        date: dateStr,
        label: `${d.toLocaleDateString('en-US', { weekday: 'short' })}`,
        count
      });
    }

    res.json({
      statusCounts: {
        pending,
        verified,
        assigned,
        inProgress,
        collected,
        rejected
      },
      priorityCounts: {
        low,
        medium,
        high,
        critical
      },
      totalBins,
      fullBins,
      last7Days
    });
  })
);

router.get(
  '/stats/public',
  asyncHandler(async (req, res) => {
    const [totalComplaints, collectedComplaints, totalBins] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Collected' }),
      Bin.countDocuments()
    ]);

    res.json({
      totalComplaints,
      collectedComplaints,
      totalBins
    });
  })
);

/* =====================================================
   NOTIFICATIONS ROUTES
   ===================================================== */

router.get(
  '/notifications',
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  })
);

router.patch(
  '/notifications/read',
  protect,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  })
);

export default router;
