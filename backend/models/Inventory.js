const { getDB } = require('../config/db');

const COLLECTION = 'inventory';

const InventoryHelper = {
    collection: () => getDB().collection(COLLECTION),

    async create(data) {
        const item = {
            schoolId: data.schoolId,
            name: (data.name || '').trim(),
            unit: data.unit, // 'kg', 'L', 'packets', 'pieces'
            quantity: data.quantity || 0,
            maxCapacity: data.maxCapacity,
            color: data.color || '#F97316',
            lastUpdated: new Date().toISOString(),
            updatedBy: data.updatedBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await this.collection().add(item);
        return { _id: docRef.id, ...item, ...this.computeVirtuals(item) };
    },

    // Compute virtual fields (replaces Mongoose virtuals)
    computeVirtuals(item) {
        const percentFull = item.maxCapacity > 0
            ? Math.round((item.quantity / item.maxCapacity) * 100)
            : 0;
        return {
            percentFull,
            isLowStock: percentFull < 20,
        };
    },

    async findById(id) {
        const doc = await this.collection().doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data();
        return { _id: doc.id, ...data, ...this.computeVirtuals(data) };
    },

    async find(filter = {}) {
        let query = this.collection();

        if (filter.schoolId) {
            query = query.where('schoolId', '==', filter.schoolId);
        }

        query = query.orderBy('name');
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { _id: doc.id, ...data, ...this.computeVirtuals(data) };
        });
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

module.exports = InventoryHelper;
