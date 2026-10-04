import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'authority', 'collector'], required: true },
  area: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const binSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  area: { type: String, required: true, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  fillLevel: { type: Number, min: 0, max: 100, default: 0 }
});
binSchema.index({ location: '2dsphere' });

const photoSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  data: { type: Buffer, required: true },
  thumb: { type: Buffer },
  mime: { type: String, default: 'image/webp' },
  expireAt: { type: Date }
});
photoSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const complaintSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
  binCode: { type: String, trim: true },
  area: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  photos: [{
    photo: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: true },
    kind: { type: String, enum: ['before', 'after'], default: 'before' }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Assigned', 'In Progress', 'Collected', 'Rejected'],
    default: 'Pending'
  },
  rejectReason: { type: String },
  reportCount: { type: Number, default: 1 },
  priority: { type: Number, default: 1 },
  history: [{
    status: { type: String, required: true },
    by: { type: String, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now }
  }],
  collectedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1 });
complaintSchema.index({ reporter: 1 });
complaintSchema.index({ followers: 1 });

const taskSchema = new mongoose.Schema({
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  collector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['assigned', 'in-progress', 'collected'], default: 'assigned' },
  assignedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date }
});

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export const Bin = mongoose.model('Bin', binSchema);
export const Photo = mongoose.model('Photo', photoSchema);
export const Complaint = mongoose.model('Complaint', complaintSchema);
export const Task = mongoose.model('Task', taskSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
