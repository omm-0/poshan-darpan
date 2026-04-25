import {
  auth, db,
  onAuthStateChanged,
  signOut,
  collection, doc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot
} from './firebase-config.js';
import {
  showToast, formatDate, formatDateTime, timeAgo,
  stockPct, stockStatus, stockStatusLabel, stockColor,
  todayISO, getLast7Days, getLast30Days, getLast90Days,
  sanitize, animateCount
} from './utils.js';

// ─── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let userDoc     = null;
let allSchools  = [];   // [{id, ...schoolData, inventory}]
let allAlerts   = [];
let allAttendance = [];
const charts   = {};
const unsubs   = [];
let analyticsRange = 7;

// ─── Auth Guard ───────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  currentUser = user;

  try {
    const uSnap = await getDoc(doc(db, 'users', user.uid));
    if (!uSnap.exists() || uSnap.data().role !== 'government') {
      window.location.href = 'index.html';
      return;
    }
    userDoc = uSnap.data();
    document.getElementById('sidebar-username').textContent = userDoc.name || user.email;
    hidePageLoading();
    initGovDash();
  } catch (e) {
    showToast('Failed to load profile. Redirecting…', 'error');
    console.error(e);
    setTimeout(() => { window.location.href = 'index.html'; }, 2500);
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initGovDash() {
  setupNavigation();
  setupMobileSidebar();
  setupLogout();
  renderProfile();
  await loadSchools();
  setupAlertsListener();
  setupAttendanceListener();
  setupSchoolFilters();
  setupAnalyticsRanges();
  setupModal();
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const section = item.dataset.section;
      document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('show');
    });
  });
}

function setupMobileSidebar() {
  const toggle  = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    unsubs.forEach(fn => fn());
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout failed:', e);
    }
    window.location.href = 'index.html';
  });
}

// ─── Load All Schools + Inventory ────────────────────────────────────────────
async function loadSchools() {
  try {
    const schoolsSnap = await getDocs(collection(db, 'schools'));
    const schools = [];
    for (const sd of schoolsSnap.docs) {
      const school = { id: sd.id, ...sd.data() };
      // Fetch inventory
      const invSnap = await getDoc(doc(db, 'schools', sd.id, 'inventory', 'stock'));
      school.inventory = invSnap.exists() ? invSnap.data() : null;
      schools.push(school);
    }
    allSchools = schools;

    // Populate district filters
    const districts = [...new Set(schools.map(s => s.district).filter(Boolean))].sort();
    ['district-filter', 'gov-alert-district'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        sel.appendChild(opt);
      });
    });

    renderSchoolsTable(schools);
    renderKPIs(schools);
    renderInventoryHealthChart(schools);
    renderStockDonutChart(schools);
    renderSchoolComparisonChart(schools);
  } catch (e) {
    showToast('Failed to load schools.', 'error');
    console.error(e);
  }
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────
function renderKPIs(schools) {
  const active = schools.filter(s => s.status === 'active').length;
  const totalEnroll = schools.reduce((sum, s) => sum + (s.enrollment || 0), 0);

  setText('kpi-schools', active);
  setText('kpi-students', totalEnroll.toLocaleString('en-IN'));
}

function updateMealsToday(attendance) {
  const today = todayISO();
  const todayRecs = attendance.filter(a => a.date === today);
  const total = todayRecs.reduce((sum, r) => sum + (r.studentsPresent || 0), 0);
  setText('kpi-meals-today', total.toLocaleString('en-IN'));
}

// ─── Alerts Listener ─────────────────────────────────────────────────────────
function setupAlertsListener() {
  const alertsQ = query(
    collection(db, 'alerts'),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  const unsub = onSnapshot(alertsQ, snap => {
    allAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOverviewAlerts(allAlerts.slice(0, 10));
    renderGovAlerts(allAlerts);
    updateAlertKPIs(allAlerts);
    setText('kpi-active-alerts', allAlerts.filter(a => a.status === 'active').length);
    const badge = document.getElementById('nav-alert-count');
    const active = allAlerts.filter(a => a.status === 'active').length;
    badge.style.display = active ? 'inline' : 'none';
    badge.textContent = active;
  }, err => console.error('Alerts err', err));
  unsubs.push(unsub);
}

// ─── Attendance Listener ──────────────────────────────────────────────────────
function setupAttendanceListener() {
  const attQ = query(
    collection(db, 'attendance'),
    orderBy('timestamp', 'desc'),
    limit(500)
  );
  const unsub = onSnapshot(attQ, snap => {
    allAttendance = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateMealsToday(allAttendance);
    renderOvAttendanceChart(allAttendance);
    renderOvMealPieChart(allAttendance);
    renderAnalytics(analyticsRange);
  }, err => console.error('Attendance err', err));
  unsubs.push(unsub);
}

// ─── Overview Charts ──────────────────────────────────────────────────────────
function renderOvAttendanceChart(records) {
  const ctx = document.getElementById('ov-attendance-chart');
  if (!ctx) return;
  const days = getLast7Days();
  const labels = days.map(d => d.slice(5));
  const map = {};
  records.forEach(r => { map[r.date] = (map[r.date] || 0) + (r.studentsPresent || 0); });
  const data = days.map(d => map[d] || 0);

  if (charts.ovAtt) charts.ovAtt.destroy();
  charts.ovAtt = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Students Served',
        data,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#2563EB',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    }
  });
}

function renderOvMealPieChart(records) {
  const ctx = document.getElementById('ov-meal-pie-chart');
  if (!ctx) return;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const recent = records.filter(r => {
    const d = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.date);
    return d >= cutoff;
  });
  const totalRice  = recent.reduce((s, r) => s + (r.riceUsed  || 0), 0);
  const totalWheat = recent.reduce((s, r) => s + (r.wheatUsed || 0), 0);
  const totalDal   = recent.reduce((s, r) => s + (r.dalUsed   || 0), 0);

  if (charts.ovPie) charts.ovPie.destroy();
  charts.ovPie = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Rice', 'Wheat', 'Dal'],
      datasets: [{
        data: [parseFloat(totalRice.toFixed(1)), parseFloat(totalWheat.toFixed(1)), parseFloat(totalDal.toFixed(1))],
        backgroundColor: ['#2563EB', '#059669', '#F59E0B'],
        borderWidth: 2, borderColor: '#fff',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderInventoryHealthChart(schools) {
  const ctx = document.getElementById('ov-inventory-chart');
  if (!ctx) return;
  const filtered = schools.filter(s => s.inventory);

  const labels = filtered.map(s => s.name.replace('Government ', '').replace(' School', ''));
  const ricePcts  = filtered.map(s => stockPct(s.inventory.rice?.current  || 0, s.inventory.rice?.max  || 1));
  const wheatPcts = filtered.map(s => stockPct(s.inventory.wheat?.current || 0, s.inventory.wheat?.max || 1));
  const dalPcts   = filtered.map(s => stockPct(s.inventory.dal?.current   || 0, s.inventory.dal?.max   || 1));

  if (charts.ovInv) charts.ovInv.destroy();
  charts.ovInv = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Rice %',  data: ricePcts,  backgroundColor: 'rgba(37,99,235,0.7)'  },
        { label: 'Wheat %', data: wheatPcts, backgroundColor: 'rgba(5,150,105,0.7)'  },
        { label: 'Dal %',   data: dalPcts,   backgroundColor: 'rgba(245,158,11,0.7)' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ─── Overview Alerts Feed ─────────────────────────────────────────────────────
function renderOverviewAlerts(alerts) {
  const el = document.getElementById('ov-alerts-feed');
  if (!alerts.length) {
    el.innerHTML = `<div class="empty-state"><i class="ph-bold ph-check-circle"></i><p>No alerts.</p></div>`;
    return;
  }
  el.innerHTML = alerts.map(a => `
    <div class="alert-card ${a.severity}">
      <div class="alert-icon ${a.severity}">
        <i class="ph-bold ph-${a.severity === 'critical' ? 'x-circle' : 'warning'}"></i>
      </div>
      <div class="alert-body">
        <div class="alert-title">${sanitize(a.schoolName || '—')} — ${sanitize(a.title || '')}</div>
        <div class="alert-message">${sanitize(a.message || '')}</div>
        <div class="alert-meta">
          <span class="badge badge-${a.severity === 'critical' ? 'critical' : 'warning'}">${a.severity}</span>
          &bull; Item: <strong>${sanitize(a.item || '—')}</strong>
          &bull; ${a.timestamp?.toDate ? timeAgo(a.timestamp.toDate()) : ''}
          &bull; <span class="badge badge-${a.status === 'active' ? 'low' : 'resolved'}">${a.status}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── Schools Table ────────────────────────────────────────────────────────────
function renderSchoolsTable(schools) {
  const tbody = document.getElementById('schools-tbody');
  if (!schools.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No schools found.</td></tr>`;
    return;
  }
  tbody.innerHTML = schools.map(s => {
    const inv    = s.inventory;
    const rPct   = inv ? stockPct(inv.rice?.current  || 0, inv.rice?.max  || 1) : 0;
    const wPct   = inv ? stockPct(inv.wheat?.current || 0, inv.wheat?.max || 1) : 0;
    const dPct   = inv ? stockPct(inv.dal?.current   || 0, inv.dal?.max   || 1) : 0;
    const rStat  = stockStatus(rPct), wStat = stockStatus(wPct), dStat = stockStatus(dPct);
    return `
      <tr data-school-id="${sanitize(s.id)}" data-district="${sanitize(s.district||'')}" data-status="${sanitize(s.status||'')}">
        <td><strong>${sanitize(s.name)}</strong></td>
        <td>${sanitize(s.district || '—')}</td>
        <td>${(s.enrollment || 0).toLocaleString('en-IN')}</td>
        <td>${miniStockCell(rPct, rStat)}</td>
        <td>${miniStockCell(wPct, wStat)}</td>
        <td>${miniStockCell(dPct, dStat)}</td>
        <td><span class="badge badge-${s.status === 'active' ? 'active' : 'inactive'}">${s.status || '—'}</span></td>
        <td><button class="btn btn-secondary btn-sm view-school-btn" data-id="${sanitize(s.id)}">
          <i class="ph-bold ph-eye"></i> View
        </button></td>
      </tr>
    `;
  }).join('');

  // View buttons
  tbody.querySelectorAll('.view-school-btn').forEach(btn => {
    btn.addEventListener('click', () => openSchoolModal(btn.dataset.id));
  });
}

function miniStockCell(pct, stat) {
  const color = stat === 'healthy' ? '#059669' : stat === 'low' ? '#F59E0B' : '#DC2626';
  return `
    <div class="stock-cell">
      <span style="font-size:0.8rem;font-weight:600;color:${color};min-width:32px">${pct}%</span>
      <div class="stock-mini-bar">
        <div class="stock-mini-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

// ─── School Filters ───────────────────────────────────────────────────────────
function setupSchoolFilters() {
  const searchEl   = document.getElementById('school-search');
  const distEl     = document.getElementById('district-filter');
  const statusEl   = document.getElementById('status-filter');
  const sortEl     = document.getElementById('sort-filter');

  function applyFilters() {
    const search = searchEl.value.toLowerCase();
    const dist   = distEl.value;
    const status = statusEl.value;
    const sort   = sortEl.value;

    let filtered = allSchools.filter(s => {
      if (search && !s.name.toLowerCase().includes(search)) return false;
      if (dist   && s.district !== dist)  return false;
      if (status && s.status   !== status) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'enrollment') return (b.enrollment || 0) - (a.enrollment || 0);
      if (sort === 'stock') {
        const aAvg = a.inventory ? avgStock(a.inventory) : 0;
        const bAvg = b.inventory ? avgStock(b.inventory) : 0;
        return aAvg - bAvg;
      }
      return a.name.localeCompare(b.name);
    });

    renderSchoolsTable(filtered);
  }

  [searchEl, distEl, statusEl, sortEl].forEach(el => el?.addEventListener('input', applyFilters));
}

function avgStock(inv) {
  const r = stockPct(inv.rice?.current  || 0, inv.rice?.max  || 1);
  const w = stockPct(inv.wheat?.current || 0, inv.wheat?.max || 1);
  const d = stockPct(inv.dal?.current   || 0, inv.dal?.max   || 1);
  return (r + w + d) / 3;
}

// ─── School Detail Modal ──────────────────────────────────────────────────────
function setupModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('school-modal-backdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('school-modal-backdrop')) closeModal();
  });
}

function closeModal() {
  document.getElementById('school-modal-backdrop').classList.remove('show');
}

async function openSchoolModal(schoolId) {
  const school = allSchools.find(s => s.id === schoolId);
  if (!school) return;

  document.getElementById('modal-school-name').textContent = school.name;
  document.getElementById('school-modal-backdrop').classList.add('show');

  const body = document.getElementById('modal-body');
  body.innerHTML = '<div class="skeleton-row"><div class="skeleton"></div></div>';

  // Fetch last 10 attendance records
  const attQ = query(
    collection(db, 'attendance'),
    where('schoolId', '==', schoolId),
    orderBy('date', 'desc'),
    limit(10)
  );
  let attRecs;
  try {
    const attSnap = await getDocs(attQ);
    attRecs = attSnap.docs.map(d => d.data());
  } catch (e) {
    console.error('Modal data load failed:', e);
    body.innerHTML = '<p style="color:var(--danger);padding:1rem">Failed to load school data. Please try again.</p>';
    return;
  }

  const inv = school.inventory;
  const rPct = inv ? stockPct(inv.rice?.current  || 0, inv.rice?.max  || 1) : 0;
  const wPct = inv ? stockPct(inv.wheat?.current || 0, inv.wheat?.max || 1) : 0;
  const dPct = inv ? stockPct(inv.dal?.current   || 0, inv.dal?.max   || 1) : 0;

  const schoolAlerts = allAlerts.filter(a => a.schoolId === schoolId && a.status === 'active');

  body.innerHTML = `
    <div class="modal-detail-grid" style="margin-bottom:1.25rem">
      <div class="modal-detail-item">
        <span class="modal-detail-label">District</span>
        <span class="modal-detail-val">${sanitize(school.district || '—')}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label">Enrollment</span>
        <span class="modal-detail-val">${(school.enrollment || 0).toLocaleString('en-IN')}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label">Status</span>
        <span class="badge badge-${school.status === 'active' ? 'active' : 'inactive'}">${school.status || '—'}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label">Contact</span>
        <span class="modal-detail-val">${sanitize(school.contactPerson || '—')}</span>
      </div>
    </div>

    <div class="section-title">Inventory Status</div>
    ${inv ? `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.25rem">
      ${['rice','wheat','dal'].map(item => {
        const cur = inv[item]?.current || 0, max = inv[item]?.max || 0;
        const pct = stockPct(cur, max);
        const stat = stockStatus(pct);
        return `<div style="text-align:center">
          <div style="font-weight:700;font-size:1.25rem;color:${stockColor(pct)}">${pct}%</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);text-transform:capitalize">${item}</div>
          <div style="font-size:0.75rem">${cur}/${max} kg</div>
          <div class="progress-bar-wrap" style="margin:0.4rem 0">
            <div class="progress-bar-fill ${stat}" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('')}
    </div>` : '<p style="color:var(--text-secondary);font-size:0.875rem">No inventory data.</p>'}

    ${schoolAlerts.length ? `
    <div class="section-title">Active Alerts (${schoolAlerts.length})</div>
    <div style="margin-bottom:1.25rem">
      ${schoolAlerts.map(a => `
        <div class="alert-card ${a.severity}" style="margin-bottom:0.5rem">
          <div class="alert-icon ${a.severity}"><i class="ph-bold ph-${a.severity === 'critical' ? 'x-circle' : 'warning'}"></i></div>
          <div class="alert-body">
            <div class="alert-title">${sanitize(a.title)}</div>
            <div class="alert-message">${sanitize(a.message)}</div>
          </div>
        </div>
      `).join('')}
    </div>` : ''}

    <div class="section-title">Last 10 Attendance Records</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Present</th><th>Rice (kg)</th><th>Wheat (kg)</th><th>Dal (kg)</th></tr></thead>
        <tbody>
          ${attRecs.length ? attRecs.map(r => `
            <tr>
              <td>${sanitize(r.date)}</td>
              <td>${sanitize(String(r.studentsPresent || 0))}</td>
              <td>${parseFloat(r.riceUsed || 0).toFixed(2)}</td>
              <td>${parseFloat(r.wheatUsed || 0).toFixed(2)}</td>
              <td>${parseFloat(r.dalUsed || 0).toFixed(2)}</td>
            </tr>
          `).join('') : `<tr><td colspan="5" class="table-empty">No attendance records.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function setupAnalyticsRanges() {
  document.querySelectorAll('#section-analytics .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#section-analytics .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      analyticsRange = parseInt(tab.dataset.range);
      renderAnalytics(analyticsRange);
    });
  });
}

function renderAnalytics(days) {
  const records = filterByDays(allAttendance, days);
  renderConsumptionChart(records, days);
  renderDistrictChart(records, days);
  renderSchoolComparisonChart(allSchools);
  renderStockDonutChart(allSchools);
  renderAnalyticsKPIs(records);
}

function filterByDays(records, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().split('T')[0];
  return records.filter(r => {
    if (r.date) return r.date >= cutoffDate;
    const d = r.timestamp?.toDate ? r.timestamp.toDate() : null;
    return d && d >= cutoff;
  });
}

function renderConsumptionChart(records, rangeLen) {
  const ctx = document.getElementById('an-consumption-chart');
  if (!ctx) return;

  const days = Array.from({ length: rangeLen }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (rangeLen - 1 - i));
    return d.toISOString().split('T')[0];
  });

  const riceMap = {}, wheatMap = {}, dalMap = {};
  records.forEach(r => {
    riceMap[r.date]  = (riceMap[r.date]  || 0) + (r.riceUsed  || 0);
    wheatMap[r.date] = (wheatMap[r.date] || 0) + (r.wheatUsed || 0);
    dalMap[r.date]   = (dalMap[r.date]   || 0) + (r.dalUsed   || 0);
  });

  const labels = days.map(d => d.slice(5));
  if (charts.consumption) charts.consumption.destroy();
  charts.consumption = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Rice (kg)',  data: days.map(d => +(riceMap[d]  || 0).toFixed(1)), borderColor: '#2563EB', fill: false, tension: 0.4 },
        { label: 'Wheat (kg)', data: days.map(d => +(wheatMap[d] || 0).toFixed(1)), borderColor: '#059669', fill: false, tension: 0.4 },
        { label: 'Dal (kg)',   data: days.map(d => +(dalMap[d]   || 0).toFixed(1)), borderColor: '#F59E0B', fill: false, tension: 0.4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    }
  });
}

function renderDistrictChart(records, days) {
  const ctx = document.getElementById('an-district-chart');
  if (!ctx) return;

  // Map schoolId → district
  const schoolDistMap = {};
  allSchools.forEach(s => { schoolDistMap[s.id] = s.district; });

  const distMap = {}, distCount = {};
  records.forEach(r => {
    const dist = schoolDistMap[r.schoolId] || 'Unknown';
    distMap[dist]  = (distMap[dist]  || 0) + (r.studentsPresent || 0);
    distCount[dist] = (distCount[dist] || 0) + 1;
  });

  const labels = Object.keys(distMap);
  const data   = labels.map(d => distCount[d] ? Math.round(distMap[d] / distCount[d]) : 0);

  if (charts.district) charts.district.destroy();
  charts.district = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Avg Daily Attendance', data, backgroundColor: '#2563EB' }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }
    }
  });
}

function renderSchoolComparisonChart(schools) {
  const ctx = document.getElementById('an-school-chart');
  if (!ctx) return;

  const recentMap = {};
  const last30 = filterByDays(allAttendance, 30);
  last30.forEach(r => { recentMap[r.schoolId] = (recentMap[r.schoolId] || 0) + (r.studentsPresent || 0); });

  // Sort by total attendance descending so the top-performing schools are shown first
  const top10 = [...schools]
    .sort((a, b) => (recentMap[b.id] || 0) - (recentMap[a.id] || 0))
    .slice(0, 10);

  const labels = top10.map(s => s.name.split(' ').slice(-1)[0]);
  const data   = top10.map(s => recentMap[s.id] || 0);

  if (charts.schoolComp) charts.schoolComp.destroy();
  charts.schoolComp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Students Served (30d)', data, backgroundColor: 'rgba(37,99,235,0.75)' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    }
  });
}

function renderStockDonutChart(schools) {
  const ctx = document.getElementById('an-stock-donut');
  if (!ctx) return;

  let totalCur = 0, totalMax = 0;
  schools.forEach(s => {
    if (!s.inventory) return;
    ['rice', 'wheat', 'dal'].forEach(item => {
      totalCur += s.inventory[item]?.current || 0;
      totalMax += s.inventory[item]?.max     || 0;
    });
  });
  const used    = +(totalCur).toFixed(1);
  const remaining = +(totalMax - totalCur).toFixed(1);

  if (charts.stockDonut) charts.stockDonut.destroy();
  charts.stockDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Current Stock (kg)', 'Empty Capacity (kg)'],
      datasets: [{
        data: [used, remaining > 0 ? remaining : 0],
        backgroundColor: ['#2563EB', '#E2E8F0'],
        borderWidth: 2, borderColor: '#fff'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderAnalyticsKPIs(records) {
  if (!records.length) return;

  const totalStudents = records.reduce((s, r) => s + (r.studentsPresent || 0), 0);
  const totalDays     = new Set(records.map(r => r.date)).size;
  const totalSchools  = new Set(records.map(r => r.schoolId)).size;

  const avgMeals = totalSchools > 0 && totalDays > 0
    ? Math.round(totalStudents / totalSchools / totalDays * 10) / 10
    : 0;

  const totalEnroll = allSchools.reduce((s, s2) => s + (s2.enrollment || 0), 0);
  const avgAttRate  = totalEnroll > 0
    ? `${Math.min(100, Math.round(totalStudents / totalEnroll / Math.max(totalDays, 1) * 100))}%`
    : '—';

  // Most consumed item
  const riceTotal  = records.reduce((s, r) => s + (r.riceUsed  || 0), 0);
  const wheatTotal = records.reduce((s, r) => s + (r.wheatUsed || 0), 0);
  const dalTotal   = records.reduce((s, r) => s + (r.dalUsed   || 0), 0);
  const topItem = riceTotal >= wheatTotal && riceTotal >= dalTotal ? 'Rice'
                : wheatTotal >= dalTotal ? 'Wheat' : 'Dal';

  // Top school
  const schoolTotals = {};
  records.forEach(r => { schoolTotals[r.schoolId] = (schoolTotals[r.schoolId] || 0) + (r.studentsPresent || 0); });
  const topSchoolId = Object.keys(schoolTotals).sort((a, b) => schoolTotals[b] - schoolTotals[a])[0];
  const topSchool   = allSchools.find(s => s.id === topSchoolId);

  setText('an-avg-att',   avgAttRate);
  setText('an-avg-meals', avgMeals);
  setText('an-top-school', topSchool ? topSchool.name.split(' ').slice(-2).join(' ') : '—');
  setText('an-top-item',  topItem);
}

// ─── Govt Alerts ──────────────────────────────────────────────────────────────
function updateAlertKPIs(alerts) {
  const active   = alerts.filter(a => a.status === 'active');
  const warnings = active.filter(a => a.severity === 'warning').length;
  const crits    = active.filter(a => a.severity === 'critical').length;

  setText('gov-warnings', warnings);
  setText('gov-criticals', crits);

  // Most alerted school
  const counts = {};
  active.forEach(a => { counts[a.schoolName || a.schoolId] = (counts[a.schoolName || a.schoolId] || 0) + 1; });
  const topSchoolName = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  setText('gov-most-alerted', topSchoolName || '—');
}

function renderGovAlerts(alerts) {
  const sevFilter  = document.getElementById('gov-alert-severity')?.value || '';
  const statFilter = document.getElementById('gov-alert-status')?.value || 'active';
  const distFilter = document.getElementById('gov-alert-district')?.value || '';

  const schoolDistMap = {};
  allSchools.forEach(s => { schoolDistMap[s.id] = s.district; });

  const filtered = alerts.filter(a => {
    if (sevFilter  && a.severity !== sevFilter) return false;
    if (statFilter && a.status   !== statFilter) return false;
    if (distFilter && schoolDistMap[a.schoolId] !== distFilter) return false;
    return true;
  });

  const el = document.getElementById('gov-alerts-list');
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><i class="ph-bold ph-bell-slash"></i><p>No alerts match the filter.</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="readonly-notice">
      <i class="ph-bold ph-eye"></i>
      Government view is read-only. Schools manage their own alerts.
    </div>
    ${filtered.map(a => `
      <div class="alert-card ${a.severity}">
        <div class="alert-icon ${a.severity}">
          <i class="ph-bold ph-${a.severity === 'critical' ? 'x-circle' : 'warning'}"></i>
        </div>
        <div class="alert-body">
          <div class="alert-title">
            <strong>${sanitize(a.schoolName || '—')}</strong> — ${sanitize(a.title || '')}
          </div>
          <div class="alert-message">${sanitize(a.message || '')}</div>
          <div class="alert-meta">
            <span class="badge badge-${a.severity === 'critical' ? 'critical' : 'warning'}">${a.severity}</span>
            &bull; Item: <strong>${sanitize(a.item || '—')}</strong>
            &bull; ${a.timestamp?.toDate ? timeAgo(a.timestamp.toDate()) : ''}
            &bull; <span class="badge badge-${a.status === 'active' ? 'low' : 'resolved'}">${a.status}</span>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

// Attach filter events for gov alerts
['gov-alert-severity', 'gov-alert-status', 'gov-alert-district'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => renderGovAlerts(allAlerts));
});

// ─── Profile ──────────────────────────────────────────────────────────────────
function renderProfile() {
  setText('prof-name',     userDoc?.name || currentUser?.email || '—');
  setText('prof-email',    currentUser?.email || '—');
  setText('prof-district', userDoc?.district || '—');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hidePageLoading() {
  const el = document.getElementById('page-loading');
  if (el) el.style.display = 'none';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
