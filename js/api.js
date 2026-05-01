/* ============================================================
   POSHAN DARPAN - API CLIENT + IN-MEMORY CACHE
   --------------------------------------------------------------
   Drop-in replacement for mock-data.js. Exposes the SAME function
   names that the dashboards already call (getInventory, getAllSchools,
   getAttendanceBySchool, ...) but backed by the REST API in
   /poshan-darpan-backend instead of localStorage.

   Strategy: pre-load all the data needed for the current page once
   on startup (loadSchoolData() / loadGovData()), cache it in module
   scope, and serve subsequent reads synchronously from the cache.
   Writes go to the API and then re-load the affected slice.
============================================================ */

// ---------- CONFIG ----------

const API_BASE = (window.POSHAN_API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'poshanToken';
const SESSION_KEY = 'poshanSession';

// ---------- STATE / CACHE ----------

const _cache = {
  schools: [],          // [{schoolId, name, district, enrollment, status, ...}]
  inventory: {},        // { [schoolId]: { rice:{current,max}, wheat:{...}, dal:{...}, lastUpdated } }
  attendance: [],       // [{ id, schoolId, date, studentsPresent, riceUsed, wheatUsed, dalUsed, timestamp }]
  alerts: [],           // [{ id, schoolId, schoolName, severity, item, status, title, message, timestamp, resolvedAt }]
  transactions: {},     // { [schoolId]: [ {id, schoolId, type, item, quantity, reason, timestamp} ] }
};

// ---------- TOKEN / SESSION ----------

function apiGetToken() { return localStorage.getItem(TOKEN_KEY) || null; }
function apiSetToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); }
function apiClearToken() { localStorage.removeItem(TOKEN_KEY); }

function getCurrentSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch (e) { return null; }
}
function saveSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); apiClearToken(); }

// ---------- LOW-LEVEL FETCH ----------

class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function apiFetch(method, path, body) {
  const url = API_BASE + path;
  const headers = { 'Accept': 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = apiGetToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    throw new ApiError(
      'Cannot reach the backend at ' + API_BASE + '. Is the server running?',
      0,
      'NETWORK_ERROR'
    );
  }

  let json = null;
  const text = await response.text();
  if (text) {
    try { json = JSON.parse(text); } catch (e) { json = null; }
  }

  if (!response.ok) {
    const msg = (json && json.message) || ('Request failed with status ' + response.status);
    const code = (json && json.error) || 'HTTP_' + response.status;
    const details = json && json.details;
    throw new ApiError(msg, response.status, code, details);
  }

  return json;
}

// ---------- AUTH API ----------

const apiAuth = {
  async login(email, password) {
    const res = await apiFetch('POST', '/auth/login', { email, password });
    return res && res.data ? res.data : null;
  },

  async register(payload) {
    const res = await apiFetch('POST', '/auth/register', payload);
    return res && res.data ? res.data : null;
  },

  async me() {
    const res = await apiFetch('GET', '/auth/me');
    return res && res.data ? res.data : null;
  },

  async logout() {
    try { await apiFetch('POST', '/auth/logout'); }
    catch (e) { /* ignore — we're logging out anyway */ }
    clearSession();
  },

  async forgotPassword(email) {
    return apiFetch('POST', '/auth/forgot-password', { email });
  }
};

// ---------- NORMALIZERS ----------

// Backend schools have id; mock-data convention is schoolId. Normalize for compat.
function _normSchool(s) {
  if (!s) return s;
  if (s.id && !s.schoolId) s.schoolId = s.id;
  return s;
}

function _normInventory(inv) {
  // Strip backend-only computed fields if present so frontend computes them itself
  // (the frontend already has stockPercent/stockLabel helpers in utils.js).
  return inv;
}

// ---------- LOAD HELPERS ----------

async function _loadSchools() {
  const res = await apiFetch('GET', '/schools');
  _cache.schools = (res.data.schools || []).map(_normSchool);
  return _cache.schools;
}

async function _loadInventoryForSchool(schoolId) {
  try {
    const res = await apiFetch('GET', '/inventory/' + encodeURIComponent(schoolId));
    _cache.inventory[schoolId] = _normInventory(res.data.inventory);
  } catch (err) {
    if (err.status === 404) {
      _cache.inventory[schoolId] = null;
    } else {
      throw err;
    }
  }
  return _cache.inventory[schoolId];
}

async function _loadAllInventories() {
  // Government view — fetch via /api/inventory which returns all active schools.
  const res = await apiFetch('GET', '/inventory');
  (res.data.inventories || []).forEach((inv) => {
    _cache.inventory[inv.schoolId] = {
      rice: inv.rice,
      wheat: inv.wheat,
      dal: inv.dal
    };
  });
  return _cache.inventory;
}

async function _loadAttendanceForSchool(schoolId, limit) {
  const path = '/attendance/school/' + encodeURIComponent(schoolId) +
    '?limit=' + (limit || 30);
  const res = await apiFetch('GET', path);
  // Replace any cached records for this school
  _cache.attendance = _cache.attendance.filter((r) => r.schoolId !== schoolId);
  (res.data.attendance || []).forEach((r) => _cache.attendance.push(r));
  return res.data.attendance;
}

async function _loadAttendanceForAllSchools(daysWindow) {
  // We don't have a single "list all attendance" endpoint, so loop active schools.
  // For 5 schools this is fine. Pull last N records each.
  const schools = _cache.schools.length ? _cache.schools : await _loadSchools();
  await Promise.all(
    schools
      .filter((s) => s.status === 'active')
      .map((s) => _loadAttendanceForSchool(s.schoolId, daysWindow || 30))
  );
}

async function _loadAlertsForSchool(schoolId) {
  const res = await apiFetch('GET', '/alerts/school/' + encodeURIComponent(schoolId));
  _cache.alerts = _cache.alerts.filter((a) => a.schoolId !== schoolId);
  (res.data.alerts || []).forEach((a) => _cache.alerts.push(a));
  return res.data.alerts;
}

async function _loadAllAlerts() {
  const res = await apiFetch('GET', '/alerts?limit=500');
  _cache.alerts = res.data.alerts || [];
  return _cache.alerts;
}

async function _loadTransactionsForSchool(schoolId, limit) {
  const path = '/transactions/school/' + encodeURIComponent(schoolId) +
    '?limit=' + (limit || 50);
  const res = await apiFetch('GET', path);
  _cache.transactions[schoolId] = res.data.transactions || [];
  return _cache.transactions[schoolId];
}

// ---------- HIGH-LEVEL PRELOAD ----------

async function loadSchoolData(schoolId) {
  // For school dashboard — only their own data.
  await Promise.all([
    _loadSchools(),
    _loadInventoryForSchool(schoolId),
    _loadAttendanceForSchool(schoolId, 30),
    _loadAlertsForSchool(schoolId),
    _loadTransactionsForSchool(schoolId, 50)
  ]);
}

async function loadGovData() {
  // For gov dashboard — everything.
  await _loadSchools();
  await Promise.all([
    _loadAllInventories(),
    _loadAllAlerts(),
    _loadAttendanceForAllSchools(40)
  ]);
}

// ---------- INIT (no-op for compat with mock-data.js) ----------

function initDataStore() { /* no-op */ }
function resetDataStore() { /* no-op — backend is the source of truth */ }

// ---------- AUTHENTICATION (compatibility shims) ----------
// The original auth.js called these as if they were sync. We keep them
// as sync helpers that just throw so the new auth.js (async) can replace them.
// Old call sites (if any) will see clear errors instead of stale localStorage.

function authenticateUser() {
  throw new Error('authenticateUser() is removed in API mode. Use apiAuth.login() (async) instead.');
}
function registerNewUser() {
  throw new Error('registerNewUser() is removed in API mode. Use apiAuth.register() (async) instead.');
}

// ---------- SCHOOLS (sync from cache) ----------

function getAllSchools()        { return _cache.schools.slice(); }
function getSchoolById(id)      { return _cache.schools.find((s) => s.schoolId === id) || null; }
function getActiveSchools()     { return _cache.schools.filter((s) => s.status === 'active'); }
function getSchoolsByDistrict(d){ return _cache.schools.filter((s) => s.district === d); }
function getDistrictList() {
  const set = new Set();
  _cache.schools.forEach((s) => { if (s.district) set.add(s.district); });
  return Array.from(set);
}

// ---------- INVENTORY (sync from cache) ----------

function getInventory(schoolId)        { return _cache.inventory[schoolId] || null; }
function getAllInventories() {
  return Object.entries(_cache.inventory).map(([schoolId, inv]) => ({
    schoolId,
    rice: inv.rice,
    wheat: inv.wheat,
    dal: inv.dal,
    lastUpdated: inv.lastUpdated
  }));
}

// stockPercent / stockStatus helpers live in utils.js — these are kept here as
// extra aliases for any caller that imports them from the old mock-data.js.
function getStockPercentage(current, max) {
  if (!max || max === 0) return 0;
  return Math.round((current / max) * 100);
}
function getStockStatus(current, max) {
  const pct = (current / max) * 100;
  if (pct < 10) return 'critical';
  if (pct < 20) return 'warning';
  return 'healthy';
}

// ---------- INVENTORY WRITES ----------

async function addStock(schoolId, item, quantity) {
  try {
    const res = await apiFetch(
      'POST',
      '/inventory/' + encodeURIComponent(schoolId) + '/add',
      { item: String(item).toLowerCase(), quantity: Number(quantity) }
    );
    // Refresh inventory + alerts + transactions for this school so subsequent
    // sync reads reflect the change.
    await Promise.all([
      _loadInventoryForSchool(schoolId),
      _loadAlertsForSchool(schoolId),
      _loadTransactionsForSchool(schoolId, 50)
    ]);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message, code: err.code, details: err.details };
  }
}

// ---------- ATTENDANCE (sync from cache) ----------

function getAttendanceBySchool(schoolId) {
  return _cache.attendance
    .filter((r) => r.schoolId === schoolId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getAllAttendance() {
  return _cache.attendance.slice();
}

function getAttendanceByDate(dateStr) {
  return _cache.attendance.filter((r) => r.date === dateStr);
}

function getTodaysAttendance(schoolId) {
  const today = todayStr();
  return _cache.attendance.find((r) => r.schoolId === schoolId && r.date === today) || null;
}

function checkDuplicateAttendance(schoolId, dateStr) {
  return _cache.attendance.some((r) => r.schoolId === schoolId && r.date === dateStr);
}

// ---------- ATTENDANCE WRITE ----------

async function submitAttendance(schoolId, dateStr, studentsPresent) {
  try {
    const res = await apiFetch('POST', '/attendance/submit', {
      date: dateStr,
      studentsPresent: Number(studentsPresent)
    });

    // Refresh inventory, attendance, alerts, transactions for this school.
    await Promise.all([
      _loadInventoryForSchool(schoolId),
      _loadAttendanceForSchool(schoolId, 30),
      _loadAlertsForSchool(schoolId),
      _loadTransactionsForSchool(schoolId, 50)
    ]);

    const d = res.data || {};
    const meals = d.mealDeductions || {};
    // Normalize to the shape the original frontend expected.
    return {
      success: true,
      data: {
        riceUsed: meals.rice,
        wheatUsed: meals.wheat,
        dalUsed: meals.dal,
        newInventory: d.updatedInventory,
        alertsGenerated: (d.alertsGenerated || []).map((a) => {
          const sevText = a.severity === 'critical'
            ? 'critically low'
            : 'running low';
          return {
            id: a.id,
            severity: a.severity,
            item: a.item,
            title: a.severity.toUpperCase() + ': ' + a.item + ' stock ' + sevText
          };
        })
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: err.code,
      details: err.details
    };
  }
}

// ---------- ATTENDANCE TREND / CONSUMPTION ----------
// Backend has /api/attendance/trend/:days and /consumption/:days.
// For convenience we keep the client-side helpers too — they read from the
// cache that loadGovData() already pre-fetched.

function getAttendanceTrendLastNDays(n) {
  const dates = getLastNDates(n);
  return dates.map((d) => {
    const recs = getAttendanceByDate(d);
    return { date: d, totalStudents: recs.reduce((s, r) => s + r.studentsPresent, 0) };
  });
}

function getConsumptionLastNDays(n) {
  const dates = getLastNDates(n);
  const riceTotals = []; const wheatTotals = []; const dalTotals = [];
  dates.forEach((d) => {
    const recs = getAttendanceByDate(d);
    let r = 0, w = 0, da = 0;
    recs.forEach((rec) => { r += rec.riceUsed; w += rec.wheatUsed; da += rec.dalUsed; });
    riceTotals.push(parseFloat(r.toFixed(2)));
    wheatTotals.push(parseFloat(w.toFixed(2)));
    dalTotals.push(parseFloat(da.toFixed(2)));
  });
  return { dates, riceTotals, wheatTotals, dalTotals };
}

// ---------- ALERTS (sync from cache) ----------

function getAlertsBySchool(schoolId) {
  return _cache.alerts
    .filter((a) => a.schoolId === schoolId)
    .slice()
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
}
function getAllAlerts() {
  return _cache.alerts.slice().sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
}
function getActiveAlerts()                  { return getAllAlerts().filter((a) => a.status === 'active'); }
function getActiveAlertCount()              { return getActiveAlerts().length; }
function getActiveAlertCountBySchool(id)    { return getAlertsBySchool(id).filter((a) => a.status === 'active').length; }

function getMostAlertedSchool() {
  const active = getActiveAlerts();
  if (active.length === 0) return '—';
  const counts = {};
  active.forEach((a) => { counts[a.schoolName] = (counts[a.schoolName] || 0) + 1; });
  let top = '—', max = 0;
  Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; top = k; } });
  return top;
}

// ---------- ALERT WRITES ----------

async function resolveAlert(alertId) {
  try {
    const res = await apiFetch('PUT', '/alerts/' + encodeURIComponent(alertId) + '/resolve');
    // Find the schoolId for this alert in cache and re-load that school's alerts.
    const cached = _cache.alerts.find((a) => a.id === alertId);
    if (cached) await _loadAlertsForSchool(cached.schoolId);
    else await _loadAllAlerts();
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
}

// ---------- TRANSACTIONS (sync from cache) ----------

function getTransactionsBySchool(schoolId) {
  const list = _cache.transactions[schoolId] || [];
  return list.slice().sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
}

// logTransaction was used by old attendance/stock-add flows — those now run
// server-side so this is a no-op kept for backward compat.
function logTransaction() { /* no-op */ }

// ---------- ANALYTICS (computed client-side from cache) ----------

function getTotalActiveSchools() { return getActiveSchools().length; }
function getTotalEnrollment()    { return getActiveSchools().reduce((s, sc) => s + sc.enrollment, 0); }
function getTodayTotalMeals() {
  const today = todayStr();
  return getAttendanceByDate(today).reduce((s, r) => s + r.studentsPresent, 0);
}

function _avgAttendancePerSchool(days) {
  const dates = getLastNDates(days);
  return getActiveSchools().map((sch) => {
    let total = 0, count = 0;
    dates.forEach((d) => {
      const rec = _cache.attendance.find((r) => r.schoolId === sch.schoolId && r.date === d);
      if (rec) {
        total += (rec.studentsPresent / sch.enrollment) * 100;
        count++;
      }
    });
    return {
      schoolId: sch.schoolId,
      schoolName: sch.name,
      district: sch.district,
      avgRate: count === 0 ? 0 : parseFloat((total / count).toFixed(1))
    };
  });
}

function getAvgAttendanceRate(days) {
  const arr = _avgAttendancePerSchool(days);
  if (arr.length === 0) return 0;
  const sum = arr.reduce((s, x) => s + x.avgRate, 0);
  return parseFloat((sum / arr.length).toFixed(1));
}

function getAvgMealsPerSchoolPerDay(days) {
  const dates = getLastNDates(days);
  const active = getActiveSchools();
  if (active.length === 0 || dates.length === 0) return 0;
  let total = 0;
  dates.forEach((d) => {
    getAttendanceByDate(d).forEach((r) => { total += r.studentsPresent; });
  });
  return Math.round(total / (active.length * dates.length));
}

function getMostConsumedItem(days) {
  const data = getConsumptionLastNDays(days);
  const r = data.riceTotals.reduce((a, b) => a + b, 0);
  const w = data.wheatTotals.reduce((a, b) => a + b, 0);
  const d = data.dalTotals.reduce((a, b) => a + b, 0);
  if (r >= w && r >= d) return 'Rice';
  if (w >= r && w >= d) return 'Wheat';
  return 'Dal';
}

function getHighestAttendanceSchool(days) {
  const arr = _avgAttendancePerSchool(days);
  if (arr.length === 0) return { name: '—', rate: 0 };
  let top = arr[0];
  arr.forEach((x) => { if (x.avgRate > top.avgRate) top = x; });
  return { name: top.schoolName, rate: top.avgRate };
}

function getLowestAttendanceSchool(days) {
  const arr = _avgAttendancePerSchool(days);
  if (arr.length === 0) return { name: '—', rate: 0 };
  let bot = arr[0];
  arr.forEach((x) => { if (x.avgRate < bot.avgRate) bot = x; });
  return { name: bot.schoolName, rate: bot.avgRate };
}

function getSchoolInventoryHealth() {
  const out = [];
  getActiveSchools().forEach((sch) => {
    const inv = getInventory(sch.schoolId);
    if (!inv) return;
    const r = (inv.rice.current / inv.rice.max) * 100;
    const w = (inv.wheat.current / inv.wheat.max) * 100;
    const d = (inv.dal.current / inv.dal.max) * 100;
    out.push({
      schoolId: sch.schoolId,
      schoolName: sch.name,
      avgPercentage: parseFloat(((r + w + d) / 3).toFixed(1))
    });
  });
  return out;
}

function getDistrictWiseAttendance(days) {
  const arr = _avgAttendancePerSchool(days);
  const grouped = {};
  arr.forEach((x) => {
    if (!grouped[x.district]) grouped[x.district] = { sum: 0, count: 0 };
    grouped[x.district].sum += x.avgRate;
    grouped[x.district].count++;
  });
  const out = {};
  Object.entries(grouped).forEach(([d, v]) => {
    out[d] = v.count === 0 ? 0 : parseFloat((v.sum / v.count).toFixed(1));
  });
  return out;
}

function getTotalConsumption(days) {
  const data = getConsumptionLastNDays(days);
  return {
    totalRice:  parseFloat(data.riceTotals.reduce((a, b) => a + b, 0).toFixed(2)),
    totalWheat: parseFloat(data.wheatTotals.reduce((a, b) => a + b, 0).toFixed(2)),
    totalDal:   parseFloat(data.dalTotals.reduce((a, b) => a + b, 0).toFixed(2))
  };
}

function getOverallStockUtilization() {
  let used = 0, total = 0;
  Object.values(_cache.inventory).forEach((inv) => {
    if (!inv) return;
    used  += (inv.rice.current  || 0) + (inv.wheat.current  || 0) + (inv.dal.current  || 0);
    total += (inv.rice.max      || 0) + (inv.wheat.max      || 0) + (inv.dal.max      || 0);
  });
  return {
    usedCapacity:  parseFloat(used.toFixed(2)),
    totalCapacity: parseFloat(total.toFixed(2)),
    percentage:    total === 0 ? 0 : parseFloat(((used / total) * 100).toFixed(1))
  };
}

// ---------- EXPORTS (window globals so HTML script tags pick them up) ----------

window.POSHAN_API_BASE = API_BASE;
window.apiAuth = apiAuth;
window.apiFetch = apiFetch;
window.ApiError = ApiError;
window.loadSchoolData = loadSchoolData;
window.loadGovData = loadGovData;
