/**
 * Firebase Client SDK initialization.
 * Used by the backend ONLY for password-based sign-in (signInWithEmailAndPassword)
 * which returns the ID token that the frontend will use for subsequent requests.
 *
 * The Admin SDK cannot do password sign-in (it has elevated privileges and bypasses
 * password verification entirely), so we keep a parallel Client SDK app instance.
 */

require('dotenv').config();
const { initializeApp, getApps, getApp } = require('firebase/app');
const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const CLIENT_APP_NAME = 'clientApp';

const clientApp = getApps().some((app) => app.name === CLIENT_APP_NAME)
  ? getApp(CLIENT_APP_NAME)
  : initializeApp(firebaseConfig, CLIENT_APP_NAME);

const clientAuth = getAuth(clientApp);

module.exports = {
  clientApp,
  clientAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
};
