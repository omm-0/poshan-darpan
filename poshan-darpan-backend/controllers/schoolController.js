/**
 * School controller — list, lookup, create.
 */

const { admin, db } = require('../config/firebase-admin');
const {
  COLLECTIONS,
  ROLES,
  ALERT_STATUS
} = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responses');
const {
  checkValidation,
  formatFirestoreTimestamp,
  getStockPercentage
} = require('../utils/helpers');
const inventoryService = require('../services/inventoryService');

function attachStockPercents(school, inventory) {
  if (!inventory) {
    school.inventory = null;
    school.ricePercent = 0;
    school.wheatPercent = 0;
    school.dalPercent = 0;
    return school;
  }
  school.inventory = inventory;
  school.ricePercent = getStockPercentage(
    (inventory.rice && inventory.rice.current) || 0,
    (inventory.rice && inventory.rice.max) || 0
  );
  school.wheatPercent = getStockPercentage(
    (inventory.wheat && inventory.wheat.current) || 0,
    (inventory.wheat && inventory.wheat.max) || 0
  );
  school.dalPercent = getStockPercentage(
    (inventory.dal && inventory.dal.current) || 0,
    (inventory.dal && inventory.dal.max) || 0
  );
  return school;
}

async function getAllSchools(req, res) {
  try {
    let results = [];

    if (req.user.role === ROLES.SCHOOL) {
      if (!req.user.schoolId) {
        return errorResponse(res, 400, 'School ID not assigned to user', 'NO_SCHOOL_ASSIGNED');
      }
      const doc = await db.collection(COLLECTIONS.SCHOOLS).doc(req.user.schoolId).get();
      if (!doc.exists) {
        return errorResponse(res, 404, 'School not found', 'SCHOOL_NOT_FOUND');
      }
      results = [{ id: doc.id, ...doc.data() }];
    } else {
      let q = db.collection(COLLECTIONS.SCHOOLS);

      if (req.query.district) {
        q = q.where('district', '==', req.query.district);
      }
      if (req.query.status) {
        q = q.where('status', '==', req.query.status);
      }

      const snap = await q.get();
      results = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (req.query.search) {
        const term = String(req.query.search).toLowerCase();
        results = results.filter(
          (s) => s.name && s.name.toLowerCase().includes(term)
        );
      }

      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const enriched = await Promise.all(
      results.map(async (school) => {
        const inv = await inventoryService.getSchoolInventory(school.id);
        return attachStockPercents(school, inv);
      })
    );

    return successResponse(res, 200, 'Schools fetched', {
      schools: enriched,
      total: enriched.length
    });
  } catch (error) {
    console.error('[getAllSchools] error:', error);
    return errorResponse(res, 500, 'Failed to fetch schools', 'FETCH_SCHOOLS_FAILED');
  }
}

async function getSchoolById(req, res) {
  try {
    const schoolId = req.params.id;

    if (req.user.role === ROLES.SCHOOL && schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'Access denied. You can only view your own school.', 'ACCESS_DENIED');
    }

    const doc = await db.collection(COLLECTIONS.SCHOOLS).doc(schoolId).get();
    if (!doc.exists) {
      return errorResponse(res, 404, 'School not found', 'SCHOOL_NOT_FOUND');
    }

    const school = { id: doc.id, ...doc.data() };
    const inventory = await inventoryService.getSchoolInventory(schoolId);

    const attendanceSnap = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where('schoolId', '==', schoolId)
      .orderBy('date', 'desc')
      .limit(10)
      .get();

    const recentAttendance = attendanceSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        timestamp: formatFirestoreTimestamp(data.timestamp)
      };
    });

    const alertsSnap = await db
      .collection(COLLECTIONS.ALERTS)
      .where('schoolId', '==', schoolId)
      .where('status', '==', ALERT_STATUS.ACTIVE)
      .orderBy('timestamp', 'desc')
      .get();

    const activeAlerts = alertsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        timestamp: formatFirestoreTimestamp(data.timestamp),
        resolvedAt: formatFirestoreTimestamp(data.resolvedAt)
      };
    });

    return successResponse(res, 200, 'School fetched', {
      school,
      inventory,
      recentAttendance,
      activeAlerts
    });
  } catch (error) {
    console.error('[getSchoolById] error:', error);
    return errorResponse(res, 500, 'Failed to fetch school', 'FETCH_SCHOOL_FAILED');
  }
}

async function getSchoolsByDistrict(req, res) {
  try {
    const district = req.params.name;
    const snap = await db
      .collection(COLLECTIONS.SCHOOLS)
      .where('district', '==', district)
      .get();

    const schools = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    schools.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return successResponse(res, 200, 'Schools fetched', {
      schools,
      total: schools.length
    });
  } catch (error) {
    console.error('[getSchoolsByDistrict] error:', error);
    return errorResponse(res, 500, 'Failed to fetch schools by district', 'FETCH_DISTRICT_FAILED');
  }
}

async function getDistrictList(req, res) {
  try {
    const snap = await db.collection(COLLECTIONS.SCHOOLS).get();
    const set = new Set();
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.district) set.add(data.district);
    });
    const districts = Array.from(set).sort((a, b) => a.localeCompare(b));

    return successResponse(res, 200, 'Districts fetched', { districts });
  } catch (error) {
    console.error('[getDistrictList] error:', error);
    return errorResponse(res, 500, 'Failed to fetch districts', 'FETCH_DISTRICTS_FAILED');
  }
}

async function createSchool(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  try {
    const { name, enrollment, district, contactPerson, contactEmail } = req.body;
    const schoolId = `school_${Date.now()}`;

    const school = {
      name: name.trim(),
      enrollment: parseInt(enrollment, 10),
      district: district.trim(),
      contactPerson: contactPerson.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const inventory = {
      rice: { current: 0, max: parseFloat((enrollment * 1).toFixed(2)) },
      wheat: { current: 0, max: parseFloat((enrollment * 0.8).toFixed(2)) },
      dal: { current: 0, max: parseFloat((enrollment * 0.3).toFixed(2)) },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    const batch = db.batch();
    const schoolRef = db.collection(COLLECTIONS.SCHOOLS).doc(schoolId);
    const inventoryRef = schoolRef.collection('inventory').doc('stock');
    batch.set(schoolRef, school);
    batch.set(inventoryRef, inventory);
    await batch.commit();

    return successResponse(res, 201, 'School created successfully', {
      school: { id: schoolId, ...school, createdAt: new Date().toISOString() },
      inventory
    });
  } catch (error) {
    console.error('[createSchool] error:', error);
    return errorResponse(res, 500, 'Failed to create school', 'CREATE_SCHOOL_FAILED');
  }
}

module.exports = {
  getAllSchools,
  getSchoolById,
  getSchoolsByDistrict,
  getDistrictList,
  createSchool
};
