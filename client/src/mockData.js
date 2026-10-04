// Realistic mock dataset replicating server seed data for live browser deployment

export const initialUsers = [
  {
    _id: 'usr_citizen_01',
    name: 'Priya Sharma',
    email: 'citizen@demo.com',
    role: 'citizen',
    area: 'Adyar'
  },
  {
    _id: 'usr_auth_01',
    name: 'Officer Karthik',
    email: 'authority@demo.com',
    role: 'authority',
    area: 'Chennai Corporation HQ'
  },
  {
    _id: 'usr_col_01',
    name: 'Murugan (Collector 1)',
    email: 'collector@demo.com',
    role: 'collector',
    area: 'Adyar & T. Nagar'
  },
  {
    _id: 'usr_col_02',
    name: 'Suresh (Collector 2)',
    email: 'collector2@demo.com',
    role: 'collector',
    area: 'Velachery & Guindy'
  },
  {
    _id: 'usr_col_03',
    name: 'Venkatesh (Collector 3)',
    email: 'collector3@demo.com',
    role: 'collector',
    area: 'Anna Nagar'
  }
];

export const initialBins = [
  {
    _id: 'bin_01',
    code: 'BIN-AD-01',
    area: 'Adyar',
    address: 'Near Adyar Signal, L.B. Road junction',
    location: { type: 'Point', coordinates: [80.2565, 13.0012] },
    fillLevel: 92,
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
    address: 'Pondy Bazaar pedestrian plaza, near Panagal Park',
    location: { type: 'Point', coordinates: [80.2341, 13.0418] },
    fillLevel: 85,
    lastCollectedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_04',
    code: 'BIN-TN-02',
    area: 'T. Nagar',
    address: 'Ranganathan Street corner, Usman Road',
    location: { type: 'Point', coordinates: [80.2305, 13.0392] },
    fillLevel: 94,
    lastCollectedAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_05',
    code: 'BIN-VL-01',
    area: 'Velachery',
    address: '100 Feet Bypass Road, near Bus Terminus',
    location: { type: 'Point', coordinates: [80.2180, 12.9815] },
    fillLevel: 55,
    lastCollectedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_06',
    code: 'BIN-VL-02',
    area: 'Velachery',
    address: 'Taramani Link Road, near Phoenix Marketcity',
    location: { type: 'Point', coordinates: [80.2198, 12.9912] },
    fillLevel: 88,
    lastCollectedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_07',
    code: 'BIN-GD-01',
    area: 'Guindy',
    address: 'Kathipara Junction service lane, near Metro',
    location: { type: 'Point', coordinates: [80.2026, 13.0067] },
    fillLevel: 42,
    lastCollectedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_08',
    code: 'BIN-GD-02',
    area: 'Guindy',
    address: 'Race Course Road, near Railway Station',
    location: { type: 'Point', coordinates: [80.2115, 13.0089] },
    fillLevel: 76,
    lastCollectedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_09',
    code: 'BIN-AN-01',
    area: 'Anna Nagar',
    address: '2nd Avenue, near Anna Nagar Roundtana',
    location: { type: 'Point', coordinates: [80.2101, 13.0850] },
    fillLevel: 30,
    lastCollectedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_10',
    code: 'BIN-AN-02',
    area: 'Anna Nagar',
    address: 'Tower Park Gate 2, 3rd Main Road',
    location: { type: 'Point', coordinates: [80.2145, 13.0882] },
    fillLevel: 82,
    lastCollectedAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_11',
    code: 'BIN-GN-01',
    area: 'Gandhi Nagar',
    address: 'Gandhi Nagar 4th Main Road, near Post Office',
    location: { type: 'Point', coordinates: [80.2543, 13.0084] },
    fillLevel: 45,
    lastCollectedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
  },
  {
    _id: 'bin_12',
    code: 'BIN-GN-02',
    area: 'Gandhi Nagar',
    address: 'Kasturba Nagar 1st Cross, near MRTS',
    location: { type: 'Point', coordinates: [80.2508, 13.0051] },
    fillLevel: 15,
    lastCollectedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];

export const initialComplaints = [
  {
    _id: 'cmp_01',
    reporter: initialUsers[0],
    bin: initialBins[0],
    description: 'Bin severely overflowing onto footpath near Adyar Signal. Pedestrians forced to walk on road.',
    severity: 'high',
    priority: 'critical',
    location: { type: 'Point', coordinates: [80.2566, 13.0013] },
    status: 'Pending',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_02',
    reporter: initialUsers[0],
    bin: initialBins[2],
    description: 'Commercial waste and vegetable crates piled around public bin near Panagal Park.',
    severity: 'high',
    priority: 'high',
    location: { type: 'Point', coordinates: [80.2343, 13.0420] },
    status: 'Pending',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_03',
    reporter: initialUsers[0],
    bin: initialBins[5],
    description: 'Trash spilling out near Phoenix mall entrance, plastic bags blowing onto the lane.',
    severity: 'medium',
    priority: 'high',
    location: { type: 'Point', coordinates: [80.2201, 12.9915] },
    status: 'Pending',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_04',
    reporter: initialUsers[0],
    bin: initialBins[9],
    description: 'Tower park walkers corner bin full of plastic water bottles and snack boxes.',
    severity: 'medium',
    priority: 'high',
    location: { type: 'Point', coordinates: [80.2147, 13.0884] },
    status: 'Verified',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Verified with priority High (Public park vicinity)',
        at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_05',
    reporter: initialUsers[0],
    bin: initialBins[3],
    description: 'Ranganathan street shopping crowd garbage overflow, immediate clearance needed.',
    severity: 'high',
    priority: 'critical',
    location: { type: 'Point', coordinates: [80.2307, 13.0394] },
    status: 'Assigned',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Verified as Critical priority',
        at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        status: 'Assigned',
        by: initialUsers[1],
        note: 'Assigned to sanitation worker Murugan (Collector 1)',
        at: new Date(Date.now() - 11 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_06',
    reporter: initialUsers[0],
    bin: initialBins[1],
    description: 'Dry leaves and organic garden waste overflowing onto Besant Avenue sidewalk.',
    severity: 'medium',
    priority: 'medium',
    location: { type: 'Point', coordinates: [80.2614, 13.0047] },
    status: 'In Progress',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Verified for routine Adyar route',
        at: new Date(Date.now() - 16 * 3600 * 1000).toISOString()
      },
      {
        status: 'Assigned',
        by: initialUsers[1],
        note: 'Assigned to Murugan (Collector 1)',
        at: new Date(Date.now() - 15 * 3600 * 1000).toISOString()
      },
      {
        status: 'In Progress',
        by: initialUsers[2],
        note: 'Collector is en route with truck TN-07-AW-4021',
        at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_07',
    reporter: initialUsers[0],
    bin: initialBins[11],
    description: 'Paper cups and food wraps scattered near Kasturba Nagar railway station staircase.',
    severity: 'low',
    priority: 'low',
    location: { type: 'Point', coordinates: [80.2510, 13.0053] },
    status: 'Collected',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 28 * 3600 * 1000).toISOString()
      },
      {
        status: 'Verified',
        by: initialUsers[1],
        note: 'Verified low priority',
        at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        status: 'Assigned',
        by: initialUsers[1],
        note: 'Assigned to Murugan (Collector 1)',
        at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
      },
      {
        status: 'In Progress',
        by: initialUsers[2],
        note: 'Collection started',
        at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      },
      {
        status: 'Collected',
        by: initialUsers[2],
        note: 'Bin emptied, surroundings swept clean. Reset fill level to 5%.',
        at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    _id: 'cmp_08',
    reporter: initialUsers[0],
    bin: initialBins[6],
    description: 'C&D construction debris dumped beside municipal bin at Kathipara junction.',
    severity: 'high',
    priority: 'high',
    location: { type: 'Point', coordinates: [80.2028, 13.0069] },
    status: 'Rejected',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    history: [
      {
        status: 'Pending',
        by: initialUsers[0],
        note: 'Report submitted by citizen',
        at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      },
      {
        status: 'Rejected',
        by: initialUsers[1],
        note: 'Construction & Demolition debris must be booked through GCC Special C&D helpline.',
        at: new Date(Date.now() - 30 * 3600 * 1000).toISOString()
      }
    ]
  }
];

export const initialTasks = [
  {
    _id: 'tsk_01',
    complaint: initialComplaints[4], // Ranganathan St
    assignedTo: initialUsers[2],    // Collector 1
    status: 'assigned',
    assignedAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString()
  },
  {
    _id: 'tsk_02',
    complaint: initialComplaints[5], // Besant Avenue
    assignedTo: initialUsers[2],    // Collector 1
    status: 'in_progress',
    assignedAt: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    _id: 'tsk_03',
    complaint: initialComplaints[6], // Kasturba Nagar
    assignedTo: initialUsers[2],    // Collector 1
    status: 'collected',
    assignedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];

export const initialNotifications = [
  {
    _id: 'notif_01',
    user: initialUsers[0]._id,
    type: 'complaint_verified',
    title: 'Report Verified',
    message: 'Your report regarding Tower Park bin has been verified with High priority.',
    read: false,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif_02',
    user: initialUsers[0]._id,
    type: 'complaint_collected',
    title: 'Waste Collected',
    message: 'Good news! The bin at Kasturba Nagar has been emptied and sanitized.',
    read: true,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif_03',
    user: initialUsers[1]._id,
    type: 'critical_bin_alert',
    title: 'High Fill Level Warning',
    message: 'Smart Bin BIN-AD-01 (Adyar Signal) has reached 92% fill capacity.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  }
];
