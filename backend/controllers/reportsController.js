const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Attendance = require('../models/Attendance');
const School = require('../models/School');
const ActivityLog = require('../models/ActivityLog');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Generate monthly PDF report
// @route   POST /api/reports/generate
// @access  Private (school_admin)
const generateReport = async (req, res) => {
    try {
        const { month, year } = req.body;
        const user = req.user;

        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and year are required' });
        }

        const schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        const school = await School.findById(schoolId);

        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Get attendance records for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const records = await Attendance.findInRange(schoolId, startDate, endDate);

        const totalMealsServed = records.reduce((sum, r) => sum + r.studentsPresent, 0);
        const avgAttendance = records.length > 0
            ? Math.round(totalMealsServed / records.length)
            : 0;

        // Generate PDF
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[month - 1];
        const fileName = `report_${school.name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // PDF Content
        doc.fontSize(22).font('Helvetica-Bold').text('POSHAN DARPAN', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Mid-Day Meal Monthly Report', { align: 'center' });
        doc.moveDown();

        doc.fontSize(16).font('Helvetica-Bold').text(`${monthName} ${year}`);
        doc.fontSize(12).font('Helvetica').text(`School: ${school.name}`);
        doc.text(`District: ${school.district} | Block: ${school.block}`);
        doc.text(`Total Enrolled: ${school.totalEnrolled}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Days Reported: ${records.length}`);
        doc.text(`Total Meals Served: ${totalMealsServed}`);
        doc.text(`Average Daily Attendance: ${avgAttendance}`);
        doc.text(`Avg Participation Rate: ${school.totalEnrolled > 0 ? Math.round((avgAttendance / school.totalEnrolled) * 100) : 0}%`);
        doc.moveDown();

        // Daily records table
        if (records.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('Daily Records');
            doc.moveDown(0.5);

            records.forEach(record => {
                const dateStr = record.dateStr || new Date(record.date).toISOString().split('T')[0];
                doc.fontSize(10).font('Helvetica');
                doc.text(`${dateStr}    |    ${record.menuServed}    |    ${record.studentsPresent}/${record.totalEnrolled}    |    ${record.verified ? 'Verified' : 'Pending'}`);
            });
        }

        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toISOString().split('T')[0]}`, { align: 'right' });
        doc.text('Poshan Darpan Analytics System v1.0.4', { align: 'right' });

        doc.end();

        // Wait for stream to finish
        await new Promise((resolve) => stream.on('finish', resolve));

        // Save report metadata (upsert by school+month+year)
        const report = await Report.upsert(schoolId, parseInt(month), parseInt(year), {
            fileName,
            filePath: `/uploads/reports/${fileName}`,
            generatedBy: user._id,
            totalMealsServed,
            avgAttendance,
        });

        // Log activity
        await ActivityLog.create({
            schoolId,
            type: 'report_generated',
            title: 'Monthly Report Generated',
            description: `${monthName} ${year} PDF Ready`,
            userId: user._id,
            icon: 'file-text',
            iconColor: 'blue',
        });

        res.status(201).json({
            success: true,
            message: `Report for ${monthName} ${year} generated`,
            data: report,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    List reports
// @route   GET /api/reports?schoolId=&year=
// @access  Private
const listReports = async (req, res) => {
    try {
        const user = req.user;
        const { schoolId, year } = req.query;

        let filter = {};

        if (user.role === 'school_admin') {
            filter.schoolId = typeof user.schoolId === 'object' ? user.schoolId._id : user.schoolId;
        } else if (schoolId) {
            filter.schoolId = schoolId;
        }

        if (year) filter.year = parseInt(year);

        const reports = await Report.find(filter);

        res.json({
            success: true,
            count: reports.length,
            data: reports,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Download a report PDF
// @route   GET /api/reports/:id/download
// @access  Private
const downloadReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const absolutePath = path.join(__dirname, '..', report.filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ success: false, message: 'Report file not found on server' });
        }

        res.download(absolutePath, report.fileName);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { generateReport, listReports, downloadReport };
