import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Bin, Complaint, Task, Notification, Photo } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-waste';

export async function fetchAllCollections() {
  const [users, bins, complaints, tasks, notifications, photos] = await Promise.all([
    User.find().select('-passwordHash').lean(),
    Bin.find().lean(),
    Complaint.find().sort({ createdAt: -1 }).lean(),
    Task.find().populate('collector', 'name email role').sort({ assignedAt: -1 }).lean(),
    Notification.find().sort({ createdAt: -1 }).limit(100).lean(),
    Photo.find().select('hash mime expireAt createdAt').lean()
  ]);

  return {
    database: 'smart-waste',
    uri: MONGODB_URI,
    timestamp: new Date().toISOString(),
    collections: {
      users: {
        name: 'users',
        displayName: 'Users',
        icon: '👥',
        count: users.length,
        description: 'System accounts (Citizens, Collectors, Authorities)',
        docs: users
      },
      bins: {
        name: 'bins',
        displayName: 'Smart IoT Bins',
        icon: '🗑️',
        count: bins.length,
        description: 'IoT bins with GPS GeoJSON Point coordinates & fill levels',
        docs: bins
      },
      complaints: {
        name: 'complaints',
        displayName: 'Complaints',
        icon: '⚠️',
        count: complaints.length,
        description: 'Civic waste overflow reports with priority & status lifecycle',
        docs: complaints
      },
      tasks: {
        name: 'tasks',
        displayName: 'Collection Tasks',
        icon: '🚚',
        count: tasks.length,
        description: 'Work routes assigned to field waste collectors',
        docs: tasks
      },
      notifications: {
        name: 'notifications',
        displayName: 'Notifications',
        icon: '🔔',
        count: notifications.length,
        description: 'Real-time alert events dispatched to citizens & staff',
        docs: notifications
      },
      photos: {
        name: 'photos',
        displayName: 'Photos (SHA-256)',
        icon: '🖼️',
        count: photos.length,
        description: 'Binary proof images stored with SHA-256 deduplication and TTL expiration',
        docs: photos
      }
    }
  };
}

export function getInspectorHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MongoDB Live Database Inspector | Smart Waste Bin</title>
  <style>
    :root {
      --bg: #0b1311;
      --surface: #14211d;
      --surface-card: #1b2d28;
      --border: #2c473f;
      --accent: #10b981;
      --accent-hover: #059669;
      --accent-soft: rgba(16, 185, 129, 0.12);
      --text: #f0fdf4;
      --text-muted: #94a3b8;
      --danger: #ef4444;
      --warning: #f59e0b;
      --info: #3b82f6;
      --font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      min-height: 100vh;
      line-height: 1.5;
    }

    /* TOP HEADER */
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 16px 28px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      font-size: 26px;
      background: var(--accent-soft);
      padding: 6px 12px;
      border-radius: 10px;
      border: 1px solid var(--accent);
    }
    .brand h1 {
      font-size: 19px;
      font-weight: 700;
      color: var(--text);
    }
    .brand p {
      font-size: 12px;
      color: var(--text-muted);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .conn-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--accent);
      color: var(--accent);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
    }
    .conn-dot {
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--accent);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .btn {
      background: var(--accent);
      color: #052e16;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: #34d399;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--surface-card);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: var(--border);
    }

    /* MAIN CONTAINER */
    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px 28px;
    }

    /* STATS OVERVIEW CARDS */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .stat-card:hover, .stat-card.active {
      border-color: var(--accent);
      background: var(--surface-card);
      transform: translateY(-2px);
    }
    .stat-icon {
      font-size: 28px;
      background: rgba(255,255,255,0.04);
      padding: 8px;
      border-radius: 10px;
    }
    .stat-meta h3 {
      font-size: 24px;
      font-weight: 800;
      color: var(--text);
    }
    .stat-meta p {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* CONTROLS BAR */
    .controls {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tab {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
    }
    .tab:hover {
      color: var(--text);
      background: var(--surface-card);
    }
    .tab.active {
      color: #052e16;
      background: var(--accent);
    }
    .tab-badge {
      background: rgba(0,0,0,0.2);
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 999px;
    }
    .tab.active .tab-badge {
      background: rgba(0,0,0,0.25);
      color: #052e16;
    }
    .search-box {
      position: relative;
      flex: 1;
      max-width: 320px;
      min-width: 220px;
    }
    .search-box input {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px 8px 34px;
      color: var(--text);
      font-size: 13px;
      outline: none;
    }
    .search-box input:focus {
      border-color: var(--accent);
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 14px;
    }
    .view-toggles {
      display: flex;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .view-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .view-btn.active {
      background: var(--surface-card);
      color: var(--accent);
    }

    /* COLLECTION CONTENT */
    .content-area {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      min-height: 480px;
    }
    .collection-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }
    .collection-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .collection-title h2 {
      font-size: 18px;
      font-weight: 700;
    }
    .collection-desc {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* CARD GRID VIEW */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }
    .doc-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s ease;
      position: relative;
    }
    .doc-card:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding-bottom: 10px;
    }
    .doc-id {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--accent);
      background: rgba(16, 185, 129, 0.08);
      padding: 2px 8px;
      border-radius: 6px;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-Pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid #f59e0b; }
    .badge-Verified { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid #3b82f6; }
    .badge-Assigned { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid #a855f7; }
    .badge-InProgress, .badge-in-progress { background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid #f97316; }
    .badge-Collected, .badge-collected { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #10b981; }
    .badge-Rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid #ef4444; }
    .badge-citizen { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-authority { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
    .badge-collector { background: rgba(16, 185, 129, 0.15); color: #34d399; }

    .doc-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }
    .doc-field {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .field-key {
      color: var(--text-muted);
      font-family: var(--mono);
      font-size: 12px;
      white-space: nowrap;
    }
    .field-val {
      color: var(--text);
      font-weight: 500;
      text-align: right;
      word-break: break-all;
    }
    .field-val.mono {
      font-family: var(--mono);
      font-size: 12px;
    }

    /* JSON ACCORDION */
    .json-preview {
      background: #090f0d;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      font-family: var(--mono);
      font-size: 11px;
      color: #a7f3d0;
      max-height: 180px;
      overflow-y: auto;
      white-space: pre-wrap;
    }

    /* TABLE VIEW */
    .table-wrapper {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background: var(--surface-card);
      color: var(--text-muted);
      font-weight: 700;
      padding: 12px 16px;
      border-bottom: 2px solid var(--border);
      font-family: var(--mono);
      font-size: 12px;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }
    tr:hover td {
      background: rgba(16, 185, 129, 0.03);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    /* FOOTER INFO */
    footer {
      margin-top: 40px;
      padding: 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      border-top: 1px solid var(--border);
    }
    footer code {
      font-family: var(--mono);
      background: var(--surface-card);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--accent);
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-icon">🍃</div>
      <div>
        <h1>MongoDB Live Database Inspector</h1>
        <p>Smart Waste Management System • NoSQL Storage</p>
      </div>
    </div>

    <div class="header-actions">
      <div class="conn-badge">
        <span class="conn-dot"></span>
        <span id="conn-status">Connected to smart-waste</span>
      </div>
      <button class="btn btn-secondary" onclick="exportDataJson()">📥 Export JSON</button>
      <button class="btn" onclick="refreshData()">🔄 Refresh</button>
    </div>
  </header>

  <div class="container">
    <!-- STATS OVERVIEW CARDS -->
    <div class="stats-row" id="stats-row">
      <!-- Populated dynamically -->
    </div>

    <!-- CONTROLS BAR -->
    <div class="controls">
      <div class="tabs" id="tabs-container">
        <!-- Tab buttons populated dynamically -->
      </div>

      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="search-input" placeholder="Search in collection..." oninput="filterCurrentDocs()">
      </div>

      <div class="view-toggles">
        <button class="view-btn active" id="btn-view-cards" onclick="setViewMode('cards')">Cards</button>
        <button class="view-btn" id="btn-view-table" onclick="setViewMode('table')">Table</button>
        <button class="view-btn" id="btn-view-raw" onclick="setViewMode('raw')">Raw JSON</button>
      </div>
    </div>

    <!-- MAIN COLLECTION CONTENT -->
    <div class="content-area">
      <div class="collection-header">
        <div class="collection-title">
          <span style="font-size: 24px;" id="active-icon">📁</span>
          <div>
            <h2 id="active-title">Collection</h2>
            <p class="collection-desc" id="active-desc">Collection description</p>
          </div>
        </div>
        <div id="active-count-badge" class="badge" style="background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent); font-size: 13px;">
          0 records
        </div>
      </div>

      <div id="render-target">
        <!-- Rendered view -->
      </div>
    </div>

    <footer>
      <p>🗄️ Database: <code>smart-waste</code> &nbsp;|&nbsp; 📍 Host: <code>mongodb://127.0.0.1:27017</code> &nbsp;|&nbsp; ⚡ Mongoose 8.9.5 ODM</p>
      <p style="margin-top: 6px; font-size: 12px;">All operations query the active MongoDB database directly. Ready for project demonstration & viva examination.</p>
    </footer>
  </div>

  <script>
    let dbData = null;
    let activeCollection = 'complaints';
    let viewMode = 'cards'; // 'cards' | 'table' | 'raw'
    let currentFilter = '';

    async function loadData() {
      try {
        const res = await fetch('/api/db-explorer');
        if (!res.ok) throw new Error('Failed to fetch database information');
        dbData = await res.json();
        renderStats();
        renderTabs();
        renderActiveCollection();
      } catch (err) {
        document.getElementById('render-target').innerHTML = \`
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h3>Could not connect to MongoDB</h3>
            <p style="margin-top: 8px;">\${err.message}</p>
          </div>
        \`;
      }
    }

    function renderStats() {
      const statsRow = document.getElementById('stats-row');
      const collections = dbData.collections;
      statsRow.innerHTML = Object.keys(collections).map(key => {
        const c = collections[key];
        const isActive = key === activeCollection ? 'active' : '';
        return \`
          <div class="stat-card \${isActive}" onclick="selectCollection('\${key}')">
            <div class="stat-icon">\${c.icon}</div>
            <div class="stat-meta">
              <h3>\${c.count}</h3>
              <p>\${c.displayName}</p>
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderTabs() {
      const container = document.getElementById('tabs-container');
      const collections = dbData.collections;
      container.innerHTML = Object.keys(collections).map(key => {
        const c = collections[key];
        const isActive = key === activeCollection ? 'active' : '';
        return \`
          <button class="tab \${isActive}" onclick="selectCollection('\${key}')">
            <span>\${c.icon}</span>
            <span>\${c.displayName}</span>
            <span class="tab-badge">\${c.count}</span>
          </button>
        \`;
      }).join('');
    }

    function selectCollection(key) {
      activeCollection = key;
      document.getElementById('search-input').value = '';
      currentFilter = '';
      renderStats();
      renderTabs();
      renderActiveCollection();
    }

    function setViewMode(mode) {
      viewMode = mode;
      document.getElementById('btn-view-cards').classList.toggle('active', mode === 'cards');
      document.getElementById('btn-view-table').classList.toggle('active', mode === 'table');
      document.getElementById('btn-view-raw').classList.toggle('active', mode === 'raw');
      renderActiveCollection();
    }

    function filterCurrentDocs() {
      currentFilter = document.getElementById('search-input').value.toLowerCase().trim();
      renderActiveCollection();
    }

    function renderActiveCollection() {
      const c = dbData.collections[activeCollection];
      if (!c) return;

      document.getElementById('active-icon').textContent = c.icon;
      document.getElementById('active-title').textContent = c.displayName + ' Collection (' + c.name + ')';
      document.getElementById('active-desc').textContent = c.description;

      let docs = c.docs || [];
      if (currentFilter) {
        docs = docs.filter(doc => JSON.stringify(doc).toLowerCase().includes(currentFilter));
      }

      document.getElementById('active-count-badge').textContent = \`\${docs.length} of \${c.count} documents\`;
      const target = document.getElementById('render-target');

      if (docs.length === 0) {
        target.innerHTML = \`
          <div class="empty-state">
            <div class="empty-icon">🍃</div>
            <h3>No documents match your query</h3>
            <p>Try clearing your search filter or selecting another collection.</p>
          </div>
        \`;
        return;
      }

      if (viewMode === 'raw') {
        target.innerHTML = \`<pre class="json-preview" style="max-height: 600px; font-size: 13px;">\${escapeHtml(JSON.stringify(docs, null, 2))}</pre>\`;
        return;
      }

      if (viewMode === 'table') {
        renderTableView(docs, target);
        return;
      }

      // Default: Cards View
      renderCardsView(docs, target);
    }

    function renderCardsView(docs, target) {
      const cardsHtml = docs.map((doc, idx) => {
        const id = doc._id || ('DOC-' + idx);
        const statusBadge = doc.status ? \`<span class="badge badge-\${doc.status.replace(/\\s+/g, '')}">\${doc.status}</span>\` : '';
        const roleBadge = doc.role ? \`<span class="badge badge-\${doc.role}">\${doc.role}</span>\` : '';

        // Extract clean key-values
        const fields = [];
        for (const [k, v] of Object.entries(doc)) {
          if (k === '_id' || k === '__v') continue;
          if (v === null || v === undefined) continue;

          let displayVal = '';
          if (typeof v === 'object') {
            if (v.type === 'Point' && Array.isArray(v.coordinates)) {
              displayVal = \`[\${v.coordinates[0].toFixed(4)}, \${v.coordinates[1].toFixed(4)}]\`;
            } else if (Array.isArray(v)) {
              displayVal = \`[\${v.length} items]\`;
            } else {
              displayVal = JSON.stringify(v);
            }
          } else if (typeof v === 'boolean') {
            displayVal = v ? 'true' : 'false';
          } else {
            displayVal = String(v);
          }

          if (displayVal.length > 55) displayVal = displayVal.slice(0, 52) + '...';
          fields.push({ key: k, val: displayVal });
        }

        return \`
          <div class="doc-card">
            <div class="doc-header">
              <span class="doc-id">#\${String(id).slice(-8)}</span>
              <div>\${statusBadge}\${roleBadge}</div>
            </div>
            <div class="doc-body">
              \${fields.slice(0, 7).map(f => \`
                <div class="doc-field">
                  <span class="field-key">\${f.key}</span>
                  <span class="field-val \${f.key.toLowerCase().includes('id') || f.key.includes('hash') ? 'mono' : ''}">\${escapeHtml(f.val)}</span>
                </div>
              \`).join('')}
            </div>
            <details style="margin-top: 6px;">
              <summary style="font-size: 12px; color: var(--accent); cursor: pointer; font-weight: 600;">View Raw JSON</summary>
              <pre class="json-preview" style="margin-top: 8px;">\${escapeHtml(JSON.stringify(doc, null, 2))}</pre>
            </details>
          </div>
        \`;
      }).join('');

      target.innerHTML = \`<div class="cards-grid">\${cardsHtml}</div>\`;
    }

    function renderTableView(docs, target) {
      if (docs.length === 0) return;
      const allKeys = Array.from(new Set(docs.flatMap(d => Object.keys(d)))).filter(k => k !== '__v');

      const thead = allKeys.map(k => \`<th>\${k}</th>\`).join('');
      const tbody = docs.map(d => {
        return '<tr>' + allKeys.map(k => {
          let val = d[k];
          if (val === undefined || val === null) return '<td style="color: #64748b;">null</td>';
          if (typeof val === 'object') {
            if (val.type === 'Point' && Array.isArray(val.coordinates)) {
              return \`<td><code style="color: #6ee7b7;">\${val.coordinates.join(', ')}</code></td>\`;
            }
            return \`<td><span title="\${escapeHtml(JSON.stringify(val))}">\${Array.isArray(val) ? \`Array(\${val.length})\` : 'Object'}</span></td>\`;
          }
          if (k === 'status') {
            return \`<td><span class="badge badge-\${String(val).replace(/\\s+/g, '')}">\${val}</span></td>\`;
          }
          if (k === 'role') {
            return \`<td><span class="badge badge-\${val}">\${val}</span></td>\`;
          }
          return \`<td>\${escapeHtml(String(val))}</td>\`;
        }).join('') + '</tr>';
      }).join('');

      target.innerHTML = \`
        <div class="table-wrapper">
          <table>
            <thead><tr>\${thead}</tr></thead>
            <tbody>\${tbody}</tbody>
          </table>
        </div>
      \`;
    }

    function refreshData() {
      const btn = event?.currentTarget;
      if (btn) btn.textContent = '⏳ Loading...';
      loadData().finally(() => {
        if (btn) btn.textContent = '🔄 Refresh';
      });
    }

    function exportDataJson() {
      const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`smart-waste-mongodb-export-\${new Date().toISOString().slice(0,10)}.json\`;
      a.click();
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Initial load
    loadData();
  </script>
</body>
</html>`;
}

// Standalone server mode
if (process.argv[1] && process.argv[1].endsWith('db-inspector.js')) {
  const app = express();
  const PORT = process.env.DB_INSPECTOR_PORT || 5050;

  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('\n======================================================');
      console.log('🍃 MONGODB WEB DATABASE INSPECTOR ONLINE');
      console.log('======================================================');
      console.log(`➜  Web UI : http://localhost:${PORT}`);
      console.log(`🗄️ Database: smart-waste (mongodb://127.0.0.1:27017)`);
      console.log('======================================================\n');

      app.get('/api/db-explorer', async (req, res) => {
        try {
          const data = await fetchAllCollections();
          res.json(data);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });

      app.get('*', (req, res) => {
        res.send(getInspectorHtml());
      });

      app.listen(PORT, () => {
        const url = `http://localhost:${PORT}`;
        const cmd = process.platform === 'win32' ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
        import('child_process').then(({ exec }) => exec(cmd).on('error', () => {}));
      });
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}
