# EduMind — Smart College Management System

A full-stack college management platform with three role-based portals — **Admin**, **Faculty**, and **Student** — built for the CSE5015 group project requirement.

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts, lucide-react
- **Backend:** Node.js, Express.js
- **Database:** MySQL (or MariaDB)
- **Auth/Security:** JWT-based sessions, bcrypt password hashing, role-based access control

Each role gets its own color-coded portal (navy for Admin, teal for Faculty, amber for Student) so it's instantly clear which part of the system you're in — useful both for day-to-day use and for demoing the three roles side by side.

## 1. Prerequisites

- Node.js 18+ and npm
- MySQL 8+ or MariaDB 10.5+ running locally (or accessible over the network)

## 2. Database setup

Create the database and load the schema + demo data. From the `backend/database` folder you can either:

**Option A — let the app do it for you:**

```bash
cd backend
cp .env.example .env
# edit .env with your MySQL host/user/password
npm install
npm run seed
```

`npm run seed` connects using your `.env` credentials, creates the `edumind` database if it doesn't exist, runs `schema.sql`, then loads `seed.sql`.

**Option B — run the SQL manually:**

```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
```

## 3. Backend setup

```bash
cd backend
cp .env.example .env   # if you haven't already
# fill in DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, and a long random JWT_SECRET
npm install
npm start               # or: npm run dev (nodemon, auto-restarts on changes)
```

The API runs on `http://localhost:5000` by default. Visit `http://localhost:5000/api/health` to confirm it's up.

## 4. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` and `/uploads` requests to the backend automatically (see `vite.config.js`), so no extra configuration is needed in development.

To build a production bundle: `npm run build` (output goes to `frontend/dist`).

## 5. Demo accounts

The seed data includes one account per role so you can explore all three portals immediately:

| Role    | Email                  | Password      |
|---------|-------------------------|---------------|
| Admin   | admin@edumind.lk         | Admin@123     |
| Faculty | rahul.s@edumind.lk       | Faculty@123   |
| Student | amit.s@edumind.lk        | Student@123   |

Two more faculty accounts (`anjali.p@edumind.lk`, `kasun.f@edumind.lk`) and seven more student accounts (`ST002`–`ST008`, email pattern `firstname.initial@edumind.lk`) share the same passwords as above for their role. One student, **Ruwan Bandara** (`ruwan.b@edumind.lk`), is deliberately seeded with poor attendance (~41%) so you can demo the low-attendance warning banner and the admin attendance report's at-risk flagging.

## 6. Current build status

This is a work-in-progress snapshot, not the finished system. A subset of each portal is wired up end-to-end so the core flows can be demoed live; the remaining modules are visible in the navigation (to show the planned scope) but currently render a "Coming soon" placeholder while they're being built.

**Admin** — Overview dashboard is implemented (currently shown with sample data while the live aggregation queries are finalized). Students, Faculty, Branches, Subjects, Notices, Exams, Reports, and Activity Logs are scaffolded in the nav and pending implementation.

**Faculty** — Overview is implemented (sample data, same as above). Subjects, Students, Attendance, Marks, Materials, Notes, and Profile are scaffolded and pending implementation.

**Student** — Overview, Schedule, Attendance, and Marks are fully implemented and connected live to the database. Materials, Notices, Notifications, and Notes are scaffolded and pending implementation.

## 7. Project structure

```
EduMind/
├── backend/
│   ├── config/          # MySQL connection pool
│   ├── controllers/      # Route handlers per role
│   ├── database/         # schema.sql, seed.sql, seed runner
│   ├── middleware/        # JWT auth, role guards, file upload
│   ├── routes/            # Express routers
│   ├── utils/              # Activity log helper
│   └── server.js
└── frontend/
    └── src/
        ├── api/            # axios wrappers per role
        ├── components/      # shared UI + layout (sidebar/topbar)
        ├── context/          # auth + toast providers
        ├── pages/admin|faculty|student/
        └── theme.js           # role color/nav configuration
```

## 8. Notes for the project report

This implementation follows the architecture described in the proposal: a `User` base identity (with `role`) extended by `Admin`/`Faculty`/`Student`-specific tables, `Subject`–`Faculty` and `Student`–`Subject` relationships, and dedicated `Attendance`, `Marks`, `Notice`, `Exam`, `Material`, `Note`, and `ActivityLog` tables — all enforced through JWT authentication and role-based middleware on every protected route.
