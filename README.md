# Smart Waste Bin Monitoring & Collection System

> **Tagline:** *"Keep It Clean, Keep It Smart."*

A full-stack MERN web application developed as a College Full Stack Development project that connects citizens, municipal authorities, and waste collectors to transform urban waste management from delayed, untracked complaints into a transparent, prioritized, and closed-loop process.

---

## 1. Problem & Solution

- **The Problem:** In urban centers, public waste bins frequently overflow. Citizens lack an effortless way to report them, municipal authorities lack real-time visibility, and garbage collection follows rigid, inefficient routes that overlook overflowing bins.
- **The Solution:** A unified digital platform enabling citizens to report overflowing bins in under a minute with compressed photos and geolocation, empowering authorities with real-time dashboard analytics and sensor simulation to assign tasks, and equipping collectors with dynamic task lists to mark collections completed.

---

## 2. Features by Role

### 👤 Citizen
- Instant incident reporting with in-browser compressed photo upload (< 150 KB) and interactive map pin placement.
- Duplicate detection warning for reports within 30 meters.
- Personal complaints dashboard with status badges and an interactive vertical audit timeline.
- Real-time in-app notification center.

### 🏛️ Municipal Authority
- Comprehensive operations dashboard with key performance metrics (Pending, Verified, In Progress, Collected, Critical fill bins).
- CSS-rendered 7-day complaint activity bar chart.
- Multi-criteria filterable complaints ledger (Status, Priority, Search).
- Single-click verification with priority adjustment and rejection workflow with mandatory reason.
- Collector dispatch modal.
- Interactive Leaflet city map displaying sensor fill levels (Green < 50%, Amber 50-80%, Red > 80%).
- "Simulate Sensor" feature to emulate live IoT bin level telemetry.

### 🚛 Waste Collector
- Mobile-responsive collection queue with priority indicators and incident photos.
- Direct Google Maps routing integration for rapid navigation.
- Simple state transitions: "Start Collection" (*In Progress*) and "Mark Collected" (*Collected*), resetting linked bin fill levels to 5%.

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, React Router DOM 6, React Leaflet / Leaflet (CircleMarker), Vanilla CSS (custom design system, Baloo 2 + Poppins fonts, keyframe animations).
- **Backend:** Node.js, Express.js (ES Modules), Multer (file uploads), JWT authentication, Bcrypt.js.
- **Database:** MongoDB, Mongoose with 2dsphere geospatial indexing.
- **Dev Tooling:** Concurrently for unified full-stack dev execution.

---

## 4. Folder Structure (Lean 25 Files Architecture)

```
smart-waste-bin-system/
├── package.json
├── .gitignore
├── README.md
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── uploads/
│   │   └── .gitkeep
│   └── src/
│       ├── index.js
│       ├── models.js
│       ├── middleware.js
│       ├── routes.js
│       └── seed.js
└── client/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.jsx
        ├── components.jsx
        ├── styles.css
        └── pages/
            ├── Home.jsx
            ├── Auth.jsx
            ├── Report.jsx
            ├── Complaints.jsx
            ├── Dashboard.jsx
            └── Tasks.jsx
```

---

## 5. Demo Accounts

All demo accounts share the password: `Demo@123`

| Role | Email | Purpose |
| :--- | :--- | :--- |
| **Citizen** | `citizen@demo.com` | Report bins, view timeline & notifications |
| **Authority** | `authority@demo.com` | View dashboard, verify, reject, assign tasks, simulate sensors |
| **Collector** | `collector@demo.com` | View assigned tasks, start & collect waste |
| **Collector 2** | `collector2@demo.com` | Secondary sanitation worker |
| **Collector 3** | `collector3@demo.com` | Tertiary sanitation worker |

---

## 6. API Reference

Base URL: `/api`

### Authentication
- `POST /auth/register` - Register a new citizen account
- `POST /auth/login` - Authenticate and receive 7-day JWT
- `GET /auth/me` - Retrieve current authenticated profile

### Complaints
- `POST /complaints` - Create a complaint (citizen, multipart/form-data)
- `GET /complaints` - Query complaints (citizen: own; authority: all with filters)
- `GET /complaints/:id` - Fetch complaint detail with timeline history
- `PATCH /complaints/:id/verify` - Verify complaint and set priority (authority)
- `PATCH /complaints/:id/reject` - Reject complaint with reason (authority)

### Tasks
- `POST /tasks` - Assign verified complaint to a collector (authority)
- `GET /tasks` - List tasks (collector: own; authority: all)
- `PATCH /tasks/:id/status` - Update task progress to `in_progress` or `collected` (collector)

### Smart Bins
- `GET /bins` - List all city bins with current fill levels
- `POST /bins/simulate` - Simulate sensor telemetry updates (authority)

### Analytics & Notifications
- `GET /stats` - Authority analytics and 7-day trend
- `GET /stats/public` - Public aggregate statistics
- `GET /notifications` - Retrieve user notifications
- `PATCH /notifications/read` - Mark notifications as read
- `GET /users/collectors` - List available collectors (authority)

---

## 7. Setup & Execution

### Prerequisites
- Node.js (v18+)
- MongoDB running locally at `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### Installation & Run

1. **Install all dependencies across root, server, and client:**
   ```bash
   npm run install:all
   ```

2. **Configure environment:**
   Copy `server/.env.example` to `server/.env` and update `MONGODB_URI` if using Atlas:
   ```bash
   cp server/.env.example server/.env
   ```

3. **Seed realistic demo data (12 bins, 18 complaints, tasks, users):**
   ```bash
   npm run seed
   ```

4. **Launch development server:**
   ```bash
   npm run dev
   ```
   - Client: `http://localhost:5173`
   - Server: `http://localhost:5000`

---

## 8. Screenshots

*(College presentation placeholders: include Citizen Report screen, Authority Command Center, and Collector Mobile Task list).*
