const Attendance = require('../models/Attendance');
const School = require('../models/School');
const ActivityLog = require('../models/ActivityLog');

// @desc    Submit daily attendance
// @route   POST /api/attendance
// @access  Private (school_admin)
const submitAttendance = async (req, res) => {
    try {
        const { date, studentsPresent, menuServed } = req.body;
        const user = req.user;

        if (!user.schoolId) {
            return res.status(400).json({
                success: false,
                message: 'No school assigned to this user',
            });
        }

        const schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        const school = await School.findById(schoolId);

        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Create attendance record
        const attendance = await Attendance.create({
            schoolId,
            date: new Date(date),
            totalEnrolled: school.totalEnrolled,
            studentsPresent,
            menuServed,
            submittedBy: user._id,
        });

        // Log activity
        await ActivityLog.create({
            schoolId,
            type: 'meal_submitted',
            title: 'Daily Meal Data Submitted',
            description: `Today's count: ${studentsPresent} students — ${menuServed}`,
            userId: user._id,
            icon: 'check',
            iconColor: 'green',
        });

        res.status(201).json({
            success: true,
            message: 'Attendance submitted successfully',
            data: attendance,
        });
    } catch (error) {
        // Handle duplicate date
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Attendance for this date has already been submitted',
            });
        }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get attendance history
// @route   GET /api/attendance?schoolId=&from=&to=
// @access  Private
const getAttendanceHistory = async (req, res) => {
    try {
        const user = req.user;
        const { schoolId, from, to } = req.query;

        let filter = {};

        // School admins can only see their own school
        if (user.role === 'school_admin') {
            filter.schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        } else if (schoolId) {
            filter.schoolId = schoolId;
        }

        if (from) filter.dateFrom = from;
        if (to) filter.dateTo = to;

        const records = await Attendance.find(filter, { limit: 30 });

        res.json({
            success: true,
            count: records.length,
            data: records,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Verify attendance record (Govt Officer only)
// @route   PATCH /api/attendance/:id/verify
// @access  Private (govt_officer)
const verifyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        if (attendance.verified) {
            return res.status(400).json({ success: false, message: 'Record already verified' });
        }

        const updated = await Attendance.update(attendance._id, {
            verified: true,
            verifiedBy: req.user._id,
            verifiedAt: new Date().toISOString(),
        });

        // Log activity
        await ActivityLog.create({
            schoolId: attendance.schoolId,
            type: 'attendance_verified',
            title: 'Attendance Record Verified',
            description: `Record for ${attendance.dateStr || attendance.date} verified by officer`,
            userId: req.user._id,
            icon: 'check-circle',
            iconColor: 'blue',
        });

        res.json({
            success: true,
            message: 'Attendance verified successfully',
            data: updated,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { submitAttendance, getAttendanceHistory, verifyAttendance };
