/**
 * Attendance controller — submission cascade + reads.
 *
 * submitAttendance is the most critical endpoint in the app:
 *   validate -> verify school -> dedupe -> compute portions -> pre-check stock
 *   -> Firestore transaction (re-check + deduct + write attendance + log 3 transactions)
 *   -> auto-create stock alerts (outside transaction)
 *   -> respond with full state.
 */

const { admin, db } = require('../config/firebase-admin');
const {
  COLLECTIONS,
  ROLES,
  PORTIONS,
  THRESHOLDS,
  ALERT_SEVERITY,
  TRANSACTION_TYPES
} = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responses');
const {
  checkValidation,
  formatFirestoreTimestamp,
  getStockPercentage,
  getTodayDateStr
} = require('../utils/helpers');
const inventoryService = require('../services/inventoryService');
const alertService = require('../services/alertService');

function mapAttendance(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    timestamp: formatFirestoreTimestamp(data.timestamp)
  };
}

async function submitAttendance(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const schoolId = req.user.schoolId;
  if (!schoolId) {
    return errorResponse(res, 400, 'School ID not assigned to user', 'NO_SCHOOL_ASSIGNED');
  }

  const date = req.body.date;
  const studentsPresent = parseInt(req.body.studentsPresent, 10);

  try {
    const schoolDoc = await db.collection(COLLECTIONS.SCHOOLS).doc(schoolId).get();
    if (!schoolDoc.exists) {
      return errorResponse(res, 404, 'School not found', 'SCHOOL_NOT_FOUND');
    }

    const school = schoolDoc.data();
    if (school.status !== 'active') {
      return errorResponse(res, 403, 'School is inactive. Cannot submit attendance.', 'SCHOOL_INACTIVE');
    }

    if (studentsPresent > school.enrollment) {
      return errorResponse(
        res,
        400,
        `Students present (${studentsPresent}) cannot exceed enrollment (${school.enrollment})`,
        'EXCEEDS_ENROLLMENT'
      );
    }

    const dupSnap = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where('schoolId', '==', schoolId)
      .where('date', '==', date)
      .limit(1)
      .get();

    if (!dupSnap.empty) {
      return errorResponse(
        res,
        409,
        `Attendance already submitted for ${date}. Each date can only have one submission per school.`,
        'DUPLICATE_ATTENDANCE'
      );
    }

    const riceNeeded = parseFloat((studentsPresent * PORTIONS.RICE).toFixed(2));
    const wheatNeeded = parseFloat((studentsPresent * PORTIONS.WHEAT).toFixed(2));
    const dalNeeded = parseFloat((studentsPresent * PORTIONS.DAL).toFixed(2));

    const stockCheck = await inventoryService.checkSufficientStock(
      schoolId,
      riceNeeded,
      wheatNeeded,
      dalNeeded
    );

    if (!stockCheck.sufficient) {
      return errorResponse(
        res,
        422,
        'Insufficient stock to serve meals',
        'INSUFFICIENT_STOCK',
        { details: stockCheck.details, shortages: stockCheck.shortages }
      );
    }

    let txResult;
    try {
      txResult = await db.runTransaction(async (transaction) => {
        const deduction = await inventoryService.deductInventory(
          schoolId,
          riceNeeded,
          wheatNeeded,
          dalNeeded,
          transaction
        );

        const attendanceRef = db.collection(COLLECTIONS.ATTENDANCE).doc();
        transaction.set(attendanceRef, {
          schoolId,
          date,
          studentsPresent,
          riceUsed: riceNeeded,
          wheatUsed: wheatNeeded,
          dalUsed: dalNeeded,
          submittedBy: req.user.uid,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const items = [
          { name: 'Rice', qty: riceNeeded },
          { name: 'Wheat', qty: wheatNeeded },
          { name: 'Dal', qty: dalNeeded }
        ];

        items.forEach((item) => {
          const txnRef = db.collection(COLLECTIONS.TRANSACTIONS).doc();
          transaction.set(txnRef, {
            schoolId,
            type: TRANSACTION_TYPES.DEDUCTION,
            item: item.name,
            quantity: item.qty,
            reason: `Attendance deduction (${studentsPresent} students)`,
            performedBy: req.user.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        });

        return { ...deduction, attendanceId: attendanceRef.id };
      });
    } catch (txError) {
      const msg = String(txError.message || '');
      if (msg.startsWith('INSUFFICIENT_STOCK')) {
        return errorResponse(
          res,
          422,
          'Insufficient stock (concurrent modification detected)',
          'INSUFFICIENT_STOCK',
          { reason: msg.split(':').slice(1).join(':') }
        );
      }
      console.error('[submitAttendance] transaction error:', txError);
      return errorResponse(res, 500, 'Failed to submit attendance', 'ATTENDANCE_TX_FAILED');
    }

    const ricePercent = getStockPercentage(txResult.newRice, txResult.riceMax);
    const wheatPercent = getStockPercentage(txResult.newWheat, txResult.wheatMax);
    const dalPercent = getStockPercentage(txResult.newDal, txResult.dalMax);

    const alertsGenerated = [];
    const itemsForAlerts = [
      { name: 'Rice', current: txResult.newRice, max: txResult.riceMax, percent: ricePercent },
      { name: 'Wheat', current: txResult.newWheat, max: txResult.wheatMax, percent: wheatPercent },
      { name: 'Dal', current: txResult.newDal, max: txResult.dalMax, percent: dalPercent }
    ];

    for (const item of itemsForAlerts) {
      let severity = null;
      if (item.percent < THRESHOLDS.CRITICAL) severity = ALERT_SEVERITY.CRITICAL;
      else if (item.percent < THRESHOLDS.WARNING) severity = ALERT_SEVERITY.WARNING;
      if (!severity) continue;

      try {
        const created = await alertService.createStockAlert(
          schoolId,
          school.name,
          severity,
          item.name,
          item.current,
          item.max,
          item.percent
        );
        if (created) {
          alertsGenerated.push({
            id: created.id,
            item: item.name,
            severity,
            percent: item.percent
          });
        }
      } catch (alertErr) {
        console.error(`[submitAttendance] alert generation failed for ${item.name}:`, alertErr);
      }
    }

    return successResponse(res, 201, 'Attendance submitted successfully', {
      attendanceId: txResult.attendanceId,
      date,
      studentsPresent,
      mealDeductions: {
        rice: riceNeeded,
        wheat: wheatNeeded,
        dal: dalNeeded
      },
      updatedInventory: {
        rice: { current: txResult.newRice, max: txResult.riceMax, percent: ricePercent },
        wheat: { current: txResult.newWheat, max: txResult.wheatMax, percent: wheatPercent },
        dal: { current: txResult.newDal, max: txResult.dalMax, percent: dalPercent }
      },
      alertsGenerated
    });
  } catch (error) {
    console.error('[submitAttendance] unexpected error:', error);
    return errorResponse(res, 500, 'Failed to submit attendance', 'SUBMIT_FAILED');
  }
}

async function getAttendanceBySchool(req, res) {
  try {
    const schoolId = req.params.schoolId;

    if (req.user.role === ROLES.SCHOOL && schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'Access denied. You can only view your own attendance.', 'ACCESS_DENIED');
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 365);

    const snap = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where('schoolId', '==', schoolId)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const attendance = snap.docs.map(mapAttendance);

    return successResponse(res, 200, 'Attendance fetched', {
      attendance,
      total: attendance.length
    });
  } catch (error) {
    console.error('[getAttendanceBySchool] error:', error);
    return errorResponse(res, 500, 'Failed to fetch attendance', 'FETCH_ATTENDANCE_FAILED');
  }
}

async function getTodaysAttendance(req, res) {
  try {
    const today = getTodayDateStr();

    let schoolId = req.query.schoolId || null;
    if (req.user.role === ROLES.SCHOOL) {
      schoolId = req.user.schoolId;
    }

    let q = db.collection(COLLECTIONS.ATTENDANCE).where('date', '==', today);
    if (schoolId) {
      q = q.where('schoolId', '==', schoolId);
    }

    const snap = await q.get();
    const records = snap.docs.map(mapAttendance);

    return successResponse(res, 200, "Today's attendance fetched", {
      date: today,
      records,
      total: records.length
    });
  } catch (error) {
    console.error('[getTodaysAttendance] error:', error);
    return errorResponse(res, 500, "Failed to fetch today's attendance", 'FETCH_TODAY_FAILED');
  }
}

async function getAttendanceByDate(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  try {
    const date = req.params.date;
    let q = db.collection(COLLECTIONS.ATTENDANCE).where('date', '==', date);

    if (req.user.role === ROLES.SCHOOL) {
      q = q.where('schoolId', '==', req.user.schoolId);
    }

    const snap = await q.get();
    const records = snap.docs.map(mapAttendance);

    return successResponse(res, 200, 'Attendance fetched', {
      date,
      records,
      total: records.length
    });
  } catch (error) {
    console.error('[getAttendanceByDate] error:', error);
    return errorResponse(res, 500, 'Failed to fetch attendance', 'FETCH_BY_DATE_FAILED');
  }
}

function computeCutoffDate(days) {
  const istOffsetMinutes = 5 * 60 + 30;
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + istOffsetMinutes * 60000);
  ist.setDate(ist.getDate() - (days - 1));
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, '0');
  const d = String(ist.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDateRange(days) {
  const istOffsetMinutes = 5 * 60 + 30;
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const today = new Date(utcMs + istOffsetMinutes * 60000);

  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dd}`);
  }
  return dates;
}

async function getAttendanceTrend(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  try {
    const days = parseInt(req.params.days, 10);
    const cutoff = computeCutoffDate(days);

    const snap = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where('date', '>=', cutoff)
      .orderBy('date', 'asc')
      .get();

    const grouped = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const d = data.date;
      if (!grouped[d]) grouped[d] = { totalStudents: 0, schoolCount: 0 };
      grouped[d].totalStudents += data.studentsPresent || 0;
      grouped[d].schoolCount += 1;
    });

    const range = buildDateRange(days);
    const trend = range.map((date) => ({
      date,
      totalStudents: grouped[date] ? grouped[date].totalStudents : 0,
      schoolCount: grouped[date] ? grouped[date].schoolCount : 0
    }));

    return successResponse(res, 200, 'Attendance trend fetched', { trend });
  } catch (error) {
    console.error('[getAttendanceTrend] error:', error);
    return errorResponse(res, 500, 'Failed to fetch attendance trend', 'FETCH_TREND_FAILED');
  }
}

async function getConsumptionData(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  try {
    const days = parseInt(req.params.days, 10);
    const cutoff = computeCutoffDate(days);

    const snap = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where('date', '>=', cutoff)
      .orderBy('date', 'asc')
      .get();

    const grouped = {};
    let totalRice = 0;
    let totalWheat = 0;
    let totalDal = 0;

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const d = data.date;
      if (!grouped[d]) grouped[d] = { rice: 0, wheat: 0, dal: 0 };
      grouped[d].rice += data.riceUsed || 0;
      grouped[d].wheat += data.wheatUsed || 0;
      grouped[d].dal += data.dalUsed || 0;
      totalRice += data.riceUsed || 0;
      totalWheat += data.wheatUsed || 0;
      totalDal += data.dalUsed || 0;
    });

    const range = buildDateRange(days);
    const daily = range.map((date) => {
      const g = grouped[date] || { rice: 0, wheat: 0, dal: 0 };
      return {
        date,
        rice: parseFloat(g.rice.toFixed(2)),
        wheat: parseFloat(g.wheat.toFixed(2)),
        dal: parseFloat(g.dal.toFixed(2))
      };
    });

    return successResponse(res, 200, 'Consumption data fetched', {
      daily,
      totals: {
        rice: parseFloat(totalRice.toFixed(2)),
        wheat: parseFloat(totalWheat.toFixed(2)),
        dal: parseFloat(totalDal.toFixed(2))
      },
      period: {
        from: range[0],
        to: range[range.length - 1],
        days
      }
    });
  } catch (error) {
    console.error('[getConsumptionData] error:', error);
    return errorResponse(res, 500, 'Failed to fetch consumption data', 'FETCH_CONSUMPTION_FAILED');
  }
}

module.exports = {
  submitAttendance,
  getAttendanceBySchool,
  getTodaysAttendance,
  getAttendanceByDate,
  getAttendanceTrend,
  getConsumptionData
};
