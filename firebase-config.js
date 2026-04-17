// ============================================================
// firebase-config.js — Poshan Darpan Firebase Initialization
// ============================================================
// Using Firebase v10 CDN (compat mode not needed — using modular)
// This file is imported as a module by all HTML pages.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBRzYpEHR6rPhIlfkBssPxR03zFI5GJBB8",
    authDomain: "poshan-darpan.firebaseapp.com",
    projectId: "poshan-darpan",
    storageBucket: "poshan-darpan.firebasestorage.app",
    messagingSenderId: "355897523524",
    appId: "1:355897523524:web:4ece8290d6d55f1bf82b11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
