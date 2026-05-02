/**
 * Firebase Client SDK initialization.
 * Used by the backend ONLY for password-based sign-in (signInWithEmailAndPassword)
 * which returns the ID token that the frontend will use for subsequent requests.
 *
 * The Admin SDK cannot do password sign-in (it has elevated privileges and bypasses
 * password verification entirely), so we keep a parallel Client SDK app instance.
 *
 * Resilient init: if web-app credentials are missing or placeholder values, we skip
 * initializeApp() and expose stubs that throw a clear error if called. This lets the
 * server boot for smoke-testing without crashing.
 */

require('dotenv').config();
const { initializeApp, getApps, getApp } = require('firebase/app');
const firebaseAuth = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const CLIENT_APP_NAME = 'clientApp';

function looksLikePlaceholder() {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  for (const key of required) {
    const v = firebaseConfig[key];
    if (!v) return true;
    if (typeof v !== 'string') return true;
    if (v.startsWith('your-')) return true;
    if (v.includes('your-project')) return true;
  }
  return false;
}

const clientConfigured = !looksLikePlaceholder();

let clientApp = null;
let clientAuth = null;

if (clientConfigured) {
  try {
    clientApp = getApps().some((app) => app.name === CLIENT_APP_NAME)
      ? getApp(CLIENT_APP_NAME)
      : initializeApp(firebaseConfig, CLIENT_APP_NAME);
    clientAuth = firebaseAuth.getAuth(clientApp);
  } catch (error) {
    console.error('[firebase-client] initializeApp failed:', error.message);
    clientApp = null;
    clientAuth = null;
  }
} else {
  console.warn(
    '\n\x1b[33m[firebase-client] WARNING: Web SDK credentials missing/placeholder.\x1b[0m\n' +
    '  signInWithEmailAndPassword and password reset will throw a configuration error\n' +
    '  until FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID\n' +
    '  are filled in .env.\n'
  );
}

function notConfiguredError() {
  const err = new Error('Firebase Web SDK credentials are not configured. Update .env and restart.');
  err.code = 'auth/configuration-not-set';
  return err;
}

async function signInWithEmailAndPassword(authArg, email, password) {
  if (!clientAuth) throw notConfiguredError();
  return firebaseAuth.signInWithEmailAndPassword(authArg || clientAuth, email, password);
}

async function createUserWithEmailAndPassword(authArg, email, password) {
  if (!clientAuth) throw notConfiguredError();
  return firebaseAuth.createUserWithEmailAndPassword(authArg || clientAuth, email, password);
}

async function sendPasswordResetEmail(authArg, email) {
  if (!clientAuth) throw notConfiguredError();
  return firebaseAuth.sendPasswordResetEmail(authArg || clientAuth, email);
}

module.exports = {
  clientApp,
  clientAuth,
  clientConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
};
