const School = require('../models/School');
const Attendance = require('../models/Attendance');

// @desc    Get all schools (for govt officer)
// @route   GET /api/schools?district=
// @access  Private (govt_officer)
const getSchools = async (req, res) => {
    try {
        const { district } = req.query;
        let filter = {};

        if (district) {
            filter.district = district;
        } else if (req.user.district) {
            filter.district = req.user.district;
        }

        const schools = await School.findAll(filter);

        res.json({
            success: true,
            count: schools.length,
            data: schools,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get comparative meal compliance across schools
// @route   GET /api/schools/comparison?month=&year=
// @access  Private (govt_officer)
const getComparison = async (req, res) => {
    try {
        const { month, year } = req.query;
        const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // Get all schools (filtered by officer's district)
        let schoolFilter = {};
        if (req.user.district) {
            schoolFilter.district = req.user.district;
        }
        const schools = await School.findAll(schoolFilter);

        const comparisonData = await Promise.all(
            schools.map(async (school) => {
                const records = await Attendance.findInRange(school._id, startDate, endDate);

                const workingDaysInMonth = records.length;
                const totalPossible = workingDaysInMonth * school.totalEnrolled;
                const totalServed = records.reduce((sum, r) => sum + r.studentsPresent, 0);
                const compliance = totalPossible > 0
                    ? Math.round((totalServed / totalPossible) * 100)
                    : 0;

                return {
                    schoolName: school.name,
                    schoolId: school._id,
                    totalEnrolled: school.totalEnrolled,
                    daysReported: workingDaysInMonth,
                    totalMealsServed: totalServed,
                    compliance,
                };
            })
        );

        res.json({
            success: true,
            data: {
                period: `${currentMonth}/${currentYear}`,
                schools: comparisonData,
                labels: comparisonData.map(d => d.schoolName),
                values: comparisonData.map(d => d.compliance),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { getSchools, getComparison };
