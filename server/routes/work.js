import express from 'express';
import mongoose from 'mongoose';
import { Bin, Notification, Task, Complaint, User, Photo } from '../models.js';
import { verifyToken, requireRole } from '../middleware.js';

const router = express.Router();

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------

// GET /api/notifications (latest 30 plus unread count)
router.get('/notifications', verifyToken, async (req, res, next) => {
  try {
    const items = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({ items, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/notifications/read-all', verifyToken, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// BINS
// -------------------------------------------------------------

// GET /api/bins
router.get('/bins', async (req, res, next) => {
  try {
    const bins = await Bin.find().sort({ code: 1 }).lean();
    res.json(bins);
  } catch (err) {
    next(err);
  }
});

// POST /api/bins (authority only)
router.post('/bins', verifyToken, requireRole('authority'), async (req, res, next) => {
  try {
    const { code, area, lat, lng } = req.body;
    if (!code || !area || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'code, area, lat, and lng are required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Bin.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ message: `Bin code ${cleanCode} already exists` });
    }

    const bin = await Bin.create({
      code: cleanCode,
      area: area.trim(),
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      },
      fillLevel: Math.floor(Math.random() * 40) + 10
    });

    res.status(201).json(bin);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bins/:id/simulate (authority only: random fill level 10 to 100)
router.patch('/bins/:id/simulate', verifyToken, requireRole('authority'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bin ID' });
    }

    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    bin.fillLevel = Math.floor(Math.random() * 91) + 10;
    await bin.save();

    res.json(bin);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// USERS (Collectors list for authority dropdown)
// -------------------------------------------------------------

// GET /api/users?role=collector (authority only)
router.get('/users', verifyToken, requireRole('authority'), async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('name email area role').lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// TASKS
// -------------------------------------------------------------

// POST /api/tasks (authority only, complaint must be Verified)
router.post('/tasks', verifyToken, requireRole('authority'), async (req, res, next) => {
  try {
    const { complaintId, collectorId } = req.body;
    if (!complaintId || !collectorId) {
      return res.status(400).json({ message: 'complaintId and collectorId are required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.status !== 'Verified') {
      return res.status(400).json({ message: `Complaint must be Verified before assigning. Current status: ${complaint.status}` });
    }

    const collector = await User.findOne({ _id: collectorId, role: 'collector' });
    if (!collector) {
      return res.status(404).json({ message: 'Collector not found' });
    }

    const task = await Task.create({
      complaint: complaint._id,
      collector: collector._id,
      status: 'assigned',
      assignedAt: new Date()
    });

    complaint.status = 'Assigned';
    complaint.history.push({
      status: 'Assigned',
      by: req.user.name || 'Authority',
      note: `Task assigned to collector ${collector.name}`,
      at: new Date()
    });
    await complaint.save();

    // Notify collector
    await Notification.create({
      user: collector._id,
      message: `New collection task assigned: Complaint #${complaint._id.toString().slice(-6)} in ${complaint.area}.`,
      complaint: complaint._id
    });

    // Notify reporter and followers
    const followers = [complaint.reporter, ...complaint.followers];
    for (const uid of followers) {
      await Notification.create({
        user: uid,
        message: `Complaint #${complaint._id.toString().slice(-6)} has been Assigned to a field collector.`,
        complaint: complaint._id
      });
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks (collector: own, authority: all)
router.get('/tasks', verifyToken, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'collector') {
      filter.collector = req.user.id;
    } else if (req.user.role !== 'authority') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const tasks = await Task.find(filter)
      .populate({
        path: 'complaint',
        select: 'description area severity status location bin binCode priority createdAt photos'
      })
      .populate('collector', 'name email')
      .sort({ assignedAt: -1 })
      .lean();

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id (collector only)
router.patch('/tasks/:id', verifyToken, requireRole('collector'), async (req, res, next) => {
  try {
    const { status, photoId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.collector.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update tasks assigned to you' });
    }

    const complaint = await Complaint.findById(task.complaint);
    if (!complaint) {
      return res.status(404).json({ message: 'Associated complaint not found' });
    }

    // In Progress
    if (status === 'in-progress') {
      if (task.status !== 'assigned') {
        return res.status(400).json({ message: `Cannot start task from status '${task.status}'. Must be 'assigned'.` });
      }

      task.status = 'in-progress';
      task.startedAt = new Date();
      await task.save();

      complaint.status = 'In Progress';
      complaint.history.push({
        status: 'In Progress',
        by: req.user.name || 'Collector',
        note: 'Collector has started work on site',
        at: new Date()
      });
      await complaint.save();

      const recipients = [complaint.reporter, ...complaint.followers];
      for (const uid of recipients) {
        await Notification.create({
          user: uid,
          message: `Collector is currently In Progress clearing Complaint #${complaint._id.toString().slice(-6)}.`,
          complaint: complaint._id
        });
      }

      return res.json(task);
    }

    // Collected
    if (status === 'collected') {
      if (task.status !== 'in-progress') {
        return res.status(400).json({ message: `Cannot mark collected from status '${task.status}'. Task must be 'in-progress'.` });
      }

      if (!photoId || !mongoose.Types.ObjectId.isValid(photoId)) {
        return res.status(400).json({ message: 'An after photo is required to mark task as collected' });
      }

      task.status = 'collected';
      task.completedAt = new Date();
      await task.save();

      complaint.status = 'Collected';
      complaint.collectedAt = new Date();
      complaint.photos.push({ photo: photoId, kind: 'after' });
      complaint.history.push({
        status: 'Collected',
        by: req.user.name || 'Collector',
        note: 'Waste collected and verified with after photo',
        at: new Date()
      });
      await complaint.save();

      // Reset linked bin fill level if exists
      if (complaint.bin) {
        await Bin.findByIdAndUpdate(complaint.bin, { fillLevel: Math.floor(Math.random() * 15) });
      }

      // Rule 7: Set expireAt = now + 60 days on all photos of this complaint
      const expireDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const photoIds = complaint.photos.map((p) => p.photo);
      await Photo.updateMany(
        { _id: { $in: photoIds } },
        { $set: { expireAt: expireDate } }
      );

      // Notify reporter and followers
      const recipients = [complaint.reporter, ...complaint.followers];
      for (const uid of recipients) {
        await Notification.create({
          user: uid,
          message: `Complaint #${complaint._id.toString().slice(-6)} has been Collected and cleared!`,
          complaint: complaint._id
        });
      }

      return res.json(task);
    }

    return res.status(400).json({ message: "Invalid status update. Allowed: 'in-progress' or 'collected'." });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// STATS (Authority Dashboard)
// -------------------------------------------------------------

// GET /api/stats (authority only)
router.get('/stats', verifyToken, requireRole('authority'), async (req, res, next) => {
  try {
    const statuses = ['Pending', 'Verified', 'Assigned', 'In Progress', 'Collected', 'Rejected'];
    const statusCounts = {};

    for (const st of statuses) {
      statusCounts[st] = await Complaint.countDocuments({ status: st });
    }

    const total = await Complaint.countDocuments();

    // Collected today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const collectedToday = await Complaint.countDocuments({
      status: 'Collected',
      collectedAt: { $gte: startOfToday }
    });

    // Average resolution hours for collected complaints
    const resolved = await Complaint.find({
      status: 'Collected',
      collectedAt: { $exists: true }
    }).select('createdAt collectedAt').lean();

    let avgResolutionHours = 0;
    if (resolved.length > 0) {
      const totalHours = resolved.reduce((acc, c) => {
        const diffMs = new Date(c.collectedAt) - new Date(c.createdAt);
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Number((totalHours / resolved.length).toFixed(1));
    }

    // Top 5 areas by complaint count
    const topAreasAgg = await Complaint.aggregate([
      { $group: { _id: '$area', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const topAreas = topAreasAgg.map((a) => ({ area: a._id || 'Unknown', count: a.count }));

    // Bins above 80%
    const binsAbove80 = await Bin.countDocuments({ fillLevel: { $gt: 80 } });

    res.json({
      total,
      statusCounts,
      collectedToday,
      avgResolutionHours,
      topAreas,
      binsAbove80
    });
  } catch (err) {
    next(err);
  }
});

export default router;
