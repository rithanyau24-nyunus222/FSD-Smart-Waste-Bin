import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, Bin, Complaint, Task, Notification } from './models.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-waste-bin';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Bin.deleteMany({}),
      Complaint.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // Ensure 2dsphere indexes
    await Bin.collection.createIndex({ location: '2dsphere' });
    await Complaint.collection.createIndex({ location: '2dsphere' });

    console.log('Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Demo@123', salt);

    const users = await User.insertMany([
      {
        name: 'Priya Sharma',
        email: 'citizen@demo.com',
        passwordHash,
        role: 'citizen',
        area: 'Adyar'
      },
      {
        name: 'Officer Karthik',
        email: 'authority@demo.com',
        passwordHash,
        role: 'authority',
        area: 'Chennai Corporation HQ'
      },
      {
        name: 'Murugan (Collector 1)',
        email: 'collector@demo.com',
        passwordHash,
        role: 'collector',
        area: 'Adyar & T. Nagar'
      },
      {
        name: 'Suresh (Collector 2)',
        email: 'collector2@demo.com',
        passwordHash,
        role: 'collector',
        area: 'Velachery & Guindy'
      },
      {
        name: 'Venkatesh (Collector 3)',
        email: 'collector3@demo.com',
        passwordHash,
        role: 'collector',
        area: 'Anna Nagar'
      }
    ]);

    const citizen = users[0];
    const authority = users[1];
    const collector1 = users[2];
    const collector2 = users[3];
    const collector3 = users[4];

    console.log('Creating 12 smart bins across Chennai...');
    // Coordinates format: [lng, lat]
    const bins = await Bin.insertMany([
      {
        code: 'BIN-AD-01',
        area: 'Adyar',
        address: 'Near Adyar Signal, L.B. Road junction',
        location: { type: 'Point', coordinates: [80.2565, 13.0012] },
        fillLevel: 92,
        lastCollectedAt: new Date(Date.now() - 48 * 3600 * 1000)
      },
      {
        code: 'BIN-AD-02',
        area: 'Adyar',
        address: 'Besant Avenue Road, near Theosophical Society',
        location: { type: 'Point', coordinates: [80.2612, 13.0045] },
        fillLevel: 68,
        lastCollectedAt: new Date(Date.now() - 24 * 3600 * 1000)
      },
      {
        code: 'BIN-TN-01',
        area: 'T. Nagar',
        address: 'Pondy Bazaar pedestrian plaza, near Panagal Park',
        location: { type: 'Point', coordinates: [80.2341, 13.0418] },
        fillLevel: 85,
        lastCollectedAt: new Date(Date.now() - 36 * 3600 * 1000)
      },
      {
        code: 'BIN-TN-02',
        area: 'T. Nagar',
        address: 'Ranganathan Street corner, Usman Road',
        location: { type: 'Point', coordinates: [80.2305, 13.0392] },
        fillLevel: 94,
        lastCollectedAt: new Date(Date.now() - 50 * 3600 * 1000)
      },
      {
        code: 'BIN-VL-01',
        area: 'Velachery',
        address: '100 Feet Bypass Road, near Bus Terminus',
        location: { type: 'Point', coordinates: [80.2180, 12.9815] },
        fillLevel: 55,
        lastCollectedAt: new Date(Date.now() - 16 * 3600 * 1000)
      },
      {
        code: 'BIN-VL-02',
        area: 'Velachery',
        address: 'Taramani Link Road, near Phoenix Marketcity',
        location: { type: 'Point', coordinates: [80.2198, 12.9912] },
        fillLevel: 88,
        lastCollectedAt: new Date(Date.now() - 40 * 3600 * 1000)
      },
      {
        code: 'BIN-GD-01',
        area: 'Guindy',
        address: 'Kathipara Junction service lane, near Metro',
        location: { type: 'Point', coordinates: [80.2026, 13.0067] },
        fillLevel: 42,
        lastCollectedAt: new Date(Date.now() - 12 * 3600 * 1000)
      },
      {
        code: 'BIN-GD-02',
        area: 'Guindy',
        address: 'Race Course Road, near Railway Station',
        location: { type: 'Point', coordinates: [80.2115, 13.0089] },
        fillLevel: 76,
        lastCollectedAt: new Date(Date.now() - 28 * 3600 * 1000)
      },
      {
        code: 'BIN-AN-01',
        area: 'Anna Nagar',
        address: '2nd Avenue, near Anna Nagar Roundtana',
        location: { type: 'Point', coordinates: [80.2101, 13.0850] },
        fillLevel: 30,
        lastCollectedAt: new Date(Date.now() - 8 * 3600 * 1000)
      },
      {
        code: 'BIN-AN-02',
        area: 'Anna Nagar',
        address: 'Tower Park Gate 2, 3rd Main Road',
        location: { type: 'Point', coordinates: [80.2145, 13.0882] },
        fillLevel: 82,
        lastCollectedAt: new Date(Date.now() - 32 * 3600 * 1000)
      },
      {
        code: 'BIN-GN-01',
        area: 'Gandhi Nagar',
        address: 'Gandhi Nagar 4th Main Road, near Post Office',
        location: { type: 'Point', coordinates: [80.2543, 13.0084] },
        fillLevel: 45,
        lastCollectedAt: new Date(Date.now() - 14 * 3600 * 1000)
      },
      {
        code: 'BIN-GN-02',
        area: 'Gandhi Nagar',
        address: 'Kasturba Nagar 1st Cross, near MRTS',
        location: { type: 'Point', coordinates: [80.2508, 13.0051] },
        fillLevel: 15,
        lastCollectedAt: new Date(Date.now() - 4 * 3600 * 1000)
      }
    ]);

    console.log('Creating 18 realistic complaints with history...');

    const complaintsData = [
      // 1. Pending (Adyar Signal)
      {
        reporter: citizen._id,
        bin: bins[0]._id,
        description: 'Bin severely overflowing onto footpath near Adyar Signal. Pedestrians forced to walk on road.',
        severity: 'high',
        priority: 'critical',
        photo: '',
        location: { type: 'Point', coordinates: [80.2566, 13.0013] },
        status: 'Pending',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 2 * 3600 * 1000)
          }
        ]
      },
      // 2. Pending (Pondy Bazaar)
      {
        reporter: citizen._id,
        bin: bins[2]._id,
        description: 'Commercial waste and vegetable crates piled around public bin near Panagal Park.',
        severity: 'high',
        priority: 'high',
        photo: '',
        location: { type: 'Point', coordinates: [80.2343, 13.0420] },
        status: 'Pending',
        createdAt: new Date(Date.now() - 4 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 4 * 3600 * 1000)
          }
        ]
      },
      // 3. Pending (Velachery)
      {
        reporter: citizen._id,
        bin: bins[5]._id,
        description: 'Trash spilling out near Phoenix mall entrance, plastic bags blowing onto the lane.',
        severity: 'medium',
        priority: 'high',
        photo: '',
        location: { type: 'Point', coordinates: [80.2201, 12.9915] },
        status: 'Pending',
        createdAt: new Date(Date.now() - 6 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 6 * 3600 * 1000)
          }
        ]
      },
      // 4. Verified (Anna Nagar Tower)
      {
        reporter: citizen._id,
        bin: bins[9]._id,
        description: 'Tower park walkers corner bin full of plastic water bottles and snack boxes.',
        severity: 'medium',
        priority: 'high',
        photo: '',
        location: { type: 'Point', coordinates: [80.2147, 13.0884] },
        status: 'Verified',
        createdAt: new Date(Date.now() - 10 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 10 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified from sensor telemetry & morning inspection',
            at: new Date(Date.now() - 8 * 3600 * 1000)
          }
        ]
      },
      // 5. Verified (T. Nagar Ranganathan)
      {
        reporter: citizen._id,
        bin: bins[3]._id,
        description: 'Heavy street shopping waste piled around Usman road junction bin.',
        severity: 'high',
        priority: 'critical',
        photo: '',
        location: { type: 'Point', coordinates: [80.2307, 13.0394] },
        status: 'Verified',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 12 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'High pedestrian density verified; expedited collection required',
            at: new Date(Date.now() - 11 * 3600 * 1000)
          }
        ]
      },
      // 6. Assigned (Adyar Besant Ave)
      {
        reporter: citizen._id,
        bin: bins[1]._id,
        description: 'Dry tree branches and household waste accumulating around bin on Besant Avenue.',
        severity: 'medium',
        priority: 'medium',
        photo: '',
        location: { type: 'Point', coordinates: [80.2614, 13.0047] },
        status: 'Assigned',
        createdAt: new Date(Date.now() - 18 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 18 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified by zone officer',
            at: new Date(Date.now() - 16 * 3600 * 1000)
          },
          {
            status: 'Assigned',
            by: authority._id,
            note: 'Assigned to collector Murugan',
            at: new Date(Date.now() - 14 * 3600 * 1000)
          }
        ]
      },
      // 7. Assigned (Guindy Race Course)
      {
        reporter: citizen._id,
        bin: bins[7]._id,
        description: 'Bin near railway subway exit overflowing with tea cups and food containers.',
        severity: 'high',
        priority: 'high',
        photo: '',
        location: { type: 'Point', coordinates: [80.2117, 13.0091] },
        status: 'Assigned',
        createdAt: new Date(Date.now() - 20 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 20 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified by station area inspection',
            at: new Date(Date.now() - 18 * 3600 * 1000)
          },
          {
            status: 'Assigned',
            by: authority._id,
            note: 'Assigned to collector Suresh',
            at: new Date(Date.now() - 15 * 3600 * 1000)
          }
        ]
      },
      // 8. In Progress (Velachery Bypass)
      {
        reporter: citizen._id,
        bin: bins[4]._id,
        description: 'Market packaging waste spilling over roadside curb near bus terminus.',
        severity: 'medium',
        priority: 'medium',
        photo: '',
        location: { type: 'Point', coordinates: [80.2182, 12.9818] },
        status: 'In Progress',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 24 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified by sector supervisor',
            at: new Date(Date.now() - 22 * 3600 * 1000)
          },
          {
            status: 'Assigned',
            by: authority._id,
            note: 'Assigned to collector Suresh',
            at: new Date(Date.now() - 20 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            by: collector2._id,
            note: 'Collector on site with compacting truck',
            at: new Date(Date.now() - 1 * 3600 * 1000)
          }
        ]
      },
      // 9. In Progress (Anna Nagar Roundtana)
      {
        reporter: citizen._id,
        bin: bins[8]._id,
        description: 'Litter scattered near bus stop shelter.',
        severity: 'low',
        priority: 'low',
        photo: '',
        location: { type: 'Point', coordinates: [80.2103, 13.0852] },
        status: 'In Progress',
        createdAt: new Date(Date.now() - 26 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 26 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified',
            at: new Date(Date.now() - 24 * 3600 * 1000)
          },
          {
            status: 'Assigned',
            by: authority._id,
            note: 'Assigned to collector Venkatesh',
            at: new Date(Date.now() - 22 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            by: collector3._id,
            note: 'Collector arrived for cleanup',
            at: new Date(Date.now() - 30 * 60 * 1000)
          }
        ]
      },
      // 10. Collected (Adyar Gandhi Nagar 4th Main)
      {
        reporter: citizen._id,
        bin: bins[10]._id,
        description: 'Dry leaves and organic garden waste overflowing from green bin.',
        severity: 'medium',
        priority: 'medium',
        photo: '',
        location: { type: 'Point', coordinates: [80.2545, 13.0086] },
        status: 'Collected',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted by citizen',
            at: new Date(Date.now() - 36 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified',
            at: new Date(Date.now() - 34 * 3600 * 1000)
          },
          {
            status: 'Assigned',
            by: authority._id,
            note: 'Assigned to collector Murugan',
            at: new Date(Date.now() - 32 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            by: collector1._id,
            note: 'Collector on the way',
            at: new Date(Date.now() - 30 * 3600 * 1000)
          },
          {
            status: 'Collected',
            by: collector1._id,
            note: 'Bin emptied, area swept clean',
            at: new Date(Date.now() - 29 * 3600 * 1000)
          }
        ]
      },
      // 11. Collected (Guindy Kathipara)
      {
        reporter: citizen._id,
        bin: bins[6]._id,
        description: 'Plastic packaging piled up next to road barrier.',
        severity: 'low',
        priority: 'low',
        photo: '',
        location: { type: 'Point', coordinates: [80.2028, 13.0069] },
        status: 'Collected',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted',
            at: new Date(Date.now() - 48 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified',
            at: new Date(Date.now() - 46 * 3600 * 1000)
          },
          {
            status: 'Assigned',
            by: authority._id,
            note: 'Assigned to collector Suresh',
            at: new Date(Date.now() - 44 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            by: collector2._id,
            note: 'Started',
            at: new Date(Date.now() - 42 * 3600 * 1000)
          },
          {
            status: 'Collected',
            by: collector2._id,
            note: 'Collected and cleared',
            at: new Date(Date.now() - 41 * 3600 * 1000)
          }
        ]
      },
      // 12. Collected (Kasturba Nagar)
      {
        reporter: citizen._id,
        bin: bins[11]._id,
        description: 'Cartons and cardboard packaging piled outside bin.',
        severity: 'low',
        priority: 'low',
        photo: '',
        location: { type: 'Point', coordinates: [80.2510, 13.0053] },
        status: 'Collected',
        createdAt: new Date(Date.now() - 60 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted',
            at: new Date(Date.now() - 60 * 3600 * 1000)
          },
          {
            status: 'Verified',
            by: authority._id,
            note: 'Verified',
            at: new Date(Date.now() - 58 * 3600 * 1000)
          },
          {
            status: 'Assigned',
            by: authority._id,
            note: 'Assigned to collector Murugan',
            at: new Date(Date.now() - 56 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            by: collector1._id,
            note: 'In progress',
            at: new Date(Date.now() - 54 * 3600 * 1000)
          },
          {
            status: 'Collected',
            by: collector1._id,
            note: 'Cleared successfully',
            at: new Date(Date.now() - 53 * 3600 * 1000)
          }
        ]
      },
      // 13. Rejected (Adyar invalid location)
      {
        reporter: citizen._id,
        bin: null,
        description: 'Private house construction debris dumped on empty plot.',
        severity: 'low',
        priority: 'low',
        photo: '',
        location: { type: 'Point', coordinates: [80.2580, 13.0020] },
        status: 'Rejected',
        rejectReason: 'Construction debris is handled separately by the C&D waste division, not municipal bin services.',
        createdAt: new Date(Date.now() - 72 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted',
            at: new Date(Date.now() - 72 * 3600 * 1000)
          },
          {
            status: 'Rejected',
            by: authority._id,
            note: 'Rejected: Construction debris is handled separately by the C&D waste division, not municipal bin services.',
            at: new Date(Date.now() - 70 * 3600 * 1000)
          }
        ]
      },
      // 14. Rejected (Duplicate complaint test)
      {
        reporter: citizen._id,
        bin: bins[0]._id,
        description: 'Accidental duplicate test submission for Adyar signal bin.',
        severity: 'low',
        priority: 'low',
        photo: '',
        location: { type: 'Point', coordinates: [80.2567, 13.0014] },
        status: 'Rejected',
        rejectReason: 'Duplicate complaint of existing active complaint.',
        createdAt: new Date(Date.now() - 80 * 3600 * 1000),
        history: [
          {
            status: 'Pending',
            by: citizen._id,
            note: 'Report submitted',
            at: new Date(Date.now() - 80 * 3600 * 1000)
          },
          {
            status: 'Rejected',
            by: authority._id,
            note: 'Rejected: Duplicate complaint of existing active complaint.',
            at: new Date(Date.now() - 78 * 3600 * 1000)
          }
        ]
      },
      // 15. Collected (T. Nagar Panagal Park 4 days ago)
      {
        reporter: citizen._id,
        bin: bins[2]._id,
        description: 'Food stall paper plates and cups piled high.',
        severity: 'medium',
        priority: 'medium',
        photo: '',
        location: { type: 'Point', coordinates: [80.2340, 13.0416] },
        status: 'Collected',
        createdAt: new Date(Date.now() - 96 * 3600 * 1000),
        history: [
          { status: 'Pending', by: citizen._id, note: 'Submitted', at: new Date(Date.now() - 96 * 3600 * 1000) },
          { status: 'Verified', by: authority._id, note: 'Verified', at: new Date(Date.now() - 94 * 3600 * 1000) },
          { status: 'Assigned', by: authority._id, note: 'Assigned to Murugan', at: new Date(Date.now() - 92 * 3600 * 1000) },
          { status: 'In Progress', by: collector1._id, note: 'Started', at: new Date(Date.now() - 90 * 3600 * 1000) },
          { status: 'Collected', by: collector1._id, note: 'Collected', at: new Date(Date.now() - 89 * 3600 * 1000) }
        ]
      },
      // 16. Collected (Velachery 5 days ago)
      {
        reporter: citizen._id,
        bin: bins[5]._id,
        description: 'Wet waste bins overflowing near apartment complex gate.',
        severity: 'high',
        priority: 'high',
        photo: '',
        location: { type: 'Point', coordinates: [80.2195, 12.9910] },
        status: 'Collected',
        createdAt: new Date(Date.now() - 120 * 3600 * 1000),
        history: [
          { status: 'Pending', by: citizen._id, note: 'Submitted', at: new Date(Date.now() - 120 * 3600 * 1000) },
          { status: 'Verified', by: authority._id, note: 'Verified', at: new Date(Date.now() - 118 * 3600 * 1000) },
          { status: 'Assigned', by: authority._id, note: 'Assigned', at: new Date(Date.now() - 116 * 3600 * 1000) },
          { status: 'In Progress', by: collector2._id, note: 'Started', at: new Date(Date.now() - 114 * 3600 * 1000) },
          { status: 'Collected', by: collector2._id, note: 'Collected', at: new Date(Date.now() - 113 * 3600 * 1000) }
        ]
      },
      // 17. Collected (Anna Nagar 6 days ago)
      {
        reporter: citizen._id,
        bin: bins[9]._id,
        description: 'Commercial boxes and packaging dump.',
        severity: 'medium',
        priority: 'medium',
        photo: '',
        location: { type: 'Point', coordinates: [80.2144, 13.0880] },
        status: 'Collected',
        createdAt: new Date(Date.now() - 144 * 3600 * 1000),
        history: [
          { status: 'Pending', by: citizen._id, note: 'Submitted', at: new Date(Date.now() - 144 * 3600 * 1000) },
          { status: 'Verified', by: authority._id, note: 'Verified', at: new Date(Date.now() - 142 * 3600 * 1000) },
          { status: 'Assigned', by: authority._id, note: 'Assigned', at: new Date(Date.now() - 140 * 3600 * 1000) },
          { status: 'In Progress', by: collector3._id, note: 'Started', at: new Date(Date.now() - 138 * 3600 * 1000) },
          { status: 'Collected', by: collector3._id, note: 'Collected', at: new Date(Date.now() - 137 * 3600 * 1000) }
        ]
      },
      // 18. Collected (Guindy 7 days ago)
      {
        reporter: citizen._id,
        bin: bins[7]._id,
        description: 'Commuter waste near metro walkway.',
        severity: 'high',
        priority: 'high',
        photo: '',
        location: { type: 'Point', coordinates: [80.2114, 13.0088] },
        status: 'Collected',
        createdAt: new Date(Date.now() - 168 * 3600 * 1000),
        history: [
          { status: 'Pending', by: citizen._id, note: 'Submitted', at: new Date(Date.now() - 168 * 3600 * 1000) },
          { status: 'Verified', by: authority._id, note: 'Verified', at: new Date(Date.now() - 166 * 3600 * 1000) },
          { status: 'Assigned', by: authority._id, note: 'Assigned', at: new Date(Date.now() - 164 * 3600 * 1000) },
          { status: 'In Progress', by: collector2._id, note: 'Started', at: new Date(Date.now() - 162 * 3600 * 1000) },
          { status: 'Collected', by: collector2._id, note: 'Collected', at: new Date(Date.now() - 161 * 3600 * 1000) }
        ]
      }
    ];

    const complaints = await Complaint.insertMany(complaintsData);

    console.log('Creating tasks for Assigned, In Progress, and Collected complaints...');
    // Task for 6 (Assigned - Murugan)
    // Task for 7 (Assigned - Suresh)
    // Task for 8 (In Progress - Suresh)
    // Task for 9 (In Progress - Venkatesh)
    // Tasks for Collected: 10, 11, 12, 15, 16, 17, 18
    await Task.insertMany([
      {
        complaint: complaints[5]._id,
        collector: collector1._id,
        assignedBy: authority._id,
        status: 'assigned',
        assignedAt: new Date(Date.now() - 14 * 3600 * 1000)
      },
      {
        complaint: complaints[6]._id,
        collector: collector2._id,
        assignedBy: authority._id,
        status: 'assigned',
        assignedAt: new Date(Date.now() - 15 * 3600 * 1000)
      },
      {
        complaint: complaints[7]._id,
        collector: collector2._id,
        assignedBy: authority._id,
        status: 'in_progress',
        assignedAt: new Date(Date.now() - 20 * 3600 * 1000)
      },
      {
        complaint: complaints[8]._id,
        collector: collector3._id,
        assignedBy: authority._id,
        status: 'in_progress',
        assignedAt: new Date(Date.now() - 22 * 3600 * 1000)
      },
      {
        complaint: complaints[9]._id,
        collector: collector1._id,
        assignedBy: authority._id,
        status: 'collected',
        assignedAt: new Date(Date.now() - 32 * 3600 * 1000),
        completedAt: new Date(Date.now() - 29 * 3600 * 1000)
      },
      {
        complaint: complaints[10]._id,
        collector: collector2._id,
        assignedBy: authority._id,
        status: 'collected',
        assignedAt: new Date(Date.now() - 44 * 3600 * 1000),
        completedAt: new Date(Date.now() - 41 * 3600 * 1000)
      },
      {
        complaint: complaints[11]._id,
        collector: collector1._id,
        assignedBy: authority._id,
        status: 'collected',
        assignedAt: new Date(Date.now() - 56 * 3600 * 1000),
        completedAt: new Date(Date.now() - 53 * 3600 * 1000)
      }
    ]);

    console.log('Creating notifications...');
    await Notification.insertMany([
      {
        user: citizen._id,
        message: 'Welcome to the Smart Waste Bin Monitoring System! Help us keep Chennai clean by reporting overflowing bins.',
        read: false
      },
      {
        user: citizen._id,
        message: 'Your report regarding Gandhi Nagar bin was Collected. Thank you for your contribution!',
        read: true
      },
      {
        user: collector1._id,
        message: 'You have 1 pending collection task assigned in Besant Avenue.',
        read: false
      },
      {
        user: authority._id,
        message: '3 new citizen reports are pending verification.',
        read: false
      }
    ]);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
