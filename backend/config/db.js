const admin = require('firebase-admin');
const path = require('path');

let db;

const connectDB = () => {
    try {
        const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        db = admin.firestore();
        console.log('✅ Firebase Firestore Connected');
    } catch (error) {
        console.error(`❌ Firebase Init Error: ${error.message}`);
        console.error('   Make sure config/serviceAccountKey.json exists');
        console.error('   Download it from Firebase Console → Project Settings → Service accounts');
        process.exit(1);
    }
};

const getDB = () => db;

module.exports = { connectDB, getDB };
