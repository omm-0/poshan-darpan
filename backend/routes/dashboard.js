const express = require('express');
const router = express.Router();
const { getSummary, getAttendanceTrend, getActivityFeed } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/attendance-trend', protect, getAttendanceTrend);
router.get('/activity-feed', protect, getActivityFeed);

module.exports = router;
