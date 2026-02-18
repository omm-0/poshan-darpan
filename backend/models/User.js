const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');

const COLLECTION = 'users';

const UserHelper = {
    collection: () => getDB().collection(COLLECTION),

    // Create a new user (hashes password)
    async create(data) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        const userData = {
            username: (data.username || '').toLowerCase().trim(),
            password: hashedPassword,
            fullName: (data.fullName || '').trim(),
            role: data.role, // 'school_admin' or 'govt_officer'
            designation: data.designation || '',
            schoolId: data.schoolId || null,
            district: data.district || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await this.collection().add(userData);
        return { _id: docRef.id, ...userData };
    },

    // Find user by username (includes password for login)
    async findByUsername(username) {
        const snapshot = await this.collection()
            .where('username', '==', username.toLowerCase().trim())
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { _id: doc.id, ...doc.data() };
    },

    // Find user by ID (excludes password by default)
    async findById(id, includePassword = false) {
        const doc = await this.collection().doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data();
        if (!includePassword) delete data.password;
        return { _id: doc.id, ...data };
    },

    // Find user by ID with populated school data
    async findByIdPopulated(id) {
        const user = await this.findById(id);
        if (!user || !user.schoolId) return user;

        // Populate school
        const SchoolHelper = require('./School');
        const school = await SchoolHelper.findById(user.schoolId);
        if (school) {
            user.schoolId = school; // Replace ID with full school object
        }
        return user;
    },

    // Compare passwords
    async matchPassword(enteredPassword, hashedPassword) {
        return await bcrypt.compare(enteredPassword, hashedPassword);
    },

    // Update user
    async update(id, data) {
        data.updatedAt = new Date().toISOString();
        await this.collection().doc(id).update(data);
        return this.findById(id);
    },

    // Delete all users
    async deleteAll() {
        const snapshot = await this.collection().get();
        const batch = getDB().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    },
};

module.exports = UserHelper;
