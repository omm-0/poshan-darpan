const express = require('express');
const router = express.Router();
const { getSchools, getComparison } = require('../controllers/schoolsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('govt_officer'), getSchools);
router.get('/comparison', protect, authorize('govt_officer'), getComparison);

module.exports = router;
