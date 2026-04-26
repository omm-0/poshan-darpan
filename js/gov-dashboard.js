/* ============================================================
   POSHAN DARPAN — GOVERNMENT ANALYTICS DASHBOARD
   Five sections: Overview, Schools, Analytics, Alerts, Profile.
   Pure frontend; reads via window.PD_Data.
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
    charts: {},
    schoolFilters: { search: '', district: '', status: '', sort: 'name' },
    alertFilters: { severity: '', status: 'active', district: '' },
    analyticsRange: 7
  };

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    state.user = window.PD_Auth.guardRoute('government');
    if (!state.user) return;

    setupSidebar();
    setupNav();
    setupLogout();
    setupSchoolFilters();
    setupAlertFilters();
    setupAnalyticsRange();
    setupModal();
    fillSidebarInfo();

    populateDistrictFilters();
    renderOverview();
    renderSchoolsTable();
    renderAnalytics();
    renderAlerts();
    renderProfile();
    updateAlertBadge();

    U.hidePageLoading();
  }

  function fillSidebarInfo() {
    const el = document.getElementById('sidebar-username');
    if (el) el.textContent = state.user.name;
  }

  // ============================================================
  // SIDEBAR / NAV
  // ============================================================
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
    if (section === 'overview')  setTimeout(renderOverviewCharts, 50);
    if (section === 'analytics') setTimeout(renderAnalyticsCharts, 50);
  }

  function setupLogout() {
    const btn = document.getElementById('logout-btn');
    if (btn) btn.addEventListener('click', window.PD_Auth.handleLogout);
  }

  // ============================================================
  // POPULATE FILTERS
  // ============================================================
  function populateDistrictFilters() {
    const districts = Array.from(new Set(D.getAllSchools().map(s => s.district))).sort();
    [
      document.getElementById('district-filter'),
      document.getElementById('gov-alert-district')
    ].forEach(sel => {
      if (!sel) return;
      districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
      });
    });
  }

  // ============================================================
  // OVERVIEW SECTION
  // ============================================================
  function renderOverview() {
    const schoolsCount = D.getTotalActiveSchools();
    const totalEnroll = D.getTotalEnrollment();
    const todayMeals = D.getTodayTotalMealsServed();
    const activeAlerts = D.getTotalActiveAlerts();

    U.animateNumber(document.getElementById('kpi-schools'), schoolsCount, 800);
    U.animateNumber(document.getElementById('kpi-students'), totalEnroll, 1000);
    U.animateNumber(document.getElementById('kpi-meals-today'), todayMeals, 1000);
    U.animateNumber(document.getElementById('kpi-active-alerts'), activeAlerts, 700);

    renderOverviewAlertsFeed();
    renderOverviewCharts();
  }

  function renderOverviewCharts() {
    renderAttendanceTrendChart();
    renderMealPieChart();
    renderInventoryHealthChart();
  }

  function renderAttendanceTrendChart() {
    const canvas = document.getElementById('ov-attendance-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.charts.attTrend);

    const trend = D.getAttendanceTrendLast7Days();
    const labels = trend.map(t => {
      const p = t.date.split('-');
      return p[2] + '/' + p[1];
    });
    const data = trend.map(t => t.totalStudents);
    const colors = U.getChartColors();

    state.charts.attTrend = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Students',
          data: data,
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
          fill: true,
          tension: 0.35,
          pointRadius: 4
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

  function renderMealPieChart() {
    const canvas = document.getElementById('ov-meal-pie-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.charts.mealPie);

    const cons = D.getMealConsumptionLast30Days();
    const colors = U.getChartColors();

    state.charts.mealPie = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Rice', 'Wheat', 'Dal'],
        datasets: [{
          data: [cons.totalRice, cons.totalWheat, cons.totalDal],
          backgroundColor: [colors.primary, colors.warning, colors.secondary],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: colors.text, font: { size: 12 } } },
          tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.parsed + ' kg' } }
        }
      }
    });
  }

  function renderInventoryHealthChart() {
    const canvas = document.getElementById('ov-inventory-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.charts.invHealth);

    const data = D.getSchoolInventoryHealth();
    const colors = U.getChartColors();
    const labels = data.map(d => d.schoolName.replace('Government ', '').replace(' School,', ','));
    const values = data.map(d => d.avgPercentage);
    const bgColors = values.map(v => v < 20 ? colors.danger : (v < 50 ? colors.warning : colors.secondary));

    state.charts.invHealth = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Avg Stock %',
          data: values,
          backgroundColor: bgColors,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ctx.parsed.x + '% avg stock' } }
        },
        scales: {
          x: { beginAtZero: true, max: 100, grid: { color: colors.grid }, ticks: { color: colors.text, callback: v => v + '%' } },
          y: { grid: { display: false }, ticks: { color: colors.text } }
        }
      }
    });
  }

  function renderOverviewAlertsFeed() {
    const feed = document.getElementById('ov-alerts-feed');
    if (!feed) return;
    const alerts = D.getActiveAlerts().slice(0, 10);
    if (alerts.length === 0) {
      feed.innerHTML = '<div class="empty-state"><i class="ph-bold ph-check-circle" style="color:var(--secondary)"></i><p>No active alerts across schools.</p></div>';
      return;
    }
    feed.innerHTML = alerts.map(a => govAlertCardHtml(a, false)).join('');
  }

  // ============================================================
  // SCHOOLS SECTION
  // ============================================================
  function setupSchoolFilters() {
    const search = document.getElementById('school-search');
    const district = document.getElementById('district-filter');
    const status = document.getElementById('status-filter');
    const sort = document.getElementById('sort-filter');
    if (search)   search.addEventListener('input', () => { state.schoolFilters.search = search.value.trim().toLowerCase(); renderSchoolsTable(); });
    if (district) district.addEventListener('change', () => { state.schoolFilters.district = district.value; renderSchoolsTable(); });
    if (status)   status.addEventListener('change', () => { state.schoolFilters.status = status.value; renderSchoolsTable(); });
    if (sort)     sort.addEventListener('change', () => { state.schoolFilters.sort = sort.value; renderSchoolsTable(); });
  }

  function renderSchoolsTable() {
    const tbody = document.getElementById('schools-tbody');
    if (!tbody) return;

    let rows = D.getSchoolComparison();

    // Filters
    const f = state.schoolFilters;
    if (f.search)   rows = rows.filter(r => r.name.toLowerCase().includes(f.search) || r.district.toLowerCase().includes(f.search));
    if (f.district) rows = rows.filter(r => r.district === f.district);
    if (f.status)   rows = rows.filter(r => r.status === f.status);

    // Sort
    if (f.sort === 'name')           rows.sort((a, b) => a.name.localeCompare(b.name));
    else if (f.sort === 'enrollment') rows.sort((a, b) => b.enrollment - a.enrollment);
    else if (f.sort === 'stock')      rows.sort((a, b) => a.avgStockPct - b.avgStockPct);

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No schools match your filters.</td></tr>';
      return;
    }

    function pctCell(v) {
      const cls = v < 20 ? 'text-critical' : (v < 50 ? 'text-low' : 'text-healthy');
      return '<td><span class="' + cls + '" style="font-weight:600">' + v + '%</span></td>';
    }

    tbody.innerHTML = rows.map(r =>
      '<tr>' +
        '<td><strong>' + U.escapeHtml(r.name) + '</strong></td>' +
        '<td>' + U.escapeHtml(r.district) + '</td>' +
        '<td>' + r.enrollment + '</td>' +
        pctCell(r.ricePct) +
        pctCell(r.wheatPct) +
        pctCell(r.dalPct) +
        '<td><span class="badge ' + (r.status === 'active' ? 'badge-active' : 'badge-inactive') + '">' + (r.status === 'active' ? 'Active' : 'Inactive') + '</span></td>' +
        '<td><button class="btn btn-sm btn-secondary" data-school-detail="' + U.escapeHtml(r.schoolId) + '"><i class="ph-bold ph-eye"></i> View</button></td>' +
      '</tr>'
    ).join('');

    tbody.querySelectorAll('[data-school-detail]').forEach(btn => {
      btn.addEventListener('click', () => openSchoolModal(btn.getAttribute('data-school-detail')));
    });
  }

  // ============================================================
  // SCHOOL DETAIL MODAL
  // ============================================================
  function setupModal() {
    const close = document.getElementById('modal-close');
    const backdrop = document.getElementById('school-modal-backdrop');
    if (close)    close.addEventListener('click', closeSchoolModal);
    if (backdrop) backdrop.addEventListener('click', e => { if (e.target === backdrop) closeSchoolModal(); });
  }

  function closeSchoolModal() {
    const backdrop = document.getElementById('school-modal-backdrop');
    if (backdrop) backdrop.classList.remove('show');
  }

  function openSchoolModal(schoolId) {
    const school = D.getSchoolById(schoolId);
    const inv = D.getInventoryBySchoolId(schoolId);
    if (!school) return;
    document.getElementById('modal-school-name').textContent = school.name;

    const body = document.getElementById('modal-body');
    const att = D.getAttendanceBySchool(schoolId).slice(0, 10);
    const alerts = D.getAlertsBySchool(schoolId).slice(0, 10);

    function invRow(item, data) {
      const pct = U.getStockPercentage(data.current, data.max);
      const cls = U.getStockHealthClass(data.current, data.max);
      return '<div style="margin-bottom:0.875rem">' +
        '<div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.3rem">' +
          '<strong>' + item + '</strong>' +
          '<span style="color:var(--text-secondary)">' + data.current + ' / ' + data.max + ' kg (' + pct + '%)</span>' +
        '</div>' +
        '<div class="progress-bar-wrap"><div class="progress-bar-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
      '</div>';
    }

    body.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">' +
        '<div><span style="font-size:0.75rem;color:var(--text-secondary);text-transform:uppercase">District</span><div style="font-weight:600">' + U.escapeHtml(school.district) + '</div></div>' +
        '<div><span style="font-size:0.75rem;color:var(--text-secondary);text-transform:uppercase">Enrollment</span><div style="font-weight:600">' + school.enrollment + ' students</div></div>' +
        '<div><span style="font-size:0.75rem;color:var(--text-secondary);text-transform:uppercase">Contact</span><div style="font-weight:600">' + U.escapeHtml(school.contactPerson) + '</div></div>' +
        '<div><span style="font-size:0.75rem;color:var(--text-secondary);text-transform:uppercase">Status</span><div><span class="badge ' + (school.status === 'active' ? 'badge-active' : 'badge-inactive') + '">' + (school.status === 'active' ? 'Active' : 'Inactive') + '</span></div></div>' +
      '</div>' +

      '<h4 class="section-title">Inventory</h4>' +
      (inv ? (invRow('Rice', inv.rice) + invRow('Wheat', inv.wheat) + invRow('Dal', inv.dal)) : '<p style="color:var(--text-secondary)">No inventory data.</p>') +

      '<h4 class="section-title" style="margin-top:1.25rem">Recent Attendance (Last 10)</h4>' +
      (att.length === 0
        ? '<p style="color:var(--text-secondary);font-size:0.85rem">No attendance recorded.</p>'
        : '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Present</th><th>Rice</th><th>Wheat</th><th>Dal</th></tr></thead><tbody>' +
          att.map(a => '<tr><td>' + U.formatDate(a.date) + '</td><td><strong>' + a.studentsPresent + '</strong></td><td>' + a.riceUsed.toFixed(2) + '</td><td>' + a.wheatUsed.toFixed(2) + '</td><td>' + a.dalUsed.toFixed(2) + '</td></tr>').join('') +
          '</tbody></table></div>'
      ) +

      '<h4 class="section-title" style="margin-top:1.25rem">Alerts (Recent)</h4>' +
      (alerts.length === 0
        ? '<p style="color:var(--text-secondary);font-size:0.85rem">No alerts for this school.</p>'
        : alerts.map(a => govAlertCardHtml(a, false)).join('')
      );

    document.getElementById('school-modal-backdrop').classList.add('show');
  }

  // ============================================================
  // ANALYTICS SECTION
  // ============================================================
  function setupAnalyticsRange() {
    const tabs = document.querySelectorAll('#section-analytics .filter-tab');
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        state.analyticsRange = parseInt(t.getAttribute('data-range'), 10) || 7;
        renderAnalytics();
      });
    });
  }

  function renderAnalytics() {
    const n = state.analyticsRange;

    const avgRate = D.getAvgAttendanceRateLastNDays(n);
    const avgMeals = D.getAvgMealsPerSchoolPerDay(n);
    const topSchool = D.getTopAttendanceSchool(n);
    const topItem = D.getMostConsumedItem(n);

    const elRate = document.getElementById('an-avg-att');
    const elMeals = document.getElementById('an-avg-meals');
    const elTop = document.getElementById('an-top-school');
    const elItem = document.getElementById('an-top-item');

    if (elRate)  elRate.textContent = avgRate + '%';
    if (elMeals) U.animateNumber(elMeals, avgMeals, 700);
    if (elTop) {
      if (topSchool) {
        // Truncate for display
        const short = topSchool.schoolName.replace('Government ', '').split(',')[0];
        elTop.textContent = short;
        elTop.title = topSchool.schoolName + ' (' + topSchool.rate + '% rate)';
        elTop.style.fontSize = '1rem';
      } else elTop.textContent = '—';
    }
    if (elItem) {
      elItem.textContent = topItem ? topItem.name : '—';
      if (topItem) elItem.title = topItem.total + ' kg consumed';
    }

    renderAnalyticsCharts();
  }

  function renderAnalyticsCharts() {
    renderConsumptionTrend();
    renderDistrictPerformance();
    renderSchoolAttendanceComparison();
    renderStockDonut();
  }

  function renderConsumptionTrend() {
    const canvas = document.getElementById('an-consumption-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.charts.consumption);

    const daily = D.getDailyConsumptionLastNDays(state.analyticsRange);
    const labels = daily.map(d => { const p = d.date.split('-'); return p[2] + '/' + p[1]; });
    const colors = U.getChartColors();

    state.charts.consumption = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Rice (kg)',  data: daily.map(d => d.rice),  borderColor: colors.primary,   backgroundColor: 'transparent', tension: 0.3 },
          { label: 'Wheat (kg)', data: daily.map(d => d.wheat), borderColor: colors.warning,   backgroundColor: 'transparent', tension: 0.3 },
          { label: 'Dal (kg)',   data: daily.map(d => d.dal),   borderColor: colors.secondary, backgroundColor: 'transparent', tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: colors.text, font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
          x: { grid: { display: false }, ticks: { color: colors.text } }
        }
      }
    });
  }

  function renderDistrictPerformance() {
    const canvas = document.getElementById('an-district-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.charts.district);

    const data = D.getDistrictWiseAttendance();
    const labels = Object.keys(data);
    const values = labels.map(l => data[l]);
    const colors = U.getChartColors();

    state.charts.district = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Avg Attendance Rate (%)',
          data: values,
          backgroundColor: colors.palette,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.parsed.y + '% attendance' } } },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: colors.grid }, ticks: { color: colors.text, callback: v => v + '%' } },
          x: { grid: { display: false }, ticks: { color: colors.text } }
        }
      }
    });
  }

  function renderSchoolAttendanceComparison() {
    const canvas = document.getElementById('an-school-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.charts.schoolComp);

    const dates = U.getLastNDaysDates(state.analyticsRange);
    const dateSet = new Set(dates);
    const schools = D.getActiveSchools();
    const all = D.getAllAttendance();

    const dataPoints = schools.map(s => {
      const recs = all.filter(a => a.schoolId === s.schoolId && dateSet.has(a.date));
      const totalPresent = recs.reduce((sum, r) => sum + r.studentsPresent, 0);
      const totalCapacity = recs.length * s.enrollment;
      return totalCapacity > 0 ? Math.round((totalPresent / totalCapacity) * 1000) / 10 : 0;
    });
    const labels = schools.map(s => s.name.replace('Government ', '').split(',')[0]);
    const colors = U.getChartColors();

    state.charts.schoolComp = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Attendance Rate %',
          data: dataPoints,
          backgroundColor: colors.primary,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.parsed.y + '%' } } },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: colors.grid }, ticks: { color: colors.text, callback: v => v + '%' } },
          x: { grid: { display: false }, ticks: { color: colors.text } }
        }
      }
    });
  }

  function renderStockDonut() {
    const canvas = document.getElementById('an-stock-donut');
    if (!canvas || typeof Chart === 'undefined') return;
    U.destroyChart(state.charts.stockDonut);

    const invs = D.getAllInventories();
    let totalCurrent = 0, totalMax = 0;
    invs.forEach(i => {
      totalCurrent += (i.rice.current + i.wheat.current + i.dal.current);
      totalMax += (i.rice.max + i.wheat.max + i.dal.max);
    });
    const used = Math.round(totalCurrent * 10) / 10;
    const free = Math.round((totalMax - totalCurrent) * 10) / 10;
    const colors = U.getChartColors();

    state.charts.stockDonut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Currently Stocked', 'Empty Capacity'],
        datasets: [{
          data: [used, free],
          backgroundColor: [colors.secondary, colors.grid],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: colors.text, font: { size: 12 } } },
          tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.parsed + ' kg' } }
        }
      }
    });
  }

  // ============================================================
  // ALERTS SECTION
  // ============================================================
  function setupAlertFilters() {
    const sev = document.getElementById('gov-alert-severity');
    const stat = document.getElementById('gov-alert-status');
    const dist = document.getElementById('gov-alert-district');
    if (sev)  sev.addEventListener('change', () => { state.alertFilters.severity = sev.value; renderAlerts(); });
    if (stat) stat.addEventListener('change', () => { state.alertFilters.status = stat.value; renderAlerts(); });
    if (dist) dist.addEventListener('change', () => { state.alertFilters.district = dist.value; renderAlerts(); });
  }

  function updateAlertBadge() {
    const badge = document.getElementById('nav-alert-count');
    if (!badge) return;
    const count = D.getActiveAlerts().length;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderAlerts() {
    // Stats
    const all = D.getAllAlerts();
    const active = all.filter(a => a.status === 'active');
    const warnings = active.filter(a => a.severity === 'warning').length;
    const criticals = active.filter(a => a.severity === 'critical').length;
    const top = D.getMostAlertedSchool();

    const wEl = document.getElementById('gov-warnings');
    const cEl = document.getElementById('gov-criticals');
    const mEl = document.getElementById('gov-most-alerted');
    if (wEl) U.animateNumber(wEl, warnings, 700);
    if (cEl) U.animateNumber(cEl, criticals, 700);
    if (mEl) {
      if (top) {
        const short = top.schoolName.replace('Government ', '').split(',')[0];
        mEl.textContent = short;
        mEl.title = top.schoolName + ' (' + top.alertCount + ' alerts)';
        mEl.style.fontSize = '1rem';
      } else mEl.textContent = 'None';
    }

    // List
    const list = document.getElementById('gov-alerts-list');
    if (!list) return;

    let alerts = all.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const f = state.alertFilters;
    if (f.severity) alerts = alerts.filter(a => a.severity === f.severity);
    if (f.status)   alerts = alerts.filter(a => a.status === f.status);
    if (f.district) {
      const schoolIds = D.getAllSchools().filter(s => s.district === f.district).map(s => s.schoolId);
      alerts = alerts.filter(a => schoolIds.includes(a.schoolId));
    }

    if (alerts.length === 0) {
      list.innerHTML = '<div class="empty-state"><i class="ph-bold ph-bell-slash"></i><p>No alerts match your filters.</p></div>';
      return;
    }
    list.innerHTML = alerts.map(a => govAlertCardHtml(a, true)).join('');

    list.querySelectorAll('[data-resolve]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-resolve');
        U.showConfirmDialog('Mark as resolved?', 'This alert will be moved to the Resolved view.', function () {
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

  function govAlertCardHtml(a, showResolveBtn) {
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
      actions = '<span class="badge badge-resolved">Resolved</span>';
    }

    return '<div class="' + cardCls + '" style="' + opacity + '">' +
      '<div class="alert-icon ' + sev + '"><i class="ph-bold ' + iconCls + '"></i></div>' +
      '<div class="alert-body">' +
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:0.25rem">' +
          '<span class="badge ' + badgeClass + '">' + sevLabel + '</span>' +
          '<span class="badge badge-inactive">' + U.escapeHtml(a.item) + '</span>' +
          '<strong style="font-size:0.85rem">' + U.escapeHtml(a.schoolName) + '</strong>' +
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
      'prof-district': state.user.district || '—'
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
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
