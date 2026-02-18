const { getDB } = require('../config/db');

const COLLECTION = 'reports';

const ReportHelper = {
    collection: () => getDB().collection(COLLECTION),

    async create(data) {
        const report = {
            schoolId: data.schoolId,
            month: data.month,
            year: data.year,
            fileName: data.fileName,
            filePath: data.filePath,
            generatedBy: data.generatedBy,
            totalMealsServed: data.totalMealsServed || 0,
            avgAttendance: data.avgAttendance || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await this.collection().add(report);
        return { _id: docRef.id, ...report };
    },

    // Find or update existing report (upsert behavior)
    async upsert(schoolId, month, year, data) {
        const snapshot = await this.collection()
            .where('schoolId', '==', schoolId)
            .where('month', '==', month)
            .where('year', '==', year)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            // Update existing
            const doc = snapshot.docs[0];
            data.updatedAt = new Date().toISOString();
            await doc.ref.update(data);
            const updated = await doc.ref.get();
            return { _id: updated.id, ...updated.data() };
        } else {
            // Create new
            return this.create({ schoolId, month, year, ...data });
        }
    },

    async findById(id) {
        const doc = await this.collection().doc(id).get();
        if (!doc.exists) return null;
        return { _id: doc.id, ...doc.data() };
    },

    async find(filter = {}) {
        let query = this.collection();

        if (filter.schoolId) {
            query = query.where('schoolId', '==', filter.schoolId);
        }

        // Fetch all, filter + sort in JS to avoid composite indexes
        const snapshot = await query.get();
        let results = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        if (filter.year) {
            const yr = parseInt(filter.year);
            results = results.filter(r => r.year === yr);
        }

        // Sort by year desc, then month desc
        results.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.month - a.month;
        });

        return results;
    },

    async deleteAll() {
        const snapshot = await this.collection().get();
        const batch = getDB().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    },
};

module.exports = ReportHelper;
