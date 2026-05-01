/**
 * Inventory service — reusable inventory read/check/update logic.
 * Used by both inventoryController and attendanceController.
 *
 * Inventory storage: schools/{schoolId}/inventory/stock document with shape:
 *   {
 *     rice:  { current: <kg>, max: <kg> },
 *     wheat: { current: <kg>, max: <kg> },
 *     dal:   { current: <kg>, max: <kg> },
 *     lastUpdated: <Timestamp>
 *   }
 */

const { admin, db } = require('../config/firebase-admin');
const { COLLECTIONS } = require('../utils/constants');
const { getStockPercentage, getStockStatus } = require('../utils/helpers');

function inventoryDocRef(schoolId) {
  return db
    .collection(COLLECTIONS.SCHOOLS)
    .doc(schoolId)
    .collection('inventory')
    .doc('stock');
}

function decorate(inventory) {
  if (!inventory) return null;
  const { rice = { current: 0, max: 0 }, wheat = { current: 0, max: 0 }, dal = { current: 0, max: 0 } } = inventory;
  return {
    ...inventory,
    rice: {
      current: rice.current || 0,
      max: rice.max || 0,
      percent: getStockPercentage(rice.current || 0, rice.max || 0),
      status: getStockStatus(rice.current || 0, rice.max || 0)
    },
    wheat: {
      current: wheat.current || 0,
      max: wheat.max || 0,
      percent: getStockPercentage(wheat.current || 0, wheat.max || 0),
      status: getStockStatus(wheat.current || 0, wheat.max || 0)
    },
    dal: {
      current: dal.current || 0,
      max: dal.max || 0,
      percent: getStockPercentage(dal.current || 0, dal.max || 0),
      status: getStockStatus(dal.current || 0, dal.max || 0)
    }
  };
}

async function getSchoolInventory(schoolId) {
  const snap = await inventoryDocRef(schoolId).get();
  if (!snap.exists) return null;
  return decorate(snap.data());
}

async function checkSufficientStock(schoolId, riceNeeded, wheatNeeded, dalNeeded) {
  const inventory = await getSchoolInventory(schoolId);
  if (!inventory) {
    return {
      sufficient: false,
      details: null,
      shortages: ['Inventory not found for this school']
    };
  }

  const rice = inventory.rice;
  const wheat = inventory.wheat;
  const dal = inventory.dal;

  const details = {
    rice: { current: rice.current, needed: riceNeeded, sufficient: rice.current >= riceNeeded },
    wheat: { current: wheat.current, needed: wheatNeeded, sufficient: wheat.current >= wheatNeeded },
    dal: { current: dal.current, needed: dalNeeded, sufficient: dal.current >= dalNeeded }
  };

  const shortages = [];
  if (!details.rice.sufficient) {
    shortages.push(`Rice needs ${riceNeeded}kg but only ${rice.current}kg available`);
  }
  if (!details.wheat.sufficient) {
    shortages.push(`Wheat needs ${wheatNeeded}kg but only ${wheat.current}kg available`);
  }
  if (!details.dal.sufficient) {
    shortages.push(`Dal needs ${dalNeeded}kg but only ${dal.current}kg available`);
  }

  return {
    sufficient: shortages.length === 0,
    details,
    shortages
  };
}

async function deductInventory(schoolId, riceQty, wheatQty, dalQty, transaction) {
  const ref = inventoryDocRef(schoolId);
  const snap = await transaction.get(ref);

  if (!snap.exists) {
    throw new Error('INSUFFICIENT_STOCK:Inventory document not found');
  }

  const data = snap.data();
  const riceCurrent = (data.rice && data.rice.current) || 0;
  const wheatCurrent = (data.wheat && data.wheat.current) || 0;
  const dalCurrent = (data.dal && data.dal.current) || 0;

  const riceMax = (data.rice && data.rice.max) || 0;
  const wheatMax = (data.wheat && data.wheat.max) || 0;
  const dalMax = (data.dal && data.dal.max) || 0;

  if (riceCurrent < riceQty) {
    throw new Error(`INSUFFICIENT_STOCK:Rice needs ${riceQty}kg but only ${riceCurrent}kg available`);
  }
  if (wheatCurrent < wheatQty) {
    throw new Error(`INSUFFICIENT_STOCK:Wheat needs ${wheatQty}kg but only ${wheatCurrent}kg available`);
  }
  if (dalCurrent < dalQty) {
    throw new Error(`INSUFFICIENT_STOCK:Dal needs ${dalQty}kg but only ${dalCurrent}kg available`);
  }

  const newRice = parseFloat((riceCurrent - riceQty).toFixed(2));
  const newWheat = parseFloat((wheatCurrent - wheatQty).toFixed(2));
  const newDal = parseFloat((dalCurrent - dalQty).toFixed(2));

  transaction.update(ref, {
    'rice.current': newRice,
    'wheat.current': newWheat,
    'dal.current': newDal,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });

  return { newRice, newWheat, newDal, riceMax, wheatMax, dalMax };
}

async function addInventoryStock(schoolId, item, quantity) {
  const ref = inventoryDocRef(schoolId);
  const snap = await ref.get();

  if (!snap.exists) {
    return { success: false, error: 'Inventory not found for this school' };
  }

  const data = snap.data();
  const itemData = data[item];
  if (!itemData) {
    return { success: false, error: `Inventory item "${item}" not found` };
  }

  const current = itemData.current || 0;
  const max = itemData.max || 0;
  const newCurrent = parseFloat((current + quantity).toFixed(2));

  if (newCurrent > max) {
    const allowed = parseFloat((max - current).toFixed(2));
    return {
      success: false,
      error: `Exceeds max capacity of ${max} kg. You can add up to ${allowed} kg.`
    };
  }

  await ref.update({
    [`${item}.current`]: newCurrent,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });

  const percentage = getStockPercentage(newCurrent, max);
  const status = getStockStatus(newCurrent, max);

  return {
    success: true,
    data: {
      item,
      addedQty: quantity,
      newCurrent,
      max,
      percentage,
      status
    }
  };
}

module.exports = {
  getSchoolInventory,
  checkSufficientStock,
  deductInventory,
  addInventoryStock,
  inventoryDocRef
};
