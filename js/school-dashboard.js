import {
  auth, db,
  onAuthStateChanged,
  signOut,
  collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc,
  query, where, orderBy, limit, onSnapshot,
  runTransaction, serverTimestamp
} from './firebase-config.js';
import {
  showToast, formatDate, formatDateTime, todayISO, timeAgo,
  stockPct, stockStatus, stockStatusLabel, stockColor,
  CONSUMPTION, setButtonLoading, sanitize, animateCount
} from './utils.js';

// ─── App State ────────────────────────────────────────────────────────────────
let currentUser = null;
let userDoc     = null;
let schoolDoc   = null;
let inventory   = null;
let attChart    = null;
const unsubs   = [];  // onSnapshot unsubscribers

// ─── Auth Guard ───────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  currentUser = user;

  try {
    const uSnap = await getDoc(doc(db, 'users', user.uid));
    if (!uSnap.exists() || uSnap.data().role !== 'school') {
      window.location.href = 'index.html';
      return;
    }
    userDoc = uSnap.data();

    const sSnap = await getDoc(doc(db, 'schools', userDoc.schoolId));
    if (!sSnap.exists()) {
      showToast('School data not found. Please contact support.', 'error');
      setTimeout(() => { window.location.href = 'index.html'; }, 3000);
      return;
    }
    schoolDoc = { id: sSnap.id, ...sSnap.data() };

    document.getElementById('sidebar-username').textContent = userDoc.name || user.email;
    hidePageLoading();
    initApp();
  } catch (e) {
    showToast('Failed to load profile. Redirecting…', 'error');
    console.error(e);
    setTimeout(() => { window.location.href = 'index.html'; }, 2500);
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
function initApp() {
  setupNavigation();
  setupInventoryListeners();
  setupAttendanceForm();
  setupAddStockForm();
  setupAlerts();
  renderProfile();
  setupMobileSidebar();
  setupLogout();
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const section = item.dataset.section;
      document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');
      // close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('show');
    });
  });
}

// ─── Mobile Sidebar ───────────────────────────────────────────────────────────
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

// ─── Logout ───────────────────────────────────────────────────────────────────
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

// ─── Inventory Real-time Listener ─────────────────────────────────────────────
function setupInventoryListeners() {
  const invRef = doc(db, 'schools', schoolDoc.id, 'inventory', 'stock');
  const unsub  = onSnapshot(invRef, (snap) => {
    if (!snap.exists()) return;
    inventory = snap.data();
    renderInventory(inventory);
    renderOverviewStock(inventory);
  }, err => console.error('Inventory listener error', err));
  unsubs.push(unsub);

  // Attendance listener (real-time)
  const attQ = query(
    collection(db, 'attendance'),
    where('schoolId', '==', schoolDoc.id),
    orderBy('date', 'desc'),
    limit(30)
  );
  const attUnsub = onSnapshot(attQ, (snap) => {
    const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAttendanceHistory(records);
    renderRecentActivity(records.slice(0, 5));
    renderOverviewAttendance(records);
    renderAttendanceChart(records);
  }, err => console.error('Attendance listener', err));
  unsubs.push(attUnsub);

  // Stock transactions listener
  const txnQ = query(
    collection(db, 'stockTransactions'),
    where('schoolId', '==', schoolDoc.id),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  const txnUnsub = onSnapshot(txnQ, (snap) => {
    const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTransactionHistory(txns);
  }, err => console.error('Transaction listener', err));
  unsubs.push(txnUnsub);
}

// ─── Render Inventory ─────────────────────────────────────────────────────────
function renderInventory(inv) {
  ['rice', 'wheat', 'dal'].forEach(item => {
    const cur  = inv[item]?.current ?? 0;
    const max  = inv[item]?.max ?? 0;
    const pct  = stockPct(cur, max);
    const stat = stockStatus(pct);
    const lbl  = stockStatusLabel(pct);

    // Inventory section cards
    setText(`inv-${item}-current`, `${cur} kg`);
    setText(`inv-${item}-max`, max);
    setWidth(`inv-${item}-bar`, pct);
    setClass(`inv-${item}-bar`, `progress-bar-fill ${stat}`);
    setText(`inv-${item}-pct`, `${pct}%`);
    setBadge(`inv-${item}-badge`, stat, lbl);

    // KPI cards (overview)
    setText(`kpi-${item}-val`, `${cur} kg`);
    setWidth(`kpi-${item}-bar`, pct);
    setClass(`kpi-${item}-bar`, `progress-bar-fill ${stat}`);
    setText(`kpi-${item}-pct`, `${pct}% of ${max} kg capacity`);
  });
}

function renderOverviewStock(inv) {
  // Already handled in renderInventory
}

function renderOverviewAttendance(records) {
  const today = todayISO();
  const todayRec = records.find(r => r.date === today);
  const enrollment = schoolDoc.enrollment || 0;

  setText('ov-enrollment', enrollment);
  setText('ov-today-att',  todayRec ? todayRec.studentsPresent : 'Not submitted');
  setText('ov-meals-today', todayRec ? todayRec.studentsPresent : '—');
}

// ─── Recent Activity Feed ─────────────────────────────────────────────────────
function renderRecentActivity(records) {
  const el = document.getElementById('recent-activity');
  if (!records.length) {
    el.innerHTML = `<div class="empty-state"><i class="ph-bold ph-note"></i><p>No attendance records yet.</p></div>`;
    return;
  }
  el.innerHTML = records.map(r => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${sanitize(r.date)}</strong> — ${sanitize(String(r.studentsPresent))} students present</div>
        <div class="activity-meta">Rice: ${r.riceUsed}kg &bull; Wheat: ${r.wheatUsed}kg &bull; Dal: ${r.dalUsed}kg</div>
      </div>
    </div>
  `).join('');
}

// ─── Attendance History Table ─────────────────────────────────────────────────
function renderAttendanceHistory(records) {
  const tbody = document.getElementById('att-history-tbody');
  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No attendance records yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${sanitize(r.date)}</td>
      <td>${sanitize(String(r.studentsPresent))}</td>
      <td>${parseFloat(r.riceUsed).toFixed(2)}</td>
      <td>${parseFloat(r.wheatUsed).toFixed(2)}</td>
      <td>${parseFloat(r.dalUsed).toFixed(2)}</td>
    </tr>
  `).join('');
}

// ─── Attendance Chart ─────────────────────────────────────────────────────────
function renderAttendanceChart(records) {
  const ctx = document.getElementById('att-chart');
  if (!ctx) return;

  // Build last 7 days map
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const map = {};
  records.forEach(r => { map[r.date] = r.studentsPresent; });
  const data   = days.map(d => map[d] || 0);
  const labels = days.map(d => {
    const [, m, day] = d.split('-');
    return `${day}/${m}`;
  });

  if (attChart) attChart.destroy();
  attChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Students Present',
        data,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#2563EB',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ─── Transaction History Table ────────────────────────────────────────────────
function renderTransactionHistory(txns) {
  const tbody = document.getElementById('txn-tbody');
  if (!txns.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No transactions yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = txns.map(t => {
    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
    const isAdd = t.type === 'addition';
    return `
      <tr>
        <td>${formatDateTime(ts)}</td>
        <td style="text-transform:capitalize">${sanitize(t.item)}</td>
        <td class="${isAdd ? 'txn-add' : 'txn-deduct'}">${isAdd ? '+ Added' : '− Deducted'}</td>
        <td>${parseFloat(t.quantity).toFixed(2)} kg</td>
        <td style="color:var(--text-secondary);font-size:0.82rem">${sanitize(t.reason || '—')}</td>
      </tr>
    `;
  }).join('');
}

// ─── Add Stock Form ───────────────────────────────────────────────────────────
function setupAddStockForm() {
  const form = document.getElementById('add-stock-form');
  const btn  = document.getElementById('add-stock-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemErr = document.getElementById('stock-item-error');
    const qtyErr  = document.getElementById('stock-qty-error');
    itemErr.classList.remove('show');
    itemErr.textContent = '';
    qtyErr.classList.remove('show');
    qtyErr.textContent = '';

    const item = document.getElementById('stock-item').value;
    const qty  = parseFloat(document.getElementById('stock-qty').value);

    let valid = true;
    if (!item) { showFieldError(itemErr, 'Please select an item.'); valid = false; }
    if (!qty || qty <= 0 || isNaN(qty)) { showFieldError(qtyErr, 'Enter a valid quantity.'); valid = false; }
    if (!valid) return;

    if (!inventory) { showToast('Inventory not loaded yet.', 'warning'); return; }

    const cur  = inventory[item]?.current ?? 0;
    const max  = inventory[item]?.max ?? 0;
    if (cur + qty > max) {
      showFieldError(qtyErr, `Adding ${qty} kg would exceed max capacity of ${max} kg. Current: ${cur} kg.`);
      return;
    }

    setButtonLoading(btn, true);
    try {
      const invRef = doc(db, 'schools', schoolDoc.id, 'inventory', 'stock');

      await runTransaction(db, async (txn) => {
        const invSnap = await txn.get(invRef);
        if (!invSnap.exists()) throw new Error('Inventory not found');
        const invData = invSnap.data();
        const newQty  = (invData[item]?.current ?? 0) + qty;
        if (newQty > (invData[item]?.max ?? 0)) throw new Error('Exceeds max capacity');

        txn.update(invRef, {
          [`${item}.current`]: newQty,
          lastUpdated: serverTimestamp()
        });
      });

      // Log transaction
      await addDoc(collection(db, 'stockTransactions'), {
        schoolId: schoolDoc.id,
        type: 'addition',
        item, quantity: qty,
        reason: 'stock-delivery',
        timestamp: serverTimestamp(),
        performedBy: currentUser.uid
      });

      // Auto-resolve alerts for this item
      await resolveStockAlerts(item);

      showToast(`Added ${qty} kg of ${item} successfully!`, 'success');
      form.reset();
    } catch (err) {
      showToast(err.message || 'Failed to add stock.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

// ─── Attendance Form ──────────────────────────────────────────────────────────
function setupAttendanceForm() {
  const form    = document.getElementById('attendance-form');
  const dateEl  = document.getElementById('att-date');
  const studEl  = document.getElementById('att-students');
  const preview = document.getElementById('att-preview');
  const btn     = document.getElementById('att-submit-btn');

  // Defaults
  dateEl.value = todayISO();
  dateEl.max   = todayISO();
  document.getElementById('att-enrollment-hint').textContent =
    `Max enrollment: ${schoolDoc.enrollment || '—'}`;

  // Live preview
  studEl.addEventListener('input', () => {
    const n = parseInt(studEl.value);
    if (n > 0) {
      preview.style.display = 'block';
      document.getElementById('prev-rice').textContent  = `${(n * CONSUMPTION.rice).toFixed(2)} kg`;
      document.getElementById('prev-wheat').textContent = `${(n * CONSUMPTION.wheat).toFixed(2)} kg`;
      document.getElementById('prev-dal').textContent   = `${(n * CONSUMPTION.dal).toFixed(2)} kg`;
    } else {
      preview.style.display = 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dateErr = document.getElementById('att-date-error');
    const studErr = document.getElementById('att-students-error');
    dateErr.classList.remove('show');
    dateErr.textContent = '';
    studErr.classList.remove('show');
    studErr.textContent = '';

    const date   = dateEl.value;
    const studs  = parseInt(studEl.value);
    const maxEnr = schoolDoc.enrollment || 0;

    let valid = true;
    if (!date || date > todayISO()) { showFieldError(dateErr, 'Date cannot be in the future.'); valid = false; }
    if (isNaN(studs) || studs < 0) { showFieldError(studErr, 'Enter a valid number.'); valid = false; }
    else if (studs > maxEnr) { showFieldError(studErr, `Cannot exceed enrollment of ${maxEnr}.`); valid = false; }
    if (!valid) return;

    if (!inventory) { showToast('Inventory not loaded.', 'warning'); return; }

    const riceNeeded  = parseFloat((studs * CONSUMPTION.rice).toFixed(3));
    const wheatNeeded = parseFloat((studs * CONSUMPTION.wheat).toFixed(3));
    const dalNeeded   = parseFloat((studs * CONSUMPTION.dal).toFixed(3));

    setButtonLoading(btn, true);

    try {
      const invRef = doc(db, 'schools', schoolDoc.id, 'inventory', 'stock');

      // Check duplicate
      const dupQ = query(
        collection(db, 'attendance'),
        where('schoolId', '==', schoolDoc.id),
        where('date', '==', date)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        showFieldError(dateErr, `Attendance for ${date} has already been submitted.`);
        setButtonLoading(btn, false);
        return;
      }

      // Firestore transaction
      await runTransaction(db, async (txn) => {
        const invSnap = await txn.get(invRef);
        if (!invSnap.exists()) throw new Error('Inventory not found');
        const invData = invSnap.data();

        const rCur = invData.rice?.current  ?? 0;
        const wCur = invData.wheat?.current ?? 0;
        const dCur = invData.dal?.current   ?? 0;

        if (rCur  < riceNeeded)  throw new Error(`Insufficient rice. Need ${riceNeeded} kg, have ${rCur} kg.`);
        if (wCur  < wheatNeeded) throw new Error(`Insufficient wheat. Need ${wheatNeeded} kg, have ${wCur} kg.`);
        if (dCur  < dalNeeded)   throw new Error(`Insufficient dal. Need ${dalNeeded} kg, have ${dCur} kg.`);

        // Deduct inventory
        txn.update(invRef, {
          'rice.current':  rCur  - riceNeeded,
          'wheat.current': wCur  - wheatNeeded,
          'dal.current':   dCur  - dalNeeded,
          lastUpdated: serverTimestamp()
        });

        // Create attendance record
        const attRef = doc(collection(db, 'attendance'));
        txn.set(attRef, {
          schoolId: schoolDoc.id,
          date,
          studentsPresent: studs,
          riceUsed:  riceNeeded,
          wheatUsed: wheatNeeded,
          dalUsed:   dalNeeded,
          timestamp: serverTimestamp(),
          submittedBy: currentUser.uid
        });

        // Log deduction transactions
        const rTxnRef = doc(collection(db, 'stockTransactions'));
        txn.set(rTxnRef, { schoolId: schoolDoc.id, type: 'deduction', item: 'rice',  quantity: riceNeeded,  reason: 'attendance-deduction', timestamp: serverTimestamp(), performedBy: currentUser.uid });

        const wTxnRef = doc(collection(db, 'stockTransactions'));
        txn.set(wTxnRef, { schoolId: schoolDoc.id, type: 'deduction', item: 'wheat', quantity: wheatNeeded, reason: 'attendance-deduction', timestamp: serverTimestamp(), performedBy: currentUser.uid });

        const dTxnRef = doc(collection(db, 'stockTransactions'));
        txn.set(dTxnRef, { schoolId: schoolDoc.id, type: 'deduction', item: 'dal',   quantity: dalNeeded,   reason: 'attendance-deduction', timestamp: serverTimestamp(), performedBy: currentUser.uid });
      });

      // Post-transaction: check and create alerts
      const freshInv = await getDoc(invRef);
      if (freshInv.exists()) {
        await checkAndCreateAlerts(freshInv.data());
      }

      showToast(`Attendance submitted! Deducted — Rice: ${riceNeeded}kg, Wheat: ${wheatNeeded}kg, Dal: ${dalNeeded}kg`, 'success', 5000);
      form.reset();
      dateEl.value = todayISO();
      preview.style.display = 'none';
    } catch (err) {
      showToast(err.message || 'Failed to submit attendance.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

// ─── Alert Generation ─────────────────────────────────────────────────────────
async function checkAndCreateAlerts(invData) {
  const items = ['rice', 'wheat', 'dal'];
  for (const item of items) {
    const pct = stockPct(invData[item]?.current ?? 0, invData[item]?.max ?? 0);

    if (pct <= 10) {
      await resolveAlertsBySeverity(item, 'warning');
      await ensureAlert(item, 'critical', `Critical: ${item} stock below 10%`,
        `${item} stock is at ${pct}% (${invData[item].current}kg remaining). Immediate restocking required.`);
    } else if (pct <= 20) {
      await ensureAlert(item, 'warning', `Warning: ${item} stock below 20%`,
        `${item} stock is at ${pct}% (${invData[item].current}kg remaining). Please restock soon.`);
    }
  }
}

async function ensureAlert(item, severity, title, message) {
  // Don't duplicate active alerts for same item+severity
  const q = query(
    collection(db, 'alerts'),
    where('schoolId', '==', schoolDoc.id),
    where('item', '==', item),
    where('severity', '==', severity),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  if (!snap.empty) return; // already exists

  await addDoc(collection(db, 'alerts'), {
    schoolId:   schoolDoc.id,
    schoolName: schoolDoc.name,
    type: 'stock',
    severity, item, title, message,
    status: 'active',
    timestamp: serverTimestamp(),
    resolvedAt: null
  });
}

async function resolveStockAlerts(item) {
  const q = query(
    collection(db, 'alerts'),
    where('schoolId', '==', schoolDoc.id),
    where('item', '==', item),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  const promises = snap.docs.map(d =>
    updateDoc(doc(db, 'alerts', d.id), { status: 'resolved', resolvedAt: serverTimestamp() })
  );
  await Promise.all(promises);
}

async function resolveAlertsBySeverity(item, severity) {
  const q = query(
    collection(db, 'alerts'),
    where('schoolId', '==', schoolDoc.id),
    where('item', '==', item),
    where('severity', '==', severity),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  const promises = snap.docs.map(d =>
    updateDoc(doc(db, 'alerts', d.id), { status: 'resolved', resolvedAt: serverTimestamp() })
  );
  await Promise.all(promises);
}

// ─── Alerts Section ───────────────────────────────────────────────────────────
function setupAlerts() {
  const alertsQ = query(
    collection(db, 'alerts'),
    where('schoolId', '==', schoolDoc.id),
    orderBy('timestamp', 'desc')
  );
  let currentFilter = 'all';

  const unsub = onSnapshot(alertsQ, (snap) => {
    const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAlerts(alerts, currentFilter);
    updateAlertBadge(alerts);
  }, err => console.error('Alerts listener', err));
  unsubs.push(unsub);

  // Filter tabs
  document.querySelectorAll('#alerts-tabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#alerts-tabs .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      // Re-fetch and render (simplified — just filter in memory on next snapshot)
      // Trigger a re-render by reading current alerts from DOM data attribute
      const alertsQ2 = query(
        collection(db, 'alerts'),
        where('schoolId', '==', schoolDoc.id),
        orderBy('timestamp', 'desc')
      );
      getDocs(alertsQ2).then(snap2 => {
        const alerts2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAlerts(alerts2, currentFilter);
      });
    });
  });

  // Overview active alerts
  setupOverviewAlerts();
}

function setupOverviewAlerts() {
  const q = query(
    collection(db, 'alerts'),
    where('schoolId', '==', schoolDoc.id),
    where('status', '==', 'active'),
    orderBy('timestamp', 'desc'),
    limit(5)
  );
  const unsub = onSnapshot(q, (snap) => {
    const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOverviewAlerts(alerts);
  });
  unsubs.push(unsub);
}

function renderOverviewAlerts(alerts) {
  const el = document.getElementById('ov-active-alerts');
  if (!alerts.length) {
    el.innerHTML = `<div class="empty-state" style="padding:1.5rem"><i class="ph-bold ph-check-circle"></i><p>No active alerts</p></div>`;
    return;
  }
  el.innerHTML = alerts.map(a => alertCardHTML(a, false)).join('');
}

function renderAlerts(alerts, filter) {
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);
  const el = document.getElementById('alerts-list');

  if (!filtered.length) {
    el.innerHTML = `<div class="alerts-empty"><i class="ph-bold ph-bell-slash"></i><p>No ${filter === 'all' ? '' : filter} alerts.</p></div>`;
    return;
  }
  el.innerHTML = filtered.map(a => alertCardHTML(a, true)).join('');

  // Attach resolve buttons
  el.querySelectorAll('.btn-resolve').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await updateDoc(doc(db, 'alerts', id), {
          status: 'resolved',
          resolvedAt: serverTimestamp()
        });
        showToast('Alert resolved.', 'success');
      } catch (e) {
        showToast('Failed to resolve alert.', 'error');
      }
    });
  });
}

function alertCardHTML(a, showResolve) {
  const ts = a.timestamp?.toDate ? a.timestamp.toDate() : null;
  return `
    <div class="alert-card ${a.severity}">
      <div class="alert-icon ${a.severity}">
        <i class="ph-bold ph-${a.severity === 'critical' ? 'x-circle' : 'warning'}"></i>
      </div>
      <div class="alert-body">
        <div class="alert-title">${sanitize(a.title || 'Alert')}</div>
        <div class="alert-message">${sanitize(a.message || '')}</div>
        <div class="alert-meta">
          Item: <strong>${sanitize(a.item || '—')}</strong>
          &bull; ${ts ? timeAgo(ts) : ''}
          &bull; <span class="badge badge-${a.status === 'active' ? 'low' : 'resolved'}">${a.status}</span>
        </div>
      </div>
      ${showResolve && a.status === 'active' ? `<button class="btn btn-success btn-sm btn-resolve" data-id="${a.id}">Resolve</button>` : ''}
    </div>
  `;
}

function updateAlertBadge(alerts) {
  const active = alerts.filter(a => a.status === 'active').length;
  const badge  = document.getElementById('nav-alert-count');
  if (active > 0) {
    badge.style.display = 'inline';
    badge.textContent   = active;
  } else {
    badge.style.display = 'none';
  }
}

// ─── Profile Render ───────────────────────────────────────────────────────────
function renderProfile() {
  setText('prof-name',        userDoc.name  || currentUser.email);
  setText('prof-email',       currentUser.email);
  setText('prof-school-name', schoolDoc.name       || '—');
  setText('prof-district',    schoolDoc.district   || '—');
  setText('prof-enrollment',  schoolDoc.enrollment || '—');
  setText('prof-contact',     schoolDoc.contactPerson || '—');

  const statusBadge = document.getElementById('prof-status');
  statusBadge.className = `badge badge-${schoolDoc.status === 'active' ? 'active' : 'inactive'}`;
  statusBadge.textContent = schoolDoc.status === 'active' ? 'Active' : 'Inactive';
}

// ─── DOM Helpers ──────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${pct}%`;
}

function setClass(id, cls) {
  const el = document.getElementById(id);
  if (el) el.className = cls;
}

function setBadge(id, status, label) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `badge badge-${status}`;
  el.textContent = label;
}

function hidePageLoading() {
  const el = document.getElementById('page-loading');
  if (el) el.style.display = 'none';
}

function showFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
