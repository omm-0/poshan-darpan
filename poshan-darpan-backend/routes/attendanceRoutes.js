/**
 * /api/attendance routes.
 * Specific paths come before parameterized ones (Express routing precedence).
 */

const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
  validateAttendance,
  validateDateParam,
  validateDaysParam
} = require('../utils/validators');
const { ROLES } = require('../utils/constants');

router.get('/today', authMiddleware, attendanceController.getTodaysAttendance);

router.get(
  '/trend/:days',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  validateDaysParam,
  attendanceController.getAttendanceTrend
);

router.get(
  '/consumption/:days',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  validateDaysParam,
  attendanceController.getConsumptionData
);

router.get(
  '/date/:date',
  authMiddleware,
  validateDateParam,
  attendanceController.getAttendanceByDate
);

router.get(
  '/school/:schoolId',
  authMiddleware,
  attendanceController.getAttendanceBySchool
);

router.post(
  '/submit',
  authMiddleware,
  requireRole(ROLES.SCHOOL),
  validateAttendance,
  attendanceController.submitAttendance
);

module.exports = router;
