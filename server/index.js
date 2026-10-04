import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware.js';
import authRouter from './routes/auth.js';
import complaintsRouter from './routes/complaints.js';
import workRouter from './routes/work.js';

import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
} else {
  console.log('MONGODB_URI not provided yet in .env');
}

// CORS header middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Central routers
app.use('/api/auth', authRouter);
app.use('/api', complaintsRouter);
app.use('/api', workRouter);

// Serve static assets in production or whenever client/dist is built
const clientDist = path.join(__dirname, '../client/dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Central error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
