const express = require('express');
const router = express.Router();
const { submitAttendance, getAttendanceHistory, verifyAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('school_admin'), submitAttendance);
router.get('/', protect, getAttendanceHistory);
router.patch('/:id/verify', protect, authorize('govt_officer'), verifyAttendance);

module.exports = router;
