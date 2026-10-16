# 🌿 Greater Chennai Smart Waste & IoT Bin Monitoring System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Local-forestgreen.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)

> **A Full-Stack Civic Waste Management & IoT Monitoring Platform** connecting Citizens, Field Waste Collectors, and Municipal Authorities across all 15 Greater Chennai Corporation (GCC) zones with automated duplicate detection, AI computer vision overflow auditing, Leaflet GPS mapping, and tamper-proof photographic verification.

---

## 🌐 Live Demo & Deployment

- **Live Cloud Web Application**: Deployable on **[Render](https://render.com)** (Single Unified Full-Stack Node Web Service)
- **Live Database Inspector**: Available at `/database` on both local and live deployments for real-time MongoDB schema inspection.
- **API Health Check**: `/api/health`

---

## 🎯 Architecture & Features by Role

```
                                  ┌────────────────────────┐
                                  │   React 18 + Vite UI   │
                                  │  (Strict UI-1 Tokens)  │
                                  └───────────┬────────────┘
                                              │ HTTP / JSON
                                              ▼
                                  ┌────────────────────────┐
                                  │   Express REST Engine  │
                                  │   JWT Auth & Guard     │
                                  └───────────┬────────────┘
                                              │ Mongoose ODM
                                              ▼
                    ┌──────────────────────────────────────────────────┐
                    │      MongoDB Enterprise Dataset (500+ Docs)      │
                    │  Users • Bins • Complaints • Tasks • Photos • UI │
                    └──────────────────────────────────────────────────┘
```

### 1. 👥 Citizen Portal (`/citizen`)
- **Interactive Bin Map & Picker**: View real-time smart IoT bins with dynamic fill-level percentages, status badges, and GIS coordinates.
- **Smart Waste Reporting**: Report overflowing bins with client-side image compression (<120 KB) and canvas location tagging.
- **AI Computer Vision Audit**: Real-time pre-submission waste detection analysis, categorizing refuse into commercial, organic wet, transit litter, and recyclables.
- **Duplicate Detection & Auto-Merging**: Merges duplicate complaints for the same bin within active hours to reduce municipal backlog.
- **Live Timeline Lifecycle**: Track complaint status through its full lifecycle: `Reported → Verified → Assigned → In Progress → Collected`.

### 2. 🚚 Field Collector Portal (`/collector`)
- **Route Optimization**: Visualized collection progress bar and prioritized bin queue.
- **Task Management**: Real-time assignment list with pickup priority and distance indicators.
- **Photographic Proof Upload**: Upload timestamped "after" clean-up photos to verify task resolution.
- **Automated Lifecycle Update**: Completing a task automatically marks the linked complaint as cleared and resets bin telemetry.

### 3. 🏛️ Municipal Authority Command Dashboard (`/authority`)
- **Bento Command Center**: Real-time key metrics, critical overflow alerts, and interactive multi-bin radar map.
- **Priority Complaints Queue**: Inspect, reassign, or force-resolve issues with instant collector assignment.
- **Photo Deduplication Gallery**: SHA-256 deduplicated image storage system preventing identical photo redundancies.
- **Bin Fleet Management**: Full audit trail of fill levels, battery stats, and sensor alerts across all 15 GCC zones.
- **Embedded Database Inspector**: Live web GUI at `/database` for exploring MongoDB collections in real time.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM, Custom UI-1 Token Palette (Green House, Paper White, Sprout, Electric Pink, Periwinkle Blue), Peace Sans & Geologica Typography, Leaflet GIS Maps |
| **Backend** | Node.js, Express (REST API), JSON Web Tokens (JWT), Bcrypt, Multer, Sharp (Image compression), SHA-256 Hashes |
| **Database** | MongoDB Atlas / Local MongoDB with Mongoose ODM (Users, Bins, Complaints, Tasks, Notifications, Photos) |
| **Cloud Hosting** | Render (Web Service), GitHub Version Control |

---

## 🚀 Live Cloud Deployment on Render (3 Minutes)

The application is configured as a **single unified full-stack web service**. Express serves both the backend API (`/api/*`) and the built React frontend (`client/dist`) from the same host, completely eliminating CORS issues.

### Step 1: Push Code to Your GitHub Repository
```bash
git add .
git commit -m "feat: complete production ready setup with render.yaml and auto-seeding"
git push origin main
```

### Step 2: Deploy on Render
1. Go to **[Render.com](https://render.com)** and sign in (using GitHub).
2. Click **New +** → **Web Service**.
3. Select your GitHub repository: `rithanyau24-nyunus222/FSD-Smart-Waste-Bin`.
4. Configure the settings:
   - **Name**: `smart-waste-management` (or any custom name)
   - **Region**: Choose closest to you (e.g., Singapore or Oregon)
   - **Branch**: `main`
   - **Root Directory**: `.` (leave empty or default)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `AUTO_OPEN`: `false`
   - `JWT_SECRET`: `supersecretjwtkeyforantigravitydemomode2026` *(or any random string)*
   - `COLLECTOR_CODE`: `CLEAN2026`
   - `MONGODB_URI`: *Your MongoDB Atlas connection URI (e.g., `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/smart-waste?retryWrites=true&w=majority`)*
6. Click **Deploy Web Service**!

> 💡 **Automatic Cloud Seeding**: When deployed to a fresh MongoDB Atlas database, the server automatically detects that the database is new and auto-seeds all 500+ records, 15 GCC zones, IoT bins, complaints, and accounts on first boot!

---

## 🔑 Demo & Evaluation Credentials

All accounts support either **`CleanChennai@2026`** or universal fallback **`Demo@123`**:

| Role | Email | Password | Access / UI Features |
|---|---|---|---|
| **Authority (Admin)** | `admin@smartwaste.gov.in` | `CleanChennai@2026` | Bento Command Center, Fleet Radar, Task Dispatch |
| **Collector (Adyar)** | `ravi.kumar@smartwaste.gov.in` | `CleanChennai@2026` | Work Route, Pickup Tasks, Photo Proof Upload |
| **Collector (T. Nagar)** | `suresh.raina@smartwaste.gov.in` | `CleanChennai@2026` | Central Zone Tasks, Bin Sensor Sync |
| **Citizen (Mylapore)** | `rithanya@civic.chennai.in` | `CleanChennai@2026` | Report Waste, Live Timeline, GPS Bin Picker |
| **Citizen (Anna Nagar)** | `karthik.raja@civic.chennai.in` | `CleanChennai@2026` | Zone 8 Complaint Tracking & Notifications |

*Quick 1-click portal sign-in buttons are also provided on the login page for rapid live demonstration.*

---

## 💻 Local Development Setup

### Prerequisites
- Node.js v18+ installed
- MongoDB installed locally OR a MongoDB Atlas URI

### 1. Install & Build
```bash
npm run build
```

### 2. Populate 500+ Chennai Production Dataset
```bash
npm run seed
```

### 3. Launch Application
Double-click `Launch-Smart-Waste.bat` OR run:
```bash
npm start
```
- Web Application: `http://localhost:5000`
- Live Database Inspector: `http://localhost:5000/database`

---

## 📁 Repository Structure

```
FSD-Smart-Waste-Bin/
├── render.yaml               # Render Infrastructure Blueprint definition
├── package.json              # Monorepo orchestration scripts
├── Launch-Smart-Waste.bat    # Windows 1-click double-clickable launcher
├── dev.js                    # Concurrent dev server runner
├── README.md                 # Full project documentation & deploy guide
├── server/
│   ├── index.js              # Express app, static SPA host & health check
│   ├── models.js             # Mongoose schemas (User, Bin, Complaint, Task, Photo)
│   ├── middleware.js         # JWT auth, role validation, error handling
│   ├── seed.js               # Enterprise 500+ GCC dataset generator
│   ├── db-inspector.js       # Live visual MongoDB Explorer at /database
│   ├── assets/               # Production imagery & seed assets
│   └── routes/
│       ├── auth.js           # Auth routes (login, register, me)
│       ├── complaints.js     # Citizen complaint intake, deduplication & photos
│       └── work.js           # Collector tasks & authority fleet management
└── client/
    ├── vite.config.js        # Vite production build & dev proxy
    ├── index.html            # Entry HTML with custom typography
    └── src/
        ├── App.jsx           # Role-based protected routes
        ├── auth.jsx          # AuthProvider context & quick demo switcher
        ├── api.js            # Unified fetch client with JWT interceptor
        ├── styles.css        # UI-1 token design system & animations
        ├── components.jsx    # Component primitives, radar & SVGs
        └── pages/
            ├── Login.jsx            # Split-hero portal sign-in
            ├── Citizen.jsx          # Citizen reporting & live timeline
            ├── Authority.jsx        # Bento dashboard & fleet control
            ├── Collector.jsx        # Task execution & after-photo flow
            └── ComplaintDetail.jsx  # Two-column complaint audit view
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
