// ============================================================
// db.js — Firestore Database Operations for Poshan Darpan
// ============================================================

import { db } from "./firebase-config.js";
import {
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    increment,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ════════════════════════════════════════════════════════════
//  SCHOOL DASHBOARD — READ FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Get school profile data (name, enrolled, district, status).
 */
export async function getSchoolProfile(schoolId) {
    const snap = await getDoc(doc(db, "schools", schoolId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Get current inventory levels for a school.
 * Returns { rice, wheat, dal } each with { current, max }.
 */
export async function getInventory(schoolId) {
    const snap = await getDoc(doc(db, "schools", schoolId, "inventory", "stock"));
    return snap.exists() ? snap.data() : null;
}

/**
 * Real-time listener for inventory. Calls callback whenever data changes.
 * Returns the unsubscribe function.
 */
export function listenToInventory(schoolId, callback) {
    return onSnapshot(
        doc(db, "schools", schoolId, "inventory", "stock"),
        (snap) => {
            if (snap.exists()) callback(snap.data());
        }
    );
}

/**
 * Get attendance & meal report history for a school.
 * Returns array of records, latest first.
 */
export async function getAttendanceHistory(schoolId) {
    const q = query(
        collection(db, "attendance"),
        where("schoolId", "==", schoolId),
        orderBy("timestamp", "desc"),
        limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time listener for attendance history. Calls callback on any change.
 * Returns unsubscribe function.
 */
export function listenToAttendanceHistory(schoolId, callback) {
    const q = query(
        collection(db, "attendance"),
        where("schoolId", "==", schoolId),
        orderBy("timestamp", "desc"),
        limit(30)
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
}

// ════════════════════════════════════════════════════════════
//  SCHOOL DASHBOARD — WRITE FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Submit daily attendance. Auto-deducts meal portions from inventory.
 * Checks for sufficient stock first — throws if insufficient.
 *
 * Deduction rules (per student):
 *   Rice  : 100g (0.1 kg)
 *   Wheat : 100g (0.1 kg)
 *   Dal   : 30g  (0.03 kg)
 */
export async function submitAttendance(schoolId, date, studentsPresent) {
    const riceUsed = parseFloat((studentsPresent * 0.1).toFixed(2));
    const wheatUsed = parseFloat((studentsPresent * 0.1).toFixed(2));
    const dalUsed = parseFloat((studentsPresent * 0.03).toFixed(2));

    const stockRef = doc(db, "schools", schoolId, "inventory", "stock");

    await runTransaction(db, async (transaction) => {
        const stockSnap = await transaction.get(stockRef);
        if (!stockSnap.exists()) throw new Error("Inventory not found.");

        const stock = stockSnap.data();

        if (stock.rice.current < riceUsed) {
            throw new Error(`Insufficient Rice! Needed: ${riceUsed}kg, Available: ${stock.rice.current}kg`);
        }
        if (stock.dal.current < dalUsed) {
            throw new Error(`Insufficient Dal! Needed: ${dalUsed}kg, Available: ${stock.dal.current}kg`);
        }

        // Deduct stock
        transaction.update(stockRef, {
            "rice.current": parseFloat((stock.rice.current - riceUsed).toFixed(2)),
            "wheat.current": parseFloat((stock.wheat.current - wheatUsed).toFixed(2)),
            "dal.current": parseFloat((stock.dal.current - dalUsed).toFixed(2)),
        });

        // Log attendance record
        const attRef = doc(collection(db, "attendance"));
        transaction.set(attRef, {
            schoolId,
            date,
            studentsPresent,
            riceUsed,
            wheatUsed,
            dalUsed,
            timestamp: serverTimestamp(),
        });

        // Auto-check inventory levels and create alerts if needed
        const newRice = stock.rice.current - riceUsed;
        const newDal = stock.dal.current - dalUsed;
        const ricePercent = (newRice / stock.rice.max) * 100;
        const dalPercent = (newDal / stock.dal.max) * 100;

        // Create alert if rice or dal goes below 20%
        if (ricePercent < 20) {
            const alertRef = doc(collection(db, "alerts"));
            transaction.set(alertRef, {
                schoolId,
                type: "stock",
                severity: ricePercent < 10 ? "critical" : "warning",
                title: `Critical Stock Level: Rice`,
                message: `School ${schoolId} has only ${newRice.toFixed(1)}kg of Rice remaining (below 20% threshold).`,
                status: "active",
                timestamp: serverTimestamp(),
            });
        }
        if (dalPercent < 20) {
            const alertRef = doc(collection(db, "alerts"));
            transaction.set(alertRef, {
                schoolId,
                type: "stock",
                severity: dalPercent < 10 ? "critical" : "warning",
                title: `Critical Stock Level: Dal`,
                message: `School ${schoolId} has only ${newDal.toFixed(1)}kg of Dal remaining (below 20% threshold).`,
                status: "active",
                timestamp: serverTimestamp(),
            });
        }
    });

    return { riceUsed, wheatUsed, dalUsed };
}

/**
 * Add a new stock delivery for a school.
 * Updates the inventory document and clamps to max if needed.
 */
export async function addStock(schoolId, item, qty) {
    const stockRef = doc(db, "schools", schoolId, "inventory", "stock");

    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(stockRef);
        if (!snap.exists()) throw new Error("Inventory not found.");

        const stock = snap.data();
        const newCurrent = parseFloat((stock[item].current + qty).toFixed(2));
        const newMax = Math.max(stock[item].max, newCurrent);

        transaction.update(stockRef, {
            [`${item}.current`]: newCurrent,
            [`${item}.max`]: newMax,
        });
    });
}

// ════════════════════════════════════════════════════════════
//  GOVERNMENT DASHBOARD — READ FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Get aggregated state-level analytics.
 */
export async function getStateAnalytics() {
    const snap = await getDoc(doc(db, "analytics", "state"));
    return snap.exists() ? snap.data() : null;
}

/**
 * Real-time listener for state analytics.
 * Returns unsubscribe function.
 */
export function listenToStateAnalytics(callback) {
    return onSnapshot(doc(db, "analytics", "state"), (snap) => {
        if (snap.exists()) callback(snap.data());
    });
}

/**
 * Get all schools from the registry.
 */
export async function getAllSchools() {
    const snap = await getDocs(collection(db, "schools"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time listener for school registry.
 * Returns unsubscribe function.
 */
export function listenToSchools(callback) {
    return onSnapshot(collection(db, "schools"), (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
}

/**
 * Get all active compliance alerts.
 */
export async function getAlerts() {
    const q = query(
        collection(db, "alerts"),
        where("status", "==", "active"),
        orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time listener for active alerts.
 * Returns unsubscribe function.
 */
export function listenToAlerts(callback) {
    const q = query(
        collection(db, "alerts"),
        where("status", "==", "active"),
        orderBy("timestamp", "desc")
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
}

// ════════════════════════════════════════════════════════════
//  GOVERNMENT DASHBOARD — WRITE FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Update an alert's status (e.g., "active" → "resolved" or "dispatched").
 */
export async function updateAlertStatus(alertId, status) {
    await updateDoc(doc(db, "alerts", alertId), {
        status,
        resolvedAt: serverTimestamp(),
    });
}

/**
 * Increment state-level analytics (total meals served).
 * Called when a school submits attendance.
 */
export async function incrementStateMeals(count) {
    await updateDoc(doc(db, "analytics", "state"), {
        totalMealsServed: increment(count),
    });
}

/**
 * Update active alert count in state analytics.
 */
export async function recalcActiveAlerts() {
    const q = query(collection(db, "alerts"), where("status", "==", "active"));
    const snap = await getDocs(q);
    await updateDoc(doc(db, "analytics", "state"), {
        activeAlerts: snap.size,
    });
}
