/**
 * Firebase Admin SDK initialization.
 * Used SERVER-SIDE for verifying ID tokens, managing users, and reading/writing Firestore.
 *
 * Resilient init: if credentials are missing OR clearly placeholder (your-project-id,
 * YOUR_KEY_HERE), we skip cert init so the server can still boot for local
 * smoke-testing. Any Firestore/Auth call will then throw a clear error at runtime
 * rather than crashing the process at module load time.
 */

require('dotenv').config();
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

function looksLikePlaceholder() {
  if (!projectId || !clientEmail || !privateKey) return true;
  if (projectId === 'your-project-id') return true;
  if (clientEmail.includes('your-project')) return true;
  if (privateKey.includes('YOUR_KEY_HERE')) return true;
  if (!privateKey.includes('BEGIN PRIVATE KEY')) return true;
  return false;
}

const credentialsConfigured = !looksLikePlaceholder();

if (!admin.apps.length) {
  if (credentialsConfigured) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      });
    } catch (error) {
      console.error('[firebase-admin] initializeApp failed:', error.message);
      admin.initializeApp({ projectId: projectId || 'unconfigured' });
    }
  } else {
    console.warn(
      '\n\x1b[33m[firebase-admin] WARNING: Firebase credentials are missing or placeholders.\x1b[0m\n' +
      '  The server will boot, but any endpoint that touches Firestore or Auth will fail.\n' +
      '  Fill in real values in .env (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,\n' +
      '  FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID,\n' +
      '  FIREBASE_APP_ID), then restart.\n'
    );
    admin.initializeApp({ projectId: projectId || 'unconfigured' });
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth, credentialsConfigured };
