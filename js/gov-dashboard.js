/* ============================================================
   POSHAN DARPAN - GOVERNMENT DASHBOARD CONTROLLER
============================================================ */

let CURRENT_USER = null;
let ANALYTICS_RANGE = 7;

// Chart instances (kept so we can destroy/replace)
const CHARTS = {};

document.addEventListener("DOMContentLoaded", () => {
  initDataStore();
  CURRENT_USER = guardRoute("government");
  if (!CURRENT_USER) return;

  initSidebarUserInfo();
  setupNav();
  setupMobileMenu();
  setupLogout();
  setupSchoolFilters();
  setupRangeTabs();
  setupAlertFilters();

  document.getElementById("todayLabel").textContent = formatDate(todayStr());
  document.getElementById("districtSub").textContent =
    CURRENT_USER.district === "All" ? "All Districts" : CURRENT_USER.district;

  renderHeaderForSection("overview");
  renderOverview();
  refreshAlertBadge();
});

// ---------- USER INFO / NAV ----------

function initSidebarUserInfo() {
  document.getElementById("userName").textContent = CURRENT_USER.name;
  document.getElementById("userAvatar").textContent = CURRENT_USER.name.charAt(0).toUpperCase();
}

function setupNav() {
  qsa(".nav-item", document.getElementById("sidebarNav")).forEach(btn => {
    btn.addEventListener("click", () => switchSection(btn.dataset.section));
  });
}

function switchSection(section) {
  qsa(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.section === section));
  qsa(".content-section").forEach(s => s.classList.remove("active"));
  const target = document.getElementById("section-" + section);
  if (target) {
    target.classList.add("active", "fade-in");
    setTimeout(() => target.classList.remove("fade-in"), 500);
  }
  renderHeaderForSection(section);

  if (section === "overview")  renderOverview();
  if (section === "schools")   renderSchools();
  if (section === "analytics") renderAnalytics();
  if (section === "alerts")    renderAlertsSection();
  if (section === "profile")   renderProfile();

  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("show");
}

function renderHeaderForSection(section) {
  const titles = {
    overview:  "Overview",
    schools:   "Schools List & Comparison",
    analytics: "Analytics",
    alerts:    "Alerts Monitor",
    profile:   "Profile"
  };
  document.getElementById("pageTitle").textContent = titles[section] || "Dashboard";
}

function setupMobileMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggle  = document.getElementById("menuToggle");
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
}

function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

function refreshAlertBadge() {
  const count = getActiveAlertCount();
  const badge = document.getElementById("alertBadge");
  if (count > 0) {
    badge.textContent = String(count);
    badge.classList.remove("zero");
    badge.classList.add("pulse");
  } else {
    badge.textContent = "0";
    badge.classList.add("zero");
    badge.classList.remove("pulse");
  }
}

function _destroyChart(key) {
  if (CHARTS[key]) {
    try { CHARTS[key].destroy(); } catch (e) {}
    CHARTS[key] = null;
  }
}

// =============================================================
// SECTION 1: OVERVIEW
// =============================================================

function renderOverview() {
  // KPIs
  animateCounter(document.getElementById("govKpiSchools"),  getTotalActiveSchools(), 900);
  animateCounter(document.getElementById("govKpiStudents"), getTotalEnrollment(),    900);
  animateCounter(document.getElementById("govKpiMeals"),    getTodayTotalMeals(),    900);
  animateCounter(document.getElementById("govKpiAlerts"),   getActiveAlertCount(),   900);

  renderAttendanceTrendChart();
  renderMealDistChart();
  renderInvHealthChart();
  renderRecentFeed();

  document.getElementById("viewAllAlertsLink").onclick = () => switchSection("alerts");
}

function renderAttendanceTrendChart() {
  _destroyChart("attendanceTrend");
  const data = getAttendanceTrendLastNDays(7);
  const ctx = document.getElementById("attendanceTrendChart").getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, "rgba(37,99,235,0.35)");
  grad.addColorStop(1, "rgba(37,99,235,0.02)");

  CHARTS.attendanceTrend = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => formatDate(d.date)),
      datasets: [{
        label: "Total Students",
        data: data.map(d => d.totalStudents),
        borderColor: "#2563EB",
        backgroundColor: grad,
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: "#2563EB",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#F1F5F9" } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderMealDistChart() {
  _destroyChart("mealDist");
  const tot = getTotalConsumption(30);
  const total = tot.totalRice + tot.totalWheat + tot.totalDal;
  const ctx = document.getElementById("mealDistChart").getContext("2d");
  CHARTS.mealDist = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Rice", "Wheat", "Dal"],
      datasets: [{
        data: [tot.totalRice, tot.totalWheat, tot.totalDal],
        backgroundColor: ["#2563EB", "#F59E0B", "#059669"],
        borderColor: "#fff",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { position: "bottom", labels: { padding: 14, usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctxObj) => {
              const v = ctxObj.parsed;
              const pct = total === 0 ? 0 : ((v / total) * 100).toFixed(1);
              return ctxObj.label + ": " + v.toFixed(1) + " kg (" + pct + "%)";
            }
          }
        }
      }
    }
  });
}

function renderInvHealthChart() {
  _destroyChart("invHealth");
  const data = getSchoolInventoryHealth();
  const ctx = document.getElementById("invHealthChart").getContext("2d");
  const colors = data.map(d => d.avgPercentage > 50 ? "#059669" : d.avgPercentage >= 20 ? "#F59E0B" : "#DC2626");

  CHARTS.invHealth = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.schoolName),
      datasets: [{
        label: "Avg Stock %",
        data: data.map(d => d.avgPercentage),
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => " " + c.parsed.x.toFixed(1) + "%" } }
      },
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#F1F5F9" } },
        y: { grid: { display: false } }
      }
    }
  });
}

function renderRecentFeed() {
  const feed = document.getElementById("govRecentFeed");
  const alerts = getAllAlerts().slice(0, 8);
  if (alerts.length === 0) {
    feed.innerHTML = '<div class="empty-list"><i class="ph ph-tray"></i>No alerts to display.</div>';
    return;
  }
  feed.innerHTML = alerts.map(a => {
    const sevBadge = a.severity === "critical"
      ? '<span class="badge badge-danger">CRITICAL</span>'
      : '<span class="badge badge-warning">WARNING</span>';
    const statusBadge = a.status === "active"
      ? '<span class="badge badge-info">Active</span>'
      : '<span class="badge badge-grey">Resolved</span>';
    return '' +
      '<div class="feed-item">' +
      '  <div class="feed-item-head">' +
      '    <span class="feed-item-school">' + escapeHtml(a.schoolName) + '</span>' +
      '    ' + sevBadge +
      '    <span class="badge badge-info">' + escapeHtml(a.item) + '</span>' +
      '    ' + statusBadge +
      '    <span class="feed-item-time">' + timeAgo(a.timestamp) + '</span>' +
      '  </div>' +
      '  <div class="feed-item-title">' + escapeHtml(a.title) + '</div>' +
      '</div>';
  }).join("");
}

// =============================================================
// SECTION 2: SCHOOLS LIST
// =============================================================

function setupSchoolFilters() {
  // Populate district options
  const distSel = document.getElementById("districtFilter");
  getDistrictList().forEach(d => {
    distSel.insertAdjacentHTML("beforeend", '<option value="' + escapeHtml(d) + '">' + escapeHtml(d) + '</option>');
  });

  document.getElementById("schoolSearch").addEventListener("input", renderSchools);
  document.getElementById("districtFilter").addEventListener("change", renderSchools);
  document.getElementById("statusFilter").addEventListener("change", renderSchools);
}

function renderSchools() {
  const q = (document.getElementById("schoolSearch").value || "").trim().toLowerCase();
  const d = document.getElementById("districtFilter").value;
  const st = document.getElementById("statusFilter").value;

  let schools = getAllSchools();
  if (q)  schools = schools.filter(s => s.name.toLowerCase().includes(q));
  if (d)  schools = schools.filter(s => s.district === d);
  if (st) schools = schools.filter(s => s.status === st);

  const tbody = document.querySelector("#schoolsTable tbody");

  if (schools.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-light);">No schools match your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = schools.map(sc => {
    const inv = getInventory(sc.schoolId);
    const cells = inv ? [
      stockCell(inv.rice.current,  inv.rice.max),
      stockCell(inv.wheat.current, inv.wheat.max),
      stockCell(inv.dal.current,   inv.dal.max)
    ] : ['<span class="text-light">—</span>', '<span class="text-light">—</span>', '<span class="text-light">—</span>'];

    const statusBadge = sc.status === "active"
      ? '<span class="badge badge-success"><span class="badge-dot" style="background:var(--secondary);"></span>Active</span>'
      : '<span class="badge badge-grey">Inactive</span>';

    return '<tr>' +
      '<td>' + escapeHtml(sc.name) + '</td>' +
      '<td>' + escapeHtml(sc.district) + '</td>' +
      '<td>' + sc.enrollment + '</td>' +
      '<td>' + cells[0] + '</td>' +
      '<td>' + cells[1] + '</td>' +
      '<td>' + cells[2] + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td><button class="btn btn-outline btn-sm" data-view="' + sc.schoolId + '"><i class="ph ph-eye"></i> View</button></td>' +
      '</tr>';
  }).join("");

  qsa('button[data-view]', tbody).forEach(b => {
    b.addEventListener("click", () => openSchoolModal(b.dataset.view));
  });
}

function stockCell(current, max) {
  const pct = stockPercent(current, max);
  const cls = pct > 50 ? "healthy" : (pct >= 20 ? "warn" : "critical");
  return '<span class="stock-cell ' + cls + '">' + pct + '%</span>';
}

// =============================================================
// SCHOOL DETAIL MODAL (Screen 13)
// =============================================================

function openSchoolModal(schoolId) {
  const sc = getSchoolById(schoolId);
  if (!sc) return;
  const inv = getInventory(schoolId);
  const att = getAttendanceBySchool(schoolId).slice(0, 10);
  const alerts = getAlertsBySchool(schoolId);

  const root = document.getElementById("schoolModalRoot");

  const statusBadge = sc.status === "active"
    ? '<span class="badge badge-success"><span class="badge-dot" style="background:var(--secondary);"></span>Active</span>'
    : '<span class="badge badge-grey">Inactive</span>';

  const invHtml = inv ? '<div class="mini-inv-grid">' +
      miniInvCard("Rice",  inv.rice) +
      miniInvCard("Wheat", inv.wheat) +
      miniInvCard("Dal",   inv.dal) +
    '</div>' : '<div class="empty-list">No inventory data.</div>';

  const attHtml = att.length === 0
    ? '<div class="empty-list">No attendance records.</div>'
    : '<div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Date</th><th>Students</th><th>Rice</th><th>Wheat</th><th>Dal</th></tr></thead><tbody>' +
      att.map(r =>
        '<tr><td>' + formatDate(r.date) + '</td>' +
        '<td>' + r.studentsPresent + '</td>' +
        '<td>' + r.riceUsed.toFixed(1) + ' kg</td>' +
        '<td>' + r.wheatUsed.toFixed(1) + ' kg</td>' +
        '<td>' + r.dalUsed.toFixed(2) + ' kg</td></tr>'
      ).join("") +
      '</tbody></table></div>';

  const alertsHtml = alerts.length === 0
    ? '<div class="empty-list"><i class="ph-fill ph-check-circle" style="color:var(--secondary);"></i>No alerts for this school.</div>'
    : alerts.map(a => govAlertCardHtml(a, false)).join("");

  root.innerHTML =
    '<div class="modal-overlay" id="schoolModalOverlay">' +
    '  <div class="modal-card school-modal">' +
    '    <div class="school-modal-head">' +
    '      <button class="school-modal-close" id="closeSchoolModal"><i class="ph ph-x"></i></button>' +
    '      <div class="school-modal-title">' + escapeHtml(sc.name) + '</div>' +
    '      <div class="school-modal-meta">' +
    '        <span><b>District:</b> ' + escapeHtml(sc.district) + '</span>' +
    '        <span><b>Enrollment:</b> ' + sc.enrollment + '</span>' +
    '        <span><b>Status:</b> ' + statusBadge + '</span>' +
    '      </div>' +
    '    </div>' +
    '    <div class="school-modal-tabs" id="schoolModalTabs">' +
    '      <button class="school-modal-tab active" data-tab="inv">Inventory</button>' +
    '      <button class="school-modal-tab" data-tab="att">Attendance</button>' +
    '      <button class="school-modal-tab" data-tab="alr">Alerts</button>' +
    '    </div>' +
    '    <div class="school-modal-body">' +
    '      <div class="school-modal-tab-content active" id="tab-inv">' + invHtml + '</div>' +
    '      <div class="school-modal-tab-content" id="tab-att">' + attHtml + '</div>' +
    '      <div class="school-modal-tab-content" id="tab-alr">' + alertsHtml + '</div>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  function closeModal() {
    const overlay = document.getElementById("schoolModalOverlay");
    if (!overlay) return;
    overlay.classList.add("modal-out");
    setTimeout(() => { root.innerHTML = ""; }, 200);
  }

  document.getElementById("closeSchoolModal").addEventListener("click", closeModal);
  document.getElementById("schoolModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "schoolModalOverlay") closeModal();
  });
  qsa("#schoolModalTabs .school-modal-tab").forEach(t => {
    t.addEventListener("click", () => {
      qsa("#schoolModalTabs .school-modal-tab").forEach(b => b.classList.remove("active"));
      t.classList.add("active");
      qsa(".school-modal-tab-content").forEach(c => c.classList.remove("active"));
      document.getElementById("tab-" + t.dataset.tab).classList.add("active");
    });
  });
}

function miniInvCard(label, slot) {
  const pct = stockPercent(slot.current, slot.max);
  const color = pct > 50 ? "green" : (pct >= 20 ? "amber" : "red");
  const status = stockLabel(slot.current, slot.max);
  const badge = stockBadgeClass(slot.current, slot.max);
  return '' +
    '<div class="mini-inv-card">' +
    '  <div class="name">' + label + '</div>' +
    '  <div class="val">' + slot.current + ' / ' + slot.max + '</div>' +
    '  <div class="max">kg</div>' +
    '  <div class="progress"><div class="progress-bar ' + color + '" style="width:' + pct + '%"></div></div>' +
    '  <div class="flex-between text-sm" style="margin-top:6px;">' +
    '    <span>' + pct + '%</span>' +
    '    <span class="badge ' + badge + '">' + status + '</span>' +
    '  </div>' +
    '</div>';
}

// =============================================================
// SECTION 3: ANALYTICS
// =============================================================

function setupRangeTabs() {
  qsa(".range-tab", document.getElementById("rangeTabs")).forEach(btn => {
    btn.addEventListener("click", () => {
      qsa(".range-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      ANALYTICS_RANGE = parseInt(btn.dataset.range, 10);
      renderAnalytics();
    });
  });
}

function renderAnalytics() {
  const days = ANALYTICS_RANGE;

  // KPIs
  const avgAttEl = document.getElementById("anaAvgAtt");
  avgAttEl.dataset.suffix = "%";
  avgAttEl.textContent = "0%";
  animateCounter(avgAttEl, getAvgAttendanceRate(days), 900);

  animateCounter(document.getElementById("anaAvgMeals"), getAvgMealsPerSchoolPerDay(days), 900);
  document.getElementById("anaTopItem").textContent = getMostConsumedItem(days);

  const top = getHighestAttendanceSchool(days);
  document.getElementById("anaTopSchool").textContent = top.name + " (" + top.rate + "%)";

  renderConsumptionChart(days);
  renderDistrictChart(days);
  renderSchoolCompareChart();
  renderUtilChart();
}

function renderConsumptionChart(days) {
  _destroyChart("consumption");
  const data = getConsumptionLastNDays(days);
  const ctx = document.getElementById("consumptionChart").getContext("2d");
  CHARTS.consumption = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.dates.map(d => formatDate(d)),
      datasets: [
        { label: "Rice (kg)",  data: data.riceTotals,  borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,0.1)", tension: 0.35, fill: false, borderWidth: 2.5 },
        { label: "Wheat (kg)", data: data.wheatTotals, borderColor: "#F59E0B", backgroundColor: "rgba(245,158,11,0.1)", tension: 0.35, fill: false, borderWidth: 2.5 },
        { label: "Dal (kg)",   data: data.dalTotals,   borderColor: "#059669", backgroundColor: "rgba(5,150,105,0.1)",  tension: 0.35, fill: false, borderWidth: 2.5 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { usePointStyle: true } } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#F1F5F9" } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }
      }
    }
  });
}

function renderDistrictChart(days) {
  _destroyChart("district");
  const map = getDistrictWiseAttendance(days);
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const ctx = document.getElementById("districtChart").getContext("2d");

  CHARTS.district = new Chart(ctx, {
    type: "bar",
    data: {
      labels: entries.map(e => e[0]),
      datasets: [{
        label: "Avg Attendance %",
        data: entries.map(e => e[1]),
        backgroundColor: "rgba(37,99,235,0.85)",
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => " " + c.parsed.x.toFixed(1) + "%" } } },
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#F1F5F9" } },
        y: { grid: { display: false } }
      }
    }
  });
}

function renderSchoolCompareChart() {
  _destroyChart("schoolCompare");
  const dates = getLastNDates(5);
  const schools = getActiveSchools();
  const shades = ["rgba(37,99,235,0.4)", "rgba(37,99,235,0.55)", "rgba(37,99,235,0.7)", "rgba(37,99,235,0.85)", "rgba(37,99,235,1)"];

  const datasets = dates.map((d, i) => ({
    label: formatDate(d),
    data: schools.map(sc => {
      const rec = getAllAttendance().find(r => r.schoolId === sc.schoolId && r.date === d);
      return rec ? rec.studentsPresent : 0;
    }),
    backgroundColor: shades[i],
    borderRadius: 4
  }));

  const ctx = document.getElementById("schoolCompareChart").getContext("2d");
  CHARTS.schoolCompare = new Chart(ctx, {
    type: "bar",
    data: { labels: schools.map(s => s.name.split(",")[0]), datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { usePointStyle: true, boxWidth: 10 } } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#F1F5F9" } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderUtilChart() {
  _destroyChart("util");
  const u = getOverallStockUtilization();
  const ctx = document.getElementById("utilChart").getContext("2d");
  const remaining = parseFloat((u.totalCapacity - u.usedCapacity).toFixed(2));

  CHARTS.util = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Currently Stocked (" + u.usedCapacity + " kg)", "Available Capacity (" + remaining + " kg)"],
      datasets: [{
        data: [u.usedCapacity, remaining],
        backgroundColor: ["#2563EB", "#E2E8F0"],
        borderColor: "#fff",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { position: "right", labels: { padding: 14, usePointStyle: true } },
        tooltip: { callbacks: { label: c => " " + c.label + ": " + c.parsed.toFixed(1) + " kg" } },
        title: { display: true, text: "Utilization: " + u.percentage + "%", font: { size: 14, weight: "600" }, color: "#1E293B" }
      }
    }
  });
}

// =============================================================
// SECTION 4: ALERTS
// =============================================================

function setupAlertFilters() {
  // Populate school filter
  const schSel = document.getElementById("alertSchoolFilter");
  getAllSchools().forEach(s => {
    schSel.insertAdjacentHTML("beforeend",
      '<option value="' + s.schoolId + '">' + escapeHtml(s.name) + '</option>');
  });

  ["alertSeverityFilter", "alertStatusFilter", "alertSchoolFilter"].forEach(id => {
    document.getElementById(id).addEventListener("change", renderAlertsSection);
  });
}

function renderAlertsSection() {
  // Top stat cards
  const active = getActiveAlerts();
  const warnings = active.filter(a => a.severity === "warning").length;
  const criticals = active.filter(a => a.severity === "critical").length;
  document.getElementById("alWarn").textContent = warnings;
  document.getElementById("alCrit").textContent = criticals;
  document.getElementById("alTopSchool").textContent = getMostAlertedSchool();

  // Filter list
  const sev    = document.getElementById("alertSeverityFilter").value;
  const status = document.getElementById("alertStatusFilter").value;
  const sch    = document.getElementById("alertSchoolFilter").value;

  let list = getAllAlerts();
  if (sev)    list = list.filter(a => a.severity === sev);
  if (status) list = list.filter(a => a.status === status);
  if (sch)    list = list.filter(a => a.schoolId === sch);

  const wrap = document.getElementById("govAlertsList");
  if (list.length === 0) {
    wrap.innerHTML =
      '<div class="card empty-state">' +
      '<i class="ph ph-funnel"></i>' +
      '<div class="empty-state-title">No alerts match your filters</div>' +
      '<div class="empty-state-msg">Try changing or clearing filters above.</div>' +
      '</div>';
    return;
  }
  wrap.innerHTML = list.map(a => govAlertCardHtml(a, true)).join("");
}

function govAlertCardHtml(a, showSchool) {
  const severityClass = a.status === "resolved"
    ? "alert-resolved"
    : (a.severity === "critical" ? "alert-critical" : "alert-warning");

  const iconClass = a.status === "resolved"
    ? "done"
    : (a.severity === "critical" ? "crit" : "warn");

  const iconName = a.status === "resolved"
    ? "ph-check-circle"
    : (a.severity === "critical" ? "ph-warning-octagon" : "ph-warning");

  const sevBadge = a.severity === "critical"
    ? '<span class="badge badge-danger">CRITICAL</span>'
    : '<span class="badge badge-warning">WARNING</span>';

  const statusBadge = a.status === "active"
    ? '<span class="badge badge-info">Active</span>'
    : '<span class="badge badge-grey">Resolved</span>';

  const schoolLine = showSchool
    ? '<div class="alert-school" style="margin-bottom:6px;">' + escapeHtml(a.schoolName) + '</div>'
    : '';

  const resolvedStamp = a.status === "resolved" && a.resolvedAt
    ? '<div class="alert-resolved-stamp">Resolved on ' + formatDateTime(a.resolvedAt) + '</div>'
    : '';

  return '' +
    '<div class="alert-card ' + severityClass + '">' +
    '  <div class="alert-icon ' + iconClass + '"><i class="ph-fill ' + iconName + '"></i></div>' +
    '  <div class="alert-body">' +
    schoolLine +
    '    <div class="alert-meta">' + sevBadge + '<span class="badge badge-info">' + escapeHtml(a.item) + '</span>' +
    statusBadge + '<span class="alert-time">' + timeAgo(a.timestamp) + '</span></div>' +
    '    <div class="alert-title">' + escapeHtml(a.title) + '</div>' +
    '    <div class="alert-message">' + escapeHtml(a.message) + '</div>' +
    resolvedStamp +
    '  </div>' +
    '  <div class="alert-action"></div>' +
    '</div>';
}

// =============================================================
// SECTION 5: PROFILE
// =============================================================

function renderProfile() {
  const u = CURRENT_USER;
  document.getElementById("profileAccount").innerHTML = '' +
    profileRow("Full Name", u.name) +
    profileRow("Email", u.email) +
    profileRow("Role", "Government Official") +
    profileRow("District", u.district === "All" ? "All Districts" : u.district) +
    profileRow("Member Since", u.createdAt ? formatDate(u.createdAt.split("T")[0]) : "—");
}

function profileRow(label, value) {
  return '<div class="profile-row"><span class="label">' + label + '</span><span class="value">' + value + '</span></div>';
}
