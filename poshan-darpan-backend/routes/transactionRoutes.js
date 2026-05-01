/**
 * /api/transactions routes.
 */

const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

router.get(
  '/school/:schoolId',
  authMiddleware,
  transactionController.getTransactionsBySchool
);

router.get(
  '/',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  transactionController.getAllTransactions
);

module.exports = router;
