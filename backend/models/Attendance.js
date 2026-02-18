const { getDB } = require('../config/db');

const COLLECTION = 'attendance';

const AttendanceHelper = {
    collection: () => getDB().collection(COLLECTION),

    async create(data) {
        // Check for duplicate (same school + date)
        const dateStr = new Date(data.date).toISOString().split('T')[0];
        const existing = await this.collection()
            .where('schoolId', '==', data.schoolId)
            .where('dateStr', '==', dateStr)
            .limit(1)
            .get();

        if (!existing.empty) {
            const error = new Error('Attendance for this date has already been submitted');
            error.code = 11000;
            throw error;
        }

        const record = {
            schoolId: data.schoolId,
            date: new Date(data.date).toISOString(),
            dateStr, // YYYY-MM-DD for easy querying
            totalEnrolled: data.totalEnrolled,
            studentsPresent: data.studentsPresent,
            menuServed: data.menuServed,
            submittedBy: data.submittedBy,
            verified: data.verified || false,
            verifiedBy: data.verifiedBy || null,
            verifiedAt: data.verifiedAt || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await this.collection().add(record);
        return { _id: docRef.id, ...record };
    },

    async findById(id) {
        const doc = await this.collection().doc(id).get();
        if (!doc.exists) return null;
        return { _id: doc.id, ...doc.data() };
    },

    async find(filter = {}, options = {}) {
        let query = this.collection();

        if (filter.schoolId) {
            query = query.where('schoolId', '==', filter.schoolId);
        }

        // Fetch all matching docs, then filter + sort in JS
        const snapshot = await query.get();
        let results = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        // Date range filter in JS
        if (filter.dateFrom) {
            const from = new Date(filter.dateFrom).toISOString();
            results = results.filter(r => r.date >= from);
        }
        if (filter.dateTo) {
            const to = new Date(filter.dateTo).toISOString();
            results = results.filter(r => r.date <= to);
        }

        // Sort by date descending
        results.sort((a, b) => b.date.localeCompare(a.date));

        // Limit
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    },

    // Find today's attendance for a school
    async findToday(schoolId) {
        const todayStr = new Date().toISOString().split('T')[0];
        let query = this.collection().where('dateStr', '==', todayStr);

        if (schoolId) {
            query = query.where('schoolId', '==', schoolId);
        }

        const snapshot = await query.limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { _id: doc.id, ...doc.data() };
    },

    // Find records within a date range for a school
    async findInRange(schoolId, startDate, endDate) {
        let query = this.collection();

        if (schoolId) {
            query = query.where('schoolId', '==', schoolId);
        }

        // Fetch all for school, filter date range in JS
        const snapshot = await query.get();
        let results = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        results = results.filter(r => r.date >= startISO && r.date <= endISO);

        // Sort ascending
        results.sort((a, b) => a.date.localeCompare(b.date));
        return results;
    },

    async update(id, data) {
        data.updatedAt = new Date().toISOString();
        await this.collection().doc(id).update(data);
        return this.findById(id);
    },

    async deleteAll() {
        const snapshot = await this.collection().get();
        const batch = getDB().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    },
};

module.exports = AttendanceHelper;
