// ─── Date Helpers ────────────────────────────────────────────────────────────

export function formatDate(date) {
  if (!date) return '—';
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return '—';
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function timeAgo(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

export function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
}

export function getLast90Days() {
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    return d.toISOString().split('T')[0];
  });
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ─── Stock Helpers ────────────────────────────────────────────────────────────

export function stockPct(current, max) {
  if (!max || max === 0) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}

export function stockStatus(pct) {
  if (pct > 50) return 'healthy';
  if (pct > 20) return 'low';
  return 'critical';
}

export function stockStatusLabel(pct) {
  if (pct > 50) return 'Healthy';
  if (pct > 20) return 'Low';
  return 'Critical';
}

export function stockColor(pct) {
  if (pct > 50) return 'var(--secondary)';
  if (pct > 20) return 'var(--warning)';
  return 'var(--danger)';
}

// Consumption constants (kg per student per day)
export const CONSUMPTION = { rice: 0.1, wheat: 0.1, dal: 0.03 };

// ─── Toast Notifications ─────────────────────────────────────────────────────

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
}

export function showToast(message, type = 'success', duration = 4000) {
  ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: 'check-circle', error: 'x-circle', warning: 'warning', info: 'info' };
  toast.innerHTML = `
    <i class="ph-bold ph-${icons[type] || 'info'}"></i>
    <span>${sanitize(message)}</span>
    <button class="toast-close" aria-label="Close"><i class="ph-bold ph-x"></i></button>
  `;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  const close = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  };

  toast.querySelector('.toast-close').addEventListener('click', close);
  setTimeout(close, duration);
}

// ─── Number Animation ─────────────────────────────────────────────────────────

export function animateCount(element, target, duration = 800, suffix = '') {
  if (!element) return;
  const start = parseInt(element.textContent) || 0;
  const range = target - start;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(start + range * eased) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────

export function showSpinner(selector) {
  const el = document.querySelector(selector);
  if (el) el.classList.add('loading');
}

export function hideSpinner(selector) {
  const el = document.querySelector(selector);
  if (el) el.classList.remove('loading');
}

export function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-sm"></span> Loading…';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
  }
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

export function renderSkeleton(container, rows = 3) {
  if (!container) return;
  container.innerHTML = Array.from({ length: rows }, () =>
    `<div class="skeleton-row"><div class="skeleton"></div></div>`
  ).join('');
}
