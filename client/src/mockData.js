// Realistic mock dataset for CleanChennai Smart Waste Management System
// Replicating authentic Chennai coordinates, realistic incident photos, and active duplicates

const createWasteSvg = (title, type, color, icon) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="grad_${type}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad_${type})"/>
    <rect x="30" y="30" width="540" height="340" rx="16" fill="#1e293b" stroke="${color}" stroke-width="2" opacity="0.6"/>
    <circle cx="300" cy="160" r="70" fill="${color}" opacity="0.2"/>
    <circle cx="300" cy="160" r="50" fill="${color}" opacity="0.3"/>
    <text x="300" y="175" font-size="52" text-anchor="middle" dominant-baseline="middle">${icon}</text>
    <text x="300" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#f8fafc" text-anchor="middle">${title}</text>
    <rect x="200" y="285" width="200" height="28" rx="14" fill="${color}" opacity="0.25"/>
    <text x="300" y="304" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${color}" text-anchor="middle">${type.toUpperCase()}</text>
    <text x="300" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Greater Chennai Corporation · Citizen Geo-Upload</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const samplePhotos = {
  bin_overflow: createWasteSvg('Severe Municipal Bin Overflow', 'Bio & Plastic Spillage', '#ef4444', '🗑️'),
  drain_block: createWasteSvg('Stormwater Drain Clogged with Plastic', 'High Flood Hazard', '#f59e0b', '🌊'),
  commercial: createWasteSvg('Commercial Market Waste & Crates', 'Vegetable Market Dump', '#3b82f6', '📦'),
  footpath: createWasteSvg('Footpath Garbage Heap & Animal Hazard', 'Public Hazard', '#ec4899', '🐕'),
  park_litter: createWasteSvg('Tower Park Walking Track Litter', 'Public Recreation Zone', '#10b981', '🥤'),
  medical: createWasteSvg('Unsegregated Pharmacy & Clinic Waste', 'Critical Biohazard', '#dc2626', '⚠️'),
  cleaned_proof: createWasteSvg('Cleaned & Disinfected Waste Spot', 'Closed Loop Verification', '#10b981', '✅')
};

export const initialUsers = [
  {
    _id: 'usr_citizen_01',
    name: 'Priya Sharma',
    email: 'citizen@demo.com',
    role: 'citizen',
    area: 'Adyar, Chennai'
  },
  {
    _id: 'usr_auth_01',
    name: 'Officer Karthik',
    email: 'authority@demo.com',
    role: 'authority',
    area: 'Greater Chennai Corporation HQ (Ripon Building)'
  },
  {
    _id: 'usr_col_01',
    name: 'Murugan (Zone 13 Driver)',
    email: 'collector@demo.com',
    role: 'collector',
    area: 'Adyar & Besant Nagar'
  },
  {
    _id: 'usr_col_02',
    name: 'Suresh (Zone 9 Driver)',
    email: 'collector2@demo.com',
    role: 'collector',
    area: 'T. Nagar & Panagal Park'
  },
  {
    _id: 'usr_col_03',
    name: 'Venkatesh (Zone 8 Driver)',
    email: 'collector3@demo.com',
    role: 'collector',
    area: 'Anna Nagar & Shenoy Nagar'
  }
];

export const initialBins = [
  {
    _id: 'bin_01',
    code: 'BIN-AD-01',
    area: 'Adyar',
    address: 'Near Adyar Signal, L.B. Road Junction',
    location: { type: 'Point', coordinates: [80.2565, 13.0012] },
    fillLevel: 94,
    lastCollectedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_02',
    code: 'BIN-AD-02',
    area: 'Adyar',
    address: 'Besant Avenue Road, near Theosophical Society',
    location: { type: 'Point', coordinates: [80.2612, 13.0045] },
    fillLevel: 68,
    lastCollectedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_03',
    code: 'BIN-TN-01',
    area: 'T. Nagar',
    address: 'Pondy Bazaar Pedestrian Plaza, near Panagal Park',
    location: { type: 'Point', coordinates: [80.2341, 13.0418] },
    fillLevel: 88,
    lastCollectedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_04',
    code: 'BIN-TN-02',
    area: 'T. Nagar',
    address: 'Ranganathan Street Corner, Usman Road',
    location: { type: 'Point', coordinates: [80.2305, 13.0392] },
    fillLevel: 96,
    lastCollectedAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_05',
    code: 'BIN-VL-01',
    area: 'Velachery',
    address: '100 Feet Bypass Road, near Bus Terminus',
    location: { type: 'Point', coordinates: [80.218, 12.9815] },
    fillLevel: 55,
    lastCollectedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_06',
    code: 'BIN-VL-02',
    area: 'Velachery',
    address: 'Taramani Link Road, near Phoenix Marketcity',
    location: { type: 'Point', coordinates: [80.2198, 12.9912] },
    fillLevel: 89,
    lastCollectedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_07',
    code: 'BIN-GD-01',
    area: 'Guindy',
    address: 'Kathipara Junction Service Lane, near Metro',
    location: { type: 'Point', coordinates: [80.2026, 13.0067] },
    fillLevel: 42,
    lastCollectedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_08',
    code: 'BIN-AN-01',
    area: 'Anna Nagar',
    address: '2nd Avenue, near Anna Nagar Roundtana',
    location: { type: 'Point', coordinates: [80.2101, 13.085] },
    fillLevel: 35,
    lastCollectedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_09',
    code: 'BIN-AN-02',
    area: 'Anna Nagar',
    address: 'Tower Park Gate 2, 3rd Main Road',
    location: { type: 'Point', coordinates: [80.2145, 13.0882] },
    fillLevel: 84,
    lastCollectedAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_10',
    code: 'BIN-MY-01',
    area: 'Mylapore',
    address: 'Luz Church Road, near Kapaleeshwarar Temple',
    location: { type: 'Point', coordinates: [80.2678, 13.0335] },
    fillLevel: 78,
    lastCollectedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  }
];

export const initialComplaints = [
  {
    _id: 'cmp_01',
    reporter: initialUsers[0],
    bin: initialBins[0],
    description: 'Severe municipal bin overflow spilling onto pedestrian footpath. Dogs scattering organic waste.',
    analysis: {
      category: 'Organic & Plastic Mix',
      estimatedWeight: '75-100 kg',
      spillRadius: '4 meters',
      drainageThreat: 'High'
    },
    severity: 'high',
    riskLevel: 'critical', // critical | high | medium | low
    priority: 'critical',
    photo: samplePhotos.bin_overflow,
    location: { type: 'Point', coordinates: [80.2566, 13.0013] },
    areaName: 'Adyar Signal (L.B. Road)',
    status: 'Pending', // Pending | Verified | Assigned | In Progress | Collected | Merged | Rejected
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    duplicateCount: 1,
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Citizen captured photo with GPS coordinates in Adyar.',
        at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ]
  },
  // Intentional duplicate report for Duplicate Detection demonstration:
  {
    _id: 'cmp_dup_01',
    reporter: { _id: 'usr_citizen_02', name: 'Ramanathan K.', email: 'ramanathan@gmail.com', role: 'citizen' },
    bin: initialBins[0],
    description: 'Garbage dump near Adyar junction traffic signal full to the brim. Foul smell.',
    analysis: {
      category: 'Household Overflow',
      estimatedWeight: '60 kg',
      spillRadius: '3 meters',
      drainageThreat: 'Moderate'
    },
    severity: 'high',
    riskLevel: 'high',
    priority: 'high',
    photo: samplePhotos.footpath,
    location: { type: 'Point', coordinates: [80.2568, 13.0014] }, // 22 meters away from cmp_01!
    areaName: 'Adyar Junction, L.B. Road',
    status: 'Pending',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    isDuplicateCandidateOf: 'cmp_01',
    history: [
      {
        status: 'Pending',
        by: { name: 'Ramanathan K.', role: 'citizen' },
        note: 'Reported by local shopkeeper nearby.',
        at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_02',
    reporter: initialUsers[0],
    bin: initialBins[2],
    description: 'Commercial vegetable crates and plastic packing bags piled around Panagal Park pedestrian entrance.',
    analysis: {
      category: 'Commercial Dry & Wet Waste',
      estimatedWeight: '120 kg',
      spillRadius: '6 meters',
      drainageThreat: 'High'
    },
    severity: 'high',
    riskLevel: 'high',
    priority: 'high',
    photo: samplePhotos.commercial,
    location: { type: 'Point', coordinates: [80.2343, 13.042] },
    areaName: 'Pondy Bazaar / Panagal Park',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Citizen report logged with smart photo analysis.',
        at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_03',
    reporter: initialUsers[0],
    bin: initialBins[5],
    description: 'Discarded packaging and beverage cups blocking stormwater grate near Phoenix Mall gate.',
    analysis: {
      category: 'Plastic Beverage Waste',
      estimatedWeight: '45 kg',
      spillRadius: '2.5 meters',
      drainageThreat: 'Critical (Drain Grate Blocked)'
    },
    severity: 'high',
    riskLevel: 'critical',
    priority: 'critical',
    photo: samplePhotos.drain_block,
    location: { type: 'Point', coordinates: [80.2201, 12.9915] },
    areaName: 'Velachery Link Road',
    status: 'Verified',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Assessed Risk: CRITICAL HAZARD. Grate blockage poses flooding threat.',
        at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_04',
    reporter: initialUsers[0],
    bin: initialBins[8],
    description: 'Tower Park walkers track bin overflowing with plastic mineral water bottles and snack boxes.',
    analysis: {
      category: 'Recyclable Plastic Litter',
      estimatedWeight: '30 kg',
      spillRadius: '1.5 meters',
      drainageThreat: 'Low'
    },
    severity: 'medium',
    riskLevel: 'medium',
    priority: 'medium',
    photo: samplePhotos.park_litter,
    location: { type: 'Point', coordinates: [80.2147, 13.0884] },
    areaName: 'Anna Nagar Tower Park Gate 2',
    status: 'Assigned',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by morning walker',
        at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Risk evaluated as Medium (Recreation zone)',
        at: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
      },
      {
        status: 'Assigned',
        by: initialUsers[1],
        note: 'Added to Daily Collection Route for Venkatesh (Driver 3)',
        at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_05',
    reporter: initialUsers[0],
    bin: initialBins[3],
    description: 'Ranganathan street shopping crowd garbage overflow, immediate clearance needed.',
    analysis: {
      category: 'Dense Commercial Waste',
      estimatedWeight: '150 kg',
      spillRadius: '5 meters',
      drainageThreat: 'High'
    },
    severity: 'high',
    riskLevel: 'critical',
    priority: 'critical',
    photo: samplePhotos.commercial,
    location: { type: 'Point', coordinates: [80.2307, 13.0394] },
    areaName: 'Usman Road Corner, T. Nagar',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Logged by citizen',
        at: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Assessed Risk: Critical. Heavy pedestrian crowd congestion.',
        at: new Date(Date.now() - 9 * 3600 * 1000).toISOString()
      },
      {
        status: 'Assigned',
        by: initialUsers[1],
        note: 'Dispatched to Suresh (Driver 2)',
        at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
      },
      {
        status: 'In Progress',
        by: initialUsers[3],
        note: 'Driver Suresh arrived at location with compactor truck.',
        at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_06',
    reporter: initialUsers[0],
    bin: initialBins[1],
    description: 'Besant Avenue roadside overflow cleared and verified by sanitation team.',
    analysis: {
      category: 'Dry Leaves & Litter',
      estimatedWeight: '40 kg',
      spillRadius: '2 meters',
      drainageThreat: 'Low'
    },
    severity: 'medium',
    riskLevel: 'low',
    priority: 'low',
    photo: samplePhotos.cleaned_proof,
    location: { type: 'Point', coordinates: [80.2614, 13.0047] },
    areaName: 'Besant Avenue Road, Adyar',
    status: 'Collected',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Reported by citizen',
        at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Verified and queued',
        at: new Date(Date.now() - 22 * 3600 * 1000).toISOString()
      },
      {
        status: 'Assigned',
        by: initialUsers[1],
        note: 'Dispatched to Murugan',
        at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
      },
      {
        status: 'In Progress',
        by: initialUsers[2],
        note: 'Collection started',
        at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
      },
      {
        status: 'Collected',
        by: initialUsers[2],
        note: 'CLOSED LOOP VERIFIED: Waste cleared, spot bleached, bin capacity reset to 5%.',
        at: new Date(Date.now() - 17 * 3600 * 1000).toISOString()
      }
    ]
  }
];

export const initialTasks = [
  {
    _id: 'tsk_01',
    complaint: initialComplaints[4], // cmp_05 in T. Nagar
    assignedTo: initialUsers[3], // Suresh
    status: 'in_progress',
    stopNumber: 1,
    priority: 'critical',
    assignedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    notes: 'Urgent weekend crowd clearing on Usman Road'
  },
  {
    _id: 'tsk_02',
    complaint: initialComplaints[3], // cmp_04 in Anna Nagar
    assignedTo: initialUsers[4], // Venkatesh
    status: 'assigned',
    stopNumber: 1,
    priority: 'medium',
    assignedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    notes: 'Clear walking track bins before evening rush'
  },
  {
    _id: 'tsk_03',
    complaint: initialComplaints[5], // cmp_06 in Adyar (collected)
    assignedTo: initialUsers[2], // Murugan
    status: 'collected',
    stopNumber: 1,
    priority: 'low',
    assignedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 17 * 3600 * 1000).toISOString(),
    proofPhoto: samplePhotos.cleaned_proof,
    proofNote: 'Pavement cleared of dry leaves and plastic, sprayed lime powder.'
  }
];

export const initialNotifications = [
  {
    _id: 'notif_01',
    user: 'usr_auth_01',
    type: 'duplicate_alert',
    title: 'Duplicate Waste Report Detected',
    message: '2 reports logged within 22 meters at Adyar Signal (L.B. Road). Review and merge to prevent duplicate truck dispatches.',
    read: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    _id: 'notif_02',
    user: 'usr_auth_01',
    type: 'high_risk',
    title: 'Critical Risk Alert: Velachery Storm Grate',
    message: 'Stormwater drain grate blocked with beverage plastic waste. Immediate dispatch recommended.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif_03',
    user: 'usr_citizen_01',
    type: 'complaint_collected',
    title: 'Incident Resolved & Closed Loop Verified!',
    message: 'Your report at Besant Avenue Road has been cleared and verified by sanitation team. Thank you for keeping Chennai clean!',
    read: false,
    createdAt: new Date(Date.now() - 17 * 3600 * 1000).toISOString()
  }
];
