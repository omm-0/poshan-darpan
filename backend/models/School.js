const { getDB } = require('../config/db');

const COLLECTION = 'schools';

const SchoolHelper = {
    collection: () => getDB().collection(COLLECTION),

    async create(data) {
        const schoolData = {
            name: data.name,
            district: data.district,
            block: data.block,
            totalEnrolled: data.totalEnrolled || 0,
            principalId: data.principalId || null,
            address: data.address || '',
            contactPhone: data.contactPhone || '',
            menuOptions: data.menuOptions || ['Rice & Dal', 'Roti & Seasonal Sabzi', 'Khichdi', 'Kheer & Puri'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await this.collection().add(schoolData);
        return { _id: docRef.id, ...schoolData };
    },

    async findById(id) {
        if (!id) return null;
        const doc = await this.collection().doc(id).get();
        if (!doc.exists) return null;
        return { _id: doc.id, ...doc.data() };
    },

    async findAll(filter = {}) {
        let query = this.collection();

        if (filter.district) {
            query = query.where('district', '==', filter.district);
        }

        const snapshot = await query.get();
        const results = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        // Sort by name in JS to avoid composite index
        return results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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

module.exports = SchoolHelper;
