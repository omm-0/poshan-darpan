const Inventory = require('../models/Inventory');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get inventory items for a school
// @route   GET /api/inventory?schoolId=
// @access  Private
const getInventory = async (req, res) => {
    try {
        const user = req.user;
        let filter = {};

        if (user.role === 'school_admin') {
            filter.schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        } else if (req.query.schoolId) {
            filter.schoolId = req.query.schoolId;
        }

        const items = await Inventory.find(filter);

        res.json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Add stock to an inventory item
// @route   PATCH /api/inventory/:id/add
// @access  Private (school_admin)
const addStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        const item = await Inventory.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
        }

        const newQuantity = Math.min(item.quantity + quantity, item.maxCapacity);
        const updated = await Inventory.update(item._id, {
            quantity: newQuantity,
            lastUpdated: new Date().toISOString(),
            updatedBy: req.user._id,
        });

        // Log activity
        await ActivityLog.create({
            schoolId: item.schoolId,
            type: 'stock_added',
            title: 'Inventory Updated',
            description: `Added ${quantity}${item.unit} of ${item.name}`,
            userId: req.user._id,
            icon: 'truck',
            iconColor: 'orange',
        });

        res.json({
            success: true,
            message: `Added ${quantity}${item.unit} of ${item.name}`,
            data: updated,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/alerts
// @access  Private
const getAlerts = async (req, res) => {
    try {
        const user = req.user;
        let filter = {};

        if (user.role === 'school_admin') {
            filter.schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        }

        const allItems = await Inventory.find(filter);
        const lowStockItems = allItems.filter(item => item.isLowStock);

        res.json({
            success: true,
            count: lowStockItems.length,
            data: lowStockItems,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { getInventory, addStock, getAlerts };
