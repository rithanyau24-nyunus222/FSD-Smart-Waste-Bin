import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Complaint, Photo, Bin, User, Notification, Task } from '../models.js';
import { verifyToken, requireRole } from '../middleware.js';

const router = express.Router();

const SEVERITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3
};

function calculatePriority(severity, reportCount, fillLevel) {
  const sevWeight = SEVERITY_WEIGHTS[severity] || 2;
  const count = Number(reportCount) || 1;
  const binBonus = Number(fillLevel) > 80 ? 2 : 0;
  return sevWeight + count + binBonus;
}

// -------------------------------------------------------------
// PHOTO ROUTES
// -------------------------------------------------------------

// POST /api/photos (raw binary image)
router.post(
  '/photos',
  express.raw({ type: 'image/*', limit: '300kb' }),
  async (req, res, next) => {
    try {
      const mime = req.headers['content-type'];
      if (!mime || !mime.startsWith('image/')) {
        return res.status(400).json({ message: 'Valid image Content-Type header is required' });
      }

      if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ message: 'Photo binary data is required' });
      }

      const { thumbFor } = req.query;

      // Thumbnail upload for existing photo
      if (thumbFor) {
        if (!mongoose.Types.ObjectId.isValid(thumbFor)) {
          return res.status(400).json({ message: 'Invalid thumbFor photo ID' });
        }
        const existingPhoto = await Photo.findById(thumbFor);
        if (!existingPhoto) {
          return res.status(404).json({ message: 'Target photo not found for thumbnail' });
        }

        if (!existingPhoto.thumb || existingPhoto.thumb.length === 0) {
          existingPhoto.thumb = req.body;
          await existingPhoto.save();
        }
        return res.json({ ok: true, id: existingPhoto._id });
      }

      // Main image upload with sha256 deduplication
      const hash = crypto.createHash('sha256').update(req.body).digest('hex');
      const existing = await Photo.findOne({ hash });
      if (existing) {
        return res.json({ id: existing._id, existed: true });
      }

      const photo = await Photo.create({
        hash,
        data: req.body,
        mime
      });

      res.status(201).json({ id: photo._id, existed: false });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/photos/:id (public endpoint for img tags)
router.get('/photos/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send('Invalid photo ID');
    }

    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).send('Photo not found');
    }

    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Content-Type', photo.mime || 'image/webp');

    if (req.query.thumb === '1' && photo.thumb && photo.thumb.length > 0) {
      return res.send(photo.thumb);
    }

    return res.send(photo.data);
  } catch (err) {
    next(err);
  }
});

// GET /api/photos-gallery (authority only: filter by area and before/after)
router.get('/photos-gallery', verifyToken, requireRole('authority'), async (req, res, next) => {
  try {
    const { area, kind } = req.query;
    const filter = { 'photos.0': { $exists: true } };
    if (area) filter.area = area;

    const complaints = await Complaint.find(filter)
      .select('area binCode photos description createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const result = [];
    for (const c of complaints) {
      if (c.photos && Array.isArray(c.photos)) {
        for (const p of c.photos) {
          if (!kind || p.kind === kind) {
            result.push({
              photoId: p.photo,
              kind: p.kind,
              area: c.area,
              binCode: c.binCode,
              complaintId: c._id,
              description: c.description,
              createdAt: c.createdAt
            });
          }
        }
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// COMPLAINT ROUTES
// -------------------------------------------------------------

// POST /api/complaints (citizen only)
router.post('/complaints', verifyToken, requireRole('citizen'), async (req, res, next) => {
  try {
    const { description, severity = 'medium', binId, lat, lng, photoIds, area: customArea } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ message: 'Description is required' });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Location coordinates (lat, lng) are required' });
    }

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const coordinates = [longitude, latitude];

    let linkedBin = null;
    let binCode = null;
    let area = customArea ? customArea.trim() : 'Chennai Central';

    if (binId && mongoose.Types.ObjectId.isValid(binId)) {
      linkedBin = await Bin.findById(binId);
      if (linkedBin) {
        binCode = linkedBin.code;
        area = linkedBin.area;
      }
    }

    // Duplicate Check Rule:
    // 1. Same open complaint on same bin
    // 2. Fallback: 30m $near query on open complaints
    let duplicate = null;
    const openStatusFilter = { status: { $nin: ['Collected', 'Rejected'] } };

    if (linkedBin) {
      duplicate = await Complaint.findOne({
        bin: linkedBin._id,
        ...openStatusFilter
      });
    }

    if (!duplicate) {
      duplicate = await Complaint.findOne({
        ...openStatusFilter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates },
            $maxDistance: 30
          }
        }
      });
    }

    // Merge duplicate complaint
    if (duplicate) {
      duplicate.reportCount += 1;

      const userIdStr = req.user.id.toString();
      const isReporter = duplicate.reporter.toString() === userIdStr;
      const isFollower = duplicate.followers.some((f) => f.toString() === userIdStr);

      if (!isReporter && !isFollower) {
        duplicate.followers.push(req.user.id);
      }

      duplicate.history.push({
        status: duplicate.status,
        by: req.user.name || 'Citizen',
        note: 'Duplicate report merged',
        at: new Date()
      });

      // Recalculate priority
      const binForPriority = duplicate.bin ? await Bin.findById(duplicate.bin) : null;
      duplicate.priority = calculatePriority(
        duplicate.severity,
        duplicate.reportCount,
        binForPriority ? binForPriority.fillLevel : 0
      );

      // Add photos if not already attached
      for (const pId of photoIds) {
        if (mongoose.Types.ObjectId.isValid(pId)) {
          const alreadyHas = duplicate.photos.some((p) => p.photo.toString() === pId);
          if (!alreadyHas) {
            duplicate.photos.push({ photo: pId, kind: 'before' });
          }
        }
      }

      await duplicate.save();

      // Create notification
      await Notification.create({
        user: req.user.id,
        message: `Your report was merged into existing complaint #${duplicate._id.toString().slice(-6)}. You are now following its updates.`,
        complaint: duplicate._id
      });

      return res.json({
        merged: true,
        complaintId: duplicate._id
      });
    }

    // Create new Complaint
    const priority = calculatePriority(severity, 1, linkedBin ? linkedBin.fillLevel : 0);
    const initialPhotos = photoIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => ({ photo: id, kind: 'before' }));

    const complaint = await Complaint.create({
      reporter: req.user.id,
      followers: [],
      bin: linkedBin ? linkedBin._id : undefined,
      binCode: binCode || undefined,
      area,
      description: description.trim(),
      severity,
      location: {
        type: 'Point',
        coordinates
      },
      photos: initialPhotos,
      status: 'Pending',
      reportCount: 1,
      priority,
      history: [
        {
          status: 'Pending',
          by: req.user.name || 'Citizen',
          note: 'Complaint reported with photo and map pin',
          at: new Date()
        }
      ]
    });

    // Notify reporter
    await Notification.create({
      user: req.user.id,
      message: `Complaint #${complaint._id.toString().slice(-6)} was submitted successfully.`,
      complaint: complaint._id
    });

    res.status(201).json({
      merged: false,
      complaintId: complaint._id
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/complaints (paginated, role-aware, no heavy image data)
router.get('/complaints', verifyToken, async (req, res, next) => {
  try {
    const { status, area, page = 1 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = 20;
    const skip = (pageNum - 1) * limit;

    const filter = {};

    // Role-based visibility
    if (req.user.role === 'citizen') {
      filter.$or = [
        { reporter: req.user.id },
        { followers: req.user.id }
      ];
    } else if (req.user.role === 'collector') {
      const assignedTasks = await Task.find({ collector: req.user.id }).select('complaint').lean();
      const complaintIds = assignedTasks.map((t) => t.complaint);
      filter._id = { $in: complaintIds };
    }
    // Authorities see all complaints

    if (status) {
      filter.status = status;
    }
    if (area) {
      filter.area = area;
    }

    const total = await Complaint.countDocuments(filter);
    const items = await Complaint.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();

    res.json({
      items,
      total,
      page: pageNum
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/complaints/:id (allowed roles only)
router.get('/complaints/:id', verifyToken, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID' });
    }

    const complaint = await Complaint.findById(req.params.id)
      .populate('reporter', 'name email area')
      .populate('followers', 'name email')
      .populate('bin', 'code area fillLevel location')
      .lean();

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role access authorization check
    if (req.user.role === 'citizen') {
      const isReporter = complaint.reporter && complaint.reporter._id.toString() === req.user.id;
      const isFollower = complaint.followers && complaint.followers.some((f) => f._id.toString() === req.user.id);
      if (!isReporter && !isFollower) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own or followed complaints' });
      }
    } else if (req.user.role === 'collector') {
      const task = await Task.findOne({ complaint: complaint._id, collector: req.user.id });
      if (!task) {
        return res.status(403).json({ message: 'Forbidden: You are not assigned to this complaint' });
      }
    }

    res.json(complaint);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/complaints/:id (authority only: verify or reject)
router.patch('/complaints/:id', verifyToken, requireRole('authority'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const { action, severity, priority, reason } = req.body;

    // Verify Action
    if (action === 'verify') {
      if (complaint.status !== 'Pending') {
        return res.status(400).json({ message: `Cannot verify complaint in '${complaint.status}' status. Only Pending complaints can be verified.` });
      }

      if (severity && ['low', 'medium', 'high'].includes(severity)) {
        complaint.severity = severity;
      }

      if (priority !== undefined && !isNaN(priority)) {
        complaint.priority = Number(priority);
      } else {
        const binDoc = complaint.bin ? await Bin.findById(complaint.bin) : null;
        complaint.priority = calculatePriority(
          complaint.severity,
          complaint.reportCount,
          binDoc ? binDoc.fillLevel : 0
        );
      }

      complaint.status = 'Verified';
      complaint.history.push({
        status: 'Verified',
        by: req.user.name || 'Authority',
        note: 'Complaint verified and prioritized',
        at: new Date()
      });

      await complaint.save();

      // Notifications for reporter and all followers
      const recipients = [complaint.reporter, ...complaint.followers];
      for (const recipientId of recipients) {
        await Notification.create({
          user: recipientId,
          message: `Complaint #${complaint._id.toString().slice(-6)} has been Verified by city authorities.`,
          complaint: complaint._id
        });
      }

      return res.json(complaint);
    }

    // Reject Action
    if (action === 'reject') {
      if (complaint.status !== 'Pending') {
        return res.status(400).json({ message: `Cannot reject complaint in '${complaint.status}' status. Rejection is only allowed from Pending.` });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ message: 'A rejection reason is required' });
      }

      complaint.status = 'Rejected';
      complaint.rejectReason = reason.trim();
      complaint.history.push({
        status: 'Rejected',
        by: req.user.name || 'Authority',
        note: reason.trim(),
        at: new Date()
      });

      await complaint.save();

      // Notifications for reporter and followers
      const recipients = [complaint.reporter, ...complaint.followers];
      for (const recipientId of recipients) {
        await Notification.create({
          user: recipientId,
          message: `Complaint #${complaint._id.toString().slice(-6)} was Rejected: ${reason.trim()}`,
          complaint: complaint._id
        });
      }

      return res.json(complaint);
    }

    return res.status(400).json({ message: "Invalid action. Supported actions are 'verify' or 'reject'." });
  } catch (err) {
    next(err);
  }
});

export default router;
