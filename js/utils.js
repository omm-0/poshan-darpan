/* ============================================================
   POSHAN DARPAN - UTILITY HELPERS
============================================================ */

// ---------- DATE HELPERS ----------

const _MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(str) {
  if (!str) return "";
  const d = new Date(str + (str.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return str;
  return d.getDate().toString().padStart(2, "0") + " " + _MONTHS[d.getMonth()] + " " + d.getFullYear();
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let hr = d.getHours();
  const min = d.getMinutes().toString().padStart(2, "0");
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12; if (hr === 0) hr = 12;
  return d.getDate().toString().padStart(2, "0") + " " + _MONTHS[d.getMonth()] + " " + d.getFullYear() + ", " + hr + ":" + min + " " + ampm;
}

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return min + " minute" + (min === 1 ? "" : "s") + " ago";
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + " hour" + (hr === 1 ? "" : "s") + " ago";
  const day = Math.floor(hr / 24);
  if (day < 30) return day + " day" + (day === 1 ? "" : "s") + " ago";
  const mo = Math.floor(day / 30);
  if (mo < 12) return mo + " month" + (mo === 1 ? "" : "s") + " ago";
  const yr = Math.floor(mo / 12);
  return yr + " year" + (yr === 1 ? "" : "s") + " ago";
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function isFutureDate(str) {
  if (!str) return false;
  return str > todayStr();
}

function getLastNDates(n) {
  const out = [];
  const cursor = new Date();
  while (out.length < n) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const ds = cursor.getFullYear() + "-" + String(cursor.getMonth() + 1).padStart(2, "0") + "-" + String(cursor.getDate()).padStart(2, "0");
      out.push(ds);
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return out.reverse(); // oldest → newest
}

// ---------- VALIDATION ----------

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isStrongPassword(pwd) {
  return typeof pwd === "string" && pwd.length >= 6;
}

function isPositiveNum(val) {
  const n = Number(val);
  return !isNaN(n) && n > 0;
}

// ---------- TOAST NOTIFICATIONS ----------

function _ensureToastContainer() {
  let c = document.getElementById("toastContainer");
  if (!c) {
    c = document.createElement("div");
    c.id = "toastContainer";
    c.className = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}

function showToast(message, type) {
  type = type || "info";
  const container = _ensureToastContainer();

  // Limit to 3 toasts
  while (container.children.length >= 3) {
    container.removeChild(container.firstChild);
  }

  const iconMap = {
    success: "ph-check-circle",
    error:   "ph-x-circle",
    warning: "ph-warning",
    info:    "ph-info"
  };

  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.innerHTML =
    '<i class="ph-fill ' + iconMap[type] + ' toast-icon"></i>' +
    '<span class="toast-message"></span>' +
    '<button class="toast-close" type="button" aria-label="Dismiss"><i class="ph ph-x"></i></button>';
  // Set the user-facing text via textContent to prevent HTML/script injection.
  toast.querySelector(".toast-message").textContent = String(message == null ? "" : message);

  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => _removeToast(toast));

  container.appendChild(toast);

  // Auto-dismiss after 4s
  setTimeout(() => _removeToast(toast), 4000);
}

function _removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add("toast-out");
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

// ---------- CONFIRM DIALOG ----------

function showConfirmDialog(title, message, onConfirm, onCancel) {
  // Remove any existing
  const existing = document.getElementById("confirmDialog");
  if (existing) existing.remove();

  const wrap = document.createElement("div");
  wrap.id = "confirmDialog";
  wrap.className = "modal-overlay";
  wrap.innerHTML =
    '<div class="modal-card confirm-card" role="dialog" aria-modal="true">' +
    '  <h3 class="confirm-title"></h3>' +
    '  <p class="confirm-message"></p>' +
    '  <div class="confirm-actions">' +
    '    <button class="btn btn-outline" data-action="cancel">Cancel</button>' +
    '    <button class="btn btn-primary" data-action="confirm">Confirm</button>' +
    '  </div>' +
    '</div>';
  wrap.querySelector(".confirm-title").textContent = String(title == null ? "" : title);
  wrap.querySelector(".confirm-message").textContent = String(message == null ? "" : message);

  function close(cb) {
    document.removeEventListener("keydown", escHandler);
    wrap.classList.add("modal-out");
    setTimeout(() => {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      if (typeof cb === "function") cb();
    }, 200);
  }

  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) close(onCancel);
  });
  wrap.querySelector('[data-action="cancel"]').addEventListener("click", () => close(onCancel));
  wrap.querySelector('[data-action="confirm"]').addEventListener("click", () => close(onConfirm));

  function escHandler(e) {
    if (e.key === "Escape") close(onCancel);
  }
  document.addEventListener("keydown", escHandler);

  document.body.appendChild(wrap);
}

// ---------- NUMBER ANIMATION ----------

function animateCounter(element, target, duration) {
  if (!element) return;
  duration = duration || 1000;
  const endVal = Number(target);
  const isPercent = String(element.dataset.suffix || "").indexOf("%") !== -1;
  // Guard against NaN / Infinity targets so the counter doesn't display "NaN".
  if (!isFinite(endVal)) {
    element.textContent = isPercent ? "0%" : "0";
    return;
  }
  const isFloat = String(target).indexOf(".") !== -1;
  const start = 0;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    const cur = start + (endVal - start) * eased;
    let display;
    if (isFloat) display = cur.toFixed(1);
    else display = Math.round(cur).toLocaleString("en-IN");
    if (isPercent) display = display + "%";
    element.textContent = display;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------- STOCK HELPERS ----------

function stockColor(current, max) {
  const pct = stockPercent(current, max);
  if (pct > 50) return "#059669";
  if (pct >= 20) return "#F59E0B";
  return "#DC2626";
}

function stockLabel(current, max) {
  const pct = stockPercent(current, max);
  if (pct > 50) return "Healthy";
  if (pct >= 20) return "Low";
  return "Critical";
}

function stockPercent(current, max) {
  const c = Number(current);
  const m = Number(max);
  if (!isFinite(c) || !isFinite(m) || m <= 0) return 0;
  return Math.round((c / m) * 100);
}

function stockBadgeClass(current, max) {
  const pct = stockPercent(current, max);
  if (pct > 50) return "badge-success";
  if (pct >= 20) return "badge-warning";
  return "badge-danger";
}

// ---------- ID GENERATOR ----------

function generateId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

// ---------- DOM HELPERS ----------

function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function qs(sel, root) { return (root || document).querySelector(sel); }
function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
