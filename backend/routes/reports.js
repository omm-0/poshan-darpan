const express = require('express');
const router = express.Router();
const { generateReport, listReports, downloadReport } = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/auth');

router.post('/generate', protect, authorize('school_admin'), generateReport);
router.get('/', protect, listReports);
router.get('/:id/download', protect, downloadReport);

module.exports = router;
