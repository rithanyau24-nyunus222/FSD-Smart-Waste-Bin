import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Bin, Complaint, Task, Notification, Photo } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-waste';

async function showDb() {
  console.log('\n======================================================');
  console.log('📦 MONGODB STORAGE INSPECTOR — SMART WASTE BIN SYSTEM');
  console.log('======================================================');
  console.log(`📍 Connection URI : ${MONGODB_URI}`);
  console.log(`📂 Physical Path  : C:\\Program Files\\MongoDB\\Server\\9.0\\data`);
  console.log(`🗄️ Database Name  : smart-waste\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully to MongoDB!\n');

    const [userCount, binCount, complaintCount, taskCount, notifCount, photoCount] = await Promise.all([
      User.countDocuments(),
      Bin.countDocuments(),
      Complaint.countDocuments(),
      Task.countDocuments(),
      Notification.countDocuments(),
      Photo.countDocuments()
    ]);

    console.log('📊 COLLECTIONS & RECORD COUNTS:');
    console.log('------------------------------------------------------');
    console.log(`  1. users         : ${userCount} accounts (Citizens, Collectors, Authorities)`);
    console.log(`  2. bins          : ${binCount} smart IoT bins with GPS coordinates`);
    console.log(`  3. complaints    : ${complaintCount} civic overflow complaints`);
    console.log(`  4. tasks         : ${taskCount} assigned collection routes`);
    console.log(`  5. notifications : ${notifCount} real-time user updates`);
    console.log(`  6. photos        : ${photoCount} SHA-256 deduplicated image buffers`);
    console.log('------------------------------------------------------\n');

    console.log('🔍 SAMPLE RECORD FROM "bins" COLLECTION:');
    const sampleBin = await Bin.findOne().lean();
    console.log(JSON.stringify(sampleBin, null, 2));

    console.log('\n🔍 SAMPLE RECORD FROM "complaints" COLLECTION:');
    const sampleComplaint = await Complaint.findOne().lean();
    console.log(JSON.stringify(sampleComplaint, null, 2));

    console.log('\n======================================================');
    console.log('💡 TIP FOR DEMO / VIVA:');
    console.log('Run: "npm run view:db" anytime to show your live MongoDB!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

showDb();
