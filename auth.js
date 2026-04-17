// ============================================================
// auth.js — Authentication utilities for Poshan Darpan
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─── Login ───────────────────────────────────────────────────
/**
 * Sign in with email and password.
 * Returns { user, profile } on success.
 * Throws on failure.
 */
export async function loginUser(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(credential.user.uid);
    return { user: credential.user, profile };
}

// ─── Logout ──────────────────────────────────────────────────
/**
 * Signs the user out and redirects to login page.
 */
export async function logoutUser() {
    await signOut(auth);
    window.location.href = "login.html";
}

// ─── Get User Profile ────────────────────────────────────────
/**
 * Fetches user profile from Firestore users/{uid}.
 * Returns the profile data or null.
 */
export async function getUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

// ─── Auth Guard ──────────────────────────────────────────────
/**
 * Checks authentication state.
 * If user is not logged in → redirect to login.html
 * If user role doesn't match allowedRole → redirect to login.html
 * Returns the user profile if all checks pass.
 *
 * Usage: const profile = await requireAuth('school');
 */
export function requireAuth(allowedRole) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // unsubscribe immediately after first check
            if (!user) {
                window.location.href = "login.html";
                reject(new Error("Not authenticated"));
                return;
            }
            try {
                const profile = await getUserProfile(user.uid);
                if (!profile) {
                    window.location.href = "login.html";
                    reject(new Error("No profile found"));
                    return;
                }
                if (allowedRole && profile.role !== allowedRole) {
                    // Wrong role: redirect to correct dashboard
                    if (profile.role === "school") {
                        window.location.href = "school-dashboard.html";
                    } else if (profile.role === "gov") {
                        window.location.href = "gov-dashboard.html";
                    } else {
                        window.location.href = "login.html";
                    }
                    reject(new Error("Wrong role"));
                    return;
                }
                resolve({ user, profile });
            } catch (err) {
                window.location.href = "login.html";
                reject(err);
            }
        });
    });
}

// ─── Current User ────────────────────────────────────────────
/**
 * Returns the currently signed-in Firebase user, or null.
 */
export function getCurrentUser() {
    return auth.currentUser;
}
