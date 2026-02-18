const { getDB } = require('../config/db');

const COLLECTION = 'activityLogs';

const ActivityLogHelper = {
    collection: () => getDB().collection(COLLECTION),

    async create(data) {
        const log = {
            schoolId: data.schoolId || null,
            type: data.type, // 'meal_submitted', 'stock_added', etc.
            title: (data.title || '').trim(),
            description: (data.description || '').trim(),
            userId: data.userId,
            icon: data.icon || 'check',
            iconColor: data.iconColor || 'green',
            createdAt: new Date().toISOString(),
        };

        const docRef = await this.collection().add(log);
        return { _id: docRef.id, ...log };
    },

    async find(filter = {}, limit = 10) {
        let query = this.collection();

        if (filter.schoolId) {
            query = query.where('schoolId', '==', filter.schoolId);
        }

        // Fetch all, sort + limit in JS to avoid composite index
        const snapshot = await query.get();
        let results = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        // Sort by createdAt descending
        results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        return results.slice(0, limit);
    },

    async deleteAll() {
        const snapshot = await this.collection().get();
        const batch = getDB().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    },
};

module.exports = ActivityLogHelper;
