/**
 * Alert service — reusable alert create/resolve logic.
 * Called by:
 *   - attendanceController (auto-generate stock alerts after deduction)
 *   - inventoryController  (auto-resolve when stock climbs back above warning)
 *   - alertController      (manual resolve by school user)
 */

const { admin, db } = require('../config/firebase-admin');
const {
  COLLECTIONS,
  ALERT_TYPES,
  ALERT_SEVERITY,
  ALERT_STATUS,
  THRESHOLDS
} = require('../utils/constants');
const { formatFirestoreTimestamp } = require('../utils/helpers');

async function createStockAlert(schoolId, schoolName, severity, item, currentQty, maxQty, percent) {
  const existing = await db
    .collection(COLLECTIONS.ALERTS)
    .where('schoolId', '==', schoolId)
    .where('item', '==', item)
    .where('severity', '==', severity)
    .where('status', '==', ALERT_STATUS.ACTIVE)
    .limit(1)
    .get();

  if (!existing.empty) {
    return null;
  }

  const isCritical = severity === ALERT_SEVERITY.CRITICAL;
  const alertObj = {
    schoolId,
    schoolName,
    type: ALERT_TYPES.STOCK,
    severity,
    item,
    title: `${severity.toUpperCase()}: ${item} stock ${isCritical ? 'critically low' : 'running low'}`,
    message: `${item} stock is at ${percent}% (${currentQty} kg out of ${maxQty} kg). ${
      isCritical ? 'Immediate replenishment needed.' : 'Consider restocking soon.'
    }`,
    status: ALERT_STATUS.ACTIVE,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    resolvedAt: null
  };

  const docRef = await db.collection(COLLECTIONS.ALERTS).add(alertObj);
  return { id: docRef.id, ...alertObj, timestamp: new Date().toISOString() };
}

async function resolveAlertsForItem(schoolId, item) {
  const snap = await db
    .collection(COLLECTIONS.ALERTS)
    .where('schoolId', '==', schoolId)
    .where('item', '==', item)
    .where('status', '==', ALERT_STATUS.ACTIVE)
    .get();

  if (snap.empty) return 0;

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: ALERT_STATUS.RESOLVED,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  return snap.size;
}

async function resolveAlertById(alertId) {
  const ref = db.collection(COLLECTIONS.ALERTS).doc(alertId);
  const snap = await ref.get();

  if (!snap.exists) {
    return { success: false, error: 'Alert not found' };
  }

  const data = snap.data();
  if (data.status === ALERT_STATUS.RESOLVED) {
    return { success: false, error: 'Alert is already resolved' };
  }

  await ref.update({
    status: ALERT_STATUS.RESOLVED,
    resolvedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const updated = await ref.get();
  const updatedData = updated.data();
  return {
    success: true,
    data: {
      id: alertId,
      ...updatedData,
      timestamp: formatFirestoreTimestamp(updatedData.timestamp),
      resolvedAt: formatFirestoreTimestamp(updatedData.resolvedAt)
    }
  };
}

module.exports = {
  createStockAlert,
  resolveAlertsForItem,
  resolveAlertById,
  THRESHOLDS
};
