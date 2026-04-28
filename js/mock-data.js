/* ============================================================
   POSHAN DARPAN - MOCK DATA LAYER
   Replaces backend. All data lives in localStorage.
============================================================ */

// ---------- SEED DATA ----------

const MOCK_USERS = [
  { uid: "u1", name: "Rajesh Kumar",     email: "rajesh@school.com",  password: "school123", role: "school",     schoolId: "s1", district: null,  createdAt: "2026-01-15T09:00:00.000Z" },
  { uid: "u2", name: "Priya Sharma",     email: "priya@school.com",   password: "school123", role: "school",     schoolId: "s2", district: null,  createdAt: "2026-01-18T09:00:00.000Z" },
  { uid: "u3", name: "Amit Patel",       email: "amit@school.com",    password: "school123", role: "school",     schoolId: "s3", district: null,  createdAt: "2026-01-20T09:00:00.000Z" },
  { uid: "u4", name: "Ramesh Yadav",     email: "ramesh@school.com",  password: "school123", role: "school",     schoolId: "s5", district: null,  createdAt: "2026-01-22T09:00:00.000Z" },
  { uid: "u5", name: "Dr. Sanjay Verma", email: "sanjay@gov.com",     password: "gov123",    role: "government", schoolId: null, district: "All", createdAt: "2026-01-10T09:00:00.000Z" }
];

const MOCK_SCHOOLS = [
  { schoolId: "s1", name: "Govt Primary School, Ujjain",    district: "Ujjain",    enrollment: 250, status: "active",   contactPerson: "Rajesh Kumar", contactEmail: "rajesh@school.com" },
  { schoolId: "s2", name: "Govt Middle School, Indore",     district: "Indore",    enrollment: 400, status: "active",   contactPerson: "Priya Sharma", contactEmail: "priya@school.com" },
  { schoolId: "s3", name: "Govt High School, Bhopal",       district: "Bhopal",    enrollment: 600, status: "active",   contactPerson: "Amit Patel",   contactEmail: "amit@school.com" },
  { schoolId: "s4", name: "Govt Primary School, Gwalior",   district: "Gwalior",   enrollment: 180, status: "inactive", contactPerson: "—",            contactEmail: "—" },
  { schoolId: "s5", name: "Govt Middle School, Jabalpur",   district: "Jabalpur",  enrollment: 320, status: "active",   contactPerson: "Ramesh Yadav", contactEmail: "ramesh@school.com" }
];

const MOCK_INVENTORY = [
  { schoolId: "s1", rice: { current: 80,  max: 200 }, wheat: { current: 60,  max: 150 }, dal: { current: 15, max: 50  }, lastUpdated: "2026-04-25T11:00:00.000Z" },
  { schoolId: "s2", rice: { current: 150, max: 300 }, wheat: { current: 120, max: 250 }, dal: { current: 35, max: 80  }, lastUpdated: "2026-04-25T11:00:00.000Z" },
  { schoolId: "s3", rice: { current: 30,  max: 400 }, wheat: { current: 200, max: 350 }, dal: { current: 8,  max: 100 }, lastUpdated: "2026-04-25T11:00:00.000Z" },
  { schoolId: "s4", rice: { current: 90,  max: 150 }, wheat: { current: 70,  max: 120 }, dal: { current: 25, max: 40  }, lastUpdated: "2026-04-20T11:00:00.000Z" },
  { schoolId: "s5", rice: { current: 45,  max: 250 }, wheat: { current: 30,  max: 200 }, dal: { current: 12, max: 60  }, lastUpdated: "2026-04-25T11:00:00.000Z" }
];

// Generate attendance records (10 per active school, last 10 working days)
function _generateMockAttendance() {
  const records = [];
  const activeSchools = MOCK_SCHOOLS.filter(s => s.status === "active");

  // Get last 10 working days (skipping weekends)
  const dates = [];
  let cursor = new Date("2026-04-25T11:00:00.000Z");
  while (dates.length < 10) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let idCounter = 1;
  activeSchools.forEach(school => {
    dates.forEach(d => {
      const pct = 0.70 + Math.random() * 0.25; // 70-95%
      const studentsPresent = Math.round(school.enrollment * pct);
      const dateStr = d.toISOString().split("T")[0];
      const record = {
        id: "att_seed_" + (idCounter++),
        schoolId: school.schoolId,
        date: dateStr,
        studentsPresent: studentsPresent,
        riceUsed: parseFloat((studentsPresent * 0.1).toFixed(2)),
        wheatUsed: parseFloat((studentsPresent * 0.1).toFixed(2)),
        dalUsed: parseFloat((studentsPresent * 0.03).toFixed(2)),
        timestamp: new Date(d.getTime() + 11 * 3600 * 1000).toISOString()
      };
      records.push(record);
    });
  });

  return records;
}

const MOCK_ATTENDANCE = _generateMockAttendance();

const MOCK_ALERTS = [
  { id: "al_1", schoolId: "s3", schoolName: "Govt High School, Bhopal",     severity: "critical", item: "Rice",  status: "active",   title: "CRITICAL: Rice stock critically low",  message: "Rice stock is at 7.5% (30 kg out of 400 kg). Immediate replenishment needed.", timestamp: "2026-04-25T09:30:00.000Z", resolvedAt: null },
  { id: "al_2", schoolId: "s3", schoolName: "Govt High School, Bhopal",     severity: "critical", item: "Dal",   status: "active",   title: "CRITICAL: Dal stock critically low",   message: "Dal stock is at 8% (8 kg out of 100 kg). Immediate replenishment needed.",     timestamp: "2026-04-25T09:35:00.000Z", resolvedAt: null },
  { id: "al_3", schoolId: "s5", schoolName: "Govt Middle School, Jabalpur", severity: "warning",  item: "Wheat", status: "active",   title: "WARNING: Wheat stock low",             message: "Wheat stock is at 15% (30 kg out of 200 kg). Please reorder soon.",            timestamp: "2026-04-24T14:20:00.000Z", resolvedAt: null },
  { id: "al_4", schoolId: "s5", schoolName: "Govt Middle School, Jabalpur", severity: "warning",  item: "Rice",  status: "active",   title: "WARNING: Rice stock low",              message: "Rice stock is at 18% (45 kg out of 250 kg). Please reorder soon.",             timestamp: "2026-04-24T14:25:00.000Z", resolvedAt: null },
  { id: "al_5", schoolId: "s1", schoolName: "Govt Primary School, Ujjain",  severity: "warning",  item: "Dal",   status: "resolved", title: "Dal stock was low",                    message: "Dal was at 18% (9 kg out of 50 kg). Now restocked to 15 kg.",                  timestamp: "2026-04-21T08:00:00.000Z", resolvedAt: "2026-04-22T10:00:00.000Z" }
];

const MOCK_TRANSACTIONS = [
  { id: "tx_1", schoolId: "s1", type: "addition",  item: "Rice",  quantity: 50.0, reason: "Stock delivery",       timestamp: "2026-04-22T08:30:00.000Z" },
  { id: "tx_2", schoolId: "s1", type: "deduction", item: "Rice",  quantity: 22.0, reason: "Attendance (220 students)", timestamp: "2026-04-25T11:00:00.000Z" },
  { id: "tx_3", schoolId: "s1", type: "deduction", item: "Wheat", quantity: 22.0, reason: "Attendance (220 students)", timestamp: "2026-04-25T11:00:00.000Z" },
  { id: "tx_4", schoolId: "s1", type: "deduction", item: "Dal",   quantity: 6.6,  reason: "Attendance (220 students)", timestamp: "2026-04-25T11:00:00.000Z" },
  { id: "tx_5", schoolId: "s2", type: "addition",  item: "Wheat", quantity: 80.0, reason: "Stock delivery",       timestamp: "2026-04-23T09:00:00.000Z" },
  { id: "tx_6", schoolId: "s3", type: "deduction", item: "Rice",  quantity: 54.0, reason: "Attendance (540 students)", timestamp: "2026-04-25T11:00:00.000Z" },
  { id: "tx_7", schoolId: "s5", type: "addition",  item: "Dal",   quantity: 25.0, reason: "Stock delivery",       timestamp: "2026-04-20T08:00:00.000Z" },
  { id: "tx_8", schoolId: "s5", type: "deduction", item: "Wheat", quantity: 28.0, reason: "Attendance (280 students)", timestamp: "2026-04-25T11:00:00.000Z" }
];

// ---------- LOCALSTORAGE KEYS ----------

const LS = {
  USERS:        "poshanUsers",
  SCHOOLS:      "poshanSchools",
  INVENTORY:    "poshanInventory",
  ATTENDANCE:   "poshanAttendance",
  ALERTS:       "poshanAlerts",
  TRANSACTIONS: "poshanTransactions",
  SESSION:      "poshanSession"
};

// ---------- HELPERS ----------

function _read(key)            { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
function _write(key, value)    { localStorage.setItem(key, JSON.stringify(value)); }
function _newId(prefix)        { return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8); }

// ---------- INITIALIZATION ----------

function initDataStore() {
  if (!_read(LS.USERS))        _write(LS.USERS, MOCK_USERS);
  if (!_read(LS.SCHOOLS))      _write(LS.SCHOOLS, MOCK_SCHOOLS);
  if (!_read(LS.INVENTORY))    _write(LS.INVENTORY, MOCK_INVENTORY);
  if (!_read(LS.ATTENDANCE))   _write(LS.ATTENDANCE, MOCK_ATTENDANCE);
  if (!_read(LS.ALERTS))       _write(LS.ALERTS, MOCK_ALERTS);
  if (!_read(LS.TRANSACTIONS)) _write(LS.TRANSACTIONS, MOCK_TRANSACTIONS);
}

function resetDataStore() {
  _write(LS.USERS, MOCK_USERS);
  _write(LS.SCHOOLS, MOCK_SCHOOLS);
  _write(LS.INVENTORY, MOCK_INVENTORY);
  _write(LS.ATTENDANCE, MOCK_ATTENDANCE);
  _write(LS.ALERTS, MOCK_ALERTS);
  _write(LS.TRANSACTIONS, MOCK_TRANSACTIONS);
  localStorage.removeItem(LS.SESSION);
}

// ---------- AUTHENTICATION ----------

function authenticateUser(email, password) {
  const users = _read(LS.USERS) || [];
  const found = users.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
  return found || null;
}

function registerNewUser(name, email, password, role, schoolId, district) {
  const users = _read(LS.USERS) || [];
  if (users.some(u => u.email.toLowerCase() === String(email).toLowerCase())) {
    return { success: false, error: "Email already registered" };
  }
  const newUser = {
    uid: _newId("u"),
    name: name,
    email: email,
    password: password,
    role: role,
    schoolId: role === "school" ? schoolId : null,
    district: role === "government" ? district : null,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  _write(LS.USERS, users);
  return { success: true, user: newUser };
}

function getCurrentSession() {
  return _read(LS.SESSION);
}

function saveSession(userObj) {
  _write(LS.SESSION, userObj);
}

function clearSession() {
  localStorage.removeItem(LS.SESSION);
}

// ---------- SCHOOLS ----------

function getAllSchools() {
  return _read(LS.SCHOOLS) || [];
}

function getSchoolById(id) {
  return getAllSchools().find(s => s.schoolId === id) || null;
}

function getActiveSchools() {
  return getAllSchools().filter(s => s.status === "active");
}

function getSchoolsByDistrict(district) {
  return getAllSchools().filter(s => s.district === district);
}

function getDistrictList() {
  const set = new Set();
  getAllSchools().forEach(s => { if (s.district) set.add(s.district); });
  return Array.from(set);
}

// ---------- INVENTORY ----------

function getInventory(schoolId) {
  const all = _read(LS.INVENTORY) || [];
  return all.find(i => i.schoolId === schoolId) || null;
}

function getAllInventories() {
  return _read(LS.INVENTORY) || [];
}

function _saveInventory(inventoryArr) {
  _write(LS.INVENTORY, inventoryArr);
}

function addStock(schoolId, item, quantity) {
  const all = _read(LS.INVENTORY) || [];
  const idx = all.findIndex(i => i.schoolId === schoolId);
  if (idx === -1) return { success: false, error: "Inventory not found" };

  const itemKey = item.toLowerCase();
  if (!["rice", "wheat", "dal"].includes(itemKey)) {
    return { success: false, error: "Invalid item" };
  }

  const inv = all[idx];
  const slot = inv[itemKey];
  const newCurrent = parseFloat((slot.current + Number(quantity)).toFixed(2));

  if (newCurrent > slot.max) {
    const remaining = parseFloat((slot.max - slot.current).toFixed(2));
    return { success: false, error: "Exceeds max capacity of " + slot.max + " kg. You can add maximum " + remaining + " kg." };
  }

  slot.current = newCurrent;
  inv.lastUpdated = new Date().toISOString();
  all[idx] = inv;
  _saveInventory(all);

  // Auto-resolve any related active alerts if stock now healthy
  _autoResolveAlertsIfHealthy(schoolId, itemKey);

  return { success: true, newCurrent: newCurrent };
}

function deductStock(schoolId, riceQty, wheatQty, dalQty) {
  const all = _read(LS.INVENTORY) || [];
  const idx = all.findIndex(i => i.schoolId === schoolId);
  if (idx === -1) return { success: false, error: "Inventory not found" };

  const inv = all[idx];

  if (inv.rice.current < riceQty) {
    return { success: false, error: "Insufficient stock: Rice needs " + riceQty + " kg but only " + inv.rice.current + " kg available" };
  }
  if (inv.wheat.current < wheatQty) {
    return { success: false, error: "Insufficient stock: Wheat needs " + wheatQty + " kg but only " + inv.wheat.current + " kg available" };
  }
  if (inv.dal.current < dalQty) {
    return { success: false, error: "Insufficient stock: Dal needs " + dalQty + " kg but only " + inv.dal.current + " kg available" };
  }

  inv.rice.current  = parseFloat((inv.rice.current - riceQty).toFixed(2));
  inv.wheat.current = parseFloat((inv.wheat.current - wheatQty).toFixed(2));
  inv.dal.current   = parseFloat((inv.dal.current - dalQty).toFixed(2));
  inv.lastUpdated   = new Date().toISOString();
  all[idx] = inv;
  _saveInventory(all);

  return { success: true, newInventory: inv };
}

function getStockPercentage(current, max) {
  if (!max || max === 0) return 0;
  return Math.round((current / max) * 100);
}

function getStockStatus(current, max) {
  const pct = (current / max) * 100;
  if (pct < 10) return "critical";
  if (pct < 20) return "warning";
  return "healthy";
}

function _autoResolveAlertsIfHealthy(schoolId, itemKey) {
  const inv = getInventory(schoolId);
  if (!inv) return;
  const slot = inv[itemKey];
  const pct = (slot.current / slot.max) * 100;
  if (pct >= 20) {
    const alerts = _read(LS.ALERTS) || [];
    let changed = false;
    alerts.forEach(a => {
      if (a.schoolId === schoolId && a.item.toLowerCase() === itemKey && a.status === "active") {
        a.status = "resolved";
        a.resolvedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) _write(LS.ALERTS, alerts);
  }
}

// ---------- ATTENDANCE ----------

function getAttendanceBySchool(schoolId) {
  const all = _read(LS.ATTENDANCE) || [];
  return all
    .filter(r => r.schoolId === schoolId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getAllAttendance() {
  return _read(LS.ATTENDANCE) || [];
}

function getAttendanceByDate(dateStr) {
  return getAllAttendance().filter(r => r.date === dateStr);
}

function getTodaysAttendance(schoolId) {
  const today = todayStr();
  return getAllAttendance().find(r => r.schoolId === schoolId && r.date === today) || null;
}

function checkDuplicateAttendance(schoolId, dateStr) {
  return getAllAttendance().some(r => r.schoolId === schoolId && r.date === dateStr);
}

function submitAttendance(schoolId, dateStr, studentsPresent) {
  // Step 1
  if (checkDuplicateAttendance(schoolId, dateStr)) {
    return { success: false, error: "Attendance already submitted for this date" };
  }

  // Step 2
  const school = getSchoolById(schoolId);
  if (!school) return { success: false, error: "School not found" };
  if (studentsPresent > school.enrollment) {
    return { success: false, error: "Students present (" + studentsPresent + ") cannot exceed enrollment (" + school.enrollment + ")" };
  }
  if (studentsPresent < 1) {
    return { success: false, error: "Students present must be at least 1" };
  }

  // Step 3
  const riceNeeded  = parseFloat((studentsPresent * 0.1).toFixed(2));
  const wheatNeeded = parseFloat((studentsPresent * 0.1).toFixed(2));
  const dalNeeded   = parseFloat((studentsPresent * 0.03).toFixed(2));

  // Step 4
  const inv = getInventory(schoolId);
  if (!inv) return { success: false, error: "Inventory not found" };

  if (inv.rice.current < riceNeeded) {
    return { success: false, error: "Insufficient Rice: need " + riceNeeded + " kg but only " + inv.rice.current + " kg available" };
  }
  if (inv.wheat.current < wheatNeeded) {
    return { success: false, error: "Insufficient Wheat: need " + wheatNeeded + " kg but only " + inv.wheat.current + " kg available" };
  }
  if (inv.dal.current < dalNeeded) {
    return { success: false, error: "Insufficient Dal: need " + dalNeeded + " kg but only " + inv.dal.current + " kg available" };
  }

  // Step 5 - deduct
  const deductRes = deductStock(schoolId, riceNeeded, wheatNeeded, dalNeeded);
  if (!deductRes.success) return deductRes;

  // Step 6 - save attendance
  const allAtt = _read(LS.ATTENDANCE) || [];
  const newRec = {
    id: _newId("att"),
    schoolId: schoolId,
    date: dateStr,
    studentsPresent: studentsPresent,
    riceUsed: riceNeeded,
    wheatUsed: wheatNeeded,
    dalUsed: dalNeeded,
    timestamp: new Date().toISOString()
  };
  allAtt.push(newRec);
  _write(LS.ATTENDANCE, allAtt);

  // Step 7 - log transactions
  logTransaction(schoolId, "deduction", "Rice",  riceNeeded,  "Attendance (" + studentsPresent + " students)");
  logTransaction(schoolId, "deduction", "Wheat", wheatNeeded, "Attendance (" + studentsPresent + " students)");
  logTransaction(schoolId, "deduction", "Dal",   dalNeeded,   "Attendance (" + studentsPresent + " students)");

  // Step 8 - check for new alerts
  const newInv = getInventory(schoolId);
  const alertsGenerated = [];
  ["rice", "wheat", "dal"].forEach(itemKey => {
    const slot = newInv[itemKey];
    const pct = (slot.current / slot.max) * 100;
    const itemLabel = itemKey.charAt(0).toUpperCase() + itemKey.slice(1);
    if (pct < 10) {
      const a = createAlert(schoolId, school.name, "critical", itemLabel,
        "CRITICAL: " + itemLabel + " stock critically low",
        itemLabel + " stock is at " + pct.toFixed(1) + "% (" + slot.current + " kg out of " + slot.max + " kg). Immediate replenishment needed.");
      alertsGenerated.push(a);
    } else if (pct < 20) {
      const a = createAlert(schoolId, school.name, "warning", itemLabel,
        "WARNING: " + itemLabel + " stock low",
        itemLabel + " stock is at " + pct.toFixed(1) + "% (" + slot.current + " kg out of " + slot.max + " kg). Please reorder soon.");
      alertsGenerated.push(a);
    }
  });

  return {
    success: true,
    data: {
      riceUsed: riceNeeded,
      wheatUsed: wheatNeeded,
      dalUsed: dalNeeded,
      newInventory: newInv,
      alertsGenerated: alertsGenerated
    }
  };
}

function getAttendanceTrendLastNDays(n) {
  const dates = getLastNDates(n);
  const result = [];
  dates.forEach(d => {
    const recs = getAttendanceByDate(d);
    const total = recs.reduce((sum, r) => sum + r.studentsPresent, 0);
    result.push({ date: d, totalStudents: total });
  });
  return result;
}

function getConsumptionLastNDays(n) {
  const dates = getLastNDates(n);
  const riceTotals = [];
  const wheatTotals = [];
  const dalTotals = [];
  dates.forEach(d => {
    const recs = getAttendanceByDate(d);
    let rice = 0, wheat = 0, dal = 0;
    recs.forEach(r => { rice += r.riceUsed; wheat += r.wheatUsed; dal += r.dalUsed; });
    riceTotals.push(parseFloat(rice.toFixed(2)));
    wheatTotals.push(parseFloat(wheat.toFixed(2)));
    dalTotals.push(parseFloat(dal.toFixed(2)));
  });
  return { dates: dates, riceTotals: riceTotals, wheatTotals: wheatTotals, dalTotals: dalTotals };
}

// ---------- ALERTS ----------

function getAlertsBySchool(schoolId) {
  const all = _read(LS.ALERTS) || [];
  return all
    .filter(a => a.schoolId === schoolId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function getAllAlerts() {
  const all = _read(LS.ALERTS) || [];
  return all.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function getActiveAlerts() {
  return getAllAlerts().filter(a => a.status === "active");
}

function getActiveAlertCount() {
  return getActiveAlerts().length;
}

function getActiveAlertCountBySchool(schoolId) {
  return getAlertsBySchool(schoolId).filter(a => a.status === "active").length;
}

function resolveAlert(alertId) {
  const all = _read(LS.ALERTS) || [];
  const idx = all.findIndex(a => a.id === alertId);
  if (idx === -1) return { success: false, error: "Alert not found" };
  all[idx].status = "resolved";
  all[idx].resolvedAt = new Date().toISOString();
  _write(LS.ALERTS, all);
  return { success: true };
}

function createAlert(schoolId, schoolName, severity, item, title, message) {
  const all = _read(LS.ALERTS) || [];
  const newAlert = {
    id: _newId("al"),
    schoolId: schoolId,
    schoolName: schoolName,
    severity: severity,
    item: item,
    status: "active",
    title: title,
    message: message,
    timestamp: new Date().toISOString(),
    resolvedAt: null
  };
  all.push(newAlert);
  _write(LS.ALERTS, all);
  return newAlert;
}

function getMostAlertedSchool() {
  const active = getActiveAlerts();
  if (active.length === 0) return "—";
  const counts = {};
  active.forEach(a => { counts[a.schoolName] = (counts[a.schoolName] || 0) + 1; });
  let max = 0, name = "—";
  Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; name = k; } });
  return name;
}

// ---------- TRANSACTIONS ----------

function getTransactionsBySchool(schoolId) {
  const all = _read(LS.TRANSACTIONS) || [];
  return all
    .filter(t => t.schoolId === schoolId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function logTransaction(schoolId, type, item, quantity, reason) {
  const all = _read(LS.TRANSACTIONS) || [];
  const tx = {
    id: _newId("tx"),
    schoolId: schoolId,
    type: type,
    item: item,
    quantity: parseFloat(Number(quantity).toFixed(2)),
    reason: reason,
    timestamp: new Date().toISOString()
  };
  all.push(tx);
  _write(LS.TRANSACTIONS, all);
  return tx;
}

// ---------- ANALYTICS ----------

function getTotalActiveSchools() {
  return getActiveSchools().length;
}

function getTotalEnrollment() {
  return getActiveSchools().reduce((s, sc) => s + sc.enrollment, 0);
}

function getTodayTotalMeals() {
  const today = todayStr();
  return getAttendanceByDate(today).reduce((s, r) => s + r.studentsPresent, 0);
}

function getAvgAttendanceRate(days) {
  const dates = getLastNDates(days);
  const activeSchools = getActiveSchools();
  if (activeSchools.length === 0) return 0;

  let totalRate = 0;
  let count = 0;
  activeSchools.forEach(sch => {
    dates.forEach(d => {
      const rec = getAllAttendance().find(r => r.schoolId === sch.schoolId && r.date === d);
      if (rec) {
        totalRate += (rec.studentsPresent / sch.enrollment) * 100;
        count++;
      }
    });
  });
  return count === 0 ? 0 : parseFloat((totalRate / count).toFixed(1));
}

function getAvgMealsPerSchoolPerDay(days) {
  const dates = getLastNDates(days);
  const activeSchools = getActiveSchools();
  if (activeSchools.length === 0 || dates.length === 0) return 0;

  let totalMeals = 0;
  dates.forEach(d => {
    getAttendanceByDate(d).forEach(r => { totalMeals += r.studentsPresent; });
  });
  return Math.round(totalMeals / (activeSchools.length * dates.length));
}

function getMostConsumedItem(days) {
  const data = getConsumptionLastNDays(days);
  const rice  = data.riceTotals.reduce((a, b) => a + b, 0);
  const wheat = data.wheatTotals.reduce((a, b) => a + b, 0);
  const dal   = data.dalTotals.reduce((a, b) => a + b, 0);
  if (rice >= wheat && rice >= dal) return "Rice";
  if (wheat >= rice && wheat >= dal) return "Wheat";
  return "Dal";
}

function _avgAttendancePerSchool(days) {
  const dates = getLastNDates(days);
  const activeSchools = getActiveSchools();
  return activeSchools.map(sch => {
    let totalRate = 0;
    let count = 0;
    dates.forEach(d => {
      const rec = getAllAttendance().find(r => r.schoolId === sch.schoolId && r.date === d);
      if (rec) {
        totalRate += (rec.studentsPresent / sch.enrollment) * 100;
        count++;
      }
    });
    return {
      schoolId: sch.schoolId,
      schoolName: sch.name,
      district: sch.district,
      avgRate: count === 0 ? 0 : parseFloat((totalRate / count).toFixed(1))
    };
  });
}

function getHighestAttendanceSchool(days) {
  const arr = _avgAttendancePerSchool(days);
  if (arr.length === 0) return { name: "—", rate: 0 };
  let top = arr[0];
  arr.forEach(x => { if (x.avgRate > top.avgRate) top = x; });
  return { name: top.schoolName, rate: top.avgRate };
}

function getLowestAttendanceSchool(days) {
  const arr = _avgAttendancePerSchool(days);
  if (arr.length === 0) return { name: "—", rate: 0 };
  let bot = arr[0];
  arr.forEach(x => { if (x.avgRate < bot.avgRate) bot = x; });
  return { name: bot.schoolName, rate: bot.avgRate };
}

function getSchoolInventoryHealth() {
  const result = [];
  getActiveSchools().forEach(sch => {
    const inv = getInventory(sch.schoolId);
    if (!inv) return;
    const ricePct  = (inv.rice.current / inv.rice.max) * 100;
    const wheatPct = (inv.wheat.current / inv.wheat.max) * 100;
    const dalPct   = (inv.dal.current / inv.dal.max) * 100;
    const avg = (ricePct + wheatPct + dalPct) / 3;
    result.push({
      schoolId: sch.schoolId,
      schoolName: sch.name,
      avgPercentage: parseFloat(avg.toFixed(1))
    });
  });
  return result;
}

function getDistrictWiseAttendance(days) {
  const arr = _avgAttendancePerSchool(days);
  const grouped = {};
  arr.forEach(x => {
    if (!grouped[x.district]) grouped[x.district] = { sum: 0, count: 0 };
    grouped[x.district].sum += x.avgRate;
    grouped[x.district].count += 1;
  });
  const out = {};
  Object.entries(grouped).forEach(([d, v]) => {
    out[d] = v.count === 0 ? 0 : parseFloat((v.sum / v.count).toFixed(1));
  });
  return out;
}

function getTotalConsumption(days) {
  const data = getConsumptionLastNDays(days);
  const rice  = data.riceTotals.reduce((a, b) => a + b, 0);
  const wheat = data.wheatTotals.reduce((a, b) => a + b, 0);
  const dal   = data.dalTotals.reduce((a, b) => a + b, 0);
  return {
    totalRice:  parseFloat(rice.toFixed(2)),
    totalWheat: parseFloat(wheat.toFixed(2)),
    totalDal:   parseFloat(dal.toFixed(2))
  };
}

function getOverallStockUtilization() {
  let used = 0, total = 0;
  getAllInventories().forEach(inv => {
    used  += inv.rice.current  + inv.wheat.current  + inv.dal.current;
    total += inv.rice.max      + inv.wheat.max      + inv.dal.max;
  });
  const pct = total === 0 ? 0 : parseFloat(((used / total) * 100).toFixed(1));
  return {
    usedCapacity:  parseFloat(used.toFixed(2)),
    totalCapacity: parseFloat(total.toFixed(2)),
    percentage:    pct
  };
}
