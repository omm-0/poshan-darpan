/**
 * /api/inventory routes.
 *
 * Specific paths come before /:schoolId (Express otherwise treats "health" as a school id).
 */

const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateAddStock } = require('../utils/validators');
const { ROLES } = require('../utils/constants');

router.get(
  '/health/overview',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  inventoryController.getInventoryHealth
);

router.get(
  '/',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  inventoryController.getAllInventories
);

router.get('/:schoolId', authMiddleware, inventoryController.getInventory);

router.post(
  '/:schoolId/add',
  authMiddleware,
  requireRole(ROLES.SCHOOL),
  validateAddStock,
  inventoryController.addStock
);

module.exports = router;
