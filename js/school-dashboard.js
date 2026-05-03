/* ============================================================
   POSHAN DARPAN - SCHOOL DASHBOARD CONTROLLER
============================================================ */

let CURRENT_USER = null;
let CURRENT_SCHOOL = null;
let ALERT_FILTER = "all";

document.addEventListener("DOMContentLoaded", () => {
  initDataStore();
  CURRENT_USER = guardRoute("school");
  if (!CURRENT_USER) return;

  CURRENT_SCHOOL = getSchoolById(CURRENT_USER.schoolId);
  if (!CURRENT_SCHOOL) {
    showToast("Your school account could not be loaded. Please log in again.", "error");
    setTimeout(() => { clearSession(); window.location.href = "index.html"; }, 1200);
    return;
  }

  initSidebarUserInfo();
  setupNav();
  setupMobileMenu();
  setupLogout();
  setupAddStockForm();
  setupAttendanceForm();
  setupAlertFilters();

  // Initial render
  renderHeaderForSection("overview");
  renderOverview();
  refreshAlertBadge();
  document.getElementById("todayLabel").textContent = formatDate(todayStr());
});

// ---------- USER INFO ----------

function initSidebarUserInfo() {
  document.getElementById("userName").textContent = CURRENT_USER.name;
  document.getElementById("userAvatar").textContent = CURRENT_USER.name.charAt(0).toUpperCase();
  document.getElementById("schoolNameSub").textContent = CURRENT_SCHOOL.name;
}

// ---------- NAVIGATION ----------

function setupNav() {
  qsa(".nav-item", document.getElementById("sidebarNav")).forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      switchSection(section);
    });
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

  if (section === "overview")    renderOverview();
  if (section === "inventory")   renderInventory();
  if (section === "attendance")  renderAttendance();
  if (section === "alerts")      renderAlerts();
  if (section === "profile")     renderProfile();

  // Close mobile menu after switching
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("show");
}

function renderHeaderForSection(section) {
  const titles = {
    overview:   "Overview",
    inventory:  "Inventory Management",
    attendance: "Attendance & Meals",
    alerts:     "Alerts",
    profile:    "Profile"
  };
  document.getElementById("pageTitle").textContent = titles[section] || "Dashboard";
}

// ---------- MOBILE MENU ----------

function setupMobileMenu() {
  const sidebar  = document.getElementById("sidebar");
  const overlay  = document.getElementById("sidebarOverlay");
  const toggle   = document.getElementById("menuToggle");
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
}

// ---------- LOGOUT ----------

function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

// ---------- ALERT BADGE ----------

function refreshAlertBadge() {
  const count = getActiveAlertCountBySchool(CURRENT_SCHOOL.schoolId);
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

// =============================================================
// SECTION 1: OVERVIEW
// =============================================================

function renderOverview() {
  renderOverviewInvCards();
  renderOverviewStats();
  renderRecentActivity();
  renderOverviewAlerts();
}

function renderOverviewInvCards() {
  const inv = getInventory(CURRENT_SCHOOL.schoolId);
  const wrap = document.getElementById("overviewInvCards");
  if (!inv) { wrap.innerHTML = ""; return; }

  const items = [
    { key: "rice",  label: "Rice",  icon: "ph-grains",          color: "amber"  },
    { key: "wheat", label: "Wheat", icon: "ph-bowl-food",       color: "purple" },
    { key: "dal",   label: "Dal",   icon: "ph-circles-three",   color: "green"  }
  ];

  wrap.innerHTML = items.map(it => {
    const slot = inv[it.key];
    const pct = stockPercent(slot.current, slot.max);
    const color = pct > 50 ? "green" : (pct >= 20 ? "amber" : "red");
    return '' +
      '<div class="inv-kpi">' +
      '  <div class="inv-kpi-top">' +
      '    <div class="kpi-icon-circle ' + it.color + '"><i class="ph ' + it.icon + '"></i></div>' +
      '    <div>' +
      '      <div class="inv-kpi-name">' + it.label + '</div>' +
      '      <div class="inv-kpi-value">' + slot.current + ' / ' + slot.max + ' kg</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="progress"><div class="progress-bar ' + color + '" style="width:' + pct + '%"></div></div>' +
      '  <div class="inv-kpi-bar"><span>' + pct + '% in stock</span><span class="badge ' + stockBadgeClass(slot.current, slot.max) + '">' + stockLabel(slot.current, slot.max) + '</span></div>' +
      '</div>';
  }).join("");
}

function renderOverviewStats() {
  const today = getTodaysAttendance(CURRENT_SCHOOL.schoolId);
  const enrollEl = document.getElementById("kpiEnrollment");
  enrollEl.textContent = "0";
  animateCounter(enrollEl, CURRENT_SCHOOL.enrollment, 900);

  const att = document.getElementById("kpiTodayAtt");
  const meals = document.getElementById("kpiTodayMeals");

  if (today) {
    att.style.fontSize = "";
    meals.style.fontSize = "";
    att.textContent = "0";
    animateCounter(att, today.studentsPresent, 900);
    meals.textContent = "0";
    animateCounter(meals, today.studentsPresent, 900);
  } else {
    att.textContent = "Not submitted";
    att.style.fontSize = "16px";
    meals.textContent = "—";
    meals.style.fontSize = "";
  }
}

function renderRecentActivity() {
  const wrap = document.getElementById("recentActivityList");
  const recs = getAttendanceBySchool(CURRENT_SCHOOL.schoolId).slice(0, 5);
  if (recs.length === 0) {
    wrap.innerHTML =
      '<div class="empty-list"><i class="ph ph-tray"></i>No activity yet.<br>Submit attendance to see recent records.</div>';
    return;
  }
  wrap.innerHTML = recs.map(r =>
    '<div class="list-item">' +
    '  <span class="dot green"></span>' +
    '  <div style="flex:1;min-width:0;">' +
    '    <div class="list-item-title">' + r.studentsPresent + ' students attended</div>' +
    '    <div class="list-item-meta">' + formatDateTime(r.timestamp) + '</div>' +
    '  </div>' +
    '</div>'
  ).join("");
}

function renderOverviewAlerts() {
  const wrap = document.getElementById("overviewAlertsList");
  const active = getAlertsBySchool(CURRENT_SCHOOL.schoolId).filter(a => a.status === "active");
  if (active.length === 0) {
    wrap.innerHTML =
      '<div class="empty-list">' +
      '<i class="ph-fill ph-check-circle" style="color:var(--secondary);"></i>' +
      'All systems healthy.<br>No active alerts.' +
      '</div>';
    return;
  }
  wrap.innerHTML = active.slice(0, 5).map(a => {
    const dotClass = a.severity === "critical" ? "red" : "amber";
    return '' +
    '<div class="list-item">' +
    '  <span class="dot ' + dotClass + '"></span>' +
    '  <div style="flex:1;min-width:0;">' +
    '    <div class="list-item-title">' + escapeHtml(a.title) + '</div>' +
    '    <div class="list-item-meta">' + timeAgo(a.timestamp) + '</div>' +
    '  </div>' +
    '</div>';
  }).join("");
}

// =============================================================
// SECTION 2: INVENTORY
// =============================================================

function renderInventory() {
  renderLargeInvCards();
  renderTransactionTable();
  refreshStockHint();
}

function renderLargeInvCards() {
  const inv = getInventory(CURRENT_SCHOOL.schoolId);
  const wrap = document.getElementById("largeInvCards");
  if (!inv) { wrap.innerHTML = ""; return; }
  const items = [
    { key: "rice",  label: "Rice",  icon: "ph-grains",        color: "amber"  },
    { key: "wheat", label: "Wheat", icon: "ph-bowl-food",     color: "purple" },
    { key: "dal",   label: "Dal",   icon: "ph-circles-three", color: "green"  }
  ];
  wrap.innerHTML = items.map(it => {
    const slot = inv[it.key];
    const pct = stockPercent(slot.current, slot.max);
    const color = pct > 50 ? "green" : (pct >= 20 ? "amber" : "red");
    return '' +
      '<div class="large-inv-card">' +
      '  <div class="large-inv-head">' +
      '    <div class="large-inv-name"><i class="ph ' + it.icon + '" style="color:var(--' + (it.color === 'amber' ? 'warning' : it.color === 'purple' ? 'purple' : 'secondary') + ');"></i>' + it.label + '</div>' +
      '    <span class="badge ' + stockBadgeClass(slot.current, slot.max) + '">' + stockLabel(slot.current, slot.max) + '</span>' +
      '  </div>' +
      '  <div>' +
      '    <div class="large-inv-current">' + slot.current + ' kg</div>' +
      '    <div class="large-inv-max">of ' + slot.max + ' kg capacity</div>' +
      '  </div>' +
      '  <div class="progress"><div class="progress-bar ' + color + '" style="width:' + pct + '%"></div></div>' +
      '  <div class="flex-between text-sm text-secondary">' +
      '    <span>' + pct + '% available</span>' +
      '    <span>Updated ' + timeAgo(inv.lastUpdated) + '</span>' +
      '  </div>' +
      '</div>';
  }).join("");
}

function renderTransactionTable() {
  const tbody = document.querySelector("#txTable tbody");
  const txs = getTransactionsBySchool(CURRENT_SCHOOL.schoolId).slice(0, 20);
  if (txs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-light);">No transactions yet.</td></tr>';
    return;
  }
  tbody.innerHTML = txs.map(t => {
    const typeBadge = t.type === "addition"
      ? '<span class="badge badge-success"><span class="badge-dot" style="background:var(--secondary);"></span>Added</span>'
      : '<span class="badge badge-danger"><span class="badge-dot" style="background:var(--danger);"></span>Deducted</span>';
    return '<tr>' +
      '<td>' + formatDateTime(t.timestamp) + '</td>' +
      '<td>' + escapeHtml(t.item) + '</td>' +
      '<td>' + typeBadge + '</td>' +
      '<td>' + Number(t.quantity).toFixed(1) + '</td>' +
      '<td>' + escapeHtml(t.reason) + '</td>' +
      '</tr>';
  }).join("");
}

function refreshStockHint() {
  const itemSel = document.getElementById("stockItem");
  const hint    = document.getElementById("stockHint");
  const hintTxt = document.getElementById("stockHintText");
  const qtyInput = document.getElementById("stockQty");

  const k = itemSel.value;
  if (!k) { hint.style.display = "none"; qtyInput.removeAttribute("max"); return; }
  const inv = getInventory(CURRENT_SCHOOL.schoolId);
  if (!inv || !inv[k]) { hint.style.display = "none"; qtyInput.removeAttribute("max"); return; }
  const slot = inv[k];
  const remaining = parseFloat((slot.max - slot.current).toFixed(2));
  hint.style.display = "flex";
  const label = k.charAt(0).toUpperCase() + k.slice(1);
  hintTxt.innerHTML = '<b>' + escapeHtml(label) + ':</b> You can add up to <b>' + remaining + ' kg</b> (capacity: ' + slot.max + ' kg, current: ' + slot.current + ' kg).';
  if (remaining > 0) qtyInput.max = remaining;
  else qtyInput.removeAttribute("max");
}

function setupAddStockForm() {
  const itemSel = document.getElementById("stockItem");
  itemSel.addEventListener("change", refreshStockHint);

  const form = document.getElementById("addStockForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const itemSel  = document.getElementById("stockItem");
    const qtyInput = document.getElementById("stockQty");
    const item = itemSel.value;
    const qty  = parseFloat(qtyInput.value);

    if (!item) return showToast("Please select an item", "warning");
    if (!isPositiveNum(qty)) return showToast("Quantity must be greater than 0", "warning");

    const result = addStock(CURRENT_SCHOOL.schoolId, item, qty);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }

    const itemLabel = item.charAt(0).toUpperCase() + item.slice(1);
    logTransaction(CURRENT_SCHOOL.schoolId, "addition", itemLabel, qty, "Stock delivery");

    showToast("Added " + qty + " kg of " + itemLabel + " successfully!", "success");
    form.reset();
    document.getElementById("stockHint").style.display = "none";

    renderLargeInvCards();
    renderTransactionTable();
    refreshAlertBadge();
    renderOverviewInvCards();
  });
}

// =============================================================
// SECTION 3: ATTENDANCE
// =============================================================

function renderAttendance() {
  const dateInput = document.getElementById("attDate");
  dateInput.max = todayStr();
  if (!dateInput.value) dateInput.value = todayStr();

  document.getElementById("attMaxHint").textContent = "Max: " + CURRENT_SCHOOL.enrollment + " (total enrollment)";

  renderAttendanceTable();
  updateAttendancePreview();
}

function renderAttendanceTable() {
  const tbody = document.querySelector("#attTable tbody");
  const recs = getAttendanceBySchool(CURRENT_SCHOOL.schoolId).slice(0, 30);
  if (recs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-light);">No attendance records yet.</td></tr>';
    return;
  }
  tbody.innerHTML = recs.map(r =>
    '<tr>' +
    '<td>' + formatDate(r.date) + '</td>' +
    '<td>' + r.studentsPresent + '</td>' +
    '<td>' + Number(r.riceUsed || 0).toFixed(1) + '</td>' +
    '<td>' + Number(r.wheatUsed || 0).toFixed(1) + '</td>' +
    '<td>' + Number(r.dalUsed || 0).toFixed(2) + '</td>' +
    '</tr>'
  ).join("");
}

function setupAttendanceForm() {
  const dateInput = document.getElementById("attDate");
  const cntInput  = document.getElementById("attCount");
  dateInput.addEventListener("change", updateAttendancePreview);
  cntInput.addEventListener("input", updateAttendancePreview);

  document.getElementById("attendanceForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const dateStr = dateInput.value;
    const count   = parseInt(cntInput.value, 10);

    if (!dateStr)             return showToast("Please select a date", "warning");
    if (isFutureDate(dateStr)) return showToast("Cannot select future date", "warning");
    if (!count || count < 1)  return showToast("Enter a valid student count", "warning");

    const result = submitAttendance(CURRENT_SCHOOL.schoolId, dateStr, count);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }

    const d = result.data;
    showToast(
      "Attendance recorded: " + count + " students. " +
      "Rice: " + d.riceUsed + "kg, Wheat: " + d.wheatUsed + "kg, Dal: " + d.dalUsed + "kg",
      "success"
    );

    if (d.alertsGenerated && d.alertsGenerated.length > 0) {
      d.alertsGenerated.forEach(a => {
        showToast(a.title, a.severity === "critical" ? "error" : "warning");
      });
    }

    cntInput.value = "";
    document.getElementById("attPreview").style.display = "none";

    renderAttendanceTable();
    refreshAlertBadge();
    renderOverviewInvCards();
    renderOverviewStats();
    renderRecentActivity();
    renderOverviewAlerts();
  });
}

function updateAttendancePreview() {
  const dateInput = document.getElementById("attDate");
  const cntInput  = document.getElementById("attCount");
  const preview   = document.getElementById("attPreview");
  const submitBtn = document.getElementById("attSubmitBtn");
  const warn      = document.getElementById("prWarn");
  const warnText  = document.getElementById("prWarnText");

  const date = dateInput.value;
  const count = parseInt(cntInput.value, 10);

  if (!count || count < 1) {
    preview.style.display = "none";
    submitBtn.disabled = true;
    return;
  }

  // Show preview
  const rice  = parseFloat((count * 0.1).toFixed(2));
  const wheat = parseFloat((count * 0.1).toFixed(2));
  const dal   = parseFloat((count * 0.03).toFixed(2));
  document.getElementById("prRice").textContent  = " " + rice;
  document.getElementById("prWheat").textContent = " " + wheat;
  document.getElementById("prDal").textContent   = " " + dal;
  preview.style.display = "block";

  // Validate
  let canSubmit = true;
  let warnMsg = "";

  if (!date) { canSubmit = false; }
  else if (isFutureDate(date)) {
    warnMsg = "Cannot select future date";
    canSubmit = false;
  } else if (checkDuplicateAttendance(CURRENT_SCHOOL.schoolId, date)) {
    warnMsg = "Attendance already submitted for " + formatDate(date);
    canSubmit = false;
  }

  if (count > CURRENT_SCHOOL.enrollment) {
    warnMsg = "Students present (" + count + ") cannot exceed enrollment (" + CURRENT_SCHOOL.enrollment + ")";
    canSubmit = false;
  }

  // Stock check
  if (canSubmit) {
    const inv = getInventory(CURRENT_SCHOOL.schoolId);
    if (!inv) {
      warnMsg = "Inventory data unavailable. Please refresh the page.";
      canSubmit = false;
    } else if (inv.rice.current < rice) {
      warnMsg = "Insufficient Rice stock! Need " + rice + " kg, but only " + inv.rice.current + " kg available.";
      canSubmit = false;
    } else if (inv.wheat.current < wheat) {
      warnMsg = "Insufficient Wheat stock! Need " + wheat + " kg, but only " + inv.wheat.current + " kg available.";
      canSubmit = false;
    } else if (inv.dal.current < dal) {
      warnMsg = "Insufficient Dal stock! Need " + dal + " kg, but only " + inv.dal.current + " kg available.";
      canSubmit = false;
    }
  }

  if (warnMsg) {
    warn.classList.add("show");
    warnText.textContent = warnMsg;
  } else {
    warn.classList.remove("show");
  }

  submitBtn.disabled = !canSubmit;
}

// =============================================================
// SECTION 4: ALERTS
// =============================================================

function setupAlertFilters() {
  qsa("#alertFilterTabs .filter-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      qsa("#alertFilterTabs .filter-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      ALERT_FILTER = btn.dataset.filter;
      renderAlerts();
    });
  });
}

function renderAlerts() {
  const all = getAlertsBySchool(CURRENT_SCHOOL.schoolId);
  const active = all.filter(a => a.status === "active");
  const resolved = all.filter(a => a.status === "resolved");

  // Update counts
  const counts = { all: all.length, active: active.length, resolved: resolved.length };
  qsa('[data-count]', document.getElementById("alertFilterTabs")).forEach(el => {
    el.textContent = "(" + counts[el.dataset.count] + ")";
  });

  let list;
  if (ALERT_FILTER === "active")        list = active;
  else if (ALERT_FILTER === "resolved") list = resolved;
  else                                  list = all;

  const container = document.getElementById("alertsListContainer");
  if (list.length === 0) {
    container.innerHTML =
      '<div class="card empty-state">' +
      '<i class="ph ph-bell-slash"></i>' +
      '<div class="empty-state-title">No alerts found</div>' +
      '<div class="empty-state-msg">' +
      (ALERT_FILTER === "active" ? "No active alerts. Everything is healthy."
        : ALERT_FILTER === "resolved" ? "No resolved alerts yet."
        : "No alerts have been raised for your school.") +
      '</div></div>';
    return;
  }

  container.innerHTML = list.map(a => alertCardHtml(a, true)).join("");

  // Wire resolve buttons
  qsa('.alert-action [data-resolve]', container).forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.resolve;
      showConfirmDialog(
        "Resolve Alert",
        "Are you sure this issue has been addressed?",
        () => {
          const r = resolveAlert(id);
          if (r.success) {
            showToast("Alert resolved", "success");
            renderAlerts();
            refreshAlertBadge();
            renderOverviewAlerts();
          } else {
            showToast(r.error || "Could not resolve", "error");
          }
        }
      );
    });
  });
}

function alertCardHtml(a, allowResolve) {
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

  const action = (allowResolve && a.status === "active")
    ? '<div class="alert-action"><button class="btn btn-outline btn-sm" data-resolve="' + a.id + '"><i class="ph ph-check"></i> Resolve</button></div>'
    : '<div class="alert-action"></div>';

  const resolvedStamp = a.status === "resolved" && a.resolvedAt
    ? '<div class="alert-resolved-stamp">Resolved on ' + formatDateTime(a.resolvedAt) + '</div>'
    : '';

  return '' +
    '<div class="alert-card ' + severityClass + '">' +
    '  <div class="alert-icon ' + iconClass + '"><i class="ph-fill ' + iconName + '"></i></div>' +
    '  <div class="alert-body">' +
    '    <div class="alert-meta">' + sevBadge + '<span class="badge badge-info">' + escapeHtml(a.item) + '</span>' +
    '      <span class="alert-time">' + timeAgo(a.timestamp) + '</span></div>' +
    '    <div class="alert-title">' + escapeHtml(a.title) + '</div>' +
    '    <div class="alert-message">' + escapeHtml(a.message) + '</div>' +
    resolvedStamp +
    '  </div>' +
    action +
    '</div>';
}

// =============================================================
// SECTION 5: PROFILE
// =============================================================

function renderProfile() {
  const sch = CURRENT_SCHOOL;
  const u = CURRENT_USER;
  const statusBadge = sch.status === "active"
    ? '<span class="badge badge-success"><span class="badge-dot" style="background:var(--secondary);"></span>Active</span>'
    : '<span class="badge badge-grey">Inactive</span>';

  document.getElementById("profileSchool").innerHTML = '' +
    profileRow("School Name", sch.name) +
    profileRow("District", sch.district) +
    profileRow("Total Enrollment", sch.enrollment + " students") +
    profileRow("Status", statusBadge) +
    profileRow("Contact Person", sch.contactPerson) +
    profileRow("Contact Email", sch.contactEmail);

  document.getElementById("profileAccount").innerHTML = '' +
    profileRow("Full Name", u.name) +
    profileRow("Email", u.email) +
    profileRow("Role", "School Administrator") +
    profileRow("Member Since", u.createdAt ? formatDate(u.createdAt.split("T")[0]) : "—");
}

function profileRow(label, value) {
  return '<div class="profile-row"><span class="label">' + label + '</span><span class="value">' + value + '</span></div>';
}
