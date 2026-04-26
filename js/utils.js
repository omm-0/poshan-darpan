/* ============================================================
   POSHAN DARPAN — UTILITY FUNCTIONS
   Date helpers, toast notifications, validation, formatters,
   chart helpers, number animation, confirm dialog.
   Exposes window.PD_Utils.
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // DATE HELPERS
  // ============================================================
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function _pad(n) { return n < 10 ? '0' + n : '' + n; }

  function getTodayDateString() {
    const d = new Date();
    return d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate());
  }

  function isDateInFuture(dateString) {
    return dateString > getTodayDateString();
  }

  function getLastNDaysDates(n) {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      out.push(d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate()));
    }
    return out;
  }

  function getLast7DaysDates()  { return getLastNDaysDates(7); }
  function getLast30DaysDates() { return getLastNDaysDates(30); }

  function formatDate(dateString) {
    if (!dateString) return '—';
    const parts = String(dateString).split('T')[0].split('-');
    if (parts.length !== 3) return dateString;
    const yr = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(yr) || isNaN(mo) || isNaN(day)) return dateString;
    return day + ' ' + MONTH_SHORT[mo] + ' ' + yr;
  }

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    let h = d.getHours();
    const m = _pad(d.getMinutes());
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + ' ' + d.getFullYear() + ', ' + h + ':' + m + ' ' + ampm;
  }

  function getTimeAgo(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 0) return formatDateTime(isoString);
    if (diff < 60) return 'just now';
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return m + ' minute' + (m === 1 ? '' : 's') + ' ago';
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return h + ' hour' + (h === 1 ? '' : 's') + ' ago';
    }
    if (diff < 604800) {
      const dd = Math.floor(diff / 86400);
      return dd + ' day' + (dd === 1 ? '' : 's') + ' ago';
    }
    return formatDate(isoString.split('T')[0]);
  }

  // ============================================================
  // VALIDATION
  // ============================================================
  function isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  function isPasswordStrong(password) {
    return typeof password === 'string' && password.length >= 6;
  }

  function isPositiveNumber(value) {
    const n = Number(value);
    return isFinite(n) && n > 0;
  }

  function isPositiveInteger(value) {
    const n = Number(value);
    return isFinite(n) && n > 0 && Number.isInteger(n);
  }

  // ============================================================
  // STOCK HEALTH
  // ============================================================
  function getStockPercentage(current, max) {
    if (!max || max <= 0) return 0;
    return Math.round((current / max) * 1000) / 10;
  }

  function getStockHealthLabel(current, max) {
    const pct = getStockPercentage(current, max);
    if (pct < 20) return 'Critical';
    if (pct < 50) return 'Low';
    return 'Healthy';
  }

  function getStockHealthClass(current, max) {
    const pct = getStockPercentage(current, max);
    if (pct < 20) return 'critical';
    if (pct < 50) return 'low';
    return 'healthy';
  }

  function getStockBadgeClass(current, max) {
    const pct = getStockPercentage(current, max);
    if (pct < 20) return 'badge-critical';
    if (pct < 50) return 'badge-low';
    return 'badge-healthy';
  }

  // ============================================================
  // TOAST NOTIFICATIONS
  // ============================================================
  function _ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type) {
    type = type || 'info';
    const container = _ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icons = {
      success: 'ph-check-circle',
      error:   'ph-x-circle',
      warning: 'ph-warning',
      info:    'ph-info'
    };
    toast.innerHTML =
      '<i class="ph-bold ' + (icons[type] || icons.info) + '"></i>' +
      '<span></span>' +
      '<button class="toast-close" aria-label="Close"><i class="ph-bold ph-x"></i></button>';
    toast.querySelector('span').textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    const remove = () => {
      toast.classList.remove('show');
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
    };
    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 4000);
  }

  // ============================================================
  // SPINNER OVERLAY
  // ============================================================
  function showLoader() {
    let el = document.getElementById('global-spinner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'global-spinner';
      el.className = 'spinner-overlay';
      el.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(el);
    }
    el.classList.add('show');
  }

  function hideLoader() {
    const el = document.getElementById('global-spinner');
    if (el) el.classList.remove('show');
  }

  function hidePageLoading() {
    const el = document.getElementById('page-loading');
    if (el) el.style.display = 'none';
  }

  // ============================================================
  // CONFIRM DIALOG
  // ============================================================
  function showConfirmDialog(title, message, onConfirm, onCancel) {
    let backdrop = document.getElementById('pd-confirm-backdrop');
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.id = 'pd-confirm-backdrop';
    backdrop.className = 'modal-backdrop show';
    backdrop.innerHTML =
      '<div class="modal" style="max-width:420px">' +
        '<div class="modal-header">' +
          '<h3></h3>' +
          '<button class="modal-close"><i class="ph-bold ph-x"></i></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<p style="color:var(--text-secondary);margin-bottom:1.25rem"></p>' +
          '<div style="display:flex;gap:0.5rem;justify-content:flex-end">' +
            '<button class="btn btn-secondary" data-action="cancel">Cancel</button>' +
            '<button class="btn btn-primary" data-action="confirm">Confirm</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    backdrop.querySelector('h3').textContent = title;
    backdrop.querySelector('p').textContent = message;
    document.body.appendChild(backdrop);

    function close() { backdrop.remove(); }
    backdrop.querySelector('.modal-close').addEventListener('click', () => { close(); if (onCancel) onCancel(); });
    backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => { close(); if (onCancel) onCancel(); });
    backdrop.querySelector('[data-action="confirm"]').addEventListener('click', () => { close(); if (onConfirm) onConfirm(); });
    backdrop.addEventListener('click', e => { if (e.target === backdrop) { close(); if (onCancel) onCancel(); } });
  }

  // ============================================================
  // ANIMATE NUMBER
  // ============================================================
  function animateNumber(element, targetNumber, duration) {
    if (!element) return;
    duration = duration || 1000;
    const target = Number(targetNumber) || 0;
    const start = performance.now();
    const isInt = Number.isInteger(target);
    function tick(t) {
      const progress = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      element.textContent = isInt ? Math.round(value).toLocaleString() : value.toFixed(1);
      if (progress < 1) requestAnimationFrame(tick);
      else element.textContent = isInt ? target.toLocaleString() : target.toString();
    }
    requestAnimationFrame(tick);
  }

  // ============================================================
  // CHART HELPERS
  // ============================================================
  function destroyChart(chartInstance) {
    try {
      if (chartInstance && typeof chartInstance.destroy === 'function') {
        chartInstance.destroy();
      }
    } catch (e) { /* ignore */ }
  }

  function getChartColors() {
    return {
      primary: '#2563EB',
      primaryLight: 'rgba(37,99,235,0.15)',
      secondary: '#059669',
      secondaryLight: 'rgba(5,150,105,0.15)',
      warning: '#F59E0B',
      warningLight: 'rgba(245,158,11,0.15)',
      danger: '#DC2626',
      dangerLight: 'rgba(220,38,38,0.15)',
      grid: '#E2E8F0',
      text: '#64748B',
      palette: ['#2563EB', '#059669', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899', '#10B981', '#F97316']
    };
  }

  // ============================================================
  // ESCAPE HTML
  // ============================================================
  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ============================================================
  // EXPOSE
  // ============================================================
  window.PD_Utils = {
    getTodayDateString: getTodayDateString,
    isDateInFuture: isDateInFuture,
    getLastNDaysDates: getLastNDaysDates,
    getLast7DaysDates: getLast7DaysDates,
    getLast30DaysDates: getLast30DaysDates,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    getTimeAgo: getTimeAgo,
    isValidEmail: isValidEmail,
    isPasswordStrong: isPasswordStrong,
    isPositiveNumber: isPositiveNumber,
    isPositiveInteger: isPositiveInteger,
    getStockPercentage: getStockPercentage,
    getStockHealthLabel: getStockHealthLabel,
    getStockHealthClass: getStockHealthClass,
    getStockBadgeClass: getStockBadgeClass,
    showToast: showToast,
    showLoader: showLoader,
    hideLoader: hideLoader,
    hidePageLoading: hidePageLoading,
    showConfirmDialog: showConfirmDialog,
    animateNumber: animateNumber,
    destroyChart: destroyChart,
    getChartColors: getChartColors,
    escapeHtml: escapeHtml
  };
})();
