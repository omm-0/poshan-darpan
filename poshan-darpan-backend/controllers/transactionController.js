/**
 * Transaction controller — read-only listing of stock transactions.
 * Transactions are written by inventoryController (additions) and attendanceController (deductions).
 */

const { db } = require('../config/firebase-admin');
const { COLLECTIONS, ROLES, TRANSACTION_TYPES } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responses');
const { formatFirestoreTimestamp } = require('../utils/helpers');

function mapTransaction(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    timestamp: formatFirestoreTimestamp(data.timestamp)
  };
}

async function getTransactionsBySchool(req, res) {
  try {
    const schoolId = req.params.schoolId;

    if (req.user.role === ROLES.SCHOOL && schoolId !== req.user.schoolId) {
      return errorResponse(res, 403, 'Access denied. You can only view your own transactions.', 'ACCESS_DENIED');
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 200);

    const snap = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .where('schoolId', '==', schoolId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const transactions = snap.docs.map(mapTransaction);

    return successResponse(res, 200, 'Transactions fetched', {
      transactions,
      total: transactions.length
    });
  } catch (error) {
    console.error('[getTransactionsBySchool] error:', error);
    return errorResponse(res, 500, 'Failed to fetch transactions', 'FETCH_TRANSACTIONS_FAILED');
  }
}

async function getAllTransactions(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    let q = db.collection(COLLECTIONS.TRANSACTIONS);

    if (req.query.schoolId) {
      q = q.where('schoolId', '==', req.query.schoolId);
    }
    if (req.query.type) {
      const type = String(req.query.type).toLowerCase();
      if (![TRANSACTION_TYPES.ADDITION, TRANSACTION_TYPES.DEDUCTION].includes(type)) {
        return errorResponse(res, 400, 'type must be "addition" or "deduction"', 'INVALID_TYPE');
      }
      q = q.where('type', '==', type);
    }

    const snap = await q.orderBy('timestamp', 'desc').limit(limit).get();
    const transactions = snap.docs.map(mapTransaction);

    return successResponse(res, 200, 'Transactions fetched', {
      transactions,
      total: transactions.length
    });
  } catch (error) {
    console.error('[getAllTransactions] error:', error);
    return errorResponse(res, 500, 'Failed to fetch transactions', 'FETCH_TRANSACTIONS_FAILED');
  }
}

module.exports = {
  getTransactionsBySchool,
  getAllTransactions
};
