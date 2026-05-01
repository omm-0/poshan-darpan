/**
 * /api/schools routes.
 *
 * IMPORTANT: specific routes (/districts/list, /district/:name) come BEFORE /:id,
 * otherwise Express treats "districts" / "district" as an :id parameter.
 */

const express = require('express');
const router = express.Router();

const schoolController = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateCreateSchool } = require('../utils/validators');
const { ROLES } = require('../utils/constants');

router.get('/districts/list', authMiddleware, schoolController.getDistrictList);
router.get('/district/:name', authMiddleware, schoolController.getSchoolsByDistrict);

router.get('/', authMiddleware, schoolController.getAllSchools);

router.post(
  '/',
  authMiddleware,
  requireRole(ROLES.GOVERNMENT),
  validateCreateSchool,
  schoolController.createSchool
);

router.get('/:id', authMiddleware, schoolController.getSchoolById);

module.exports = router;
