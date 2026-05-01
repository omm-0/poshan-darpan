/**
 * Firestore + Firebase Auth seed script.
 *
 * Usage:
 *   npm run seed             # seed (will skip docs that already exist)
 *   npm run seed -- --clean  # wipe collections first, then seed
 *
 * Seeds:
 *   - 5 schools          (matches frontend mock-data.js IDs s1..s5)
 *   - 5 inventory docs   (sub-collection schools/{id}/inventory/stock)
 *   - 5 Firebase Auth users + Firestore user profiles
 *   - ~40 attendance records (10 per active school × 4 active schools)
 *   - 5 alerts (2 critical, 2 warning, 1 resolved)
 *   - 8 stock transactions
 *
 * Demo creds:
 *   School: rajesh@school.com / school123 (s1)
 *           priya@school.com  / school123 (s2)
 *           amit@school.com   / school123 (s3)
 *           ramesh@school.com / school123 (s5)
 *   Govt:   sanjay@gov.com    / gov123    (district: All)
 */

require('dotenv').config();

const { admin, db, auth } = require('../config/firebase-admin');
const { COLLECTIONS } = require('../utils/constants');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

const ok = (msg) => console.log(`${GREEN}[OK]${RESET} ${msg}`);
const skip = (msg) => console.log(`${YELLOW}[SKIP]${RESET} ${msg}`);
const fail = (msg) => console.log(`${RED}[FAIL]${RESET} ${msg}`);
const info = (msg) => console.log(`${CYAN}[INFO]${RESET} ${msg}`);

const args = process.argv.slice(2);
const CLEAN = args.includes('--clean');

const SCHOOLS = [
  { id: 's1', name: 'Govt Primary School, Ujjain',  district: 'Ujjain',  enrollment: 250, status: 'active',   contactPerson: 'Rajesh Kumar', contactEmail: 'rajesh@school.com' },
  { id: 's2', name: 'Govt Middle School, Indore',   district: 'Indore',  enrollment: 400, status: 'active',   contactPerson: 'Priya Sharma', contactEmail: 'priya@school.com' },
  { id: 's3', name: 'Govt High School, Bhopal',     district: 'Bhopal',  enrollment: 600, status: 'active',   contactPerson: 'Amit Patel',   contactEmail: 'amit@school.com' },
  { id: 's4', name: 'Govt Primary School, Gwalior', district: 'Gwalior', enrollment: 180, status: 'inactive', contactPerson: '-',            contactEmail: '-' },
  { id: 's5', name: 'Govt Middle School, Jabalpur', district: 'Jabalpur', enrollment: 320, status: 'active',  contactPerson: 'Ramesh Yadav', contactEmail: 'ramesh@school.com' }
];

const INVENTORY = {
  s1: { rice: { current: 80,  max: 200 }, wheat: { current: 60,  max: 150 }, dal: { current: 15, max: 50  } },
  s2: { rice: { current: 150, max: 300 }, wheat: { current: 120, max: 250 }, dal: { current: 35, max: 80  } },
  s3: { rice: { current: 30,  max: 400 }, wheat: { current: 200, max: 350 }, dal: { current: 8,  max: 100 } },
  s4: { rice: { current: 90,  max: 150 }, wheat: { current: 70,  max: 120 }, dal: { current: 25, max: 40  } },
  s5: { rice: { current: 45,  max: 250 }, wheat: { current: 30,  max: 200 }, dal: { current: 12, max: 60  } }
};

const USERS = [
  { name: 'Rajesh Kumar',     email: 'rajesh@school.com', password: 'school123', role: 'school',     schoolId: 's1', district: null },
  { name: 'Priya Sharma',     email: 'priya@school.com',  password: 'school123', role: 'school',     schoolId: 's2', district: null },
  { name: 'Amit Patel',       email: 'amit@school.com',   password: 'school123', role: 'school',     schoolId: 's3', district: null },
  { name: 'Ramesh Yadav',     email: 'ramesh@school.com', password: 'school123', role: 'school',     schoolId: 's5', district: null },
  { name: 'Dr. Sanjay Verma', email: 'sanjay@gov.com',    password: 'gov123',    role: 'government', schoolId: null, district: 'All' }
];

const ALERTS = [
  { schoolId: 's3', schoolName: 'Govt High School, Bhopal',     type: 'stock', severity: 'critical', item: 'Rice',  status: 'active',   title: 'CRITICAL: Rice stock critically low',  message: 'Rice stock is at 7.5% (30 kg out of 400 kg). Immediate replenishment needed.',                          tsOffsetMs: -2 * 86400000 + 9 * 3600000 + 30 * 60000,   resolvedAt: null },
  { schoolId: 's3', schoolName: 'Govt High School, Bhopal',     type: 'stock', severity: 'critical', item: 'Dal',   status: 'active',   title: 'CRITICAL: Dal stock critically low',   message: 'Dal stock is at 8% (8 kg out of 100 kg). Immediate replenishment needed.',                              tsOffsetMs: -2 * 86400000 + 9 * 3600000 + 35 * 60000,   resolvedAt: null },
  { schoolId: 's5', schoolName: 'Govt Middle School, Jabalpur', type: 'stock', severity: 'warning',  item: 'Wheat', status: 'active',   title: 'WARNING: Wheat stock low',             message: 'Wheat stock is at 15% (30 kg out of 200 kg). Please reorder soon.',                                     tsOffsetMs: -3 * 86400000 + 14 * 3600000 + 20 * 60000,  resolvedAt: null },
  { schoolId: 's5', schoolName: 'Govt Middle School, Jabalpur', type: 'stock', severity: 'warning',  item: 'Rice',  status: 'active',   title: 'WARNING: Rice stock low',              message: 'Rice stock is at 18% (45 kg out of 250 kg). Please reorder soon.',                                      tsOffsetMs: -3 * 86400000 + 14 * 3600000 + 25 * 60000,  resolvedAt: null },
  { schoolId: 's1', schoolName: 'Govt Primary School, Ujjain',  type: 'stock', severity: 'warning',  item: 'Dal',   status: 'resolved', title: 'Dal stock was low',                    message: 'Dal was at 18% (9 kg out of 50 kg). Now restocked to 15 kg.',                                           tsOffsetMs: -6 * 86400000 + 8 * 3600000,                resolvedAt: -5 * 86400000 + 10 * 3600000 }
];

const TRANSACTIONS = [
  { schoolId: 's1', type: 'addition',  item: 'Rice',  quantity: 50.0, reason: 'Stock delivery',                     tsOffsetMs: -5 * 86400000 + 8 * 3600000 + 30 * 60000 },
  { schoolId: 's1', type: 'deduction', item: 'Rice',  quantity: 22.0, reason: 'Attendance (220 students)',          tsOffsetMs: -2 * 86400000 + 11 * 3600000 },
  { schoolId: 's1', type: 'deduction', item: 'Wheat', quantity: 22.0, reason: 'Attendance (220 students)',          tsOffsetMs: -2 * 86400000 + 11 * 3600000 },
  { schoolId: 's1', type: 'deduction', item: 'Dal',   quantity: 6.6,  reason: 'Attendance (220 students)',          tsOffsetMs: -2 * 86400000 + 11 * 3600000 },
  { schoolId: 's2', type: 'addition',  item: 'Wheat', quantity: 80.0, reason: 'Stock delivery',                     tsOffsetMs: -4 * 86400000 + 9 * 3600000 },
  { schoolId: 's3', type: 'deduction', item: 'Rice',  quantity: 54.0, reason: 'Attendance (540 students)',          tsOffsetMs: -2 * 86400000 + 11 * 3600000 },
  { schoolId: 's5', type: 'addition',  item: 'Dal',   quantity: 25.0, reason: 'Stock delivery',                     tsOffsetMs: -7 * 86400000 + 8 * 3600000 },
  { schoolId: 's5', type: 'deduction', item: 'Wheat', quantity: 28.0, reason: 'Attendance (280 students)',          tsOffsetMs: -2 * 86400000 + 11 * 3600000 }
];

async function deleteCollection(collectionPath) {
  const snap = await db.collection(collectionPath).get();
  if (snap.empty) return 0;
  const docs = snap.docs;
  let deleted = 0;
  while (deleted < docs.length) {
    const batch = db.batch();
    const slice = docs.slice(deleted, deleted + 450);
    slice.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += slice.length;
  }
  return deleted;
}

async function deleteSchoolInventories() {
  const snap = await db.collection(COLLECTIONS.SCHOOLS).get();
  let total = 0;
  for (const doc of snap.docs) {
    const invSnap = await doc.ref.collection('inventory').get();
    if (invSnap.empty) continue;
    const batch = db.batch();
    invSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += invSnap.size;
  }
  return total;
}

async function clean() {
  info('--clean flag detected - wiping collections...');
  const counts = {
    inventory: await deleteSchoolInventories(),
    schools: await deleteCollection(COLLECTIONS.SCHOOLS),
    attendance: await deleteCollection(COLLECTIONS.ATTENDANCE),
    alerts: await deleteCollection(COLLECTIONS.ALERTS),
    transactions: await deleteCollection(COLLECTIONS.TRANSACTIONS),
    users: await deleteCollection(COLLECTIONS.USERS)
  };
  ok(`Wiped: ${JSON.stringify(counts)}`);
}

async function seedSchoolsAndInventory() {
  let createdSchools = 0;
  let createdInventories = 0;

  for (const s of SCHOOLS) {
    const ref = db.collection(COLLECTIONS.SCHOOLS).doc(s.id);
    const existing = await ref.get();
    if (existing.exists) {
      skip(`School ${s.id} already exists - ${s.name}`);
    } else {
      const { id, ...payload } = s;
      await ref.set({
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      ok(`Created school ${id} - ${s.name}`);
      createdSchools++;
    }

    const invRef = ref.collection('inventory').doc('stock');
    const invExists = await invRef.get();
    if (invExists.exists) {
      skip(`Inventory already exists for ${s.id}`);
    } else {
      await invRef.set({
        ...INVENTORY[s.id],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      ok(`Seeded inventory for ${s.id}`);
      createdInventories++;
    }
  }

  return { createdSchools, createdInventories };
}

async function seedUsers() {
  let createdAuth = 0;
  let createdProfiles = 0;
  let reusedAuth = 0;

  for (const u of USERS) {
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.name
      });
      ok(`Created Firebase Auth user ${u.email}`);
      createdAuth++;
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(u.email);
        skip(`Auth user ${u.email} already exists - reusing uid ${userRecord.uid}`);
        reusedAuth++;
      } else {
        fail(`Failed to create auth user ${u.email}: ${error.message}`);
        continue;
      }
    }

    const profileRef = db.collection(COLLECTIONS.USERS).doc(userRecord.uid);
    const profileSnap = await profileRef.get();
    if (profileSnap.exists) {
      skip(`Firestore profile already exists for ${u.email}`);
    } else {
      await profileRef.set({
        name: u.name,
        email: u.email,
        role: u.role,
        schoolId: u.schoolId,
        district: u.district,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null
      });
      ok(`Created Firestore profile for ${u.email}`);
      createdProfiles++;
    }
  }

  return { createdAuth, reusedAuth, createdProfiles };
}

function lastNWorkingDays(n, refDate) {
  const dates = [];
  const cursor = new Date(refDate);
  while (dates.length < n) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates;
}

async function seedAttendance() {
  const existingSnap = await db.collection(COLLECTIONS.ATTENDANCE).limit(1).get();
  if (!existingSnap.empty) {
    skip('Attendance collection already has records - skipping seed (use --clean to reseed)');
    return 0;
  }

  const activeSchools = SCHOOLS.filter((s) => s.status === 'active');
  const refDate = new Date();
  refDate.setUTCHours(11, 0, 0, 0);

  const dates = lastNWorkingDays(10, refDate);

  let count = 0;
  let batch = db.batch();
  let inBatch = 0;

  for (const school of activeSchools) {
    for (const d of dates) {
      const pct = 0.7 + Math.random() * 0.25;
      const studentsPresent = Math.round(school.enrollment * pct);
      const dateStr = d.toISOString().split('T')[0];
      const ref = db.collection(COLLECTIONS.ATTENDANCE).doc();
      batch.set(ref, {
        schoolId: school.id,
        date: dateStr,
        studentsPresent,
        riceUsed: parseFloat((studentsPresent * 0.1).toFixed(2)),
        wheatUsed: parseFloat((studentsPresent * 0.1).toFixed(2)),
        dalUsed: parseFloat((studentsPresent * 0.03).toFixed(2)),
        submittedBy: 'seed',
        timestamp: admin.firestore.Timestamp.fromDate(d)
      });
      inBatch++;
      count++;
      if (inBatch >= 450) {
        await batch.commit();
        batch = db.batch();
        inBatch = 0;
      }
    }
  }
  if (inBatch > 0) await batch.commit();

  ok(`Seeded ${count} attendance records`);
  return count;
}

async function seedAlerts() {
  const existing = await db.collection(COLLECTIONS.ALERTS).limit(1).get();
  if (!existing.empty) {
    skip('Alerts collection already has records - skipping seed');
    return 0;
  }

  const now = Date.now();
  let count = 0;
  const batch = db.batch();
  ALERTS.forEach((a) => {
    const ref = db.collection(COLLECTIONS.ALERTS).doc();
    const ts = admin.firestore.Timestamp.fromMillis(now + a.tsOffsetMs);
    const resolvedAt = a.resolvedAt
      ? admin.firestore.Timestamp.fromMillis(now + a.resolvedAt)
      : null;
    const { tsOffsetMs, resolvedAt: _ra, ...rest } = a;
    batch.set(ref, {
      ...rest,
      timestamp: ts,
      resolvedAt
    });
    count++;
  });
  await batch.commit();
  ok(`Seeded ${count} alerts`);
  return count;
}

async function seedTransactions() {
  const existing = await db.collection(COLLECTIONS.TRANSACTIONS).limit(1).get();
  if (!existing.empty) {
    skip('Transactions collection already has records - skipping seed');
    return 0;
  }

  const now = Date.now();
  let count = 0;
  const batch = db.batch();
  TRANSACTIONS.forEach((t) => {
    const ref = db.collection(COLLECTIONS.TRANSACTIONS).doc();
    const { tsOffsetMs, ...rest } = t;
    batch.set(ref, {
      ...rest,
      performedBy: 'seed',
      timestamp: admin.firestore.Timestamp.fromMillis(now + tsOffsetMs)
    });
    count++;
  });
  await batch.commit();
  ok(`Seeded ${count} transactions`);
  return count;
}

async function main() {
  console.log(`${BOLD}${CYAN}\n=== Poshan Darpan Firestore Seed ===${RESET}\n`);

  if (CLEAN) {
    await clean();
  }

  info('Seeding schools + inventory...');
  const sRes = await seedSchoolsAndInventory();

  info('Seeding users...');
  const uRes = await seedUsers();

  info('Seeding attendance records...');
  const attCount = await seedAttendance();

  info('Seeding alerts...');
  const alertCount = await seedAlerts();

  info('Seeding transactions...');
  const txCount = await seedTransactions();

  console.log(`\n${BOLD}${GREEN}=== SUMMARY ===${RESET}`);
  console.log(`Schools created:       ${sRes.createdSchools} (of ${SCHOOLS.length})`);
  console.log(`Inventories created:   ${sRes.createdInventories}`);
  console.log(`Auth users created:    ${uRes.createdAuth} (reused: ${uRes.reusedAuth})`);
  console.log(`User profiles created: ${uRes.createdProfiles}`);
  console.log(`Attendance records:    ${attCount}`);
  console.log(`Alerts:                ${alertCount}`);
  console.log(`Transactions:          ${txCount}`);
  console.log(`\n${BOLD}Demo logins:${RESET}`);
  console.log('  School: rajesh@school.com / school123 (Ujjain - s1)');
  console.log('  School: priya@school.com  / school123 (Indore - s2)');
  console.log('  School: amit@school.com   / school123 (Bhopal - s3)');
  console.log('  School: ramesh@school.com / school123 (Jabalpur - s5)');
  console.log('  Govt:   sanjay@gov.com    / gov123\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`${RED}[FATAL]${RESET}`, err);
    process.exit(1);
  });
