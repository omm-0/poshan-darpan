/**
 * Application-wide constants used across controllers, services, and middleware.
 */

const COLLECTIONS = {
  USERS: 'users',
  SCHOOLS: 'schools',
  INVENTORY: 'inventory',
  ATTENDANCE: 'attendance',
  ALERTS: 'alerts',
  TRANSACTIONS: 'stockTransactions'
};

const PORTIONS = {
  RICE: 0.1,
  WHEAT: 0.1,
  DAL: 0.03
};

const THRESHOLDS = {
  CRITICAL: 10,
  WARNING: 20
};

const ROLES = {
  SCHOOL: 'school',
  GOVERNMENT: 'government'
};

const ALERT_TYPES = {
  STOCK: 'stock',
  DELIVERY: 'delivery',
  ANOMALY: 'anomaly'
};

const ALERT_SEVERITY = {
  WARNING: 'warning',
  CRITICAL: 'critical'
};

const ALERT_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved'
};

const TRANSACTION_TYPES = {
  ADDITION: 'addition',
  DEDUCTION: 'deduction'
};

module.exports = {
  COLLECTIONS,
  PORTIONS,
  THRESHOLDS,
  ROLES,
  ALERT_TYPES,
  ALERT_SEVERITY,
  ALERT_STATUS,
  TRANSACTION_TYPES
};
