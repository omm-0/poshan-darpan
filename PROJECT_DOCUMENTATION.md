# POSHAN DARPAN — पोषण दर्पण
### A Digital Platform for School Nutrition Program Monitoring

---

**Project Title:** POSHAN DARPAN — पोषण दर्पण
**Subtitle:** A Digital Platform for School Nutrition Program Monitoring
**College Name:** YOUR COLLEGE NAME
**Department:** Department of Computer Science / Information Technology
**Academic Year:** 2025-2026
**Submitted By:** Student Name — Roll No
**Guided By:** Prof. XYZ
**Date:** April 2026

---

## Table of Contents

1. Introduction 

---

## 1. Introduction

The **Pradhan Mantri Poshan Shakti Nirman (PM POSHAN)** scheme — formerly known as the Mid-Day Meal Scheme — is one of the world's largest school-feeding programmes. Originally mandated by the Government of India in 1995 and reinforced by a Supreme Court order in 2001, the scheme today serves approximately 11.8 crore children in 11.20 lakh government and government-aided schools across the country. The objective is two-fold: address childhood malnutrition by ensuring at least one nutritious cooked meal per school day, and increase enrolment, attendance, and retention in elementary education.

Despite the scale and success of the programme, day-to-day operations at school level continue to depend on **paper-based registers, manual stock counting, and monthly consolidated reports** sent up the administrative chain. This results in several systemic problems: delayed visibility for district and state officials, frequent stock-outs of staples such as rice, wheat, and pulses, food wastage due to over-cooking on low-attendance days, and an absence of any objective audit trail. School coordinators must phone block-level officers when supplies run low, and government officials have no real-time mechanism to compare performance across schools or anticipate procurement needs.

This project, **Poshan Darpan** (literally "Nutrition Mirror"), is a web-based prototype that demonstrates how a modern digital monitoring platform can address these gaps. The system provides two role-based dashboards — one for **School Administrators** and one for **Government Officials** — each tailored to the operational needs of its user. A school administrator can record daily attendance, watch the system automatically deduct the appropriate meal portions from inventory (rice and wheat at 100 g per student, dal at 30 g per student), add stock when deliveries arrive, and monitor critical alerts when supplies fall to dangerous levels. A government official, by contrast, sees an aggregated view: total schools, total students served today, district-wise attendance comparisons, school-by-school inventory health, and a feed of every alert raised across the entire network.

The scope of the prototype is intentionally focused on the operational core of the programme — inventory management, attendance-driven meal accounting, alert generation, and analytics — without venturing into payroll, vendor management, or financial reconciliation. The application is implemented using only **HTML5, CSS3, and vanilla JavaScript ES6+** with **Chart.js** for data visualization and **localStorage** for client-side persistence. No server, database, or build pipeline is required, allowing the entire application to run by simply double-clicking the `index.html` file in any modern browser. This deliberate technical simplicity makes the prototype an ideal teaching artefact while still demonstrating, in production-quality detail, every feature a real-world deployment would require.

---

## 2. Problem Statement

Government schools across India operate the world's largest mid-day meal programme, yet the day-to-day operations of this programme are still **largely manual, paper-driven, and opaque to oversight authorities**. School staff record attendance and inventory by hand, calculate daily meal portions using mental arithmetic, and rely on telephone calls to report stock shortages. Government officials at the district, state, and national levels must wait for monthly consolidated reports to assess programme effectiveness, leaving them unable to respond in real time to stock-outs, attendance anomalies, or operational failures.

This manual workflow leads to **avoidable food wastage, delayed alerts, frequent stock-outs, inconsistent reporting, and an inability to compare school performance objectively**. There is no automated way to detect that a school has only two days of rice remaining, no aggregate dashboard to identify the lowest-performing district, and no audit trail to verify that meals reported as served were indeed served. The absence of digital tooling not only constrains decision-making but also makes the programme vulnerable to leakage and inefficiency.

**Poshan Darpan addresses these challenges by providing** a unified, role-based digital platform that automates daily attendance recording, deducts meal portions from inventory in real time, generates threshold-based alerts when stock levels fall below safety limits, and presents government officials with rich analytical dashboards for cross-school monitoring and trend analysis.

---

## 3. Objectives

1. To develop a **role-based web application** that distinguishes between School Administrators and Government Officials and presents each role with the views and controls appropriate to their responsibilities.
2. To **automate inventory deduction** based on daily attendance records, eliminating the need for manual portion-size calculations.
3. To provide **real-time stock-level monitoring** with colour-coded visual indicators (Healthy, Low, Critical) for rice, wheat, and dal at every school.
4. To **generate automated alerts** when an item's stock drops below a Warning threshold (20 %) or a Critical threshold (10 %), and to **auto-resolve those alerts** when stock is replenished above the safe line.
5. To provide government officials with **aggregate analytics** including total active schools, total enrolment, today's meals served, district-wise attendance comparisons, and inventory-health rankings.
6. To create **interactive data visualisations** including line charts for attendance trends, doughnut charts for meal distribution, horizontal bar charts for inventory health, and grouped bar charts for school comparison.
7. To implement **fully responsive design** that works on desktop (≥ 1024 px), tablet (768–1024 px), and mobile (< 768 px) devices using only CSS Grid, Flexbox, and media queries.
8. To build a **prototype that demonstrates the complete workflow without requiring any server-side infrastructure**, validating that the user experience and feature set are sound before any production back-end is built.
9. To ensure **data persistence across browser sessions** using the Web Storage API (`localStorage`), so that user-entered data is preserved across page refreshes and tab closures.
10. To ship a code-base that is **clean, modular, and reproducible** so that any future developer can extend it — for example, by replacing the `localStorage` data layer with a Firebase or REST back-end — without rewriting application logic.

---

## 4. Literature Survey

**4.1 Mid-Day Meal Scheme in India.** The National Programme of Nutritional Support to Primary Education was launched on 15 August 1995 and was made universal under a 2001 Supreme Court directive. The programme was rebranded as **PM POSHAN (Pradhan Mantri Poshan Shakti Nirman)** in 2021, expanding to cover Bal Vatika (pre-primary) students with an estimated central outlay of ₹54,000 crore over 2021–26. Independent studies (Drèze & Goyal, 2003; Singh et al., 2014) have established statistically significant positive impacts on enrolment, attendance, learning outcomes, and child nutrition. The scheme's relevance to this project is direct: Poshan Darpan is designed to support exactly the kind of school-level operational accounting the programme requires.

**4.2 Existing Digital Solutions.** The Government of India operates the **MDM-MIS web portal** (Ministry of Education) where states upload monthly meal-served and stock-on-hand data. The **Automated Monitoring System (AMS)** uses IVRS calls to school heads to confirm meal delivery. State-level innovations include Tamil Nadu's mid-day-meal mobile app and Karnataka's NMP. These systems generally suffer from one or more of: delayed reporting cadence (monthly rather than daily), low data fidelity (school staff input "round numbers"), and lack of real-time alerting. Poshan Darpan's design directly addresses these limitations by tying inventory deduction to the moment attendance is recorded.

**4.3 Web Technologies for Government Services.** The **Digital India** initiative (launched 2015) has driven adoption of web-based and mobile-first delivery for citizen services such as DigiLocker, Aadhaar self-service, and CoWIN. Research (Goswami, 2019; Rana et al., 2020) shows that lightweight web platforms with low data requirements perform best in low-connectivity rural environments. Poshan Darpan's choice of pure-frontend, CDN-cached architecture follows this principle: total payload is under 200 KB, and the application functions even after the first load with no further network calls.

**4.4 Data Visualisation in Decision Making.** A substantial body of HCI research (Few, 2013; Heer & Shneiderman, 2012) shows that well-designed dashboards reduce cognitive load and improve operational decision quality, particularly when colour coding follows the universal traffic-light convention (green = healthy, amber = warning, red = critical). Chart.js, the visualisation library used in this project, is one of the most widely adopted open-source charting tools because of its small footprint (~ 60 KB gzipped), animation support, and accessible defaults. Poshan Darpan uses seven distinct chart types, each chosen to match the underlying data shape: line charts for time-series, doughnut charts for part-to-whole distribution, and bar charts for categorical comparison.

**4.5 Client-Side Web Applications.** Modern browsers expose a complete suite of client-side APIs — `localStorage`, `IndexedDB`, Service Workers, WebSockets — that allow rich applications to be built without any back-end infrastructure. The Web Storage API (Hickson, W3C 2016) provides synchronous key-value storage with a 5–10 MB quota per origin. Poshan Darpan uses `localStorage` to persist users, schools, inventory, attendance, alerts, and transactions, demonstrating that a complete operational system can be prototyped client-side before any server commitment is made. This approach mirrors the increasingly popular **Jamstack** architecture (Biilmann & Hawksworth, 2019) where front-end logic is decoupled from any specific back-end.

---

## 5. System Analysis

### 5.1 Existing System & Limitations

The existing operational workflow at most government schools relies on a hand-written **Mid-Day Meal Register**, a separate **Stock Register**, and a **Monthly Utilisation Report** that is typed up at the block office. The process is summarised below.

| Function | Current Practice | Limitation |
|---|---|---|
| Daily attendance recording | Hand-written class register | Error-prone; no automated portion calculation |
| Inventory tracking | Stock register updated weekly | Stale figures; under-reporting common |
| Stock alerts | Phone call to block officer | No threshold-based detection; reactive only |
| Government oversight | Monthly consolidated reports | One-month visibility lag |
| Cross-school comparison | Not feasible | No standard data format |
| Audit trail | Paper signatures | Not searchable, easily lost |
| Analytics | Manual tabulation | High effort, low frequency |
| Performance reporting | Ad-hoc Excel sheets | No drill-down or trend view |

### 5.2 Proposed System & Advantages

| Feature | Existing System | Proposed System (Poshan Darpan) |
|---|---|---|
| Attendance recording | Paper register | Web form with same-day submission |
| Portion calculation | Manual arithmetic | Automatic (rice 100 g, wheat 100 g, dal 30 g per student) |
| Inventory tracking | Periodic stock-take | Live deduction at the moment attendance is recorded |
| Stock alerts | Phone call | Automated Warning at < 20 %, Critical at < 10 % |
| Alert resolution | Verbal confirmation | One-click resolve with audit timestamp; auto-resolved on restock |
| Government oversight | Monthly report | Real-time dashboard with seven live charts |
| Cross-school comparison | Not feasible | Sortable/filterable schools table with live stock percentages |
| Trend analysis | Manual | Multi-line consumption charts over 7/30/90-day windows |
| Audit trail | Paper signatures | Append-only transaction log per school |
| Responsiveness | N/A | Works on phone, tablet, and desktop |
| Setup cost | Zero | Zero (no server required) |

---

## 6. System Requirements

### 6.1 Hardware Requirements

| Component | Minimum Requirement |
|---|---|
| Processor | Intel Core i3 / AMD Ryzen 3 or equivalent |
| RAM | 4 GB |
| Storage | 500 MB free disk space |
| Display | 1280 × 720 resolution |
| Internet | Required for first load (CDN assets); offline thereafter |
| Input Devices | Keyboard and Mouse, or Touchscreen |

### 6.2 Software Requirements

| Component | Requirement |
|---|---|
| Operating System | Windows 10+, macOS 10.15+, Linux (any distro), Chrome OS |
| Web Browser | Google Chrome 90+, Mozilla Firefox 88+, Microsoft Edge 90+, Apple Safari 14+ |
| Code Editor | VS Code, Sublime Text, or any plain-text editor (development only) |
| Version Control | Git (optional, for development) |
| Server | None required |
| Runtime | None required (no Node.js, no Python, no PHP) |
| Build Tools | None required (no Webpack, no npm) |

---

## 7. System Architecture

### 7.1 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  HTML PAGES  │  │ CSS STYLESHEETS  │  │  JS MODULES    │ │
│  │              │  │                  │  │                │ │
│  │ index        │  │ global.css       │  │ mock-data.js   │ │
│  │ register     │  │ auth.css         │  │ utils.js       │ │
│  │ school-dash  │  │ school-dash.css  │  │ auth.js        │ │
│  │ gov-dash     │  │ gov-dash.css     │  │ school-dash.js │ │
│  │ 404          │  │                  │  │ gov-dash.js    │ │
│  └──────────────┘  └──────────────────┘  └───────┬────────┘ │
│                                                  │          │
│                                          ┌───────▼────────┐ │
│                                          │  localStorage  │ │
│                                          │  (Data Store)  │ │
│                                          │                │ │
│                                          │ poshanUsers    │ │
│                                          │ poshanSchools  │ │
│                                          │ poshanInventory│ │
│                                          │ poshanAttendance│ │
│                                          │ poshanAlerts   │ │
│                                          │ poshanTransactions│
│                                          │ poshanSession  │ │
│                                          └────────────────┘ │
│                                                              │
│  External CDN dependencies (loaded once and cached):         │
│   ├── Chart.js          — charts and graphs                  │
│   ├── Phosphor Icons    — icon library                       │
│   └── Google Fonts Inter — typography                        │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Data Flow Diagrams

**Level 0 (Context Diagram).** External entities are the **School Administrator** and the **Government Official**. The single central process is the **Poshan Darpan System**. The school administrator supplies login credentials, daily attendance, and stock additions; in return the system gives back inventory status, alert lists, and transaction history. The government official supplies login credentials and filter parameters; in return the system gives back aggregated KPIs, charts, and alert feeds.

**Level 1 DFD.** The Poshan Darpan System decomposes into five sub-processes and six data stores.

- **P1 Authentication** reads from and writes to the *Users Store* and the *Session Store*.
- **P2 Inventory Management** reads and writes the *Inventory Store* and writes to the *Transactions Store*.
- **P3 Attendance Processing** reads from the *Schools Store* and the *Inventory Store*; writes to the *Attendance Store*, the *Transactions Store*, and triggers P4.
- **P4 Alert Generation** reads from the *Inventory Store* and the *Alerts Store*; creates new alerts in the *Alerts Store* when thresholds are crossed; auto-resolves alerts when stock recovers.
- **P5 Analytics Engine** reads from every store except Session and Users, and produces aggregated outputs consumed by the government dashboard.

Data flows: school administrator → P1 → Session Store → P2/P3 → Inventory/Attendance Stores → P4 → Alerts Store. Government official → P1 → Session Store → P5 → all stores → aggregated charts.

### 7.3 Module Description

1. **Authentication Module (`auth.js`)** — Handles login, registration, session management, password visibility toggle, and route guarding. Routes are protected by checking the role on every dashboard load.
2. **School Dashboard Module (`school-dashboard.js`)** — Owns five sub-modules: Overview (KPIs and recent activity), Inventory (current stock + add-stock + transaction log), Attendance (daily submission with live preview + history), Alerts (view + resolve), and Profile (read-only).
3. **Government Dashboard Module (`gov-dashboard.js`)** — Owns five sub-modules: Overview (4 KPIs + 3 charts + alert feed), Schools (filterable table + detail modal), Analytics (4 KPIs + 4 charts), Alerts (read-only with multi-filter), and Profile.
4. **Data Management Module (`mock-data.js`)** — Encapsulates all reads and writes to `localStorage` and exposes a clean, function-level API to the dashboard modules. Acts as the single source of truth for the application's data layer.
5. **Utility Module (`utils.js`)** — Provides reusable helpers: date formatting, validation, toast notifications, confirm dialogs, number animation, and stock-status colour helpers.
6. **UI Component Module** — Embedded inside `utils.js`; the `showToast()` and `showConfirmDialog()` functions create on-the-fly DOM elements with animation and lifecycle management.

---

## 8. Technology Stack

**HTML5** is used for the document structure of all five pages. Semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, `<form>`) are preferred over generic `<div>`s where the meaning is clear, improving accessibility and SEO. HTML5 form features such as `type="email"`, `type="number"`, `type="date"`, `min`, `max`, and `required` provide a first line of input validation in the browser before any JavaScript runs.

**CSS3** delivers all visual styling. The project uses **CSS Custom Properties** (variables) declared in `:root` to centralise the design system — colours, spacing, radii, shadows, and typography are all defined once and referenced everywhere. Layout uses **Flexbox** for one-dimensional flows (sidebar, header, button rows) and **CSS Grid** for two-dimensional layouts (KPI grids, dashboard sections). Animations use **`@keyframes`** for toast slide-in/out, modal fade-in, badge pulse, and progress bar fill. **Media queries** at 1024 px, 768 px, and 480 px implement the responsive breakpoints.

**JavaScript ES6+** powers all logic. Features used include arrow functions, template literals, `const`/`let`, destructuring, `Array.prototype` methods (`filter`, `map`, `reduce`, `sort`, `find`, `some`), the `localStorage` API for persistence, and the `requestAnimationFrame` API for smooth number-counter animations. The code is structured as namespaced top-level functions rather than ES modules to avoid the need for a build step or HTTP server.

**Chart.js v4** (loaded from `cdn.jsdelivr.net`) renders the seven charts on the government dashboard. The library was chosen for its small footprint (~ 60 KB gzipped), built-in responsiveness, and rich animation defaults. The project uses line charts (attendance trend, consumption trend), doughnut charts (meal distribution, stock utilisation), horizontal bar charts (inventory health, district comparison), and grouped vertical bar charts (school comparison). Each chart is destroyed and re-created on data refresh to avoid the canvas-reuse error common in single-page apps.

**Phosphor Icons** (loaded from `unpkg.com`) supplies the icon system. Phosphor was chosen over Material Icons or Font Awesome because of its modern visual style, its dual support for outline (`ph`) and filled (`ph-fill`) variants, and its alphabetical, semantic naming (`ph-bowl-food`, `ph-warning-octagon`, `ph-clipboard-text`).

**Google Fonts Inter** is the primary typeface. Inter (designed by Rasmus Andersson) is optimised for screen readability at small sizes, has wide weight coverage (300–700), and is widely used by data-heavy SaaS applications. The five weights used (300, 400, 500, 600, 700) are loaded in a single CSS request.

**localStorage** (a browser-native Web Storage API) is the persistence layer. It provides synchronous string key-value storage scoped to the page's origin, with an effective quota of 5–10 MB. The application stores JSON-serialised arrays under seven keys: `poshanUsers`, `poshanSchools`, `poshanInventory`, `poshanAttendance`, `poshanAlerts`, `poshanTransactions`, and `poshanSession`. Reads and writes are wrapped by `_read()` and `_write()` helpers in `mock-data.js` so that the rest of the application never touches `localStorage` directly.

---

## 9. Database Design

### 9.1 Data Store Structure

Although Poshan Darpan does not use a traditional database, it organises data as if it did. Seven logical "tables" are stored as JSON-serialised arrays under seven distinct `localStorage` keys.

| localStorage Key | Holds | Initialised From |
|---|---|---|
| `poshanUsers` | Array of user objects | `MOCK_USERS` constant |
| `poshanSchools` | Array of school objects | `MOCK_SCHOOLS` constant |
| `poshanInventory` | Array of inventory objects (one per school) | `MOCK_INVENTORY` constant |
| `poshanAttendance` | Array of attendance records | `_generateMockAttendance()` |
| `poshanAlerts` | Array of alert objects | `MOCK_ALERTS` constant |
| `poshanTransactions` | Array of stock-movement records | `MOCK_TRANSACTIONS` constant |
| `poshanSession` | Currently logged-in user object | Created on login |

The initialisation function `initDataStore()` writes each key only if it does not yet exist, so subsequent page loads preserve user-entered changes.

### 9.2 Entity Description

**Entity: Users**

| Field | Type | Description | Constraints |
|---|---|---|---|
| uid | String | Unique user identifier | Primary key, auto-generated |
| name | String | Full name | Required, min 2 chars |
| email | String | E-mail address | Required, unique, valid format |
| password | String | Plain-text password | Required, min 6 chars (prototype only) |
| role | String | "school" or "government" | Required, enum |
| schoolId | String / null | Linked school | Required iff role = "school" |
| district | String / null | District covered | Required iff role = "government" |
| createdAt | String (ISO 8601) | Account creation timestamp | Auto-generated |

**Entity: Schools**

| Field | Type | Description | Constraints |
|---|---|---|---|
| schoolId | String | Unique school identifier | Primary key |
| name | String | School name | Required |
| district | String | District | Required |
| enrollment | Integer | Total students enrolled | Required, > 0 |
| status | String | "active" or "inactive" | Required, enum |
| contactPerson | String | School coordinator | Required |
| contactEmail | String | Coordinator e-mail | Required |

**Entity: Inventory**

| Field | Type | Description | Constraints |
|---|---|---|---|
| schoolId | String | School identifier | Foreign key → Schools |
| rice | Object | `{ current: Number, max: Number }` | Required |
| wheat | Object | `{ current: Number, max: Number }` | Required |
| dal | Object | `{ current: Number, max: Number }` | Required |
| lastUpdated | String (ISO 8601) | Last write timestamp | Auto-updated |

**Entity: Attendance**

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | String | Unique record identifier | Primary key |
| schoolId | String | School identifier | Foreign key → Schools |
| date | String (YYYY-MM-DD) | Date of attendance | Required, ≤ today |
| studentsPresent | Integer | Count of students present | 1 ≤ x ≤ enrollment |
| riceUsed | Number | Rice consumed (kg) | = students × 0.1 |
| wheatUsed | Number | Wheat consumed (kg) | = students × 0.1 |
| dalUsed | Number | Dal consumed (kg) | = students × 0.03 |
| timestamp | String (ISO 8601) | Submission timestamp | Auto-generated |

**Entity: Alerts**

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | String | Unique alert identifier | Primary key |
| schoolId | String | School identifier | Foreign key → Schools |
| schoolName | String | Denormalised school name | For display |
| severity | String | "critical" or "warning" | Enum |
| item | String | "Rice", "Wheat", or "Dal" | Enum |
| status | String | "active" or "resolved" | Enum |
| title | String | Short headline | Required |
| message | String | Detailed message | Required |
| timestamp | String (ISO 8601) | Alert creation time | Auto-generated |
| resolvedAt | String (ISO 8601) / null | Resolution time | Set on resolve |

**Entity: Transactions**

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | String | Unique transaction identifier | Primary key |
| schoolId | String | School identifier | Foreign key → Schools |
| type | String | "addition" or "deduction" | Enum |
| item | String | "Rice", "Wheat", "Dal" | Enum |
| quantity | Number | Quantity in kg | > 0 |
| reason | String | Free-text reason | Required |
| timestamp | String (ISO 8601) | Event timestamp | Auto-generated |

### 9.3 Data Dictionary

| Entity | Field | Type | Size | Description |
|---|---|---|---|---|
| Users | uid | String | 30 | Unique user identifier |
| Users | name | String | 100 | Full name |
| Users | email | String | 100 | E-mail address |
| Users | password | String | 50 | Plain-text password (prototype) |
| Users | role | String | 15 | "school" / "government" |
| Users | schoolId | String | 10 | FK to Schools |
| Users | district | String | 50 | District (for govt users) |
| Users | createdAt | String | 30 | ISO 8601 timestamp |
| Schools | schoolId | String | 10 | Unique school identifier |
| Schools | name | String | 200 | Full school name |
| Schools | district | String | 50 | District |
| Schools | enrollment | Integer | 5 | Number of students |
| Schools | status | String | 10 | "active" / "inactive" |
| Schools | contactPerson | String | 100 | Coordinator name |
| Schools | contactEmail | String | 100 | Coordinator e-mail |
| Inventory | schoolId | String | 10 | FK to Schools |
| Inventory | rice.current | Number | 6 | Current rice in kg |
| Inventory | rice.max | Number | 6 | Max rice capacity in kg |
| Inventory | wheat.current | Number | 6 | Current wheat in kg |
| Inventory | wheat.max | Number | 6 | Max wheat capacity in kg |
| Inventory | dal.current | Number | 6 | Current dal in kg |
| Inventory | dal.max | Number | 6 | Max dal capacity in kg |
| Inventory | lastUpdated | String | 30 | Last write ISO timestamp |
| Attendance | id | String | 30 | Unique record identifier |
| Attendance | schoolId | String | 10 | FK to Schools |
| Attendance | date | String | 10 | YYYY-MM-DD |
| Attendance | studentsPresent | Integer | 5 | Student count |
| Attendance | riceUsed | Number | 6 | Rice consumed (kg) |
| Attendance | wheatUsed | Number | 6 | Wheat consumed (kg) |
| Attendance | dalUsed | Number | 6 | Dal consumed (kg) |
| Attendance | timestamp | String | 30 | Submission ISO timestamp |
| Alerts | id | String | 30 | Unique alert identifier |
| Alerts | schoolId | String | 10 | FK to Schools |
| Alerts | schoolName | String | 200 | Denormalised name |
| Alerts | severity | String | 10 | "critical" / "warning" |
| Alerts | item | String | 10 | "Rice" / "Wheat" / "Dal" |
| Alerts | status | String | 10 | "active" / "resolved" |
| Alerts | title | String | 200 | Headline |
| Alerts | message | String | 500 | Detail message |
| Alerts | timestamp | String | 30 | Creation ISO timestamp |
| Alerts | resolvedAt | String | 30 | Resolution ISO timestamp |
| Transactions | id | String | 30 | Unique identifier |
| Transactions | schoolId | String | 10 | FK to Schools |
| Transactions | type | String | 10 | "addition" / "deduction" |
| Transactions | item | String | 10 | "Rice" / "Wheat" / "Dal" |
| Transactions | quantity | Number | 6 | Amount in kg |
| Transactions | reason | String | 200 | Free-text reason |
| Transactions | timestamp | String | 30 | Event ISO timestamp |

---

## 10. Module-wise Detailed Design

### 10.1 Authentication Module (`auth.js`)

**Purpose.** Manage the entire authentication lifecycle: log in existing users, register new users, persist sessions across page loads, redirect logged-in users to their dashboards, and protect dashboards from unauthorised access.

**Login Flow (step-by-step).**
1. User submits the login form on `index.html`.
2. `handleLogin()` is invoked; calls `event.preventDefault()` to suppress default form submission.
3. Email and password are read and validated client-side (non-empty + valid e-mail format).
4. The submit button is disabled and replaced with a spinner.
5. After a 500-ms delay (to give the user perceptible feedback), `authenticateUser(email, password)` is called.
6. If a matching user is found, `saveSession(user)` writes the user object to `localStorage`.
7. A success toast is shown and the user is redirected to the role-appropriate dashboard after 800 ms.
8. If no match is found, the spinner is removed and an error toast is shown.

**Registration Flow (step-by-step).**
1. User fills out the registration form with name, e-mail, password, password confirmation, role, and either schoolId or district.
2. `handleRegister()` validates each field and writes inline error messages below the failing fields.
3. On all-pass, `registerNewUser()` is called, which checks for duplicate e-mails and creates a new user with a unique ID.
4. The new user is logged in automatically and redirected to the appropriate dashboard.

**Session Management.** The `getCurrentSession()`, `saveSession()`, and `clearSession()` helpers wrap the `poshanSession` `localStorage` key. `checkExistingSession()` is called on the login and register pages to auto-redirect already-logged-in users.

**Route Guard.** `guardRoute(requiredRole)` is called at the top of every dashboard's DOMContentLoaded handler. If no session exists, the user is redirected to `index.html`. If the session role does not match `requiredRole`, the user is redirected to their correct dashboard.

**Function inventory.** `handleLogin(event)`, `handleRegister(event)`, `handleLogout()`, `guardRoute(requiredRole)`, `checkExistingSession()`, `setupRoleFieldToggle()`, `populateSchoolDropdown()`, `setupPasswordToggle()`, `setupInlineErrorClear()`.

### 10.2 School Dashboard Module (`school-dashboard.js`)

**Purpose.** Render the five sections that make up a school administrator's experience and wire up every interactive element.

**Section 1: Overview.** `renderOverview()` calls four sub-renderers that populate the inventory KPI grid (`renderOverviewInvCards()`), the three stat boxes (`renderOverviewStats()` — enrolment, today's attendance, today's meals), the recent-activity list (`renderRecentActivity()`), and the active-alert preview (`renderOverviewAlerts()`). All KPI values use `animateCounter()` for a count-up effect.

**Section 2: Inventory.** `renderInventory()` paints three large inventory cards with progress bars, refreshes the stock-hint helper, and re-renders the transaction history table. The Add Stock form is wired up once at init by `setupAddStockForm()`. On submission, it calls `addStock()`, logs a transaction, and triggers `_autoResolveAlertsIfHealthy()` indirectly through `addStock`.

**Section 3: Attendance.** `setupAttendanceForm()` wires the date input, the count input, and the submit button. As the user types in the count field, `updateAttendancePreview()` runs in real time: it computes the three meal portions, checks each against current stock, checks for duplicate dates, and shows or hides a red warning banner. The submit button is enabled only when every check passes. On submit, `submitAttendance()` runs the ten-step critical flow described in §10.4.

**Section 4: Alerts.** Three filter tabs (All / Active / Resolved) drive `renderAlerts()`. Each alert card shows severity, item, time, title, and message. Active alerts get a "Resolve" button that triggers `showConfirmDialog()` before calling `resolveAlert()`.

**Section 5: Profile.** `renderProfile()` writes two cards of read-only label-value pairs: school information and account information.

**Function inventory.** `initSidebarUserInfo()`, `setupNav()`, `switchSection(name)`, `renderHeaderForSection(name)`, `setupMobileMenu()`, `setupLogout()`, `refreshAlertBadge()`, `renderOverview()`, `renderOverviewInvCards()`, `renderOverviewStats()`, `renderRecentActivity()`, `renderOverviewAlerts()`, `renderInventory()`, `renderLargeInvCards()`, `renderTransactionTable()`, `refreshStockHint()`, `setupAddStockForm()`, `renderAttendance()`, `renderAttendanceTable()`, `setupAttendanceForm()`, `updateAttendancePreview()`, `setupAlertFilters()`, `renderAlerts()`, `alertCardHtml(alert, allowResolve)`, `renderProfile()`, `profileRow(label, value)`.

### 10.3 Government Dashboard Module (`gov-dashboard.js`)

**Purpose.** Render the five sections of the government oversight experience including all seven Chart.js charts and the multi-tab School Detail modal.

**Section 1: Overview.** Four animated KPI cards (Active Schools, Total Students, Meals Today, Active Alerts), an attendance trend line chart over the last seven days, a meal distribution doughnut over the last 30 days, an inventory health horizontal bar chart, and a feed of the eight most recent alerts across all schools.

**Section 2: Schools.** A search box and two select dropdowns (district, status) drive the schools table. Filtering is performed in JavaScript (no backend round-trip) and combines all three filters using AND logic. Each row's "View" button opens the School Detail modal.

**Section 3: Analytics.** A range tab group (7 / 30 / 90 days) controls the data window. Four KPI cards summarise the period (Avg Attendance %, Avg Meals/School/Day, Most Consumed Item, Highest Attendance School). Four charts render below: consumption trend (multi-line), district performance (horizontal bar), school comparison (grouped vertical bars), and overall stock utilisation (doughnut).

**Section 4: Alerts.** Three KPI cards (Active Warnings, Active Criticals, Most Alerted School). Three select filters (severity, status, school) combine AND-wise to filter the alert list. Government users have **no Resolve button** — viewing only.

**Section 5: Profile.** Single read-only card showing the government user's account details.

**School Detail Modal.** Opened from the schools table. Top section shows school name and three meta facts. Three tabs (Inventory / Attendance / Alerts) switch the body content. Closes on backdrop click or X button.

**Function inventory.** `setupNav()`, `switchSection(name)`, `renderHeaderForSection(name)`, `setupMobileMenu()`, `setupLogout()`, `refreshAlertBadge()`, `_destroyChart(key)`, `renderOverview()`, `renderAttendanceTrendChart()`, `renderMealDistChart()`, `renderInvHealthChart()`, `renderRecentFeed()`, `setupSchoolFilters()`, `renderSchools()`, `stockCell(current, max)`, `openSchoolModal(schoolId)`, `miniInvCard(label, slot)`, `setupRangeTabs()`, `renderAnalytics()`, `renderConsumptionChart(days)`, `renderDistrictChart(days)`, `renderSchoolCompareChart()`, `renderUtilChart()`, `setupAlertFilters()`, `renderAlertsSection()`, `govAlertCardHtml(alert, showSchool)`, `renderProfile()`, `profileRow(label, value)`.

### 10.4 Alert Management Module

The alert sub-system is woven through `mock-data.js` and exposed through several functions: `createAlert()`, `resolveAlert()`, `getAllAlerts()`, `getActiveAlerts()`, `getActiveAlertCount()`, `getActiveAlertCountBySchool()`, `getAlertsBySchool()`, `getMostAlertedSchool()`, and the private helper `_autoResolveAlertsIfHealthy()`.

**Alert generation rules.** Inside `submitAttendance()` step 8, after stock has been deducted, the current stock percentage of each item (rice, wheat, dal) is computed. If percentage < 10 %, a *Critical* alert is created; if 10–20 %, a *Warning* alert is created; if ≥ 20 %, no alert is created. To prevent duplicate alerts, the function first checks whether an active alert already exists for the same school+item; if so, no new alert is created.

**Auto-resolve logic.** When stock is added through `addStock()`, the helper `_autoResolveAlertsIfHealthy()` checks whether the new percentage has climbed back to ≥ 20 %. If so, every active alert for that school+item is set to `status: "resolved"` and given a `resolvedAt` timestamp.

**Cross-module flow.** Attendance submission → inventory deduction → percentage check → alert creation → toast notification → sidebar badge update. Stock addition → inventory increase → percentage check → alert resolution (if applicable) → sidebar badge update.

### 10.5 Analytics & Reporting Module

The analytics module exposes 13 aggregation functions: `getTotalActiveSchools()`, `getTotalEnrollment()`, `getTodayTotalMeals()`, `getAvgAttendanceRate(days)`, `getAvgMealsPerSchoolPerDay(days)`, `getMostConsumedItem(days)`, `getHighestAttendanceSchool(days)`, `getLowestAttendanceSchool(days)`, `getSchoolInventoryHealth()`, `getDistrictWiseAttendance(days)`, `getTotalConsumption(days)`, `getOverallStockUtilization()`, and `getConsumptionLastNDays(n)`.

**Chart selection rationale.** Line charts are used for time-series data (attendance trend, consumption trend) because they make change over time most visible. Doughnut charts are used for part-to-whole breakdowns (meal distribution, stock utilisation) because they make ratios easy to read at a glance. Horizontal bar charts are used for ranked categorical data (inventory health, district comparison) because they accommodate long category names that would crowd a vertical axis. Grouped vertical bars are used for the school-comparison chart because users need to compare multiple days within and across schools simultaneously.

**Date-range filtering logic.** The 7/30/90-day toggle stores its value in the `ANALYTICS_RANGE` global, which is passed to every aggregation function. `getLastNDates(n)` walks backwards from today, skipping Saturdays and Sundays, until it has collected n working days.

**District grouping.** `_avgAttendancePerSchool(days)` produces a per-school list of average attendance rates. `getDistrictWiseAttendance(days)` then groups that list by district and computes the per-district mean.

---

## 11. UI/UX Design

### 11.1 Screen Flow Diagram

```
index.html (Login)
  ├── [School Login]    → school-dashboard.html
  │      ├── Overview
  │      ├── Inventory  → Add Stock Form / Transaction History
  │      ├── Attendance → Submit Form (live preview) / History Table
  │      ├── Alerts     → Resolve Confirm Dialog
  │      └── Profile
  │
  ├── [Government Login] → gov-dashboard.html
  │      ├── Overview (4 KPIs + 3 charts + alert feed)
  │      ├── Schools
  │      │     └── School Detail Modal
  │      │            ├── Inventory tab
  │      │            ├── Attendance tab
  │      │            └── Alerts tab
  │      ├── Analytics (4 KPIs + 4 charts + range tabs)
  │      ├── Alerts (read-only)
  │      └── Profile
  │
  ├── [Register Link]    → register.html → Auto-login → Dashboard
  │
  ├── Logout (any page)  → index.html
  │
  └── Invalid URL        → 404.html → "Back to Home" → index.html
```

### 11.2 Screen-wise Description

**Screen 1 — Login Page (`index.html`).** A centred white card on a deep-blue gradient background carries the logo, the heading "पोषण दर्पण", the subtitle, an e-mail input, a password input with eye toggle, a Login button, a registration link, and a demo-credentials box. On submit, the button switches to a spinner; on success, a toast appears and the user is redirected. *[Insert Screenshot]*

**Screen 2 — Registration Page (`register.html`).** Same visual style as login. The form contains name, e-mail, password, confirm-password, role, and one of two conditional fields: a school dropdown (when role is School) or a district text input (when role is Government). Conditional fields slide in/out via CSS transitions. Inline errors appear below failing fields and clear when the user starts typing. *[Insert Screenshot]*

**Screen 3 — School Overview.** Three inventory KPI cards (rice, wheat, dal) with progress bars; three stat boxes (enrolment, today's attendance, today's meals); a Recent Activity card listing the last five attendance submissions; an Active Alerts card listing every unresolved alert. *[Insert Screenshot]*

**Screen 4 — School Inventory.** Three large inventory cards each showing item name, status badge, current/max in large type, animated progress bar, and "updated X minutes ago". An Add Stock card lets the admin pick item, enter quantity, and submit; a hint shows the maximum quantity that can be added. A Transaction History table lists the 20 most recent stock movements. *[Insert Screenshot]*

**Screen 5 — School Attendance.** A submission form with date input (defaults to today, max = today) and student-count input. Below the count field, a Live Preview card shows the three meal portions in real time and a red warning if any item lacks enough stock. The submit button is disabled until all checks pass. Below, an Attendance History table shows the last 30 records. *[Insert Screenshot]*

**Screen 6 — School Alerts.** Three filter tabs (All / Active / Resolved) with counts. Each alert is rendered as a card with severity icon, severity badge, item badge, time-ago, title, message, and (for active alerts only) a Resolve button. The Resolve button opens a confirm dialog. Resolved alerts are greyed out with a "Resolved on …" stamp. *[Insert Screenshot]*

**Screen 7 — School Profile.** Two read-only cards side by side: School Information (name, district, enrolment, status, contact person, contact e-mail) and Your Account (full name, e-mail, role, member-since date). *[Insert Screenshot]*

**Screen 8 — Government Overview.** Four animated KPI cards: Active Schools, Total Students, Meals Today, Active Alerts. Below them, a 7-day attendance trend line chart and a 30-day meal distribution doughnut chart. Below those, a horizontal bar chart of school inventory health. At the bottom, a feed of the eight most recent alerts across all schools. *[Insert Screenshot]*

**Screen 9 — Government Schools.** A filter row with a search box, a district dropdown, and a status dropdown. A table lists every school with columns: School Name, District, Enrolment, Rice %, Wheat %, Dal %, Status, Actions. The three percentage cells use coloured pill badges (green / amber / red). Clicking the "View" button in any row opens the School Detail modal. *[Insert Screenshot]*

**Screen 10 — Government Analytics.** A range tab group (7 / 30 / 90 days) at the top. Four KPI summary cards. Below them, a multi-line consumption chart, a district performance horizontal bar chart, a grouped school-comparison bar chart, and a stock-utilisation doughnut chart. Changing the range re-renders every chart on the page. *[Insert Screenshot]*

**Screen 11 — Government Alerts Monitor.** Three KPI cards (Active Warnings, Active Criticals, Most Alerted School). Three filter dropdowns (severity, status, school). A list of alert cards; each card shows the school name prominently, the severity badge, the item, the status, and the time. **No Resolve button** — government users cannot resolve alerts. *[Insert Screenshot]*

**Screen 12 — Government Profile.** Single read-only card showing the official's full name, e-mail, role, district, and member-since date. *[Insert Screenshot]*

**Screen 13 — School Detail Modal.** A 700-px-wide modal opened from the schools table. Header shows school name, district, enrolment, and status. Three tabs in the body: Inventory (three mini cards with progress bars), Attendance (last 10 records as a table), and Alerts (every alert raised against the school). Close button or backdrop click dismisses. *[Insert Screenshot]*

**Screen 14 — Confirm Dialog Modal.** Reusable modal triggered by `showConfirmDialog()`. 420-px wide, centred, with a title, a message paragraph, a grey Cancel button, and a primary-blue Confirm button. Closes on Cancel, Confirm, backdrop click, or Escape key. *[Insert Screenshot]*

**Screen 15 — Toast Notification System.** Stack of up to three toasts in the top-right corner. Each toast carries a coloured left border (green/red/amber/blue), an icon, the message, and a close button. Auto-dismisses after four seconds with a slide-out animation. *[Insert Screenshot]*

**Screen 16 — Add Stock Success Feedback.** After a successful Add Stock submission, a green toast confirms ("Added 50 kg of Rice successfully!") and the inventory cards re-render with their new values and updated progress-bar widths. *[Insert Screenshot]*

**Screen 17 — 404 Error Page (`404.html`).** Displays a large "404", the heading "Page Not Found", an explanatory line, and a "Back to Home" button. Same gradient background as the auth pages. *[Insert Screenshot]*

### 11.3 Design System

**Colour Palette.**

| Token | Hex | Usage |
|---|---|---|
| Primary | `#2563EB` | Buttons, active nav, links, primary chart colour |
| Primary Dark | `#1D4ED8` | Button hover |
| Primary Light | `#DBEAFE` | Hint backgrounds, info badges |
| Secondary (Green) | `#059669` | Success, healthy stock |
| Warning (Amber) | `#F59E0B` | Low stock, warning alerts |
| Danger (Red) | `#DC2626` | Critical alerts, errors |
| Purple | `#7C3AED` | Wheat icon accent |
| Body BG | `#F1F5F9` | Page background |
| Card BG | `#FFFFFF` | All cards |
| Sidebar BG | `#1E293B` | Dark sidebar |
| Text Primary | `#1E293B` | Headings, body text |
| Text Secondary | `#64748B` | Labels, meta text |
| Border | `#E2E8F0` | Card borders, table borders |

**Typography.** Inter, weights 300/400/500/600/700. Sizes: H1 19 px, H2 18 px, H3 16 px, body 14 px, small 12.5 px, KPI value 22 px, large inventory value 36 px.

**Components.** Buttons (primary, success, danger, outline, ghost; sizes sm/md/lg; full-width modifier), cards (`.card`, `.card-hover`), inputs (`.form-input`, `.form-select`, `.input-with-icon`), tables (`.table-wrap`, `.table`), progress bars (`.progress`, `.progress-bar` with green/amber/red modifiers), badges (success/warning/danger/info/grey), modals (`.modal-overlay`, `.modal-card`, `.confirm-card`), toasts (`.toast` with success/error/warning/info modifiers).

**Spacing System.** Increments of 4 px (gap-1) through 24 px (gap-6). Margin and padding utilities follow the same scale.

**Border Radius.** sm = 8 px, md = 12 px, lg = 16 px, xl = 20 px, full = 9999 px (pill).

**Shadows.** Four levels: sm (1 px), md (4 px), lg (10 px), xl (20 px), each with consistent black tint.

**Icon Library.** Phosphor Icons. Common icons used: `ph-bowl-food`, `ph-grains`, `ph-circles-three`, `ph-warning`, `ph-warning-octagon`, `ph-check-circle`, `ph-clipboard-text`, `ph-package`, `ph-buildings`, `ph-chart-bar`, `ph-chart-line-up`, `ph-user`, `ph-sign-out`, `ph-envelope`, `ph-lock`, `ph-eye`, `ph-eye-slash`, `ph-magnifying-glass`, `ph-funnel`, `ph-x`, `ph-arrow-right`, `ph-plus`, `ph-cooking-pot`, `ph-student`, `ph-calendar`, `ph-clock-clockwise`, `ph-trophy`, `ph-percent`, `ph-shield-check`, `ph-bell`, `ph-bell-slash`, `ph-tray`, `ph-info`, `ph-list`.

### 11.4 Responsive Design Strategy

The application uses three breakpoints: **1024 px** (tablet boundary), **768 px** (mobile boundary), and **480 px** (small mobile).

- **Desktop (≥ 1024 px).** Sidebar is always visible at 260 px wide. Main content area has 26 px padding. KPI grids use four columns; inventory grids use three. Tables show all columns; charts are full-width.
- **Tablet (768–1024 px).** Sidebar is hidden by default and replaced by a hamburger button in the header. KPI grid drops to two columns. Tables become horizontally scrollable.
- **Mobile (< 768 px).** All grids collapse to a single column. The sidebar slides in from the left when the hamburger is tapped, with a semi-transparent backdrop. Buttons grow to a 44-px minimum tap target. Charts use Chart.js's `maintainAspectRatio: false` and resize fluidly.

Charts respond to window resize automatically because every `<canvas>` lives inside a fixed-height wrapper (`.chart-wrap`, 280 px or 360 px) with width: 100 %.

---

## 12. Implementation Details

### 12.1 Folder Structure

```
poshan-darpan/
├── index.html                      (~3 KB)   — Login page
├── register.html                   (~5 KB)   — Registration page
├── school-dashboard.html           (~11 KB)  — School dashboard shell
├── gov-dashboard.html              (~11 KB)  — Government dashboard shell
├── 404.html                        (~1 KB)   — Error page
├── PROJECT_DOCUMENTATION.md                  — This document
├── css/
│   ├── global.css                  (~12 KB)  — Design system + shared components
│   ├── auth.css                    (~4 KB)   — Login/Register/404 page styles
│   ├── school-dashboard.css        (~14 KB)  — School dashboard layout + sections
│   └── gov-dashboard.css           (~6 KB)   — Government dashboard extras
└── js/
    ├── mock-data.js                (~26 KB)  — Data layer + analytics
    ├── utils.js                    (~8 KB)   — Helpers, toasts, modals
    ├── auth.js                     (~7 KB)   — Authentication logic
    ├── school-dashboard.js         (~23 KB)  — School dashboard controller
    └── gov-dashboard.js            (~26 KB)  — Government dashboard controller
```

### 12.2 File-wise Description

| File | LoC | Purpose | Dependencies |
|---|---|---|---|
| `index.html` | ~75 | Login page markup | global.css, auth.css, mock-data.js, utils.js, auth.js |
| `register.html` | ~125 | Registration page | Same as login |
| `school-dashboard.html` | ~225 | School dashboard with 5 sections | global.css, school-dashboard.css, mock-data.js, utils.js, auth.js, school-dashboard.js |
| `gov-dashboard.html` | ~245 | Govt dashboard with 5 sections + modal root | global.css, school-dashboard.css, gov-dashboard.css, Chart.js CDN, plus all JS |
| `404.html` | ~25 | Error page | global.css, auth.css |
| `global.css` | ~430 | Design tokens + buttons, cards, inputs, tables, toasts, modals, animations | None |
| `auth.css` | ~135 | Auth/404 page-specific styles | global.css |
| `school-dashboard.css` | ~480 | Sidebar, main, KPI cards, inventory cards, attendance form, alert cards | global.css |
| `gov-dashboard.css` | ~190 | Chart cards, filter rows, range tabs, school table cells, modal | school-dashboard.css |
| `mock-data.js` | ~600 | Seed constants, localStorage I/O, auth functions, CRUD functions, analytics functions | None |
| `utils.js` | ~250 | Date helpers, validation, toasts, confirm dialogs, animation, stock helpers | None |
| `auth.js` | ~230 | Login, register, logout, route guard, form helpers | mock-data.js, utils.js |
| `school-dashboard.js` | ~550 | All school-side rendering and event wiring | mock-data.js, utils.js, auth.js |
| `gov-dashboard.js` | ~620 | All gov-side rendering, all 7 charts, school detail modal | Chart.js, mock-data.js, utils.js, auth.js |

### 12.3 Key Algorithms & Logic

**Algorithm 1 — Attendance Submission (the 10-step critical flow).**

```
INPUT:  schoolId, dateStr, studentsPresent
OUTPUT: { success: bool, error?: string, data?: object }

STEP 1: if checkDuplicateAttendance(schoolId, dateStr) → return error
STEP 2: school = getSchoolById(schoolId)
        if studentsPresent > school.enrollment → return error
        if studentsPresent < 1                  → return error
STEP 3: riceNeeded   = studentsPresent × 0.1
        wheatNeeded  = studentsPresent × 0.1
        dalNeeded    = studentsPresent × 0.03
STEP 4: inv = getInventory(schoolId)
        if inv.rice.current  < riceNeeded   → return error
        if inv.wheat.current < wheatNeeded  → return error
        if inv.dal.current   < dalNeeded    → return error
STEP 5: deductStock(schoolId, riceNeeded, wheatNeeded, dalNeeded)  // atomic
STEP 6: append {id, schoolId, date, studentsPresent, riceUsed,
                wheatUsed, dalUsed, timestamp} to attendanceStore
STEP 7: append 3 transaction records (rice, wheat, dal) of type "deduction"
STEP 8: newInv = getInventory(schoolId)
        FOR each itemKey in [rice, wheat, dal]:
            slot = newInv[itemKey]
            pct  = (slot.current / slot.max) × 100
            if existing active alert for (schoolId, itemKey) → continue
            if pct < 10 → createAlert(severity="critical")
            elif pct < 20 → createAlert(severity="warning")
STEP 9: persist all changes (every store has been written)
STEP 10: return { success: true, data: {...} }
```

Time complexity: O(N + M) where N is the size of the attendance store and M is the size of the alert store.

**Algorithm 2 — Auto Alert Generation.**

```
INPUT:  schoolId, itemKey, newCurrent, max
OUTPUT: alert object (or null)

pct = (newCurrent / max) × 100
existing = filter(alerts, a → a.schoolId == schoolId
                            && a.item == itemLabel
                            && a.status == "active")
if existing.length > 0 → return null     // do not duplicate
if pct < 10  → return createAlert("critical", itemKey, "...")
if pct < 20  → return createAlert("warning",  itemKey, "...")
return null
```

Time complexity: O(M) per check.

**Algorithm 3 — Auto Alert Resolution.**

```
INPUT:  schoolId, itemKey
OUTPUT: void

inv  = getInventory(schoolId)
slot = inv[itemKey]
pct  = (slot.current / slot.max) × 100
if pct < 20 → return  // still in alert range
FOR each alert in alertStore:
    if alert.schoolId == schoolId
       && alert.item.toLowerCase() == itemKey
       && alert.status == "active":
        alert.status     = "resolved"
        alert.resolvedAt = now()
write alertStore
```

Time complexity: O(M).

**Algorithm 4 — Inventory Update with Capacity Validation.**

```
INPUT:  schoolId, itemKey, quantity
OUTPUT: { success: bool, error?: string, newCurrent?: number }

inv      = getInventory(schoolId)
slot     = inv[itemKey]
newCurr  = slot.current + quantity
if newCurr > slot.max:
    remaining = slot.max - slot.current
    return error("Exceeds max capacity. You can add up to " + remaining + " kg.")
slot.current     = newCurr
inv.lastUpdated  = now()
write inventoryStore
autoResolveAlertsIfHealthy(schoolId, itemKey)
return success
```

Time complexity: O(1) for the update plus O(M) for alert resolution.

**Algorithm 5 — Analytics Aggregation.**

```
INPUT:  days (7, 30, or 90)
OUTPUT: { avgAttendance, avgMealsPerDay, mostConsumedItem, topSchool }

dates    = getLastNDates(days)             // skips weekends
schools  = getActiveSchools()
totalAtt = 0, count = 0
totalMeals = 0
FOR each school s in schools:
    FOR each date d in dates:
        rec = find(attendance, r → r.schoolId == s.id && r.date == d)
        if rec exists:
            totalAtt   += (rec.studentsPresent / s.enrollment) × 100
            count       += 1
            totalMeals  += rec.studentsPresent
avgAttendance     = totalAtt / count
avgMealsPerDay    = totalMeals / (schools.length × dates.length)
mostConsumedItem  = argmax(sumRice, sumWheat, sumDal)
topSchool         = argmax(perSchoolAvgAttendance)
return summary
```

Time complexity: O(S × D × N) where S is schools, D is days, and N is attendance records (find scan).

**Algorithm 6 — Multi-filter School Table.**

```
INPUT:  query (string), district (string), status (string)
OUTPUT: filtered school array

result = getAllSchools()
if query    : result = result.filter(s → s.name.toLowerCase().includes(query.toLowerCase()))
if district : result = result.filter(s → s.district == district)
if status   : result = result.filter(s → s.status == status)
return result
```

Time complexity: O(S) per filter; O(S) overall because the filters are applied sequentially.

### 12.4 Data Persistence Strategy

**Initialisation.** On every page load, `initDataStore()` runs first. For each of the seven keys it tries `JSON.parse(localStorage.getItem(key))`; if the parse returns null, the key is seeded from its `MOCK_*` constant. If the parse returns a value, no overwrite happens — the user's previous data is preserved.

**Read/Write Pattern.** All access is mediated by the private helpers `_read(key)` and `_write(key, value)`. `_read` wraps `JSON.parse` in a try-catch and returns `null` on any error. `_write` calls `JSON.stringify` and `localStorage.setItem`. The rest of the application never touches `localStorage` directly, which makes it trivial to swap in a different persistence layer (REST, Firestore, IndexedDB) later.

**Session Management.** The current session is stored under `poshanSession` as a serialised user object. `getCurrentSession()`, `saveSession(user)`, and `clearSession()` are the only three functions that touch this key. Every dashboard's `guardRoute(role)` reads the session and redirects unauthorised users.

**Data Integrity.** Writes are not atomic across keys — if the user closes the browser between a write to `inventoryStore` and a write to `attendanceStore`, partial state is possible. In practice this is benign because the writes always happen within a single synchronous call sequence inside `submitAttendance()`. A real production system would replace `localStorage` with a transaction-aware database.

**Limitations.**
- Quota: 5–10 MB per origin (browser-dependent). With the current data volume (a handful of users, schools, and events) this is enormous headroom.
- No multi-tab synchronisation. If the same user opens two tabs and writes in both, the last write wins.
- No encryption at rest. Anyone with access to the browser can read the data through DevTools.
- Single-user. There is no real-world authentication; passwords are stored in plain text and "auth" is purely a prototype convention.

---

## 13. Testing

### 13.1 Testing Strategy

The application was tested using a combination of approaches:

- **Functional testing** verified that every user-facing feature behaves according to specification.
- **UI testing** verified visual correctness on Chrome, Firefox, and Edge at desktop, tablet, and mobile widths.
- **Boundary testing** exercised threshold values (stock at exactly 10 %, 20 %, 50 %) to confirm correct status classification.
- **Negative testing** verified that invalid inputs (empty fields, mismatched passwords, future dates, over-enrolment counts, exceeding inventory capacity) are rejected with clear error messages.
- **Cross-browser testing** confirmed identical behaviour across the four major browsers.
- **Responsive testing** used the browser's device-emulation mode to verify layout at 1440 px, 1024 px, 768 px, 414 px (iPhone), and 360 px (small Android).

### 13.2 Test Cases Table

| TC No | Module | Test Case Description | Input | Expected Output | Status |
|---|---|---|---|---|---|
| TC01 | Authentication | Login with valid school credentials | `rajesh@school.com / school123` | Redirect to `school-dashboard.html` | Pass |
| TC02 | Authentication | Login with invalid password | `rajesh@school.com / wrong123` | Error toast "Invalid email or password" | Pass |
| TC03 | Authentication | Login with non-existent email | `nobody@test.com / test123` | Error toast "Invalid email or password" | Pass |
| TC04 | Authentication | Register with mismatched passwords | pwd "abc123" / confirm "xyz456" | Inline error "Passwords do not match" | Pass |
| TC05 | Authentication | Register with already-registered email | `rajesh@school.com` | Inline error "This email is already registered" | Pass |
| TC06 | Authentication | Session persistence after refresh | Login → reload page | Still on dashboard with same data | Pass |
| TC07 | Authentication | Route guard — school user accessing gov dashboard | Manual URL change | Redirected to `school-dashboard.html` | Pass |
| TC08 | Authentication | Auto-redirect logged-in user from login page | Already logged in → visit `index.html` | Redirected to dashboard | Pass |
| TC09 | Authentication | Conditional field shows for school role | Select role "School Administrator" | School dropdown slides in | Pass |
| TC10 | Authentication | Conditional field shows for government role | Select role "Government Official" | District input slides in | Pass |
| TC11 | Attendance | Submit valid attendance | Date today, Students 200 | Success toast; inventory deducted by 20 / 20 / 6 | Pass |
| TC12 | Attendance | Submit duplicate attendance for same date | Same date twice | Error "Attendance already submitted for this date" | Pass |
| TC13 | Attendance | Submit with students > enrolment | Students 999 (enrolment 250) | Submit disabled; warning shown | Pass |
| TC14 | Attendance | Submit with insufficient stock | 400 students at Bhopal (rice 30 kg) | Submit disabled; warning shown | Pass |
| TC15 | Attendance | Verify correct deduction amounts | 200 students | Rice -20, Wheat -20, Dal -6 | Pass |
| TC16 | Attendance | Critical alert generated when stock drops below 10 % | Submit causing rice → 8 % | Critical alert auto-created | Pass |
| TC17 | Attendance | Warning alert generated for 10–20 % range | Submit causing wheat → 15 % | Warning alert auto-created | Pass |
| TC18 | Attendance | No duplicate alert when one already exists | Submit again while alert active | No new alert created | Pass |
| TC19 | Attendance | Future date rejection | Pick tomorrow | Date input maxes today; warning shown | Pass |
| TC20 | Inventory | Add stock within capacity | +50 kg rice | Success; inventory updated | Pass |
| TC21 | Inventory | Add stock exceeding max | +500 kg (max 200) | Error "Exceeds max capacity of 200 kg." | Pass |
| TC22 | Inventory | Add stock auto-resolves alert | +150 kg rice at Bhopal (was 7.5 %) | Critical alert resolved; badge count -1 | Pass |
| TC23 | Inventory | Transaction history records addition | +50 kg wheat | New "Added" row appears in table | Pass |
| TC24 | Inventory | Stock-hint text updates on item change | Select "Rice" | Hint shows remaining capacity | Pass |
| TC25 | Alerts | Resolve active alert | Click Resolve → Confirm | Alert moves to Resolved tab | Pass |
| TC26 | Alerts | Filter by Active | Click "Active" tab | Only active alerts visible | Pass |
| TC27 | Alerts | Filter by Resolved | Click "Resolved" tab | Only resolved alerts visible (greyed) | Pass |
| TC28 | Gov Dashboard | KPI cards animate on load | Open Overview | Counters animate from 0 to target | Pass |
| TC29 | Gov Dashboard | Attendance trend chart renders | Open Overview | Line chart with 7 data points | Pass |
| TC30 | Gov Dashboard | School search filter works | Type "Bhopal" | Only Bhopal school visible | Pass |
| TC31 | Gov Dashboard | District filter works | Select "Indore" | Only Indore schools shown | Pass |
| TC32 | Gov Dashboard | Combined filters work | Search "Govt" + District "Ujjain" | Schools matching both | Pass |
| TC33 | Gov Dashboard | School detail modal opens | Click "View" | Modal with correct school | Pass |
| TC34 | Gov Dashboard | Modal tabs switch correctly | Click "Attendance" tab | Attendance content shown | Pass |
| TC35 | Gov Dashboard | Modal closes on backdrop click | Click backdrop | Modal animates out | Pass |
| TC36 | Gov Dashboard | Government user has no Resolve button | View Alerts section | No Resolve buttons rendered | Pass |
| TC37 | Gov Dashboard | Range tab change re-renders charts | Click "Last 30 Days" | All four analytics charts update | Pass |
| TC38 | Responsive | Mobile sidebar hamburger works | Width < 768 px → tap hamburger | Sidebar slides in, backdrop visible | Pass |
| TC39 | Responsive | Charts resize on window change | Resize browser | Charts scale proportionally | Pass |
| TC40 | UI | Toast auto-dismisses after 4 s | Trigger any toast | Toast slides out at 4 s | Pass |
| TC41 | UI | Maximum 3 toasts visible | Trigger 4 toasts rapidly | Oldest is removed when 4th appears | Pass |
| TC42 | UI | Confirm dialog Esc key | Press Escape | Modal closes via cancel path | Pass |
| TC43 | Data | localStorage persists across refresh | Add stock → refresh | Added stock still reflected | Pass |
| TC44 | Data | initDataStore does not overwrite | Modify data → refresh | Modified data preserved | Pass |
| TC45 | UI | Logout opens confirm dialog | Click Logout | Confirm dialog appears | Pass |

### 13.3 User Acceptance Testing

User Acceptance Testing (UAT) was scoped to two user personas: a *school administrator* (a teacher or coordinator responsible for the mid-day meal at a single school) and a *government district official* (a block-level or district-level officer overseeing many schools). For each persona, three real-world scenarios were defined:

For school administrators, the UAT scenarios were: (1) record today's attendance and verify the inventory drops; (2) discover a critical stock alert and resolve it after a delivery; (3) review the last week's transaction history before a monthly report. For government officials, the UAT scenarios were: (1) identify the school with the lowest stock health; (2) compare attendance trends across districts over the last 30 days; (3) drill into a specific school via the detail modal to investigate alerts.

**Acceptance criteria** included: every action completes within 1 s on a mid-range laptop, every error message is clear and actionable, the layout works without horizontal scrolling on a 360 px-wide phone, and no JavaScript errors appear in the browser console during normal use. All scenarios passed acceptance after the bug-fix pass described in §13.1.

---

## 14. Screenshots

*The following placeholders are provided for screenshots. Each may be captured by running the application locally and using the host operating system's screen-capture tool.*

1. *[Insert Screenshot: Login Page (Desktop)]*
2. *[Insert Screenshot: Login Page (Mobile)]*
3. *[Insert Screenshot: Registration Page with School role selected]*
4. *[Insert Screenshot: Registration Page with Government role selected]*
5. *[Insert Screenshot: School Dashboard — Overview Section]*
6. *[Insert Screenshot: School Dashboard — Inventory Section showing healthy, low and critical stock]*
7. *[Insert Screenshot: School Dashboard — Attendance Section with deduction preview]*
8. *[Insert Screenshot: School Dashboard — Attendance Section with insufficient-stock warning]*
9. *[Insert Screenshot: School Dashboard — Alerts (Active tab)]*
10. *[Insert Screenshot: School Dashboard — Alerts (Resolved tab)]*
11. *[Insert Screenshot: School Dashboard — Profile Section]*
12. *[Insert Screenshot: Government Dashboard — Overview Section with all charts]*
13. *[Insert Screenshot: Government Dashboard — Schools Table with colour-coded stock %]*
14. *[Insert Screenshot: Government Dashboard — School Detail Modal (Inventory tab)]*
15. *[Insert Screenshot: Government Dashboard — School Detail Modal (Attendance tab)]*
16. *[Insert Screenshot: Government Dashboard — Analytics Section (all charts)]*
17. *[Insert Screenshot: Government Dashboard — Alerts Monitor]*
18. *[Insert Screenshot: Toast Notification examples (success / error / warning)]*
19. *[Insert Screenshot: Confirm Dialog Modal]*
20. *[Insert Screenshot: Mobile Responsive — School Dashboard, sidebar closed]*
21. *[Insert Screenshot: Mobile Responsive — School Dashboard, sidebar open]*
22. *[Insert Screenshot: 404 Error Page]*

---

## 15. Future Enhancements

1. **Firebase Backend Integration.** Replace the `localStorage` data layer with Cloud Firestore. The data-access functions in `mock-data.js` are already segregated, so the swap can be done without touching any UI code. Firestore would provide multi-user real-time synchronisation, enabling many schools to feed a single live dashboard.

2. **Firebase Authentication.** Replace the prototype authentication with Firebase Authentication. This adds proper password hashing, e-mail verification, password reset, and multi-factor authentication. Custom claims would carry the role and school assignment.

3. **Offline Mode via Service Workers.** Cache the application shell with a Service Worker so that the platform continues to work in low-connectivity rural environments. Pending writes can be queued in IndexedDB and replayed when connectivity returns, turning the application into a Progressive Web App.

4. **Native Mobile Applications.** Re-implement the same data layer in React Native or Flutter to deliver an installable Android and iOS application. The schools table could trigger phone-call shortcuts and the attendance form could leverage device-native date pickers.

5. **PDF and CSV Report Export.** Add a "Download Report" button on every analytics view that uses jsPDF or the browser's print API to generate a polished, paginated report suitable for circulation in the existing offline workflows.

6. **Multi-language Support (i18n).** Introduce a translation layer with locale files for Hindi, English, Marathi, Bengali, Tamil, Telugu, and other regional languages. School coordinators with limited English literacy would access the platform in their preferred language.

7. **GPS-based School Verification.** Capture the device location at the moment attendance is submitted and compare it against the school's registered geofence. Submissions outside the geofence are flagged for review, deterring the "ghost teacher" problem.

8. **SMS and WhatsApp Alerting.** Integrate with Twilio or the WhatsApp Business API so that critical stock alerts also reach the school coordinator's phone, the block officer, and the district magistrate. This creates an escalation chain that does not depend on either party being logged into the dashboard.

9. **Predictive Stock Analytics.** Use the consumption history to forecast when each item will run out for each school. A simple linear-regression or exponential-smoothing model is sufficient for the prototype; more advanced forecasting can layer in seasonality (festival days, exam weeks) over time.

10. **Barcode and QR Code Scanning.** When a stock delivery arrives, the school coordinator scans the consignment QR code to auto-populate the Add Stock form, eliminating manual data entry and reducing the chance of typos in the most error-prone part of the workflow.

---

## 16. Conclusion

The Poshan Darpan project demonstrates that a **complete, production-quality user experience** for a complex, multi-role government workflow can be designed, built, and tested using only the platform primitives every modern browser already provides — HTML, CSS, JavaScript, and the Web Storage API — without any server, build pipeline, or third-party SaaS dependency. The prototype implements seventeen distinct screens, two role-tailored dashboards, seven Chart.js visualisations, a complete authentication flow, automated stock-deduction tied to attendance submission, threshold-based alert generation, and auto-resolution on stock replenishment.

In doing so, the project achieves all ten objectives set out in §3. It validates the **design and feature set** of a digital mid-day-meal monitoring system before any infrastructure investment is committed, and it gives the eventual production team a precise, executable specification of what the user-facing system must deliver. The clean separation of concerns — `mock-data.js` is the only file that touches `localStorage`; the dashboards are pure consumers of its API — means that when the time comes to migrate to a real back-end, the change is **surgical**, not architectural.

Beyond its technical demonstration, the project illustrates the wider principle that **digital tools can transform government social-protection programmes** at a fraction of the cost typically associated with bespoke government IT contracts. A single developer can prototype the complete flow in a few weeks; the deployment, when it comes, is incremental — a pilot district, then a state, then the country — because the data model, the alert logic, and the reporting structure have all already been worked out. With the addition of the back-end and authentication enhancements described in §15, Poshan Darpan would be ready for a real-world pilot serving thousands of schools, hundreds of thousands of children, and the daily operational and strategic decisions that determine whether the mid-day meal scheme delivers on its mandate.

---

## 17. References

1. Government of India, Ministry of Education. *PM POSHAN: Pradhan Mantri Poshan Shakti Nirman.* Official scheme guidelines, 2021. <https://pmposhan.education.gov.in/>
2. Ministry of Education, Department of School Education and Literacy. *Mid-Day Meal Management Information System (MDM-MIS).* <https://mdm.nic.in/>
3. Mozilla Developer Network. *HTML Living Standard.* <https://developer.mozilla.org/en-US/docs/Web/HTML>
4. Mozilla Developer Network. *CSS Reference.* <https://developer.mozilla.org/en-US/docs/Web/CSS>
5. Mozilla Developer Network. *JavaScript ECMAScript 2015 (ES6) and Beyond.* <https://developer.mozilla.org/en-US/docs/Web/JavaScript>
6. Mozilla Developer Network. *Window.localStorage.* <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>
7. Chart.js Contributors. *Chart.js v4 Documentation.* <https://www.chartjs.org/docs/>
8. Phosphor Icons. *Phosphor Icons web library.* <https://phosphoricons.com/>
9. Drèze, J., & Goyal, A. (2003). *The Future of Mid-Day Meals.* Economic and Political Weekly, 38(44), 4673–4683.
10. Singh, A., Park, A., & Dercon, S. (2014). *School Meals as a Safety Net: An Evaluation of the Midday Meal Scheme in India.* Economic Development and Cultural Change, 62(2), 275–306.
11. Few, S. (2013). *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring.* Analytics Press.
12. Heer, J., & Shneiderman, B. (2012). *Interactive Dynamics for Visual Analysis.* Communications of the ACM, 55(4), 45–54.
13. Government of India. *Digital India Programme.* <https://www.digitalindia.gov.in/>
14. Marcotte, E. (2010). *Responsive Web Design.* A List Apart, Issue 306. <https://alistapart.com/article/responsive-web-design/>
15. Biilmann, M., & Hawksworth, P. (2019). *Modern Web Development on the Jamstack.* O'Reilly Media.

---

## 18. Appendices

### Appendix A: Source Code Listing

The complete source code is organised under the project root directory and consists of fourteen files plus this documentation file. Each file is self-contained except for the documented dependencies on the global `mock-data.js` and `utils.js` modules.

| File | Purpose (one line) |
|---|---|
| `index.html` | Login page entry point |
| `register.html` | New-user registration page |
| `school-dashboard.html` | School administrator dashboard shell with five sections |
| `gov-dashboard.html` | Government official dashboard shell with five sections plus modal root |
| `404.html` | Generic page-not-found error page |
| `css/global.css` | Design system — variables, buttons, cards, inputs, tables, modals, toasts |
| `css/auth.css` | Auth and 404 page-specific styles |
| `css/school-dashboard.css` | School dashboard layout and section styling |
| `css/gov-dashboard.css` | Government dashboard chart cards, filter rows, and modal extras |
| `js/mock-data.js` | Seed data plus complete data-access and analytics API |
| `js/utils.js` | Shared helpers (dates, validation, toasts, modals, animations) |
| `js/auth.js` | Login, registration, session, route-guard logic |
| `js/school-dashboard.js` | School dashboard controller — wires up all five sections |
| `js/gov-dashboard.js` | Government dashboard controller — wires up all five sections, all charts, and the school detail modal |

### Appendix B: User Manual

**Step 1 — Open the application.** Navigate to the project folder and double-click `index.html`. The application opens in your default browser. No installation, no server, and no internet connection (after the first load) is required.

**Step 2 — Login with demo credentials.**

| Role | E-mail | Password |
|---|---|---|
| School Administrator | `rajesh@school.com` | `school123` |
| Government Official | `sanjay@gov.com` | `gov123` |

Click **Login**. After a brief loading animation you are taken to the appropriate dashboard.

**Step 3 — Register a new account.** From the login page, click **Register here**. Fill in your name, e-mail, password (minimum 6 characters), and password confirmation. Choose your role: *School Administrator* or *Government Official*. If you chose School Administrator, select your school from the dropdown; if Government Official, enter your district. Click **Create Account** to be logged in automatically.

**Step 4 — School Administrator Guide.**
- *Overview.* The first screen after login summarises the three key items in stock and shows today's attendance and meals.
- *Inventory.* Three large cards show current stock for rice, wheat, and dal. To add stock, choose the item, enter the quantity, and click **Add Stock**. The Transaction History table lists every recent stock movement.
- *Attendance.* Pick today's date (or any earlier date) and enter the number of students present. The deduction preview updates in real time. If everything is in order, click **Submit Attendance**. The system automatically deducts the right amounts and creates alerts if any item drops too low.
- *Alerts.* Filter by All, Active, or Resolved. Click **Resolve** on any active alert to mark it as handled. Resolving requires a confirmation.
- *Profile.* Read-only view of your school and account details.

**Step 5 — Government Official Guide.**
- *Overview.* Four KPI cards summarise the entire programme. Three charts visualise attendance trends, meal distribution, and inventory health. A feed shows the eight most recent alerts.
- *Schools.* Search by name, filter by district, filter by status, then click **View** on any school to drill into its inventory, attendance, and alert history.
- *Analytics.* Choose 7, 30, or 90 days. Four KPI cards summarise the period; four charts visualise consumption trends, district performance, school-by-school comparison, and stock utilisation.
- *Alerts.* Filter by severity, status, and school. Government users can view but not resolve alerts.
- *Profile.* Read-only view of your account.

**Step 6 — Logout.** Click **Logout** in the bottom-left of the sidebar. After a confirmation, you are returned to the login page.

**Step 7 — Troubleshooting.**

| Symptom | Solution |
|---|---|
| Data has unexpected values | Open browser DevTools (F12) → Console → run `resetDataStore()` and refresh |
| Login does not work | Confirm caps-lock is off; passwords are case-sensitive |
| Charts are blank | Ensure you are online for the first load (Chart.js loads from CDN) |
| Sidebar is missing on phone | Tap the hamburger button in the top-left of the page |
| "Page Not Found" appears | Click **Back to Home** to return to the login page |

---

*End of document.*
