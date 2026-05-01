# Poshan Darpan — Backend API

REST API for the Poshan Darpan school nutrition monitoring platform.

Stack: **Node.js + Express + Firebase Admin SDK + Firestore + Firebase Auth**.

---

## Setup

### 1. Install dependencies

```bash
cd poshan-darpan-backend
npm install
```

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Authentication** → Sign-in method → Email/Password.
3. **Create a Firestore database** (start in production mode; rules will be added in a later step).
4. **Service account key** (Admin SDK):
   - Project settings → Service accounts → Generate new private key.
   - Copy the `project_id`, `client_email`, and `private_key` values into `.env`.
5. **Web app config** (Client SDK):
   - Project settings → Your apps → Add app → Web → Register.
   - Copy the `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` values into `.env`.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the values from step 2.

> **Important:** the `FIREBASE_PRIVATE_KEY` must include the literal `\n` sequences from the JSON file — they are converted to real newlines at runtime.

### 4. Run the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Health check: <http://localhost:5000/api/health>

---

## Endpoints (Modules 1–6 implemented)

### Auth — `/api/auth`
| Method | Endpoint              | Auth | Role | Description                |
| ------ | --------------------- | ---- | ---- | -------------------------- |
| POST   | `/register`           | No   | -    | Register a new user        |
| POST   | `/login`              | No   | -    | Sign in, returns ID token  |
| POST   | `/logout`             | Yes  | Any  | Revoke refresh tokens      |
| GET    | `/me`                 | Yes  | Any  | Current user profile       |
| POST   | `/forgot-password`    | No   | -    | Send reset email           |
| PUT    | `/profile`            | Yes  | Any  | Update profile             |

### Schools — `/api/schools`
| Method | Endpoint              | Auth | Role | Description                                        |
| ------ | --------------------- | ---- | ---- | -------------------------------------------------- |
| GET    | `/`                   | Yes  | Any  | List schools (school: own; gov: all + filters)     |
| GET    | `/:id`                | Yes  | Any  | School + inventory + recent attendance + alerts    |
| GET    | `/district/:name`     | Yes  | Any  | Schools in a district                              |
| GET    | `/districts/list`     | Yes  | Any  | Unique district names                              |
| POST   | `/`                   | Yes  | Gov  | Create a school (also seeds inventory)             |

### Inventory — `/api/inventory`
| Method | Endpoint              | Auth | Role    | Description                       |
| ------ | --------------------- | ---- | ------- | --------------------------------- |
| GET    | `/:schoolId`          | Yes  | Any     | One school's inventory            |
| GET    | `/`                   | Yes  | Gov     | All inventories                   |
| POST   | `/:schoolId/add`      | Yes  | School  | Add stock + log txn + auto-resolve|
| GET    | `/health/overview`    | Yes  | Gov     | Per-school health %               |

### Attendance — `/api/attendance`
| Method | Endpoint              | Auth | Role    | Description                                |
| ------ | --------------------- | ---- | ------- | ------------------------------------------ |
| POST   | `/submit`             | Yes  | School  | Submit attendance (atomic cascade)         |
| GET    | `/school/:schoolId`   | Yes  | Any     | School's attendance history                |
| GET    | `/today`              | Yes  | Any     | Today's records                            |
| GET    | `/date/:date`         | Yes  | Any     | Records for a specific date                |
| GET    | `/trend/:days`        | Yes  | Gov     | Trend (`days` ∈ {7, 30, 90})               |
| GET    | `/consumption/:days`  | Yes  | Gov     | Rice/wheat/dal consumption                 |

### Alerts — `/api/alerts`
| Method | Endpoint                       | Auth | Role    | Description                       |
| ------ | ------------------------------ | ---- | ------- | --------------------------------- |
| GET    | `/`                            | Yes  | Gov     | All alerts (filters)              |
| GET    | `/school/:schoolId`            | Yes  | Any     | One school's alerts               |
| GET    | `/active`                      | Yes  | Any     | Active only                       |
| GET    | `/active/count`                | Yes  | Any     | Active count                      |
| GET    | `/active/count/:schoolId`      | Yes  | Any     | Active count for a school         |
| PUT    | `/:id/resolve`                 | Yes  | School  | Resolve own school's alert        |
| GET    | `/most-alerted`                | Yes  | Gov     | School with most active alerts    |

### Transactions — `/api/transactions`
| Method | Endpoint              | Auth | Role | Description                  |
| ------ | --------------------- | ---- | ---- | ---------------------------- |
| GET    | `/school/:schoolId`   | Yes  | Any  | One school's transactions    |
| GET    | `/`                   | Yes  | Gov  | All transactions (filters)   |

All authenticated endpoints expect:

```
Authorization: Bearer <firebase-id-token>
```

Auth routes are rate-limited to **20 requests per 15 min per IP**.

---

## Response format

**Success**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Error**
```json
{ "success": false, "message": "...", "error": "ERROR_CODE", "details": [ ... ] }
```

---

## Folder structure

```
poshan-darpan-backend/
├── server.js
├── package.json
├── .env / .env.example
├── config/
│   ├── firebase-admin.js
│   └── firebase-client.js
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── errorHandler.js
├── routes/
│   └── authRoutes.js
├── controllers/
│   └── authController.js
├── utils/
│   ├── constants.js
│   ├── responses.js
│   ├── helpers.js
│   └── validators.js
├── services/        (filled in later modules)
└── scripts/         (seed.js comes later)
```

---

## Seeding the database

Once `.env` is filled with real credentials and the project's Firestore is created:

```bash
npm run seed              # creates docs that don't exist yet (safe to re-run)
npm run seed -- --clean   # wipe collections first, then seed from scratch
```

Demo logins (created in Firebase Auth + Firestore):

| Role       | Email                  | Password    | School         |
| ---------- | ---------------------- | ----------- | -------------- |
| School     | `rajesh@school.com`    | `school123` | s1 / Ujjain    |
| School     | `priya@school.com`     | `school123` | s2 / Indore    |
| School     | `amit@school.com`      | `school123` | s3 / Bhopal    |
| School     | `ramesh@school.com`    | `school123` | s5 / Jabalpur  |
| Government | `sanjay@gov.com`       | `gov123`    | -              |

## What's next

Modules to be built in subsequent prompts: analytics, frontend integration, deployment.
