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

        if (filter.dateFrom) {
            query = query.where('date', '>=', new Date(filter.dateFrom).toISOString());
        }
        if (filter.dateTo) {
            query = query.where('date', '<=', new Date(filter.dateTo).toISOString());
        }

        // Sort by date descending by default
        const sortField = options.sortField || 'date';
        const sortDir = options.sortDir || 'desc';
        query = query.orderBy(sortField, sortDir);

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
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
        let query = this.collection()
            .where('date', '>=', startDate.toISOString())
            .where('date', '<=', endDate.toISOString());

        if (schoolId) {
            query = query.where('schoolId', '==', schoolId);
        }

        query = query.orderBy('date', 'asc');
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
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
