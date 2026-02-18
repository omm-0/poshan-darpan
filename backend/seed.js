/**
 * Seed Script for Poshan Darpan (Firebase Firestore)
 * Run: node seed.js
 * Seeds default users, schools, inventory, attendance records, and activity logs.
 */

require('dotenv').config();
const { connectDB, getDB } = require('./config/db');
const User = require('./models/User');
const School = require('./models/School');
const Inventory = require('./models/Inventory');
const Attendance = require('./models/Attendance');
const ActivityLog = require('./models/ActivityLog');

const seedDB = async () => {
    try {
        // Initialize Firebase
        connectDB();

        console.log('🗑️  Clearing existing data...');
        await User.deleteAll();
        await School.deleteAll();
        await Inventory.deleteAll();
        await Attendance.deleteAll();
        await ActivityLog.deleteAll();

        // Also clear reports
        const db = getDB();
        const reportsSnap = await db.collection('reports').get();
        const batch = db.batch();
        reportsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log('✅ Cleared existing data');

        // --- 1. Create Schools ---
        const schools = [];
        const schoolData = [
            {
                name: 'Govt. Primary School Indore',
                district: 'Indore',
                block: 'Block A',
                totalEnrolled: 120,
                address: 'Near Bus Stand, Indore, MP',
                contactPhone: '9876543210',
            },
            {
                name: 'Govt. Middle School Bhopal',
                district: 'Indore',
                block: 'Block B',
                totalEnrolled: 150,
                address: 'Main Road, Bhopal, MP',
                contactPhone: '9876543211',
            },
            {
                name: 'Govt. Primary School Ujjain',
                district: 'Indore',
                block: 'Block C',
                totalEnrolled: 90,
                address: 'Temple Road, Ujjain, MP',
                contactPhone: '9876543212',
            },
            {
                name: 'Govt. High School Dewas',
                district: 'Indore',
                block: 'Block D',
                totalEnrolled: 200,
                address: 'Station Road, Dewas, MP',
                contactPhone: '9876543213',
            },
        ];

        for (const s of schoolData) {
            const school = await School.create(s);
            schools.push(school);
        }
        console.log(`🏫 Created ${schools.length} schools`);

        // --- 2. Create Users ---
        const schoolAdmin = await User.create({
            username: 'anita',
            password: 'admin123',
            fullName: 'Anita Sharma',
            role: 'school_admin',
            designation: 'Principal, Govt School Indore',
            schoolId: schools[0]._id,
        });

        const govtOfficer = await User.create({
            username: 'rajesh',
            password: 'officer123',
            fullName: 'Rajesh Verma',
            role: 'govt_officer',
            designation: 'District Block Officer',
            district: 'Indore',
        });

        // Link principal to school
        await School.update(schools[0]._id, { principalId: schoolAdmin._id });

        console.log('👤 Created 2 users (anita / admin123, rajesh / officer123)');

        // --- 3. Create Inventory for School A ---
        const inventoryItems = [];
        const invData = [
            { name: 'Rice (Basmati)', unit: 'kg', quantity: 450, maxCapacity: 1000, color: '#FCD34D' },
            { name: 'Wheat Flour', unit: 'kg', quantity: 120, maxCapacity: 500, color: '#FDBA74' },
            { name: 'Toor Dal', unit: 'kg', quantity: 80, maxCapacity: 300, color: '#F97316' },
            { name: 'Cooking Oil', unit: 'L', quantity: 15, maxCapacity: 100, color: '#EF4444' },
        ];

        for (const item of invData) {
            const created = await Inventory.create({
                schoolId: schools[0]._id,
                ...item,
                updatedBy: schoolAdmin._id,
            });
            inventoryItems.push(created);
        }
        console.log(`📦 Created ${inventoryItems.length} inventory items`);

        // --- 4. Create Attendance Records ---
        const today = new Date();
        let attendanceCount = 0;

        // Create 14 days of records for school A
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            const menus = ['Rice & Dal', 'Roti & Seasonal Sabzi', 'Khichdi', 'Kheer & Puri'];
            const present = Math.floor(Math.random() * 15) + 105; // 105-120

            await Attendance.create({
                schoolId: schools[0]._id,
                date,
                totalEnrolled: 120,
                studentsPresent: present,
                menuServed: menus[i % 4],
                submittedBy: schoolAdmin._id,
                verified: i > 3,
            });
            attendanceCount++;
        }

        // Add records for other schools
        for (let s = 1; s < schools.length; s++) {
            for (let i = 1; i <= 10; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                if (date.getDay() === 0 || date.getDay() === 6) continue;

                const menus = ['Rice & Dal', 'Roti & Seasonal Sabzi', 'Khichdi', 'Kheer & Puri'];
                const totalEnrolled = schools[s].totalEnrolled;
                const present = Math.floor(Math.random() * (totalEnrolled * 0.15)) + Math.floor(totalEnrolled * 0.75);

                await Attendance.create({
                    schoolId: schools[s]._id,
                    date,
                    totalEnrolled,
                    studentsPresent: Math.min(present, totalEnrolled),
                    menuServed: menus[i % 4],
                    submittedBy: schoolAdmin._id,
                    verified: i > 4,
                });
                attendanceCount++;
            }
        }
        console.log(`📋 Created ${attendanceCount} attendance records`);

        // --- 5. Create Activity Logs ---
        await ActivityLog.create({
            schoolId: schools[0]._id,
            type: 'meal_submitted',
            title: 'Daily Meal Data Submitted',
            description: "Today's count: 115 students",
            userId: schoolAdmin._id,
            icon: 'check',
            iconColor: 'green',
        });

        await ActivityLog.create({
            schoolId: schools[0]._id,
            type: 'stock_added',
            title: 'Inventory Added',
            description: 'Received 50kg Wheat Flour',
            userId: schoolAdmin._id,
            icon: 'truck',
            iconColor: 'orange',
        });

        await ActivityLog.create({
            schoolId: schools[0]._id,
            type: 'report_generated',
            title: 'Monthly Report Generated',
            description: 'January 2026 PDF Ready',
            userId: schoolAdmin._id,
            icon: 'file-text',
            iconColor: 'blue',
        });

        console.log('📝 Created 3 activity log entries');

        console.log('\n🎉 Firebase Firestore seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Login Credentials:');
        console.log('  School Admin → username: anita  | password: admin123');
        console.log('  Govt Officer → username: rajesh | password: officer123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedDB();
