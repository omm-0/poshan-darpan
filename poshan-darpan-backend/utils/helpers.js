/**
 * Shared helper functions used across controllers and services.
 */

const { validationResult } = require('express-validator');

function checkValidation(req) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return { isValid: true };
  }

  const errors = result.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg
  }));

  return { isValid: false, errors };
}

function getTodayDateStr() {
  const now = new Date();
  const istOffsetMinutes = 5 * 60 + 30;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + istOffsetMinutes * 60000);

  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;

  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }

  return null;
}

function getStockPercentage(current, max) {
  if (!max || max <= 0) return 0;
  return Math.round((current / max) * 100);
}

function getStockStatus(current, max) {
  const percent = getStockPercentage(current, max);
  if (percent < 10) return 'critical';
  if (percent < 20) return 'warning';
  return 'healthy';
}

function getLastNDates(n) {
  const dates = [];
  const istOffsetMinutes = 5 * 60 + 30;
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  let cursor = new Date(utc + istOffsetMinutes * 60000);

  while (dates.length < n) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const date = String(cursor.getDate()).padStart(2, '0');
      dates.unshift(`${year}-${month}-${date}`);
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return dates;
}

module.exports = {
  checkValidation,
  getTodayDateStr,
  formatFirestoreTimestamp,
  getStockPercentage,
  getStockStatus,
  getLastNDates
};
