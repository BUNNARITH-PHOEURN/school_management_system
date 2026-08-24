# School Management System

Full-stack app: **React (Vite)** frontend + **Express (MySQL)** backend.

## Tech Stack

| Layer    | Tech                                        | Port |
|----------|---------------------------------------------|------|
| Frontend | React 19, Vite 8, Tailwind 4, TypeScript    | 8443 |
| Backend  | Node.js, Express 5, mysql2                  | 5000 |
| Database | MySQL / MariaDB (InnoDB)                    | 3306 |

## Project Structure

```
school_management_system/
├── backend/
│   ├── schema.sql              # full database schema (all tables + FKs)
│   ├── scripts/setup-db.js     # creates database & tables from schema.sql
│   ├── server.js               # entry point
│   ├── src/
│   │   ├── app.js              # express app (routes mounted here)
│   │   ├── config/db.js        # mysql2 pool (reads .env)
│   │   ├── controllers/        # request handlers + validation
│   │   ├── models/             # SQL queries
│   │   └── routes/
│   ├── tests/                  # jest + supertest (DB is mocked)
│   └── .env                    # database credentials (you create this)
├── frontend/                   # Vite React app
└── package.json                # runs backend + frontend together
```

## Prerequisites

- **Node.js** 18+
- **MySQL** running locally (WAMP/XAMPP/standalone all work)

## Step-by-step Setup

### 1. Install dependencies (all three folders)

```bash
# from project root
npm install

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure database credentials

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=school_management
```

> Adjust user/password to your MySQL setup. Default WAMP/XAMPP installs use `root` with an empty password.

### 3. Create the database and tables

```bash
cd backend
node scripts/setup-db.js
```

This creates the `school_management` database and **all 10 tables** (departments, students, teachers, subjects, classes, enrollments, attendance, etc.) with foreign keys, using `schema.sql`.

### 4. Run the app (backend + frontend together)

```bash
# from project root
npm run dev
```

You should see:

```
[backend]  Server running on http://localhost:5000
[frontend] VITE ready ➜ Local: http://localhost:8443/
```

Both auto-reload on save (backend uses nodemon, frontend uses Vite HMR).

### Run them separately (optional)

```bash
cd backend   && npm run dev    # API only  → http://localhost:5000
cd frontend  && npm run dev    # UI only   → http://localhost:8443
```

## Run Backend Tests

Tests mock the database layer — no MySQL required.

```bash
cd backend
npm test
```

## API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint            | Description        |
|--------|---------------------|--------------------|
| GET    | `/api/health`       | Health check       |
| GET    | `/api/students`     | List all students  |
| GET    | `/api/students/:id` | Get one student    |
| POST   | `/api/students`     | Create student     |
| PUT    | `/api/students/:id` | Update student     |
| DELETE | `/api/students/:id` | Delete student     |

Example create:

```bash
curl -X POST http://localhost:5000/api/students ^
  -H "Content-Type: application/json" ^
  -d "{\"first_name\":\"John\",\"last_name\":\"Doe\",\"email\":\"john@school.edu\",\"gender\":\"male\",\"date_of_birth\":\"2005-04-12\"}"
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Access denied for user 'root'@'localhost'` | Wrong password in `backend/.env` — try empty for default WAMP/XAMPP |
| `ER_ACCESS_DENIED` from old CLI clients but Node works fine | Old `mysql.exe` client can't load `caching_sha2_password`; use `scripts/setup-db.js` instead |
| Port 5000 or 8443 already in use | Stop the other process or change `PORT` in env / `vite.config.ts` |
| `Cannot find module 'mysql2/promise'` | Run `npm install` inside `backend/` |
