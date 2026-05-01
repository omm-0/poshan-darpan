/**
 * Inventory controller — fetch, list, add stock, health overview.
 */

const { admin, db } = require('../config/firebase-admin');
const {
  COLLECTIONS,
  ROLES,
  THRESHOLDS,
  TRANSACTION_TYPES
} = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responses');
const {
  checkValidation,
  getStockStatus
} = require('../utils/helpers');
const inventoryService = require('../services/inventoryService');
const alertService = require('../services/alertService');

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function getInventory(req, res) {
  try {
    const schoolId = req.params.schoolId;

    if (req.user.role === ROLES.SCHOOL && schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'Access denied. You can only view your own inventory.', 'ACCESS_DENIED');
    }

    const inventory = await inventoryService.getSchoolInventory(schoolId);
    if (!inventory) {
      return errorResponse(res, 404, 'Inventory not found for this school', 'INVENTORY_NOT_FOUND');
    }

    return successResponse(res, 200, 'Inventory fetched', { schoolId, inventory });
  } catch (error) {
    console.error('[getInventory] error:', error);
    return errorResponse(res, 500, 'Failed to fetch inventory', 'FETCH_INVENTORY_FAILED');
  }
}

async function getAllInventories(req, res) {
  try {
    const schoolsSnap = await db
      .collection(COLLECTIONS.SCHOOLS)
      .where('status', '==', 'active')
      .get();

    const inventories = await Promise.all(
      schoolsSnap.docs.map(async (doc) => {
        const school = doc.data();
        const inventory = await inventoryService.getSchoolInventory(doc.id);
        return {
          schoolId: doc.id,
          schoolName: school.name,
          district: school.district,
          rice: inventory ? inventory.rice : null,
          wheat: inventory ? inventory.wheat : null,
          dal: inventory ? inventory.dal : null
        };
      })
    );

    inventories.sort((a, b) => (a.schoolName || '').localeCompare(b.schoolName || ''));

    return successResponse(res, 200, 'Inventories fetched', {
      inventories,
      total: inventories.length
    });
  } catch (error) {
    console.error('[getAllInventories] error:', error);
    return errorResponse(res, 500, 'Failed to fetch inventories', 'FETCH_INVENTORIES_FAILED');
  }
}

async function addStock(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  try {
    const schoolId = req.params.schoolId;

    if (req.user.role === ROLES.SCHOOL && schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'Access denied. You can only add stock to your own school.', 'ACCESS_DENIED');
    }

    const item = String(req.body.item).toLowerCase();
    const quantity = parseFloat(req.body.quantity);

    const result = await inventoryService.addInventoryStock(schoolId, item, quantity);
    if (!result.success) {
      return errorResponse(res, 422, result.error, 'STOCK_ADD_FAILED');
    }

    const txnRef = await db.collection(COLLECTIONS.TRANSACTIONS).add({
      schoolId,
      type: TRANSACTION_TYPES.ADDITION,
      item: capitalize(item),
      quantity,
      reason: 'Stock delivery received',
      performedBy: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    let alertsResolved = 0;
    if (result.data.percentage >= THRESHOLDS.WARNING) {
      alertsResolved = await alertService.resolveAlertsForItem(schoolId, capitalize(item));
    }

    const updatedInventory = await inventoryService.getSchoolInventory(schoolId);

    return successResponse(res, 200, 'Stock added successfully', {
      updatedInventory,
      transactionId: txnRef.id,
      alertsResolved,
      addition: result.data
    });
  } catch (error) {
    console.error('[addStock] error:', error);
    return errorResponse(res, 500, 'Failed to add stock', 'ADD_STOCK_FAILED');
  }
}

async function getInventoryHealth(req, res) {
  try {
    const schoolsSnap = await db
      .collection(COLLECTIONS.SCHOOLS)
      .where('status', '==', 'active')
      .get();

    const schoolHealth = await Promise.all(
      schoolsSnap.docs.map(async (doc) => {
        const school = doc.data();
        const inventory = await inventoryService.getSchoolInventory(doc.id);

        if (!inventory) {
          return {
            schoolId: doc.id,
            schoolName: school.name,
            district: school.district,
            avgPercent: 0,
            status: 'critical'
          };
        }

        const ricePercent = inventory.rice.percent;
        const wheatPercent = inventory.wheat.percent;
        const dalPercent = inventory.dal.percent;
        const avgPercent = Math.round((ricePercent + wheatPercent + dalPercent) / 3);

        let status;
        if (avgPercent < 10) status = 'critical';
        else if (avgPercent < 20) status = 'warning';
        else status = 'healthy';

        return {
          schoolId: doc.id,
          schoolName: school.name,
          district: school.district,
          ricePercent,
          wheatPercent,
          dalPercent,
          avgPercent,
          status
        };
      })
    );

    schoolHealth.sort((a, b) => a.avgPercent - b.avgPercent);

    return successResponse(res, 200, 'Inventory health fetched', { schoolHealth });
  } catch (error) {
    console.error('[getInventoryHealth] error:', error);
    return errorResponse(res, 500, 'Failed to fetch inventory health', 'FETCH_HEALTH_FAILED');
  }
}

module.exports = {
  getInventory,
  getAllInventories,
  addStock,
  getInventoryHealth
};
