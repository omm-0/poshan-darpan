const Attendance = require('../models/Attendance');
const Inventory = require('../models/Inventory');
const ActivityLog = require('../models/ActivityLog');
const School = require('../models/School');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
const getSummary = async (req, res) => {
    try {
        const user = req.user;
        let schoolId = null;

        if (user.role === 'school_admin' && user.schoolId) {
            schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        }

        // Today's attendance
        const todayAttendance = await Attendance.findToday(schoolId);

        // Stock alerts (items below 20%)
        const allInventory = await Inventory.find(schoolId ? { schoolId } : {});
        const lowStockItems = allInventory.filter(item => item.isLowStock);

        // Latest attendance record for sync status
        const recentRecords = await Attendance.find(
            schoolId ? { schoolId } : {},
            { limit: 1 }
        );
        const latestRecord = recentRecords.length > 0 ? recentRecords[0] : null;

        let syncStatus = 'No Data';
        if (latestRecord) {
            const diffMs = Date.now() - new Date(latestRecord.createdAt).getTime();
            const diffMins = Math.round(diffMs / 60000);
            if (diffMins < 60) {
                syncStatus = `${diffMins} mins ago`;
            } else if (diffMins < 1440) {
                syncStatus = `${Math.round(diffMins / 60)} hours ago`;
            } else {
                syncStatus = `${Math.round(diffMins / 1440)} days ago`;
            }
        }

        // Get school total enrolled
        let totalEnrolled = 0;
        if (user.role === 'school_admin' && user.schoolId) {
            const school = typeof user.schoolId === 'object' ? user.schoolId : await School.findById(user.schoolId);
            totalEnrolled = school ? school.totalEnrolled : 120;
        } else {
            const schools = await School.findAll();
            totalEnrolled = schools.reduce((sum, s) => sum + s.totalEnrolled, 0);
        }

        res.json({
            success: true,
            data: {
                mealsToday: {
                    served: todayAttendance ? todayAttendance.studentsPresent : 0,
                    total: totalEnrolled,
                    participation: todayAttendance
                        ? Math.round((todayAttendance.studentsPresent / todayAttendance.totalEnrolled) * 100)
                        : 0,
                },
                stockAlerts: {
                    count: lowStockItems.length,
                    criticalItems: lowStockItems.map(i => i.name),
                },
                syncStatus,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get attendance trend data (for charts)
// @route   GET /api/dashboard/attendance-trend
// @access  Private
const getAttendanceTrend = async (req, res) => {
    try {
        const user = req.user;
        let schoolId = null;

        if (user.role === 'school_admin' && user.schoolId) {
            schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        }

        // Last 4 weeks of data
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const records = await Attendance.findInRange(schoolId, fourWeeksAgo, new Date());

        // Group by week
        const weeks = [[], [], [], []];
        records.forEach(record => {
            const daysDiff = Math.floor((Date.now() - new Date(record.date).getTime()) / (1000 * 60 * 60 * 24));
            const weekIndex = 3 - Math.min(3, Math.floor(daysDiff / 7));
            weeks[weekIndex].push(record.studentsPresent);
        });

        const weeklyAverages = weeks.map(week => {
            if (week.length === 0) return 0;
            return Math.round(week.reduce((a, b) => a + b, 0) / week.length);
        });

        res.json({
            success: true,
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                values: weeklyAverages,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get recent activity feed
// @route   GET /api/dashboard/activity-feed
// @access  Private
const getActivityFeed = async (req, res) => {
    try {
        const user = req.user;
        let filter = {};

        if (user.role === 'school_admin' && user.schoolId) {
            filter.schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        }

        const activities = await ActivityLog.find(filter, 10);

        res.json({
            success: true,
            data: activities,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { getSummary, getAttendanceTrend, getActivityFeed };
