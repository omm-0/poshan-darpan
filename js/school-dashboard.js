/* ============================================================
   POSHAN DARPAN — SCHOOL ADMIN DASHBOARD
   Five sections: Overview, Inventory, Attendance, Alerts, Profile.
   Pure frontend; reads/writes via window.PD_Data.
   ============================================================ */

(function () {
  'use strict';

  const D = window.PD_Data;
  const U = window.PD_Utils;

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    user: null,
    school: null,
    alertFilter: 'all',
    attendanceChart: null
  };

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    state.user = window.PD_Auth.guardRoute('school');
    if (!state.user) return;
    state.school = D.getSchoolById(state.user.schoolId);
    if (!state.school) {
      U.showToast('School record not found. Please contact admin.', 'error');
      return;
    }

    setupSidebar();
    setupNav();
    setupLogout();
    setupAttendanceForm();
    setupAddStockForm();
    setupAlertTabs();
    fillSidebarInfo();
    renderAll();

    U.hidePageLoading();
  }

  // ============================================================
  // SIDEBAR / NAV
  // ============================================================
  function fillSidebarInfo() {
    const nameEl = document.getElementById('sidebar-username');
    if (nameEl) nameEl.textContent = state.user.name;
  }

  function setupSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
    if (toggle) toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    if (overlay) overlay.addEventListener('click', close);
  }

  function setupNav() {
    const items = document.querySelectorAll('#nav-links .nav-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        switchSection(section);
        // Close sidebar on mobile
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
          if (overlay) overlay.classList.remove('show');
        }
      });
    });
  }

  function switchSection(section) {
    document.querySelectorAll('#nav-links .nav-item').forEach(n => {
      n.classList.toggle('active', n.getAttribute('data-section') === section);
    });
    document.querySelectorAll('.page-section').forEach(s => {
      s.classList.toggle('active', s.id === 'section-' + section);
    });
    if (section === 'attendance') renderAttendanceChart();
  }

  function setupLogout() {
    const btn = document.getElementById('logout-btn');
    if (btn) btn.addEventListener('click', window.PD_Auth.handleLogout);
  }

  // ============================================================
  // RENDER ALL
  // ============================================================
  function renderAll() {
    renderOverview();
    renderInventory();
    renderTransactions();
    renderAttendanceHistory();
    renderAlerts();
    renderProfile();
    updateAlertBadge();
  }

  function updateAlertBadge() {
    const badge = document.getElementById('nav-alert-count');
    if (!badge) return;
    const count = D.getActiveAlertsBySchool(state.school.schoolId).length;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // ============================================================
  // OVERVIEW SECTION
  // ============================================================
  function renderOverview() {
    const inv = D.getInventoryBySchoolId(state.school.schoolId);
    if (!inv) return;

    renderKpiBar('rice',  inv.rice);
    renderKpiBar('wheat', inv.wheat);
    renderKpiBar('dal',   inv.dal);

    // Quick stats
    const enrollEl = document.getElementById('ov-enrollment');
    const todayAttEl = document.getElementById('ov-today-att');
    const mealsTodayEl = document.getElementById('ov-meals-today');

    const today = U.getTodayDateString();
    const todayAtt = D.getAttendanceBySchool(state.school.schoolId).find(a => a.date === today);
    const todayCount = todayAtt ? todayAtt.studentsPresent : 0;

    if (enrollEl)    U.animateNumber(enrollEl, state.school.enrollment, 700);
    if (todayAttEl)  U.animateNumber(todayAttEl, todayCount, 700);
    if (mealsTodayEl) U.animateNumber(mealsTodayEl, todayCount, 700);

    // Recent activity (last 5 attendance)
    const recent = D.getAttendanceBySchool(state.school.schoolId).slice(0, 5);
    const recentEl = document.getElementById('recent-activity');
    if (recentEl) {
      if (recent.length === 0) {
        recentEl.innerHTML = '<div class="empty-state"><i class="ph-bold ph-clipboard-text"></i><p>No attendance recorded yet.</p></div>';
      } else {
        recentEl.innerHTML = recent.map(r =>
          '<div class="activity-item">' +
            '<div class="activity-dot"></div>' +
            '<div style="flex:1">' +
              '<div class="activity-text">' + U.escapeHtml(r.studentsPresent) + ' students attended on ' + U.escapeHtml(U.formatDate(r.date)) + '</div>' +
              '<div class="activity-meta">' + U.escapeHtml(U.formatDateTime(r.timestamp)) + ' • ' + r.riceUsed.toFixed(1) + ' kg rice, ' + r.dalUsed.toFixed(1) + ' kg dal</div>' +
            '</div>' +
          '</div>'
        ).join('');
      }
    }

    // Active alerts preview
    const activeAlerts = D.getActiveAlertsBySchool(state.school.schoolId);
    const alertsEl = document.getElementById('ov-active-alerts');
    if (alertsEl) {
      if (activeAlerts.length === 0) {
        alertsEl.innerHTML =
          '<div style="display:flex;gap:0.6rem;align-items:center;padding:0.75rem;background:var(--success-light);border-radius:var(--radius-sm)">' +
            '<i class="ph-bold ph-check-circle" style="color:var(--secondary);font-size:1.25rem"></i>' +
            '<span style="font-size:0.875rem;color:var(--secondary);font-weight:600">All clear! No active alerts.</span>' +
          '</div>';
      } else {
        alertsEl.innerHTML = activeAlerts.slice(0, 4).map(a => alertCardHtml(a, false)).join('');
      }
    }
  }

  function renderKpiBar(item, data) {
    const valEl = document.getElementById('kpi-' + item + '-val');
    const barEl = document.getElementById('kpi-' + item + '-bar');
    const pctEl = document.getElementById('kpi-' + item + '-pct');
    if (!data || !valEl) return;
    const pct = U.getStockPercentage(data.current, data.max);
    const cls = U.getStockHealthClass(data.current, data.max);
    valEl.textContent = data.current + ' / ' + data.max + ' kg';
    if (barEl) {
      barEl.style.width = pct + '%';
      barEl.className = 'progress-bar-fill ' + cls;
    }
    if (pctEl) pctEl.textContent = pct + '% — ' + U.getStockHealthLabel(data.current, data.max);
  }

  // ============================================================
  // INVENTORY SECTION
  // ============================================================
  function renderInventory() {
    const inv = D.getInventoryBySchoolId(state.school.schoolId);
    if (!inv) return;
    ['rice', 'wheat', 'dal'].forEach(item => {
      const data = inv[item];
      const cur = document.getElementById('inv-' + item + '-current');
      const max = document.getElementById('inv-' + item + '-max');
      const bar = document.getElementById('inv-' + item + '-bar');
      const pctEl = document.getElementById('inv-' + item + '-pct');
      const badge = document.getElementById('inv-' + item + '-badge');
      const pct = U.getStockPercentage(data.current, data.max);
      const cls = U.getStockHealthClass(data.current, data.max);
      const label = U.getStockHealthLabel(data.current, data.max);
      if (cur) cur.textContent = data.current + ' kg';
      if (max) max.textContent = data.max;
      if (bar) {
        bar.style.width = pct + '%';
        bar.className = 'progress-bar-fill ' + cls;
      }
      if (pctEl) pctEl.textContent = pct + '%';
      if (badge) {
        badge.textContent = label;
        badge.className = 'badge ' + U.getStockBadgeClass(data.current, data.max);
      }
    });
  }

  function renderTransactions() {
    const txns = D.getTransactionsBySchool(state.school.schoolId).slice(0, 30);
    const tbody = document.getElementById('txn-tbody');
    if (!tbody) return;
    if (txns.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No transactions yet.</td></tr>';
      return;
    }
    tbody.innerHTML = txns.map(t => {
      const isAdd = t.type === 'addition';
      const badgeClass = isAdd ? 'badge-active' : 'badge-warning';
      const typeLabel = isAdd ? 'Added' : 'Deducted';
      return '<tr>' +
        '<td>' + U.escapeHtml(U.formatDateTime(t.timestamp)) + '</td>' +
        '<td>' + U.escapeHtml(t.item) + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + typeLabel + '</span></td>' +
        '<td>' + (isAdd ? '+' : '−') + t.quantity + ' kg</td>' +
        '<td style="color:var(--text-secondary);font-size:0.85rem">' + U.escapeHtml(t.reason) + '</td>' +
      '</tr>';
    }).join('');
  }

  function setupAddStockForm() {
    const form = document.getElementById('add-stock-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      document.getElementById('stock-item-error').classList.remove('show');
      document.getElementById('stock-qty-error').classList.remove('show');

      const item = document.getElementById('stock-item').value;
      const qty = Number(document.getElementById('stock-qty').value);
      let valid = true;
      if (!item) {
        const e1 = document.getElementById('stock-item-error');
        e1.textContent = 'Please select an item.';
        e1.classList.add('show');
        valid = false;
      }
      if (!isFinite(qty) || qty <= 0) {
        const e2 = document.getElementById('stock-qty-error');
        e2.textContent = 'Enter a valid positive quantity.';
        e2.classList.add('show');
        valid = false;
      }
      if (!valid) return;

      const result = D.addStock(state.school.schoolId, item, qty);
      if (!result.success) {
        U.showToast(result.error, 'error');
        return;
      }
      U.showToast('Added ' + qty + ' kg of ' + item + ' successfully!', 'success');
      form.reset();
      renderInventory();
      renderTransactions();
      renderOverview();
      renderAlerts();
      updateAlertBadge();
    });
  }

  // ============================================================
  // ATTENDANCE SECTION
  // ============================================================
  function setupAttendanceForm() {
    const form = document.getElementById('attendance-form');
    if (!form) return;
    const dateInput = document.getElementById('att-date');
    const studentsInput = document.getElementById('att-students');
    const enrollHint = document.getElementById('att-enrollment-hint');
    const previewBox = document.getElementById('att-preview');
    const prevRice = document.getElementById('prev-rice');
    const prevWheat = document.getElementById('prev-wheat');
    const prevDal = document.getElementById('prev-dal');
    const submitBtn = document.getElementById('att-submit-btn');

    // Default today; max today
    const today = U.getTodayDateString();
    dateInput.value = today;
    dateInput.max = today;
    if (enrollHint) enrollHint.textContent = 'Max enrollment: ' + state.school.enrollment;
    studentsInput.max = state.school.enrollment;

    function updatePreview() {
      const count = Number(studentsInput.value);
      if (!isFinite(count) || count <= 0) {
        previewBox.style.display = 'none';
        return;
      }
      const rice  = (count * D.PORTION.rice).toFixed(2);
      const wheat = (count * D.PORTION.wheat).toFixed(2);
      const dal   = (count * D.PORTION.dal).toFixed(2);
      prevRice.textContent  = rice + ' kg';
      prevWheat.textContent = wheat + ' kg';
      prevDal.textContent   = dal + ' kg';

      // Check stock sufficiency, color cells
      const inv = D.getInventoryBySchoolId(state.school.schoolId);
      function paint(el, need, have) {
        el.style.color = need > have ? 'var(--danger)' : 'var(--text-primary)';
      }
      paint(prevRice,  Number(rice),  inv.rice.current);
      paint(prevWheat, Number(wheat), inv.wheat.current);
      paint(prevDal,   Number(dal),   inv.dal.current);

      previewBox.style.display = 'block';
    }

    studentsInput.addEventListener('input', updatePreview);
    dateInput.addEventListener('change', updatePreview);

    form.addEventListener('submit', e => {
      e.preventDefault();
      document.getElementById('att-date-error').classList.remove('show');
      document.getElementById('att-students-error').classList.remove('show');

      const date = dateInput.value;
      const count = Number(studentsInput.value);

      let valid = true;
      if (!date) {
        const ed = document.getElementById('att-date-error');
        ed.textContent = 'Date is required.';
        ed.classList.add('show');
        valid = false;
      } else if (U.isDateInFuture(date)) {
        const ed = document.getElementById('att-date-error');
        ed.textContent = 'Cannot submit for a future date.';
        ed.classList.add('show');
        valid = false;
      }
      if (!isFinite(count) || count <= 0 || !Number.isInteger(count)) {
        const es = document.getElementById('att-students-error');
        es.textContent = 'Enter a positive whole number.';
        es.classList.add('show');
        valid = false;
      } else if (count > state.school.enrollment) {
        const es = document.getElementById('att-students-error');
        es.textContent = 'Cannot exceed enrollment of ' + state.school.enrollment + '.';
        es.classList.add('show');
        valid = false;
      }
      if (!valid) return;

      U.showConfirmDialog(
        'Submit attendance?',
        'Submit ' + count + ' students for ' + U.formatDate(date) + '? This will deduct food from inventory.',
        function () {
          submitBtn.disabled = true;
          const result = D.submitAttendance(state.school.schoolId, date, count);
          submitBtn.disabled = false;
          if (!result.success) {
            U.showToast(result.error, 'error');
            return;
          }
          U.showToast('Attendance submitted! Deducted ' +
            result.summary.riceDeducted + ' kg rice, ' +
            result.summary.wheatDeducted + ' kg wheat, ' +
            result.summary.dalDeducted + ' kg dal.', 'success');
          form.reset();
          dateInput.value = U.getTodayDateString();
          previewBox.style.display = 'none';
          renderAll();
          renderAttendanceChart();
        }
      );
    });
  }

  function renderAttendanceHistory() {
    const records = D.getAttendanceBySchool(state.school.schoolId).slice(0, 30);
    const tbody = document.getElementById('att-history-tbody');
    if (!tbody) return;
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No attendance records yet.</td></tr>';
      return;
    }
    tbody.innerHTML = records.map(r =>
      '<tr>' +
        '<td>' + U.escapeHtml(U.formatDate(r.date)) + '</td>' +
        '<td><strong>' + r.studentsPresent + '</strong></td>' +
        '<td>' + r.riceUsed.toFixed(2) + '</td>' +
        '<td>' + r.wheatUsed.toFixed(2) + '</td>' +
        '<td>' + r.dalUsed.toFixed(2) + '</td>' +
      '</tr>'
    ).join('');
  }

  function renderAttendanceChart() {
    const canvas = document.getElementById('att-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.attendanceChart);

    const last7 = U.getLast7DaysDates();
    const all = D.getAttendanceBySchool(state.school.schoolId);
    const data = last7.map(d => {
      const rec = all.find(a => a.date === d);
      return rec ? rec.studentsPresent : 0;
    });
    const labels = last7.map(d => {
      const parts = d.split('-');
      return parts[2] + '/' + parts[1];
    });
    const colors = U.getChartColors();

    state.attendanceChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Students Present',
          data: data,
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: colors.primary,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
          x: { grid: { display: false }, ticks: { color: colors.text } }
        }
      }
    });
  }

  // ============================================================
  // ALERTS SECTION
  // ============================================================
  function setupAlertTabs() {
    const tabs = document.querySelectorAll('#alerts-tabs .filter-tab');
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        state.alertFilter = t.getAttribute('data-filter');
        renderAlerts();
      });
    });
  }

  function renderAlerts() {
    const list = document.getElementById('alerts-list');
    if (!list) return;
    let alerts = D.getAlertsBySchool(state.school.schoolId);
    if (state.alertFilter === 'active')   alerts = alerts.filter(a => a.status === 'active');
    if (state.alertFilter === 'resolved') alerts = alerts.filter(a => a.status === 'resolved');

    if (alerts.length === 0) {
      list.innerHTML = '<div class="empty-state"><i class="ph-bold ph-bell-slash"></i><p>No alerts found in this view.</p></div>';
      return;
    }
    list.innerHTML = alerts.map(a => alertCardHtml(a, true)).join('');

    // wire up resolve buttons
    list.querySelectorAll('[data-resolve]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-resolve');
        U.showConfirmDialog('Mark as resolved?', 'This alert will be moved to the Resolved tab.', function () {
          const result = D.resolveAlert(id);
          if (result.success) {
            U.showToast('Alert resolved.', 'success');
            renderAlerts();
            renderOverview();
            updateAlertBadge();
          } else {
            U.showToast(result.error, 'error');
          }
        });
      });
    });
  }

  function alertCardHtml(a, showResolveBtn) {
    const sev = a.severity || 'warning';
    const isResolved = a.status === 'resolved';
    const iconCls = sev === 'critical' ? 'ph-warning-octagon' : 'ph-warning';
    const badgeClass = sev === 'critical' ? 'badge-critical' : 'badge-warning';
    const sevLabel = sev === 'critical' ? 'CRITICAL' : 'WARNING';
    const cardCls = 'alert-card ' + (isResolved ? 'resolved' : sev);
    const opacity = isResolved ? 'opacity:0.65;' : '';

    let actions = '';
    if (showResolveBtn && !isResolved) {
      actions = '<button class="btn btn-sm btn-success" data-resolve="' + U.escapeHtml(a.id) + '"><i class="ph-bold ph-check"></i> Resolve</button>';
    } else if (isResolved) {
      actions = '<span class="badge badge-resolved">Resolved ' + U.escapeHtml(U.formatDate((a.resolvedAt || '').split('T')[0])) + '</span>';
    }

    return '<div class="' + cardCls + '" style="' + opacity + '">' +
      '<div class="alert-icon ' + sev + '"><i class="ph-bold ' + iconCls + '"></i></div>' +
      '<div class="alert-body">' +
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:0.25rem">' +
          '<span class="badge ' + badgeClass + '">' + sevLabel + '</span>' +
          '<span class="badge badge-inactive">' + U.escapeHtml(a.item) + '</span>' +
        '</div>' +
        '<div class="alert-title">' + U.escapeHtml(a.title) + '</div>' +
        '<div class="alert-message">' + U.escapeHtml(a.message) + '</div>' +
        '<div class="alert-meta">' + U.escapeHtml(U.getTimeAgo(a.timestamp)) + '</div>' +
      '</div>' +
      (actions ? '<div style="flex-shrink:0;align-self:center">' + actions + '</div>' : '') +
    '</div>';
  }

  // ============================================================
  // PROFILE SECTION
  // ============================================================
  function renderProfile() {
    const map = {
      'prof-name': state.user.name,
      'prof-email': state.user.email,
      'prof-school-name': state.school.name,
      'prof-district': state.school.district,
      'prof-enrollment': state.school.enrollment + ' students',
      'prof-contact': state.school.contactPerson
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
    const status = document.getElementById('prof-status');
    if (status) {
      status.textContent = state.school.status === 'active' ? 'Active' : 'Inactive';
      status.className = 'badge ' + (state.school.status === 'active' ? 'badge-active' : 'badge-inactive');
    }
  }

  // ============================================================
  // BOOT
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
