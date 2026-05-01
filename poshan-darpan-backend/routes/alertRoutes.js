/**
 * /api/alerts routes.
 * Specific paths come before /:id (Express otherwise treats "active" / "school" as :id).
 */

const express = require('express');
const router = express.Router();

const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

router.get(
  '/active/count/:schoolId',
  authMiddleware,
  alertController.getActiveAlertCountBySchool
);

router.get(
  '/active/count',
  authMiddleware,
  alertController.getActiveAlertCount
);

router.get(
  '/active',
  authMiddleware,
  alertController.getActiveAlerts
);

router.get(
  '/most-alerted',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  alertController.getMostAlertedSchool
);

router.get(
  '/school/:schoolId',
  authMiddleware,
  alertController.getAlertsBySchool
);

router.get(
  '/',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  alertController.getAllAlerts
);

router.put(
  '/:id/resolve',
  authMiddleware,
  requireRole(ROLES.SCHOOL),
  alertController.resolveAlert
);

module.exports = router;
