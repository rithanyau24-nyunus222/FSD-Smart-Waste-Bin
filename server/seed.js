/**
 * Smart Waste Bin Monitoring & Collection System
 * Database Seed Script
 *
 * WARNING: Running this script will completely wipe existing data in the
 * Users, Bins, Complaints, Tasks, Notifications, and Photos collections!
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Bin, Complaint, Task, Notification, Photo } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-waste';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database.');

    // 1. Clear all collections
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Bin.deleteMany({}),
      Complaint.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({}),
      Photo.deleteMany({})
    ]);

    // 2. Hash password for demo users
    const defaultPassword = 'Demo@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 3. Create Users
    console.log('Seeding demo users...');
    const users = await User.create([
      {
        name: 'City Admin',
        email: 'authority@demo.com',
        passwordHash,
        role: 'authority',
        area: 'Chennai Central'
      },
      {
        name: 'Ravi Kumar',
        email: 'collector@demo.com',
        passwordHash,
        role: 'collector',
        area: 'Adyar Zone'
      },
      {
        name: 'Suresh Raina',
        email: 'collector2@demo.com',
        passwordHash,
        role: 'collector',
        area: 'T. Nagar Zone'
      },
      {
        name: 'Rithanya',
        email: 'citizen@demo.com',
        passwordHash,
        role: 'citizen',
        area: 'Mylapore'
      },
      {
        name: 'Karthik Raja',
        email: 'citizen2@demo.com',
        passwordHash,
        role: 'citizen',
        area: 'Anna Nagar'
      }
    ]);

    const authorityUser = users[0];
    const collector1 = users[1];
    const collector2 = users[2];
    const citizen1 = users[3];
    const citizen2 = users[4];

    // 4. Create 15 Bins in Chennai (varied fill levels, several > 80%)
    // Note: Coordinates in GeoJSON are [longitude, latitude]
    console.log('Seeding 15 Chennai smart bins...');
    const bins = await Bin.create([
      { code: 'BIN-001', area: 'Anna Nagar', location: { type: 'Point', coordinates: [80.2101, 13.0850] }, fillLevel: 85 },
      { code: 'BIN-002', area: 'T. Nagar', location: { type: 'Point', coordinates: [80.2341, 13.0418] }, fillLevel: 92 },
      { code: 'BIN-003', area: 'Adyar', location: { type: 'Point', coordinates: [80.2565, 13.0012] }, fillLevel: 45 },
      { code: 'BIN-004', area: 'Velachery', location: { type: 'Point', coordinates: [80.2180, 12.9815] }, fillLevel: 88 },
      { code: 'BIN-005', area: 'Mylapore', location: { type: 'Point', coordinates: [80.2676, 13.0368] }, fillLevel: 60 },
      { code: 'BIN-006', area: 'Guindy', location: { type: 'Point', coordinates: [80.2206, 13.0067] }, fillLevel: 75 },
      { code: 'BIN-007', area: 'Tambaram', location: { type: 'Point', coordinates: [80.1000, 12.9249] }, fillLevel: 30 },
      { code: 'BIN-008', area: 'Porur', location: { type: 'Point', coordinates: [80.1565, 13.0382] }, fillLevel: 82 },
      { code: 'BIN-009', area: 'Kodambakkam', location: { type: 'Point', coordinates: [80.2255, 13.0521] }, fillLevel: 55 },
      { code: 'BIN-010', area: 'Perambur', location: { type: 'Point', coordinates: [80.2328, 13.1186] }, fillLevel: 90 },
      { code: 'BIN-011', area: 'Egmore', location: { type: 'Point', coordinates: [80.2609, 13.0732] }, fillLevel: 40 },
      { code: 'BIN-012', area: 'Besant Nagar', location: { type: 'Point', coordinates: [80.2667, 13.0003] }, fillLevel: 25 },
      { code: 'BIN-013', area: 'Nungambakkam', location: { type: 'Point', coordinates: [80.2425, 13.0569] }, fillLevel: 84 },
      { code: 'BIN-014', area: 'Washermanpet', location: { type: 'Point', coordinates: [80.2806, 13.1067] }, fillLevel: 68 },
      { code: 'BIN-015', area: 'Sholinganallur', location: { type: 'Point', coordinates: [80.2279, 12.9010] }, fillLevel: 35 }
    ]);

    // 5. Create 8 Complaints across all statuses with realistic history
    console.log('Seeding 8 complaints across statuses...');
    const now = Date.now();
    const oneHour = 3600 * 1000;

    const complaints = await Complaint.create([
      // 1. Pending (T. Nagar - Critical >80%)
      {
        reporter: citizen1._id,
        followers: [citizen2._id],
        bin: bins[1]._id,
        binCode: bins[1].code,
        area: bins[1].area,
        description: 'Large public bin severely overflowing onto pedestrian walkway near shopping complex.',
        severity: 'high',
        location: bins[1].location,
        photos: [],
        status: 'Pending',
        reportCount: 2,
        priority: 7, // 3 + 2 + 2 (fill > 80)
        history: [
          { status: 'Pending', by: citizen1.name, note: 'Initial citizen report submitted', at: new Date(now - 4 * oneHour) },
          { status: 'Pending', by: citizen2.name, note: 'Duplicate report merged', at: new Date(now - 2 * oneHour) }
        ],
        createdAt: new Date(now - 4 * oneHour)
      },

      // 2. Pending (Perambur - Critical >80%)
      {
        reporter: citizen2._id,
        followers: [],
        bin: bins[9]._id,
        binCode: bins[9].code,
        area: bins[9].area,
        description: 'Commercial waste piling up around railway station bin. Stray animals gathering.',
        severity: 'high',
        location: bins[9].location,
        photos: [],
        status: 'Pending',
        reportCount: 1,
        priority: 6, // 3 + 1 + 2
        history: [
          { status: 'Pending', by: citizen2.name, note: 'Report submitted via mobile pin', at: new Date(now - 3 * oneHour) }
        ],
        createdAt: new Date(now - 3 * oneHour)
      },

      // 3. Verified (Velachery - Critical >80%)
      {
        reporter: citizen1._id,
        followers: [],
        bin: bins[3]._id,
        binCode: bins[3].code,
        area: bins[3].area,
        description: 'Wet waste overflowing near market entrance, creating foul smell.',
        severity: 'medium',
        location: bins[3].location,
        photos: [],
        status: 'Verified',
        reportCount: 1,
        priority: 5, // 2 + 1 + 2
        history: [
          { status: 'Pending', by: citizen1.name, note: 'Complaint reported with map pin', at: new Date(now - 6 * oneHour) },
          { status: 'Verified', by: authorityUser.name, note: 'Verified by sanitation inspector', at: new Date(now - 5 * oneHour) }
        ],
        createdAt: new Date(now - 6 * oneHour)
      },

      // 4. Assigned (Anna Nagar - Assigned to Ravi)
      {
        reporter: citizen2._id,
        followers: [citizen1._id],
        bin: bins[0]._id,
        binCode: bins[0].code,
        area: bins[0].area,
        description: 'Overflowing residential bin near 2nd Avenue junction. Road partially blocked.',
        severity: 'high',
        location: bins[0].location,
        photos: [],
        status: 'Assigned',
        reportCount: 2,
        priority: 7, // 3 + 2 + 2
        history: [
          { status: 'Pending', by: citizen2.name, note: 'Reported by local resident', at: new Date(now - 8 * oneHour) },
          { status: 'Pending', by: citizen1.name, note: 'Duplicate report merged', at: new Date(now - 7 * oneHour) },
          { status: 'Verified', by: authorityUser.name, note: 'Approved for urgent clearance', at: new Date(now - 5 * oneHour) },
          { status: 'Assigned', by: authorityUser.name, note: `Task assigned to collector ${collector1.name}`, at: new Date(now - 4 * oneHour) }
        ],
        createdAt: new Date(now - 8 * oneHour)
      },

      // 5. In Progress (Nungambakkam - Started by Suresh)
      {
        reporter: citizen1._id,
        followers: [],
        bin: bins[12]._id,
        binCode: bins[12].code,
        area: bins[12].area,
        description: 'Overflowing bins on College Road near campus bus stop.',
        severity: 'medium',
        location: bins[12].location,
        photos: [],
        status: 'In Progress',
        reportCount: 1,
        priority: 5,
        history: [
          { status: 'Pending', by: citizen1.name, note: 'Reported by commuter', at: new Date(now - 5 * oneHour) },
          { status: 'Verified', by: authorityUser.name, note: 'Verified by central control', at: new Date(now - 4 * oneHour) },
          { status: 'Assigned', by: authorityUser.name, note: `Dispatched to ${collector2.name}`, at: new Date(now - 3 * oneHour) },
          { status: 'In Progress', by: collector2.name, note: 'Collector arrived on site and commenced cleaning', at: new Date(now - 1 * oneHour) }
        ],
        createdAt: new Date(now - 5 * oneHour)
      },

      // 6. Collected Today (Adyar - Cleared by Ravi)
      {
        reporter: citizen1._id,
        followers: [],
        bin: bins[2]._id,
        binCode: bins[2].code,
        area: bins[2].area,
        description: 'Dry leaves and packaging overflow near bus terminal cleared.',
        severity: 'medium',
        location: bins[2].location,
        photos: [],
        status: 'Collected',
        reportCount: 1,
        priority: 3,
        collectedAt: new Date(now - 1 * oneHour),
        history: [
          { status: 'Pending', by: citizen1.name, note: 'Reported', at: new Date(now - 6 * oneHour) },
          { status: 'Verified', by: authorityUser.name, note: 'Verified', at: new Date(now - 4 * oneHour) },
          { status: 'Assigned', by: authorityUser.name, note: `Assigned to ${collector1.name}`, at: new Date(now - 3 * oneHour) },
          { status: 'In Progress', by: collector1.name, note: 'Work commenced', at: new Date(now - 2 * oneHour) },
          { status: 'Collected', by: collector1.name, note: 'Waste completely cleared and bin sanitized', at: new Date(now - 1 * oneHour) }
        ],
        createdAt: new Date(now - 6 * oneHour)
      },

      // 7. Collected Today (Guindy - Cleared by Suresh)
      {
        reporter: citizen2._id,
        followers: [],
        bin: bins[5]._id,
        binCode: bins[5].code,
        area: bins[5].area,
        description: 'Industrial estate corner bin overflow cleared.',
        severity: 'low',
        location: bins[5].location,
        photos: [],
        status: 'Collected',
        reportCount: 1,
        priority: 2,
        collectedAt: new Date(now - 2 * oneHour),
        history: [
          { status: 'Pending', by: citizen2.name, note: 'Reported', at: new Date(now - 7 * oneHour) },
          { status: 'Verified', by: authorityUser.name, note: 'Verified', at: new Date(now - 5 * oneHour) },
          { status: 'Assigned', by: authorityUser.name, note: `Assigned to ${collector2.name}`, at: new Date(now - 4 * oneHour) },
          { status: 'In Progress', by: collector2.name, note: 'Cleaning started', at: new Date(now - 3 * oneHour) },
          { status: 'Collected', by: collector2.name, note: 'Cleared and collected', at: new Date(now - 2 * oneHour) }
        ],
        createdAt: new Date(now - 7 * oneHour)
      },

      // 8. Rejected (Besant Nagar - Outside municipal purview)
      {
        reporter: citizen1._id,
        followers: [],
        bin: bins[11]._id,
        binCode: bins[11].code,
        area: bins[11].area,
        description: 'Private hotel backyard garbage dump.',
        severity: 'low',
        location: bins[11].location,
        photos: [],
        status: 'Rejected',
        rejectReason: 'Private property: Commercial establishment is responsible for private waste management.',
        reportCount: 1,
        priority: 2,
        history: [
          { status: 'Pending', by: citizen1.name, note: 'Report submitted', at: new Date(now - 10 * oneHour) },
          { status: 'Rejected', by: authorityUser.name, note: 'Private property: Commercial establishment is responsible for private waste management.', at: new Date(now - 8 * oneHour) }
        ],
        createdAt: new Date(now - 10 * oneHour)
      }
    ]);

    // 6. Create Tasks for Assigned, In-Progress, and Collected complaints
    console.log('Seeding collection tasks...');
    await Task.create([
      {
        complaint: complaints[3]._id, // Anna Nagar
        collector: collector1._id,
        status: 'assigned',
        assignedAt: new Date(now - 4 * oneHour)
      },
      {
        complaint: complaints[4]._id, // Nungambakkam
        collector: collector2._id,
        status: 'in-progress',
        assignedAt: new Date(now - 3 * oneHour),
        startedAt: new Date(now - 1 * oneHour)
      },
      {
        complaint: complaints[5]._id, // Adyar
        collector: collector1._id,
        status: 'collected',
        assignedAt: new Date(now - 3 * oneHour),
        startedAt: new Date(now - 2 * oneHour),
        completedAt: new Date(now - 1 * oneHour)
      },
      {
        complaint: complaints[6]._id, // Guindy
        collector: collector2._id,
        status: 'collected',
        assignedAt: new Date(now - 4 * oneHour),
        startedAt: new Date(now - 3 * oneHour),
        completedAt: new Date(now - 2 * oneHour)
      }
    ]);

    // 7. Create Notifications
    console.log('Seeding initial notifications...');
    await Notification.create([
      {
        user: citizen1._id,
        message: `Complaint #${complaints[0]._id.toString().slice(-6)} in T. Nagar was received and registered.`,
        complaint: complaints[0]._id,
        read: false
      },
      {
        user: citizen1._id,
        message: `Complaint #${complaints[2]._id.toString().slice(-6)} in Velachery was Verified by city authorities.`,
        complaint: complaints[2]._id,
        read: false
      },
      {
        user: citizen1._id,
        message: `Complaint #${complaints[5]._id.toString().slice(-6)} in Adyar has been Collected!`,
        complaint: complaints[5]._id,
        read: true
      },
      {
        user: collector1._id,
        message: `New task assigned: Complaint #${complaints[3]._id.toString().slice(-6)} in Anna Nagar.`,
        complaint: complaints[3]._id,
        read: false
      },
      {
        user: collector2._id,
        message: `New task assigned: Complaint #${complaints[4]._id.toString().slice(-6)} in Nungambakkam.`,
        complaint: complaints[4]._id,
        read: true
      }
    ]);

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
    console.log('Demo Credentials (All accounts use password: Demo@123)\n');
    console.log('1. City Authority:');
    console.log('   Email:    authority@demo.com');
    console.log('   Password: Demo@123\n');
    console.log('2. Field Collectors:');
    console.log('   Email:    collector@demo.com  (Ravi Kumar, Adyar)');
    console.log('   Email:    collector2@demo.com (Suresh Raina, T. Nagar)');
    console.log('   Password: Demo@123\n');
    console.log('3. Citizens:');
    console.log('   Email:    citizen@demo.com    (Rithanya, Mylapore)');
    console.log('   Email:    citizen2@demo.com   (Karthik Raja, Anna Nagar)');
    console.log('   Password: Demo@123\n');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
