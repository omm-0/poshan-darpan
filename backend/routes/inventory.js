const express = require('express');
const router = express.Router();
const { getInventory, addStock, getAlerts } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getInventory);
router.get('/alerts', protect, getAlerts);
router.patch('/:id/add', protect, authorize('school_admin'), addStock);

module.exports = router;
