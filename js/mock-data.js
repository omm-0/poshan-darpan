/* ============================================================
   POSHAN DARPAN — MOCK DATA LAYER (replaces backend/database)
   All data is stored in localStorage; seed values are below.
   No imports — exposes functions on window for global access.
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // STORAGE KEYS
  // ============================================================
  const KEYS = {
    USERS: 'pd_users',
    SCHOOLS: 'pd_schools',
    INVENTORY: 'pd_inventory',
    ATTENDANCE: 'pd_attendance',
    ALERTS: 'pd_alerts',
    TRANSACTIONS: 'pd_transactions',
    SESSION: 'poshanDarpan_currentUser',
    SEEDED: 'pd_seeded_v1'
  };

  // Per-meal portion sizes (kg per student)
  const PORTION = { rice: 0.1, wheat: 0.1, dal: 0.03 };

  // ============================================================
  // SEED DATA
  // ============================================================
  const MOCK_USERS = [
    { uid: 'user_school_001', name: 'Rajesh Kumar', email: 'rajesh@school.com', password: 'school123', role: 'school', schoolId: 'school_001', district: null, createdAt: '2026-01-15T10:00:00' },
    { uid: 'user_school_002', name: 'Priya Sharma', email: 'priya@school.com', password: 'school123', role: 'school', schoolId: 'school_002', district: null, createdAt: '2026-01-20T10:00:00' },
    { uid: 'user_school_003', name: 'Amit Patel', email: 'amit@school.com', password: 'school123', role: 'school', schoolId: 'school_003', district: null, createdAt: '2026-02-01T10:00:00' },
    { uid: 'user_school_005', name: 'Ramesh Yadav', email: 'ramesh@school.com', password: 'school123', role: 'school', schoolId: 'school_005', district: null, createdAt: '2026-02-10T10:00:00' },
    { uid: 'user_gov_001', name: 'Dr. Sanjay Verma', email: 'sanjay@gov.com', password: 'gov123', role: 'government', schoolId: null, district: 'All Districts', createdAt: '2026-01-10T10:00:00' },
    { uid: 'user_gov_002', name: 'Meera Joshi', email: 'meera@gov.com', password: 'gov123', role: 'government', schoolId: null, district: 'Ujjain', createdAt: '2026-01-12T10:00:00' }
  ];

  const MOCK_SCHOOLS = [
    { schoolId: 'school_001', name: 'Government Primary School, Ujjain', enrollment: 250, district: 'Ujjain', status: 'active', contactPerson: 'Rajesh Kumar', contactEmail: 'rajesh@school.com', createdAt: '2025-06-01' },
    { schoolId: 'school_002', name: 'Government Middle School, Indore', enrollment: 400, district: 'Indore', status: 'active', contactPerson: 'Priya Sharma', contactEmail: 'priya@school.com', createdAt: '2025-06-15' },
    { schoolId: 'school_003', name: 'Government High School, Bhopal', enrollment: 600, district: 'Bhopal', status: 'active', contactPerson: 'Amit Patel', contactEmail: 'amit@school.com', createdAt: '2025-07-01' },
    { schoolId: 'school_004', name: 'Government Primary School, Gwalior', enrollment: 180, district: 'Gwalior', status: 'inactive', contactPerson: 'Sunita Devi', contactEmail: 'sunita@school.com', createdAt: '2025-08-01' },
    { schoolId: 'school_005', name: 'Government Middle School, Jabalpur', enrollment: 320, district: 'Jabalpur', status: 'active', contactPerson: 'Ramesh Yadav', contactEmail: 'ramesh@school.com', createdAt: '2025-07-20' }
  ];

  const MOCK_INVENTORY = [
    { schoolId: 'school_001', rice: { current: 80, max: 200 }, wheat: { current: 60, max: 150 }, dal: { current: 15, max: 50 }, lastUpdated: '2026-04-25T14:30:00' },
    { schoolId: 'school_002', rice: { current: 150, max: 300 }, wheat: { current: 120, max: 250 }, dal: { current: 35, max: 80 }, lastUpdated: '2026-04-25T16:00:00' },
    { schoolId: 'school_003', rice: { current: 30, max: 400 }, wheat: { current: 200, max: 350 }, dal: { current: 8, max: 100 }, lastUpdated: '2026-04-24T09:00:00' },
    { schoolId: 'school_004', rice: { current: 90, max: 150 }, wheat: { current: 70, max: 120 }, dal: { current: 25, max: 40 }, lastUpdated: '2026-04-20T11:00:00' },
    { schoolId: 'school_005', rice: { current: 45, max: 250 }, wheat: { current: 30, max: 200 }, dal: { current: 12, max: 60 }, lastUpdated: '2026-04-25T10:00:00' }
  ];

  const MOCK_ATTENDANCE = [
    // school_001
    { id: 'att_001_01', schoolId: 'school_001', date: '2026-04-25', studentsPresent: 220, riceUsed: 22.0, wheatUsed: 22.0, dalUsed: 6.6, timestamp: '2026-04-25T11:00:00' },
    { id: 'att_001_02', schoolId: 'school_001', date: '2026-04-24', studentsPresent: 210, riceUsed: 21.0, wheatUsed: 21.0, dalUsed: 6.3, timestamp: '2026-04-24T11:00:00' },
    { id: 'att_001_03', schoolId: 'school_001', date: '2026-04-23', studentsPresent: 195, riceUsed: 19.5, wheatUsed: 19.5, dalUsed: 5.85, timestamp: '2026-04-23T11:00:00' },
    { id: 'att_001_04', schoolId: 'school_001', date: '2026-04-22', studentsPresent: 230, riceUsed: 23.0, wheatUsed: 23.0, dalUsed: 6.9, timestamp: '2026-04-22T11:00:00' },
    { id: 'att_001_05', schoolId: 'school_001', date: '2026-04-21', studentsPresent: 180, riceUsed: 18.0, wheatUsed: 18.0, dalUsed: 5.4, timestamp: '2026-04-21T11:00:00' },
    { id: 'att_001_06', schoolId: 'school_001', date: '2026-04-18', studentsPresent: 240, riceUsed: 24.0, wheatUsed: 24.0, dalUsed: 7.2, timestamp: '2026-04-18T11:00:00' },
    { id: 'att_001_07', schoolId: 'school_001', date: '2026-04-17', studentsPresent: 200, riceUsed: 20.0, wheatUsed: 20.0, dalUsed: 6.0, timestamp: '2026-04-17T11:00:00' },
    { id: 'att_001_08', schoolId: 'school_001', date: '2026-04-16', studentsPresent: 215, riceUsed: 21.5, wheatUsed: 21.5, dalUsed: 6.45, timestamp: '2026-04-16T11:00:00' },
    { id: 'att_001_09', schoolId: 'school_001', date: '2026-04-15', studentsPresent: 190, riceUsed: 19.0, wheatUsed: 19.0, dalUsed: 5.7, timestamp: '2026-04-15T11:00:00' },
    { id: 'att_001_10', schoolId: 'school_001', date: '2026-04-14', studentsPresent: 225, riceUsed: 22.5, wheatUsed: 22.5, dalUsed: 6.75, timestamp: '2026-04-14T11:00:00' },
    // school_002
    { id: 'att_002_01', schoolId: 'school_002', date: '2026-04-25', studentsPresent: 370, riceUsed: 37.0, wheatUsed: 37.0, dalUsed: 11.1, timestamp: '2026-04-25T10:30:00' },
    { id: 'att_002_02', schoolId: 'school_002', date: '2026-04-24', studentsPresent: 350, riceUsed: 35.0, wheatUsed: 35.0, dalUsed: 10.5, timestamp: '2026-04-24T10:30:00' },
    { id: 'att_002_03', schoolId: 'school_002', date: '2026-04-23', studentsPresent: 310, riceUsed: 31.0, wheatUsed: 31.0, dalUsed: 9.3, timestamp: '2026-04-23T10:30:00' },
    { id: 'att_002_04', schoolId: 'school_002', date: '2026-04-22', studentsPresent: 390, riceUsed: 39.0, wheatUsed: 39.0, dalUsed: 11.7, timestamp: '2026-04-22T10:30:00' },
    { id: 'att_002_05', schoolId: 'school_002', date: '2026-04-21', studentsPresent: 280, riceUsed: 28.0, wheatUsed: 28.0, dalUsed: 8.4, timestamp: '2026-04-21T10:30:00' },
    { id: 'att_002_06', schoolId: 'school_002', date: '2026-04-18', studentsPresent: 360, riceUsed: 36.0, wheatUsed: 36.0, dalUsed: 10.8, timestamp: '2026-04-18T10:30:00' },
    { id: 'att_002_07', schoolId: 'school_002', date: '2026-04-17', studentsPresent: 340, riceUsed: 34.0, wheatUsed: 34.0, dalUsed: 10.2, timestamp: '2026-04-17T10:30:00' },
    { id: 'att_002_08', schoolId: 'school_002', date: '2026-04-16', studentsPresent: 330, riceUsed: 33.0, wheatUsed: 33.0, dalUsed: 9.9, timestamp: '2026-04-16T10:30:00' },
    { id: 'att_002_09', schoolId: 'school_002', date: '2026-04-15', studentsPresent: 295, riceUsed: 29.5, wheatUsed: 29.5, dalUsed: 8.85, timestamp: '2026-04-15T10:30:00' },
    { id: 'att_002_10', schoolId: 'school_002', date: '2026-04-14', studentsPresent: 375, riceUsed: 37.5, wheatUsed: 37.5, dalUsed: 11.25, timestamp: '2026-04-14T10:30:00' },
    // school_003
    { id: 'att_003_01', schoolId: 'school_003', date: '2026-04-25', studentsPresent: 540, riceUsed: 54.0, wheatUsed: 54.0, dalUsed: 16.2, timestamp: '2026-04-25T10:00:00' },
    { id: 'att_003_02', schoolId: 'school_003', date: '2026-04-24', studentsPresent: 510, riceUsed: 51.0, wheatUsed: 51.0, dalUsed: 15.3, timestamp: '2026-04-24T10:00:00' },
    { id: 'att_003_03', schoolId: 'school_003', date: '2026-04-23', studentsPresent: 480, riceUsed: 48.0, wheatUsed: 48.0, dalUsed: 14.4, timestamp: '2026-04-23T10:00:00' },
    { id: 'att_003_04', schoolId: 'school_003', date: '2026-04-22', studentsPresent: 560, riceUsed: 56.0, wheatUsed: 56.0, dalUsed: 16.8, timestamp: '2026-04-22T10:00:00' },
    { id: 'att_003_05', schoolId: 'school_003', date: '2026-04-21', studentsPresent: 420, riceUsed: 42.0, wheatUsed: 42.0, dalUsed: 12.6, timestamp: '2026-04-21T10:00:00' },
    { id: 'att_003_06', schoolId: 'school_003', date: '2026-04-18', studentsPresent: 550, riceUsed: 55.0, wheatUsed: 55.0, dalUsed: 16.5, timestamp: '2026-04-18T10:00:00' },
    { id: 'att_003_07', schoolId: 'school_003', date: '2026-04-17', studentsPresent: 490, riceUsed: 49.0, wheatUsed: 49.0, dalUsed: 14.7, timestamp: '2026-04-17T10:00:00' },
    { id: 'att_003_08', schoolId: 'school_003', date: '2026-04-16', studentsPresent: 530, riceUsed: 53.0, wheatUsed: 53.0, dalUsed: 15.9, timestamp: '2026-04-16T10:00:00' },
    // school_005
    { id: 'att_005_01', schoolId: 'school_005', date: '2026-04-25', studentsPresent: 280, riceUsed: 28.0, wheatUsed: 28.0, dalUsed: 8.4, timestamp: '2026-04-25T10:15:00' },
    { id: 'att_005_02', schoolId: 'school_005', date: '2026-04-24', studentsPresent: 260, riceUsed: 26.0, wheatUsed: 26.0, dalUsed: 7.8, timestamp: '2026-04-24T10:15:00' },
    { id: 'att_005_03', schoolId: 'school_005', date: '2026-04-23', studentsPresent: 240, riceUsed: 24.0, wheatUsed: 24.0, dalUsed: 7.2, timestamp: '2026-04-23T10:15:00' },
    { id: 'att_005_04', schoolId: 'school_005', date: '2026-04-22', studentsPresent: 300, riceUsed: 30.0, wheatUsed: 30.0, dalUsed: 9.0, timestamp: '2026-04-22T10:15:00' },
    { id: 'att_005_05', schoolId: 'school_005', date: '2026-04-21', studentsPresent: 210, riceUsed: 21.0, wheatUsed: 21.0, dalUsed: 6.3, timestamp: '2026-04-21T10:15:00' }
  ];

  const MOCK_ALERTS = [
    { id: 'alert_001', schoolId: 'school_003', schoolName: 'Government High School, Bhopal', type: 'stock', severity: 'critical', item: 'Rice', title: 'CRITICAL: Rice stock critically low', message: 'Rice stock is at 7.5% (30 kg out of 400 kg). Immediate replenishment needed.', status: 'active', timestamp: '2026-04-24T09:30:00', resolvedAt: null },
    { id: 'alert_002', schoolId: 'school_003', schoolName: 'Government High School, Bhopal', type: 'stock', severity: 'critical', item: 'Dal', title: 'CRITICAL: Dal stock critically low', message: 'Dal stock is at 8% (8 kg out of 100 kg). Immediate replenishment needed.', status: 'active', timestamp: '2026-04-24T09:30:00', resolvedAt: null },
    { id: 'alert_003', schoolId: 'school_005', schoolName: 'Government Middle School, Jabalpur', type: 'stock', severity: 'warning', item: 'Wheat', title: 'WARNING: Wheat stock running low', message: 'Wheat stock is at 15% (30 kg out of 200 kg). Consider restocking soon.', status: 'active', timestamp: '2026-04-25T10:15:00', resolvedAt: null },
    { id: 'alert_004', schoolId: 'school_005', schoolName: 'Government Middle School, Jabalpur', type: 'stock', severity: 'warning', item: 'Rice', title: 'WARNING: Rice stock running low', message: 'Rice stock is at 18% (45 kg out of 250 kg). Consider restocking soon.', status: 'active', timestamp: '2026-04-25T10:15:00', resolvedAt: null },
    { id: 'alert_005', schoolId: 'school_001', schoolName: 'Government Primary School, Ujjain', type: 'stock', severity: 'warning', item: 'Dal', title: 'WARNING: Dal stock running low', message: 'Dal stock was at 18% (9 kg out of 50 kg). Restocked successfully.', status: 'resolved', timestamp: '2026-04-20T14:00:00', resolvedAt: '2026-04-21T09:00:00' }
  ];

  const MOCK_TRANSACTIONS = [
    { id: 'txn_001', schoolId: 'school_001', type: 'deduction', item: 'Rice', quantity: 22.0, reason: 'Attendance deduction (220 students)', timestamp: '2026-04-25T11:00:00' },
    { id: 'txn_002', schoolId: 'school_001', type: 'deduction', item: 'Wheat', quantity: 22.0, reason: 'Attendance deduction (220 students)', timestamp: '2026-04-25T11:00:00' },
    { id: 'txn_003', schoolId: 'school_001', type: 'deduction', item: 'Dal', quantity: 6.6, reason: 'Attendance deduction (220 students)', timestamp: '2026-04-25T11:00:00' },
    { id: 'txn_004', schoolId: 'school_001', type: 'addition', item: 'Rice', quantity: 50.0, reason: 'Stock delivery received', timestamp: '2026-04-22T08:30:00' },
    { id: 'txn_005', schoolId: 'school_001', type: 'addition', item: 'Dal', quantity: 20.0, reason: 'Stock delivery received', timestamp: '2026-04-21T09:00:00' },
    { id: 'txn_006', schoolId: 'school_002', type: 'deduction', item: 'Rice', quantity: 37.0, reason: 'Attendance deduction (370 students)', timestamp: '2026-04-25T10:30:00' },
    { id: 'txn_007', schoolId: 'school_003', type: 'deduction', item: 'Rice', quantity: 54.0, reason: 'Attendance deduction (540 students)', timestamp: '2026-04-25T10:00:00' },
    { id: 'txn_008', schoolId: 'school_005', type: 'addition', item: 'Wheat', quantity: 80.0, reason: 'Stock delivery received', timestamp: '2026-04-20T14:00:00' }
  ];

  // ============================================================
  // STORAGE HELPERS
  // ============================================================
  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('[mock-data] read error', key, e);
      return fallback;
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[mock-data] write error', key, e);
      return false;
    }
  }

  function _genId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  function _nowISO() {
    return new Date().toISOString();
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function initializeDataStore() {
    if (localStorage.getItem(KEYS.SEEDED) === '1') return;
    _write(KEYS.USERS, MOCK_USERS);
    _write(KEYS.SCHOOLS, MOCK_SCHOOLS);
    _write(KEYS.INVENTORY, MOCK_INVENTORY);
    _write(KEYS.ATTENDANCE, MOCK_ATTENDANCE);
    _write(KEYS.ALERTS, MOCK_ALERTS);
    _write(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    localStorage.setItem(KEYS.SEEDED, '1');
  }

  // Reset for debugging — exposed but not auto-called
  function resetDataStore() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    initializeDataStore();
  }

  // ============================================================
  // USER / AUTH
  // ============================================================
  function authenticateUser(email, password) {
    const users = _read(KEYS.USERS, []);
    const user = users.find(u =>
      u.email.toLowerCase() === String(email).toLowerCase().trim() &&
      u.password === password
    );
    return user || null;
  }

  function registerUser(name, email, password, role, schoolId, district) {
    const users = _read(KEYS.USERS, []);
    const emailNorm = String(email).toLowerCase().trim();
    if (users.some(u => u.email.toLowerCase() === emailNorm)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser = {
      uid: _genId('user'),
      name: String(name).trim(),
      email: emailNorm,
      password: password,
      role: role,
      schoolId: role === 'school' ? schoolId : null,
      district: role === 'government' ? district : null,
      createdAt: _nowISO()
    };
    users.push(newUser);
    _write(KEYS.USERS, users);
    return { success: true, data: newUser };
  }

  function getCurrentUser() {
    return _read(KEYS.SESSION, null);
  }

  function setCurrentUser(user) {
    _write(KEYS.SESSION, user);
  }

  function logoutUser() {
    localStorage.removeItem(KEYS.SESSION);
  }

  function getUserById(uid) {
    const users = _read(KEYS.USERS, []);
    return users.find(u => u.uid === uid) || null;
  }

  // ============================================================
  // SCHOOLS
  // ============================================================
  function getAllSchools() {
    return _read(KEYS.SCHOOLS, []);
  }

  function getSchoolById(schoolId) {
    return getAllSchools().find(s => s.schoolId === schoolId) || null;
  }

  function getActiveSchools() {
    return getAllSchools().filter(s => s.status === 'active');
  }

  function getSchoolsByDistrict(district) {
    if (!district || district === 'all' || district === 'All Districts') {
      return getAllSchools();
    }
    return getAllSchools().filter(s => s.district === district);
  }

  // ============================================================
  // INVENTORY
  // ============================================================
  function getAllInventories() {
    return _read(KEYS.INVENTORY, []);
  }

  function getInventoryBySchoolId(schoolId) {
    return getAllInventories().find(i => i.schoolId === schoolId) || null;
  }

  function _saveInventory(invArr) {
    _write(KEYS.INVENTORY, invArr);
  }

  function updateInventory(schoolId, item, newCurrentValue) {
    const itemKey = String(item).toLowerCase();
    if (!['rice', 'wheat', 'dal'].includes(itemKey)) {
      return { success: false, error: 'Invalid item' };
    }
    const inv = getAllInventories();
    const idx = inv.findIndex(i => i.schoolId === schoolId);
    if (idx === -1) return { success: false, error: 'Inventory not found' };
    if (newCurrentValue < 0) {
      return { success: false, error: 'Stock cannot be negative' };
    }
    if (newCurrentValue > inv[idx][itemKey].max) {
      return { success: false, error: 'Exceeds capacity (' + inv[idx][itemKey].max + ' kg)' };
    }
    inv[idx][itemKey].current = Math.round(newCurrentValue * 100) / 100;
    inv[idx].lastUpdated = _nowISO();
    _saveInventory(inv);
    return { success: true, data: inv[idx] };
  }

  function addStock(schoolId, item, quantityToAdd) {
    const itemKey = String(item).toLowerCase();
    if (!['rice', 'wheat', 'dal'].includes(itemKey)) {
      return { success: false, error: 'Please select a valid item.' };
    }
    const qty = Number(quantityToAdd);
    if (!isFinite(qty) || qty <= 0) {
      return { success: false, error: 'Quantity must be a positive number.' };
    }
    const inv = getAllInventories();
    const idx = inv.findIndex(i => i.schoolId === schoolId);
    if (idx === -1) return { success: false, error: 'Inventory not found.' };
    const itemData = inv[idx][itemKey];
    const newTotal = itemData.current + qty;
    if (newTotal > itemData.max) {
      const remaining = Math.round((itemData.max - itemData.current) * 100) / 100;
      return {
        success: false,
        error: 'Cannot add ' + qty + ' kg. Only ' + remaining + ' kg capacity remaining (max ' + itemData.max + ' kg).'
      };
    }
    inv[idx][itemKey].current = Math.round(newTotal * 100) / 100;
    inv[idx].lastUpdated = _nowISO();
    _saveInventory(inv);

    // Log transaction
    const itemDisplay = itemKey.charAt(0).toUpperCase() + itemKey.slice(1);
    addStockTransaction(schoolId, 'addition', itemDisplay, qty, 'Stock delivery received');

    // Auto-resolve any active alerts for this item if stock now > 20%
    const pct = (inv[idx][itemKey].current / inv[idx][itemKey].max) * 100;
    if (pct > 20) {
      _autoResolveAlertsForItem(schoolId, itemDisplay);
    }

    return { success: true, data: inv[idx] };
  }

  function deductStock(schoolId, riceQty, wheatQty, dalQty) {
    const inv = getAllInventories();
    const idx = inv.findIndex(i => i.schoolId === schoolId);
    if (idx === -1) return { success: false, error: 'Inventory not found.' };

    const item = inv[idx];
    const insufficient = [];
    if (item.rice.current < riceQty)   insufficient.push('Rice (need ' + riceQty + ' kg, have ' + item.rice.current + ' kg)');
    if (item.wheat.current < wheatQty) insufficient.push('Wheat (need ' + wheatQty + ' kg, have ' + item.wheat.current + ' kg)');
    if (item.dal.current < dalQty)     insufficient.push('Dal (need ' + dalQty + ' kg, have ' + item.dal.current + ' kg)');

    if (insufficient.length > 0) {
      return { success: false, error: 'Insufficient stock: ' + insufficient.join(', ') };
    }

    item.rice.current  = Math.round((item.rice.current  - riceQty)  * 100) / 100;
    item.wheat.current = Math.round((item.wheat.current - wheatQty) * 100) / 100;
    item.dal.current   = Math.round((item.dal.current   - dalQty)   * 100) / 100;
    item.lastUpdated = _nowISO();
    _saveInventory(inv);
    return { success: true, data: item };
  }

  // ============================================================
  // ATTENDANCE
  // ============================================================
  function getAllAttendance() {
    return _read(KEYS.ATTENDANCE, []);
  }

  function getAttendanceBySchool(schoolId) {
    return getAllAttendance()
      .filter(a => a.schoolId === schoolId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp));
  }

  function getAttendanceByDate(date) {
    return getAllAttendance().filter(a => a.date === date);
  }

  function checkDuplicateAttendance(schoolId, date) {
    return getAllAttendance().some(a => a.schoolId === schoolId && a.date === date);
  }

  function getAttendanceLast7Days() {
    const dates = window.PD_Utils.getLastNDaysDates(7);
    const all = getAllAttendance();
    return dates.map(d => {
      const total = all.filter(a => a.date === d).reduce((sum, a) => sum + (a.studentsPresent || 0), 0);
      return { date: d, totalStudents: total };
    });
  }

  function getAttendanceLast30Days() {
    const dates = window.PD_Utils.getLastNDaysDates(30);
    const all = getAllAttendance();
    return dates.map(d => {
      const total = all.filter(a => a.date === d).reduce((sum, a) => sum + (a.studentsPresent || 0), 0);
      return { date: d, totalStudents: total };
    });
  }

  function getAttendanceLastNDays(n) {
    const dates = window.PD_Utils.getLastNDaysDates(n);
    const all = getAllAttendance();
    return dates.map(d => {
      const total = all.filter(a => a.date === d).reduce((sum, a) => sum + (a.studentsPresent || 0), 0);
      return { date: d, totalStudents: total };
    });
  }

  function submitAttendance(schoolId, date, studentsPresent) {
    // 1. Validate inputs
    if (!schoolId) return { success: false, error: 'School ID required.' };
    if (!date) return { success: false, error: 'Date is required.' };
    const count = Number(studentsPresent);
    if (!isFinite(count) || count <= 0 || !Number.isInteger(count)) {
      return { success: false, error: 'Students present must be a positive whole number.' };
    }

    // 2. Future date check
    const today = window.PD_Utils.getTodayDateString();
    if (date > today) {
      return { success: false, error: 'Cannot submit attendance for a future date.' };
    }

    // 3. Duplicate check
    if (checkDuplicateAttendance(schoolId, date)) {
      return { success: false, error: 'Attendance for this date has already been submitted.' };
    }

    // 4. Enrollment check
    const school = getSchoolById(schoolId);
    if (!school) return { success: false, error: 'School not found.' };
    if (count > school.enrollment) {
      return { success: false, error: 'Students present (' + count + ') cannot exceed enrollment (' + school.enrollment + ').' };
    }

    // 5. Calculate portions
    const riceNeeded  = Math.round(count * PORTION.rice  * 100) / 100;
    const wheatNeeded = Math.round(count * PORTION.wheat * 100) / 100;
    const dalNeeded   = Math.round(count * PORTION.dal   * 100) / 100;

    // 6. Deduct (validates sufficiency atomically)
    const deduct = deductStock(schoolId, riceNeeded, wheatNeeded, dalNeeded);
    if (!deduct.success) return deduct;

    // 7. Save attendance record
    const attendance = getAllAttendance();
    const record = {
      id: _genId('att'),
      schoolId: schoolId,
      date: date,
      studentsPresent: count,
      riceUsed: riceNeeded,
      wheatUsed: wheatNeeded,
      dalUsed: dalNeeded,
      timestamp: _nowISO()
    };
    attendance.push(record);
    _write(KEYS.ATTENDANCE, attendance);

    // 8. Log 3 deduction transactions
    addStockTransaction(schoolId, 'deduction', 'Rice',  riceNeeded,  'Attendance deduction (' + count + ' students)');
    addStockTransaction(schoolId, 'deduction', 'Wheat', wheatNeeded, 'Attendance deduction (' + count + ' students)');
    addStockTransaction(schoolId, 'deduction', 'Dal',   dalNeeded,   'Attendance deduction (' + count + ' students)');

    // 9. Check stock thresholds → create alerts
    const inv = getInventoryBySchoolId(schoolId);
    ['rice', 'wheat', 'dal'].forEach(itemKey => {
      const data = inv[itemKey];
      const pct = (data.current / data.max) * 100;
      const itemDisplay = itemKey.charAt(0).toUpperCase() + itemKey.slice(1);
      const hasActive = getActiveAlertsBySchool(schoolId).some(a => a.item === itemDisplay);
      if (hasActive) return;
      if (pct < 10) {
        createAlert(
          schoolId, school.name, 'critical', itemDisplay,
          'CRITICAL: ' + itemDisplay + ' stock critically low',
          itemDisplay + ' stock is at ' + pct.toFixed(1) + '% (' + data.current + ' kg out of ' + data.max + ' kg). Immediate replenishment needed.'
        );
      } else if (pct < 20) {
        createAlert(
          schoolId, school.name, 'warning', itemDisplay,
          'WARNING: ' + itemDisplay + ' stock running low',
          itemDisplay + ' stock is at ' + pct.toFixed(1) + '% (' + data.current + ' kg out of ' + data.max + ' kg). Consider restocking soon.'
        );
      }
    });

    return {
      success: true,
      data: record,
      summary: {
        studentsPresent: count,
        riceDeducted: riceNeeded,
        wheatDeducted: wheatNeeded,
        dalDeducted: dalNeeded
      }
    };
  }

  // ============================================================
  // ALERTS
  // ============================================================
  function getAllAlerts() {
    return _read(KEYS.ALERTS, []);
  }

  function getAlertsBySchool(schoolId) {
    return getAllAlerts()
      .filter(a => a.schoolId === schoolId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  function getActiveAlerts() {
    return getAllAlerts()
      .filter(a => a.status === 'active')
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  function getActiveAlertsBySchool(schoolId) {
    return getAllAlerts()
      .filter(a => a.schoolId === schoolId && a.status === 'active');
  }

  function createAlert(schoolId, schoolName, severity, item, title, message) {
    const alerts = getAllAlerts();
    const alert = {
      id: _genId('alert'),
      schoolId: schoolId,
      schoolName: schoolName,
      type: 'stock',
      severity: severity,
      item: item,
      title: title,
      message: message,
      status: 'active',
      timestamp: _nowISO(),
      resolvedAt: null
    };
    alerts.push(alert);
    _write(KEYS.ALERTS, alerts);
    return alert;
  }

  function resolveAlert(alertId) {
    const alerts = getAllAlerts();
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx === -1) return { success: false, error: 'Alert not found.' };
    alerts[idx].status = 'resolved';
    alerts[idx].resolvedAt = _nowISO();
    _write(KEYS.ALERTS, alerts);
    return { success: true, data: alerts[idx] };
  }

  function _autoResolveAlertsForItem(schoolId, itemDisplay) {
    const alerts = getAllAlerts();
    let changed = false;
    alerts.forEach(a => {
      if (a.schoolId === schoolId && a.item === itemDisplay && a.status === 'active') {
        a.status = 'resolved';
        a.resolvedAt = _nowISO();
        changed = true;
      }
    });
    if (changed) _write(KEYS.ALERTS, alerts);
  }

  // ============================================================
  // STOCK TRANSACTIONS
  // ============================================================
  function getAllTransactions() {
    return _read(KEYS.TRANSACTIONS, []);
  }

  function getTransactionsBySchool(schoolId) {
    return getAllTransactions()
      .filter(t => t.schoolId === schoolId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  function addStockTransaction(schoolId, type, item, quantity, reason) {
    const txns = getAllTransactions();
    const txn = {
      id: _genId('txn'),
      schoolId: schoolId,
      type: type,
      item: item,
      quantity: Math.round(quantity * 100) / 100,
      reason: reason,
      timestamp: _nowISO()
    };
    txns.push(txn);
    _write(KEYS.TRANSACTIONS, txns);
    return txn;
  }

  // ============================================================
  // ANALYTICS HELPERS
  // ============================================================
  function getTotalActiveSchools() {
    return getActiveSchools().length;
  }

  function getTotalEnrollment() {
    return getActiveSchools().reduce((sum, s) => sum + (s.enrollment || 0), 0);
  }

  function getTodayTotalMealsServed() {
    const today = window.PD_Utils.getTodayDateString();
    return getAttendanceByDate(today).reduce((sum, a) => sum + (a.studentsPresent || 0), 0);
  }

  function getTotalActiveAlerts() {
    return getActiveAlerts().length;
  }

  function getAttendanceTrendLast7Days() {
    return getAttendanceLast7Days();
  }

  function getMealConsumptionLast30Days() {
    const dates = window.PD_Utils.getLastNDaysDates(30);
    const set = new Set(dates);
    let totalRice = 0, totalWheat = 0, totalDal = 0;
    getAllAttendance().forEach(a => {
      if (set.has(a.date)) {
        totalRice  += a.riceUsed  || 0;
        totalWheat += a.wheatUsed || 0;
        totalDal   += a.dalUsed   || 0;
      }
    });
    return {
      totalRice:  Math.round(totalRice  * 100) / 100,
      totalWheat: Math.round(totalWheat * 100) / 100,
      totalDal:   Math.round(totalDal   * 100) / 100
    };
  }

  function getMealConsumptionLastNDays(n) {
    const dates = window.PD_Utils.getLastNDaysDates(n);
    const set = new Set(dates);
    let totalRice = 0, totalWheat = 0, totalDal = 0;
    getAllAttendance().forEach(a => {
      if (set.has(a.date)) {
        totalRice  += a.riceUsed  || 0;
        totalWheat += a.wheatUsed || 0;
        totalDal   += a.dalUsed   || 0;
      }
    });
    return {
      totalRice:  Math.round(totalRice  * 100) / 100,
      totalWheat: Math.round(totalWheat * 100) / 100,
      totalDal:   Math.round(totalDal   * 100) / 100
    };
  }

  function getDailyConsumptionLastNDays(n) {
    const dates = window.PD_Utils.getLastNDaysDates(n);
    const all = getAllAttendance();
    return dates.map(d => {
      const dayRecords = all.filter(a => a.date === d);
      return {
        date: d,
        rice:  Math.round(dayRecords.reduce((s, a) => s + (a.riceUsed  || 0), 0) * 100) / 100,
        wheat: Math.round(dayRecords.reduce((s, a) => s + (a.wheatUsed || 0), 0) * 100) / 100,
        dal:   Math.round(dayRecords.reduce((s, a) => s + (a.dalUsed   || 0), 0) * 100) / 100
      };
    });
  }

  function getSchoolInventoryHealth() {
    const schools = getActiveSchools();
    const invs = getAllInventories();
    return schools.map(s => {
      const inv = invs.find(i => i.schoolId === s.schoolId);
      let avg = 0;
      if (inv) {
        const ricePct  = (inv.rice.current  / inv.rice.max)  * 100;
        const wheatPct = (inv.wheat.current / inv.wheat.max) * 100;
        const dalPct   = (inv.dal.current   / inv.dal.max)   * 100;
        avg = (ricePct + wheatPct + dalPct) / 3;
      }
      return {
        schoolId: s.schoolId,
        schoolName: s.name,
        avgPercentage: Math.round(avg * 10) / 10
      };
    });
  }

  function getDistrictWiseAttendance() {
    const schools = getActiveSchools();
    const last7 = window.PD_Utils.getLastNDaysDates(7);
    const all = getAllAttendance();

    const byDistrict = {};
    schools.forEach(s => {
      if (!byDistrict[s.district]) {
        byDistrict[s.district] = { totalPresent: 0, totalCapacity: 0 };
      }
      last7.forEach(d => {
        const rec = all.find(a => a.schoolId === s.schoolId && a.date === d);
        if (rec) {
          byDistrict[s.district].totalPresent += rec.studentsPresent;
          byDistrict[s.district].totalCapacity += s.enrollment;
        }
      });
    });

    const out = {};
    Object.keys(byDistrict).forEach(d => {
      const data = byDistrict[d];
      const rate = data.totalCapacity > 0 ? (data.totalPresent / data.totalCapacity) * 100 : 0;
      out[d] = Math.round(rate * 10) / 10;
    });
    return out;
  }

  function getSchoolComparison() {
    const schools = getAllSchools();
    const invs = getAllInventories();
    const today = window.PD_Utils.getTodayDateString();
    const all = getAllAttendance();

    return schools.map(s => {
      const inv = invs.find(i => i.schoolId === s.schoolId) || { rice: { current: 0, max: 1 }, wheat: { current: 0, max: 1 }, dal: { current: 0, max: 1 } };
      const todayRec = all.find(a => a.schoolId === s.schoolId && a.date === today);
      const ricePct  = Math.round((inv.rice.current  / inv.rice.max)  * 1000) / 10;
      const wheatPct = Math.round((inv.wheat.current / inv.wheat.max) * 1000) / 10;
      const dalPct   = Math.round((inv.dal.current   / inv.dal.max)   * 1000) / 10;
      return {
        schoolId: s.schoolId,
        name: s.name,
        district: s.district,
        enrollment: s.enrollment,
        status: s.status,
        ricePct: ricePct,
        wheatPct: wheatPct,
        dalPct: dalPct,
        avgStockPct: Math.round(((ricePct + wheatPct + dalPct) / 3) * 10) / 10,
        todayAttendance: todayRec ? todayRec.studentsPresent : 0,
        attendanceRate: todayRec && s.enrollment > 0 ? Math.round((todayRec.studentsPresent / s.enrollment) * 1000) / 10 : 0
      };
    });
  }

  function getMostAlertedSchool() {
    const active = getActiveAlerts();
    if (active.length === 0) return null;
    const counts = {};
    active.forEach(a => {
      counts[a.schoolId] = counts[a.schoolId] || { count: 0, name: a.schoolName };
      counts[a.schoolId].count += 1;
    });
    let topId = null, top = 0;
    Object.keys(counts).forEach(id => {
      if (counts[id].count > top) { top = counts[id].count; topId = id; }
    });
    return topId ? { schoolId: topId, schoolName: counts[topId].name, alertCount: top } : null;
  }

  function getAvgAttendanceRateLastNDays(n) {
    const dates = window.PD_Utils.getLastNDaysDates(n);
    const dateSet = new Set(dates);
    const schools = getActiveSchools();
    const all = getAllAttendance();
    let totalPresent = 0, totalCapacity = 0;
    schools.forEach(s => {
      dates.forEach(d => {
        const rec = all.find(a => a.schoolId === s.schoolId && a.date === d);
        if (rec) {
          totalPresent += rec.studentsPresent;
          totalCapacity += s.enrollment;
        }
      });
    });
    return totalCapacity > 0 ? Math.round((totalPresent / totalCapacity) * 1000) / 10 : 0;
  }

  function getAvgMealsPerSchoolPerDay(n) {
    const dates = window.PD_Utils.getLastNDaysDates(n);
    const dateSet = new Set(dates);
    const schoolIds = new Set(getActiveSchools().map(s => s.schoolId));
    const records = getAllAttendance().filter(a => dateSet.has(a.date) && schoolIds.has(a.schoolId));
    if (records.length === 0) return 0;
    const total = records.reduce((s, r) => s + r.studentsPresent, 0);
    return Math.round(total / records.length);
  }

  function getTopAttendanceSchool(n) {
    const dates = window.PD_Utils.getLastNDaysDates(n);
    const dateSet = new Set(dates);
    const schools = getActiveSchools();
    const all = getAllAttendance();
    let best = null;
    schools.forEach(s => {
      const records = all.filter(a => a.schoolId === s.schoolId && dateSet.has(a.date));
      if (records.length === 0) return;
      const totalPresent = records.reduce((sum, r) => sum + r.studentsPresent, 0);
      const totalPossible = records.length * s.enrollment;
      const rate = totalPossible > 0 ? totalPresent / totalPossible : 0;
      if (!best || rate > best.rate) {
        best = { school: s, rate: rate };
      }
    });
    return best ? { schoolName: best.school.name, rate: Math.round(best.rate * 1000) / 10 } : null;
  }

  function getMostConsumedItem(n) {
    const cons = getMealConsumptionLastNDays(n);
    const items = [
      { name: 'Rice',  total: cons.totalRice  },
      { name: 'Wheat', total: cons.totalWheat },
      { name: 'Dal',   total: cons.totalDal   }
    ];
    items.sort((a, b) => b.total - a.total);
    return items[0];
  }

  // ============================================================
  // EXPOSE TO WINDOW
  // ============================================================
  initializeDataStore();

  window.PD_Data = {
    KEYS: KEYS,
    PORTION: PORTION,
    initializeDataStore: initializeDataStore,
    resetDataStore: resetDataStore,
    // auth
    authenticateUser: authenticateUser,
    registerUser: registerUser,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    logoutUser: logoutUser,
    getUserById: getUserById,
    // schools
    getAllSchools: getAllSchools,
    getSchoolById: getSchoolById,
    getActiveSchools: getActiveSchools,
    getSchoolsByDistrict: getSchoolsByDistrict,
    // inventory
    getAllInventories: getAllInventories,
    getInventoryBySchoolId: getInventoryBySchoolId,
    updateInventory: updateInventory,
    addStock: addStock,
    deductStock: deductStock,
    // attendance
    getAllAttendance: getAllAttendance,
    getAttendanceBySchool: getAttendanceBySchool,
    getAttendanceByDate: getAttendanceByDate,
    checkDuplicateAttendance: checkDuplicateAttendance,
    getAttendanceLast7Days: getAttendanceLast7Days,
    getAttendanceLast30Days: getAttendanceLast30Days,
    getAttendanceLastNDays: getAttendanceLastNDays,
    submitAttendance: submitAttendance,
    // alerts
    getAllAlerts: getAllAlerts,
    getAlertsBySchool: getAlertsBySchool,
    getActiveAlerts: getActiveAlerts,
    getActiveAlertsBySchool: getActiveAlertsBySchool,
    createAlert: createAlert,
    resolveAlert: resolveAlert,
    // transactions
    getAllTransactions: getAllTransactions,
    getTransactionsBySchool: getTransactionsBySchool,
    addStockTransaction: addStockTransaction,
    // analytics
    getTotalActiveSchools: getTotalActiveSchools,
    getTotalEnrollment: getTotalEnrollment,
    getTodayTotalMealsServed: getTodayTotalMealsServed,
    getTotalActiveAlerts: getTotalActiveAlerts,
    getAttendanceTrendLast7Days: getAttendanceTrendLast7Days,
    getMealConsumptionLast30Days: getMealConsumptionLast30Days,
    getMealConsumptionLastNDays: getMealConsumptionLastNDays,
    getDailyConsumptionLastNDays: getDailyConsumptionLastNDays,
    getSchoolInventoryHealth: getSchoolInventoryHealth,
    getDistrictWiseAttendance: getDistrictWiseAttendance,
    getSchoolComparison: getSchoolComparison,
    getMostAlertedSchool: getMostAlertedSchool,
    getAvgAttendanceRateLastNDays: getAvgAttendanceRateLastNDays,
    getAvgMealsPerSchoolPerDay: getAvgMealsPerSchoolPerDay,
    getTopAttendanceSchool: getTopAttendanceSchool,
    getMostConsumedItem: getMostConsumedItem
  };
})();
