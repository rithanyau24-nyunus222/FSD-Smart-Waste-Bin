# Smart Waste & Bin Management System

A full-stack, real-time civic waste management platform connecting Citizens, Waste Collectors, and Municipal Authorities to monitor, report, and clear smart bins across Chennai with automated duplicate detection, photo verification, and status tracking.

---

## Features by Role

### 1. Citizen (`/citizen`)
- **Interactive Bin Map & Picker**: View 15 real-time smart bins across Chennai with dynamic fill-level indicators.
- **Smart Waste Reporting**: Report overflowing bins with client-side image compression (<120 KB) and canvas location tagging.
- **Duplicate Detection & Merging**: Automatically merges duplicate complaints for the same bin within active hours to reduce clutter.
- **Live Timeline Tracking**: Track complaint lifecycle (Reported → Assigned → In Progress → Cleared).
- **In-App Notifications**: Real-time alerts when complaints are updated or resolved.

### 2. Waste Collector (`/collector`)
- **Route Optimization**: Visualized route progress bar and ordered bin collection queue.
- **Task Management**: Real-time assignment list with pickup priority and distance indicators.
- **After-Photo Verification**: Upload timestamped "after" photos to document clean-up completion.
- **Automated Lifecycle Update**: Completing a task automatically marks the linked complaint as cleared and updates bin fill levels.

### 3. Municipal Authority (`/authority`)
- **Live Bento Command Dashboard**: Real-time key metrics, critical overflow alerts, and interactive multi-bin radar map.
- **Priority Complaints Queue**: Inspect, reassign, or force-resolve issues with instant collector assignment.
- **SHA-256 Photo Deduplication Gallery**: Deduplicated photo repository storing identical photos only once.
- **Bin Fleet Management**: Full audit trail of fill levels, battery stats, and sensor alerts.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Custom Design System (Strict UI-1 Token Palette: Green House, Paper White, Sprout, Electric Pink, Periwinkle Blue), Peace Sans & Geologica Typography, Leaflet / Custom Canvas Maps.
- **Backend**: Node.js, Express (REST API), JSON Web Tokens (JWT), Multer, Sharp (Image compression).
- **Database**: MongoDB with Mongoose (Users, Bins, Complaints, Tasks, Notifications, Photos).

---

## Folder Structure

```
smart-waste-bin/
├── package.json              # Monorepo build and start scripts
├── .gitignore                # Ignores node_modules, dist, .env
├── README.md                 # Deployment & setup documentation
├── server/
│   ├── index.js              # Express app, API routes, static production hosting
│   ├── middleware.js         # JWT auth, role guard, error handling
│   ├── models.js             # Mongoose schemas (User, Bin, Complaint, Task, Notification, Photo)
│   ├── seed.js               # Seed script for demo bins, users, and complaints
│   ├── routes/
│   │   ├── auth.js           # Auth routes (login, register, me)
│   │   ├── complaints.js     # Citizen complaint intake and listing
│   │   └── work.js           # Collector tasks & authority fleet management
│   └── package.json
└── client/
    ├── index.html            # Entry HTML with custom typography
    ├── vite.config.js        # Vite build config & dev proxy
    ├── package.json
    └── src/
        ├── main.jsx          # React DOM root
        ├── App.jsx           # Role-based protected routes
        ├── auth.jsx          # AuthProvider context
        ├── api.js            # Axios client with JWT interceptor
        ├── styles.css        # Full design system & token definitions
        ├── components.jsx    # Design system primitives & SVG illustrations
        └── pages/
            ├── Login.jsx            # Split-hero authentication screen
            ├── Citizen.jsx          # Citizen reporting & live timeline
            ├── Authority.jsx        # Bento dashboard & fleet control
            ├── Collector.jsx        # Task execution & after-photo flow
            └── ComplaintDetail.jsx  # Two-column complaint audit view
```

---

## Environment Variables

Create a `.env` file in `server/` (or configure via Render dashboard):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart-waste
JWT_SECRET=demo_jwt_secret_key_chennai_waste_2026
COLLECTOR_CODE=COLLECT-2026
NODE_ENV=development
```

---

## How to Run Locally

Run the system locally in two simple commands:

### Command 1: Seed the Database
Populates 15 Chennai smart bins, 8 realistic complaints, tasks, notifications, and demo accounts:
```bash
node server/seed.js
```

### Command 2: Start Development Servers
Runs backend API on port 5000 and Vite client on port 3000 concurrently:
```bash
npm run dev:server
# in a second terminal:
npm run dev:client
```
Visit `http://localhost:3000` in your browser.

---

## Demo Logins

All demo accounts use password **`Demo@123`**:

| Role | Email | Password | Access / UI |
|---|---|---|---|
| **Citizen** | `citizen@demo.com` | `Demo@123` | Report waste, live timeline, status tracker |
| **Collector** | `collector@demo.com` | `Demo@123` | Route tasks, pickup navigation, after photos |
| **Authority** | `authority@demo.com` | `Demo@123` | Bento dashboard, fleet radar, photo audit |

*Quick-click demo chips are also available directly on the login form for 1-click access.*

---

## Render Deployment (Single Web Service)

Deploy to [Render](https://render.com) as a single Node.js Web Service:

1. Push your repository to GitHub.
2. In Render, click **New +** → **Web Service** and select your repository.
3. Configure the service settings:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `MONGODB_URI`: *Your MongoDB Atlas connection string*
   - `JWT_SECRET`: *A secure random string*
   - `COLLECTOR_CODE`: `COLLECT-2026`
   - `NODE_ENV`: `production`
5. Click **Create Web Service**. Express automatically serves the built frontend (`client/dist`) at the root URL while handling all `/api` endpoints without CORS configuration.

### Prevent Free-Tier Sleep (Optional)
To keep the Render free tier responsive:
- Add a free monitor on [UptimeRobot](https://uptimerobot.com) targeting `https://<your-render-app>.onrender.com/api/health` with a 5-minute interval.
