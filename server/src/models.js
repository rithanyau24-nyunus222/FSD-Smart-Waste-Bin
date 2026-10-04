import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'authority', 'collector'], default: 'citizen' },
    area: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

const BinSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    area: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    fillLevel: { type: Number, default: 0, min: 0, max: 100 },
    lastCollectedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

BinSchema.index({ location: '2dsphere' });

const HistoryItemSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ComplaintSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', default: null },
    description: { type: String, required: true, maxlength: 500, trim: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    photo: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Assigned', 'In Progress', 'Collected', 'Rejected', 'Merged'],
      default: 'Pending'
    },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    areaName: { type: String, default: '' },
    photoProof: { type: String, default: '' },
    rejectReason: { type: String, default: '' },
    duplicateCount: { type: Number, default: 0 },
    history: [HistoryItemSchema]
  },
  { timestamps: true }
);

ComplaintSchema.index({ location: '2dsphere' });

const TaskSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    collector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'collected'],
      default: 'assigned'
    },
    stopNumber: { type: Number, default: 1 },
    notes: { type: String, default: '' },
    proofNote: { type: String, default: '' },
    proofPhoto: { type: String, default: '' },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
export const Bin = mongoose.model('Bin', BinSchema);
export const Complaint = mongoose.model('Complaint', ComplaintSchema);
export const Task = mongoose.model('Task', TaskSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
