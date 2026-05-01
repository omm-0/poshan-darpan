/**
 * Alert controller — listing, counting, resolving, ranking.
 * Alert auto-creation lives in attendanceController; auto-resolution lives in inventoryController.
 */

const { db } = require('../config/firebase-admin');
const {
  COLLECTIONS,
  ROLES,
  ALERT_STATUS,
  ALERT_SEVERITY
} = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responses');
const { formatFirestoreTimestamp } = require('../utils/helpers');
const alertService = require('../services/alertService');

function mapAlert(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    timestamp: formatFirestoreTimestamp(data.timestamp),
    resolvedAt: formatFirestoreTimestamp(data.resolvedAt)
  };
}

async function getAllAlerts(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    let q = db.collection(COLLECTIONS.ALERTS);

    if (req.query.severity) {
      q = q.where('severity', '==', req.query.severity);
    }
    if (req.query.status) {
      q = q.where('status', '==', req.query.status);
    }
    if (req.query.schoolId) {
      q = q.where('schoolId', '==', req.query.schoolId);
    }

    const snap = await q.orderBy('timestamp', 'desc').limit(limit).get();
    const alerts = snap.docs.map(mapAlert);

    return successResponse(res, 200, 'Alerts fetched', {
      alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('[getAllAlerts] error:', error);
    return errorResponse(res, 500, 'Failed to fetch alerts', 'FETCH_ALERTS_FAILED');
  }
}

async function getAlertsBySchool(req, res) {
  try {
    const schoolId = req.params.schoolId;

    if (req.user.role === ROLES.SCHOOL && schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'Access denied. You can only view your own alerts.', 'ACCESS_DENIED');
    }

    let q = db.collection(COLLECTIONS.ALERTS).where('schoolId', '==', schoolId);

    if (req.query.status) {
      q = q.where('status', '==', req.query.status);
    }

    const snap = await q.orderBy('timestamp', 'desc').get();
    const alerts = snap.docs.map(mapAlert);

    return successResponse(res, 200, 'Alerts fetched', {
      alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('[getAlertsBySchool] error:', error);
    return errorResponse(res, 500, 'Failed to fetch alerts', 'FETCH_ALERTS_FAILED');
  }
}

async function getActiveAlerts(req, res) {
  try {
    let q = db.collection(COLLECTIONS.ALERTS).where('status', '==', ALERT_STATUS.ACTIVE);

    if (req.user.role === ROLES.SCHOOL) {
      if (!req.user.schoolId) {
        return successResponse(res, 200, 'No alerts', { alerts: [], total: 0 });
      }
      q = q.where('schoolId', '==', req.user.schoolId);
    }

    const snap = await q.get();
    const alerts = snap.docs.map(mapAlert);

    const severityRank = { [ALERT_SEVERITY.CRITICAL]: 0, [ALERT_SEVERITY.WARNING]: 1 };
    alerts.sort((a, b) => {
      const sa = severityRank[a.severity] !== undefined ? severityRank[a.severity] : 99;
      const sb = severityRank[b.severity] !== undefined ? severityRank[b.severity] : 99;
      if (sa !== sb) return sa - sb;
      const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
      const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
      return tb - ta;
    });

    return successResponse(res, 200, 'Active alerts fetched', {
      alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('[getActiveAlerts] error:', error);
    return errorResponse(res, 500, 'Failed to fetch active alerts', 'FETCH_ACTIVE_ALERTS_FAILED');
  }
}

async function getActiveAlertCount(req, res) {
  try {
    let q = db.collection(COLLECTIONS.ALERTS).where('status', '==', ALERT_STATUS.ACTIVE);

    if (req.user.role === ROLES.SCHOOL) {
      if (!req.user.schoolId) {
        return successResponse(res, 200, 'Count fetched', { count: 0 });
      }
      q = q.where('schoolId', '==', req.user.schoolId);
    }

    const snap = await q.get();
    return successResponse(res, 200, 'Count fetched', { count: snap.size });
  } catch (error) {
    console.error('[getActiveAlertCount] error:', error);
    return errorResponse(res, 500, 'Failed to count alerts', 'COUNT_ALERTS_FAILED');
  }
}

async function getActiveAlertCountBySchool(req, res) {
  try {
    const schoolId = req.params.schoolId;

    if (req.user.role === ROLES.SCHOOL && schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'Access denied. You can only view your own alerts.', 'ACCESS_DENIED');
    }

    const snap = await db
      .collection(COLLECTIONS.ALERTS)
      .where('schoolId', '==', schoolId)
      .where('status', '==', ALERT_STATUS.ACTIVE)
      .get();

    return successResponse(res, 200, 'Count fetched', { schoolId, count: snap.size });
  } catch (error) {
    console.error('[getActiveAlertCountBySchool] error:', error);
    return errorResponse(res, 500, 'Failed to count alerts', 'COUNT_ALERTS_FAILED');
  }
}

async function resolveAlert(req, res) {
  try {
    const alertId = req.params.id;
    const ref = db.collection(COLLECTIONS.ALERTS).doc(alertId);
    const snap = await ref.get();

    if (!snap.exists) {
      return errorResponse(res, 404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    const alert = snap.data();
    if (alert.schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'You can only resolve alerts for your own school', 'ACCESS_DENIED');
    }

    const result = await alertService.resolveAlertById(alertId);
    if (!result.success) {
      return errorResponse(res, 409, result.error, 'RESOLVE_FAILED');
    }

    return successResponse(res, 200, 'Alert resolved successfully', result.data);
  } catch (error) {
    console.error('[resolveAlert] error:', error);
    return errorResponse(res, 500, 'Failed to resolve alert', 'RESOLVE_ALERT_FAILED');
  }
}

async function getMostAlertedSchool(req, res) {
  try {
    const snap = await db
      .collection(COLLECTIONS.ALERTS)
      .where('status', '==', ALERT_STATUS.ACTIVE)
      .get();

    if (snap.empty) {
      return successResponse(res, 200, 'No active alerts', {
        schoolId: null,
        schoolName: null,
        activeAlertCount: 0
      });
    }

    const counts = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const sid = data.schoolId;
      counts[sid] = (counts[sid] || 0) + 1;
    });

    let topSchoolId = null;
    let topCount = 0;
    Object.entries(counts).forEach(([sid, count]) => {
      if (count > topCount) {
        topCount = count;
        topSchoolId = sid;
      }
    });

    let schoolName = null;
    if (topSchoolId) {
      const schoolDoc = await db.collection(COLLECTIONS.SCHOOLS).doc(topSchoolId).get();
      if (schoolDoc.exists) {
        schoolName = schoolDoc.data().name;
      }
    }

    return successResponse(res, 200, 'Most-alerted school fetched', {
      schoolId: topSchoolId,
      schoolName,
      activeAlertCount: topCount
    });
  } catch (error) {
    console.error('[getMostAlertedSchool] error:', error);
    return errorResponse(res, 500, 'Failed to compute most-alerted school', 'MOST_ALERTED_FAILED');
  }
}

module.exports = {
  getAllAlerts,
  getAlertsBySchool,
  getActiveAlerts,
  getActiveAlertCount,
  getActiveAlertCountBySchool,
  resolveAlert,
  getMostAlertedSchool
};
