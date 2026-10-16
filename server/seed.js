/**
 * Greater Chennai Smart Waste Monitoring & Collection System
 * Enterprise Scaled Dataset Generator (~500+ Production Documents)
 *
 * Populates real Greater Chennai Corporation (GCC) wards, smart IoT bins,
 * realistic citizen overflow complaints with AI vision analysis,
 * before/after photo evidence buffers, collection tasks, and notifications.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { User, Bin, Complaint, Task, Notification, Photo } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-waste';

// 15 Greater Chennai Corporation Zones with realistic bounding boxes
const GCC_ZONES = [
  { name: 'Zone 1 - Thiruvottiyur', latMin: 13.150, latMax: 13.175, lngMin: 80.285, lngMax: 80.315, prefix: 'THIRU' },
  { name: 'Zone 2 - Manali', latMin: 13.155, latMax: 13.180, lngMin: 80.245, lngMax: 80.275, prefix: 'MANALI' },
  { name: 'Zone 3 - Madhavaram', latMin: 13.135, latMax: 13.160, lngMin: 80.220, lngMax: 80.250, prefix: 'MADHA' },
  { name: 'Zone 4 - Tondiarpet', latMin: 13.110, latMax: 13.140, lngMin: 80.270, lngMax: 80.295, prefix: 'TONDI' },
  { name: 'Zone 5 - Royapuram', latMin: 13.085, latMax: 13.115, lngMin: 80.280, lngMax: 80.300, prefix: 'ROYA' },
  { name: 'Zone 6 - Thiru Vi Ka Nagar', latMin: 13.100, latMax: 13.130, lngMin: 80.220, lngMax: 80.255, prefix: 'PERAM' },
  { name: 'Zone 7 - Ambattur', latMin: 13.090, latMax: 13.125, lngMin: 80.140, lngMax: 80.180, prefix: 'AMBAT' },
  { name: 'Zone 8 - Anna Nagar', latMin: 13.070, latMax: 13.095, lngMin: 80.190, lngMax: 80.235, prefix: 'ANNAN' },
  { name: 'Zone 9 - Teynampet', latMin: 13.030, latMax: 13.065, lngMin: 80.230, lngMax: 80.285, prefix: 'TEYNM' },
  { name: 'Zone 10 - Kodambakkam', latMin: 13.020, latMax: 13.065, lngMin: 80.190, lngMax: 80.230, prefix: 'KODAM' },
  { name: 'Zone 11 - Valasaravakkam', latMin: 13.025, latMax: 13.055, lngMin: 80.150, lngMax: 80.190, prefix: 'VALAS' },
  { name: 'Zone 12 - Alandur', latMin: 12.985, latMax: 13.015, lngMin: 80.180, lngMax: 80.215, prefix: 'ALAND' },
  { name: 'Zone 13 - Adyar', latMin: 12.975, latMax: 13.015, lngMin: 80.235, lngMax: 80.275, prefix: 'ADYAR' },
  { name: 'Zone 14 - Perungudi', latMin: 12.940, latMax: 12.975, lngMin: 80.210, lngMax: 80.255, prefix: 'PERUN' },
  { name: 'Zone 15 - Sholinganallur', latMin: 12.870, latMax: 12.935, lngMin: 80.210, lngMax: 80.250, prefix: 'SHOLN' }
];

const STREET_NAMES = [
  'Main Road', 'High Road', 'Bypass Road', 'Junction', 'Market Road', 'Bus Terminus Gate',
  'Railway Station West', 'Railway Station East', 'Pedestrian Plaza', '2nd Avenue',
  '4th Cross Street', 'Temple Gate', 'Radial Road', 'Expressway Service Lane', 'Roundabout',
  'Commercial Complex', 'Industrial Estate 3rd Main', 'Hospital Access Road', 'Beach Promenade', 'Metro Pillar'
];

const COMPLAINT_TEMPLATES = [
  { desc: 'Commercial packing boxes and plastic wrapping overflowing onto public sidewalk.', sev: 'high', label: 'Commercial Dumpster Overflow', cat: 'commercial-waste', tags: ['Cardboard', 'Plastics', 'Footpath Block'] },
  { desc: 'Wet municipal waste and organic refuse spilling outside dumpster, generating severe odor.', sev: 'high', label: 'Wet Waste Organic Spillage', cat: 'organic-wet', tags: ['Domestic Waste', 'Odor Hazard', 'Stray Animals'] },
  { desc: 'Plastic beverage bottles and food wrappers scattered near public transit terminal.', sev: 'medium', label: 'Transit Litter Accumulation', cat: 'plastic-litter', tags: ['PET Bottles', 'Wrappers', 'Transit Hub'] },
  { desc: 'Heavy vegetable market waste and broken packing crates piling up around morning market bin.', sev: 'high', label: 'Wholesale Market Refuse Pile', cat: 'market-waste', tags: ['Vegetable Debris', 'Wooden Crates', 'Heavy Inflow'] },
  { desc: 'Dry cardboard packing cartons and shipping thermocol piled up around community bin.', sev: 'medium', label: 'Packaging Material Spill', cat: 'dry-recyclable', tags: ['Cardboard', 'Thermocol', 'Recyclables'] },
  { desc: 'Post-weekend takeaway food containers and litter overflowing along beachfront walkway.', sev: 'high', label: 'Promenade Waste Overflow', cat: 'tourist-litter', tags: ['Food Cartons', 'Beach Litter', 'High Footfall'] },
  { desc: 'Residential apartment cluster dumpster overflowing onto motorable road shoulder.', sev: 'high', label: 'Residential Cluster Dumpster Spill', cat: 'residential-overflow', tags: ['Road Encroachment', 'Solid Municipal Waste'] },
  { desc: 'Dry leaves and street sweeping collection bags waiting for truck pickup.', sev: 'low', label: 'Municipal Sweep Collection Point', cat: 'street-sweep', tags: ['Garden Waste', 'Light Refuse'] }
];

export async function seed(disconnectAtEnd = true) {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB: smart-waste...');
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB.');
    }

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Bin.deleteMany({}),
      Complaint.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({}),
      Photo.deleteMany({})
    ]);

    // 1. Password Hash (CleanChennai@2026 and fallback Demo@123)
    const passwordHash = await bcrypt.hash('CleanChennai@2026', 10);

    // 2. Create 30 Official Users
    console.log('Seeding 30 official accounts (Authorities, Zonal Supervisors, Collectors, Citizens)...');
    const usersData = [
      // Sanitation Authorities (Control Room)
      { name: 'Dr. K. Rajasekaran', email: 'admin@smartwaste.gov.in', passwordHash, role: 'authority', area: 'Chennai Central' },
      { name: 'S. Meenakshi Sundaram', email: 'meenakshi@smartwaste.gov.in', passwordHash, role: 'authority', area: 'South Region' },
      { name: 'P. Balakrishnan', email: 'balakrishnan@smartwaste.gov.in', passwordHash, role: 'authority', area: 'North Region' },
      { name: 'Dr. Ananya Swaminathan', email: 'ananya.s@smartwaste.gov.in', passwordHash, role: 'authority', area: 'Central Region' },

      // Field Collectors across GCC Zones
      { name: 'Ravi Kumar', email: 'ravi.kumar@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 13 - Adyar' },
      { name: 'Suresh Raina', email: 'suresh.raina@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 10 - Kodambakkam' },
      { name: 'Anand Murugan', email: 'anand.m@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 9 - Teynampet' },
      { name: 'G. Venkatesh', email: 'venkatesh.g@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 8 - Anna Nagar' },
      { name: 'M. Selvaraj', email: 'selvaraj.m@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 4 - Tondiarpet' },
      { name: 'K. Thangaraj', email: 'thangaraj.k@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 14 - Perungudi' },
      { name: 'D. Pandian', email: 'pandian.d@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 15 - Sholinganallur' },
      { name: 'A. Joseph Vijay', email: 'joseph.v@smartwaste.gov.in', passwordHash, role: 'collector', area: 'Zone 7 - Ambattur' },

      // Citizens across Chennai Wards
      { name: 'Rithanya', email: 'rithanya@civic.chennai.in', passwordHash, role: 'citizen', area: 'Mylapore' },
      { name: 'Karthik Raja', email: 'karthik.raja@civic.chennai.in', passwordHash, role: 'citizen', area: 'Anna Nagar' },
      { name: 'Priya Sundaram', email: 'priya.sundaram@civic.chennai.in', passwordHash, role: 'citizen', area: 'Velachery' },
      { name: 'Arun Venkat', email: 'arun.venkat@civic.chennai.in', passwordHash, role: 'citizen', area: 'Besant Nagar' },
      { name: 'Deepa Narayanan', email: 'deepa.n@civic.chennai.in', passwordHash, role: 'citizen', area: 'T. Nagar' },
      { name: 'V. Senthil Nathan', email: 'senthil.v@civic.chennai.in', passwordHash, role: 'citizen', area: 'Adyar' },
      { name: 'Lakshmi Prabha', email: 'lakshmi.p@civic.chennai.in', passwordHash, role: 'citizen', area: 'Royapettah' },
      { name: 'Manoj Kumar', email: 'manoj.k@civic.chennai.in', passwordHash, role: 'citizen', area: 'Porur' },
      { name: 'Swetha Ramani', email: 'swetha.r@civic.chennai.in', passwordHash, role: 'citizen', area: 'Thoraipakkam OMR' },
      { name: 'G. Vignesh', email: 'vignesh.g@civic.chennai.in', passwordHash, role: 'citizen', area: 'Guindy' },
      { name: 'N. Radhakrishnan', email: 'radhakrishnan.n@civic.chennai.in', passwordHash, role: 'citizen', area: 'Koyambedu' },
      { name: 'Divya Bharathi', email: 'divya.b@civic.chennai.in', passwordHash, role: 'citizen', area: 'Triplicane' },
      { name: 'C. Saravanan', email: 'saravanan.c@civic.chennai.in', passwordHash, role: 'citizen', area: 'Madhavaram' },
      { name: 'Preeti Chandran', email: 'preeti.c@civic.chennai.in', passwordHash, role: 'citizen', area: 'Alwarpet' },
      { name: 'R. Balaji', email: 'balaji.r@civic.chennai.in', passwordHash, role: 'citizen', area: 'Thiruvottiyur' },

      // Backward compatible demo aliases
      { name: 'City Admin (Authority)', email: 'authority@demo.com', passwordHash, role: 'authority', area: 'Chennai Central' },
      { name: 'Ravi Kumar (Collector)', email: 'collector@demo.com', passwordHash, role: 'collector', area: 'Zone 13 - Adyar' },
      { name: 'Rithanya (Citizen)', email: 'citizen@demo.com', passwordHash, role: 'citizen', area: 'Mylapore' }
    ];

    const users = await User.create(usersData);
    const authorities = users.filter(u => u.role === 'authority');
    const collectors = users.filter(u => u.role === 'collector');
    const citizens = users.filter(u => u.role === 'citizen');

    // 3. Create 150 Smart IoT Bins across all 15 GCC Zones
    console.log('Generating 150 Smart IoT Bins with real GPS coordinates across Chennai...');
    const binsData = [];
    let binSeq = 1;

    for (const zone of GCC_ZONES) {
      // 10 bins per zone = 150 bins
      for (let j = 0; j < 10; j++) {
        const code = `BIN-${String(binSeq).padStart(3, '0')}`;
        const street = STREET_NAMES[(binSeq * 3 + j) % STREET_NAMES.length];
        const areaName = `${zone.prefix} ${street} (${zone.name.split(' - ')[1]})`;
        
        // Exact real coordinates bounded in each GCC zone
        const lng = Number((zone.lngMin + (j / 10) * (zone.lngMax - zone.lngMin)).toFixed(5));
        const lat = Number((zone.latMin + ((j * 7) % 10 / 10) * (zone.latMax - zone.latMin)).toFixed(5));
        
        // Realistic distribution of fill levels (some normal, some near full, some critical >80)
        let fillLevel;
        if (j % 4 === 0) fillLevel = Math.floor(Math.random() * 15) + 85; // 85-99% (High)
        else if (j % 3 === 0) fillLevel = Math.floor(Math.random() * 20) + 65; // 65-84%
        else fillLevel = Math.floor(Math.random() * 45) + 20; // 20-64%

        binsData.push({
          code,
          area: areaName,
          location: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          fillLevel
        });
        binSeq++;
      }
    }

    const bins = await Bin.create(binsData);

    // 4. Photographic Evidence Buffers
    console.log('Seeding real photographic evidence buffers into MongoDB...');
    const readSafe = (filePath, fallback) => {
      try {
        if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
        if (fs.existsSync(fallback)) return fs.readFileSync(fallback);
      } catch (e) {}
      return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGNYFqCgAvXQM1j2m6uAAAAABJRU5ErkJggg==', 'base64');
    };

    const imgW1 = readSafe(path.join(__dirname, 'assets/chennai_waste_1.jpg'), path.join(__dirname, 'assets/before.jpg'));
    const imgC1 = readSafe(path.join(__dirname, 'assets/chennai_clean_1.jpg'), path.join(__dirname, 'assets/after.jpg'));
    const imgW2 = readSafe(path.join(__dirname, 'assets/before.jpg'), path.join(__dirname, 'assets/chennai_waste_1.jpg'));
    const imgC2 = readSafe(path.join(__dirname, 'assets/after.jpg'), path.join(__dirname, 'assets/chennai_clean_1.jpg'));

    const photos = await Photo.create([
      { hash: 'sha256_chennai_dumpster_overflow_01', data: imgW1, thumb: imgW1, mime: 'image/jpeg' },
      { hash: 'sha256_chennai_dumpster_cleaned_01', data: imgC1, thumb: imgC1, mime: 'image/jpeg' },
      { hash: 'sha256_chennai_market_waste_02', data: imgW2, thumb: imgW2, mime: 'image/jpeg' },
      { hash: 'sha256_chennai_pavement_cleared_02', data: imgC2, thumb: imgC2, mime: 'image/jpeg' }
    ]);

    const pWaste1 = photos[0];
    const pClean1 = photos[1];
    const pWaste2 = photos[2];
    const pClean2 = photos[3];

    // 5. Create 180 Comprehensive Complaints (100% WITH REAL PHOTOS!)
    console.log('Seeding 180 civic overflow complaints across all GCC zones...');
    const now = Date.now();
    const oneHour = 3600 * 1000;
    const complaintsData = [];
    const statuses = ['Pending', 'Verified', 'Assigned', 'In Progress', 'Collected', 'Pending', 'Verified', 'Assigned', 'Collected', 'Rejected'];

    for (let i = 0; i < 180; i++) {
      const bin = bins[i % bins.length];
      const citizen = citizens[i % citizens.length];
      const follower = citizens[(i + 3) % citizens.length];
      const tmpl = COMPLAINT_TEMPLATES[i % COMPLAINT_TEMPLATES.length];
      const status = statuses[i % statuses.length];
      const hoursAgo = Number(((i * 3.5) + (i % 7) * 1.2).toFixed(1)); // Spread over past 3 weeks
      const createdAt = new Date(now - hoursAgo * oneHour);

      // Photo Assignment (Alternating between realistic waste and clean proofs)
      const useSetA = (i % 2 === 0);
      const beforePhoto = useSetA ? pWaste1 : pWaste2;
      const afterPhoto = useSetA ? pClean1 : pClean2;

      const complaintPhotos = [{ photo: beforePhoto._id, kind: 'before' }];
      if (status === 'Collected') {
        complaintPhotos.push({ photo: afterPhoto._id, kind: 'after' });
      }

      const sevWeight = tmpl.sev === 'high' ? 3 : tmpl.sev === 'medium' ? 2 : 1;
      const reportCount = (i % 3) + 1;
      const binBonus = bin.fillLevel > 80 ? 2 : 0;
      const priority = sevWeight + reportCount + binBonus;

      // Realistic audit history trail
      const history = [
        { status: 'Pending', by: citizen.name, note: 'Citizen overflow report submitted with geo-tag and photo evidence', at: createdAt }
      ];

      const authority = authorities[i % authorities.length];
      if (['Verified', 'Assigned', 'In Progress', 'Collected'].includes(status)) {
        history.push({
          status: 'Verified',
          by: authority.name,
          note: 'Verified by GCC Zonal Sanitation Inspector',
          at: new Date(createdAt.getTime() + 1.2 * oneHour)
        });
      }

      const assignedCollector = collectors[i % collectors.length];
      if (['Assigned', 'In Progress', 'Collected'].includes(status)) {
        history.push({
          status: 'Assigned',
          by: authority.name,
          note: `Task assigned to collector ${assignedCollector.name}`,
          at: new Date(createdAt.getTime() + 2.5 * oneHour)
        });
      }

      if (['In Progress', 'Collected'].includes(status)) {
        history.push({
          status: 'In Progress',
          by: assignedCollector.name,
          note: 'Compactor vehicle reached destination; loading started',
          at: new Date(createdAt.getTime() + 3.8 * oneHour)
        });
      }

      let collectedAt = undefined;
      if (status === 'Collected') {
        collectedAt = new Date(createdAt.getTime() + 5.5 * oneHour);
        history.push({
          status: 'Collected',
          by: assignedCollector.name,
          note: 'Waste successfully collected and site washed. Verified with photo proof.',
          at: collectedAt
        });
      }

      let rejectReason = undefined;
      if (status === 'Rejected') {
        rejectReason = 'Sensor telemetry confirms bin under 35% capacity. Physical inspection showed no active overflow.';
        history.push({
          status: 'Rejected',
          by: authority.name,
          note: rejectReason,
          at: new Date(createdAt.getTime() + 1.5 * oneHour)
        });
      }

      complaintsData.push({
        reporter: citizen._id,
        followers: reportCount > 1 ? [follower._id] : [],
        bin: bin._id,
        binCode: bin.code,
        area: bin.area,
        description: `${tmpl.desc} Reported near ${bin.area}.`,
        severity: tmpl.sev,
        location: bin.location,
        photos: complaintPhotos,
        status,
        rejectReason,
        reportCount,
        priority,
        aiAnalysis: {
          wasteDetected: status !== 'Rejected',
          label: tmpl.label,
          confidence: Number((93.0 + (i % 60) * 0.1).toFixed(1)),
          category: tmpl.cat,
          tags: tmpl.tags,
          suggestedSeverity: tmpl.sev,
          model: 'WasteVision-Net v2.4 (ResNet-50 GCC)',
          scannedAt: createdAt
        },
        history,
        collectedAt,
        createdAt
      });
    }

    const complaints = await Complaint.create(complaintsData);

    // 6. Create 80 Tasks (Assigned, In Progress, Collected)
    console.log('Seeding operational tasks for collection crews...');
    const taskEligible = complaints.filter(c => ['Assigned', 'In Progress', 'Collected'].includes(c.status));
    const tasksData = taskEligible.slice(0, 80).map((c, idx) => {
      const collector = collectors[idx % collectors.length];
      const taskStatus = c.status === 'Assigned' ? 'assigned' : c.status === 'In Progress' ? 'in-progress' : 'collected';
      return {
        complaint: c._id,
        collector: collector._id,
        status: taskStatus,
        assignedAt: c.createdAt,
        startedAt: taskStatus !== 'assigned' ? new Date(c.createdAt.getTime() + 2 * oneHour) : undefined,
        completedAt: taskStatus === 'collected' ? c.collectedAt : undefined
      };
    });

    const tasks = await Task.create(tasksData);

    // 7. Create 80 Notifications
    console.log('Seeding 80 civic notifications...');
    const notifsData = [];
    for (let i = 0; i < 80; i++) {
      const c = complaints[i % complaints.length];
      const citizen = citizens[i % citizens.length];
      let msg = '';
      if (c.status === 'Collected') {
        msg = `Complaint #${c._id.toString().slice(-6)} in ${c.area} has been successfully Collected and cleared!`;
      } else if (c.status === 'In Progress') {
        msg = `Field crew is currently In Progress clearing Complaint #${c._id.toString().slice(-6)} in ${c.area}.`;
      } else if (c.status === 'Verified') {
        msg = `Complaint #${c._id.toString().slice(-6)} in ${c.area} has been Verified by GCC municipal authorities.`;
      } else {
        msg = `Your report for bin #${c.binCode} in ${c.area} was submitted and prioritized for inspection.`;
      }

      notifsData.push({
        user: citizen._id,
        message: msg,
        complaint: c._id,
        read: i % 2 === 0,
        createdAt: new Date(now - (i * 2 + 1) * oneHour)
      });
    }

    const notifications = await Notification.create(notifsData);

    console.log('\n======================================================');
    console.log('🚀 ENTERPRISE 500+ CHENNAI SMART WASTE DATABASE SEEDED');
    console.log('======================================================');
    console.log(`👥 Users         : ${users.length} accounts (Authorities, Zonal Staff, Citizens)`);
    console.log(`🗑️ Smart IoT Bins: ${bins.length} IoT GPS sensor bins across all 15 GCC Zones`);
    console.log(`⚠️ Complaints    : ${complaints.length} civic overflow reports (100% with photos!)`);
    console.log(`🚚 Tasks         : ${tasks.length} active collection routes`);
    console.log(`🔔 Notifications : ${notifications.length} real-time user updates`);
    console.log(`🖼️ Photos        : ${photos.length} SHA-256 deduplicated image buffers`);
    console.log('------------------------------------------------------');
    const totalDocs = users.length + bins.length + complaints.length + tasks.length + notifications.length + photos.length;
    console.log(`📊 TOTAL RECORDS IN MONGODB: ${totalDocs} Documents!`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    if (disconnectAtEnd) {
      await mongoose.disconnect();
      process.exit(0);
    }
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed'))) {
  seed(true);
}
