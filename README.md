# Leave Management System

Enterprise-grade Leave Management System with **React (Vite)** frontend and optional backends:

- **Vercel + MongoDB** (recommended for hosting): Node.js serverless API with MongoDB. See [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md).
- **Local**: **Golang (Gin)** backend with **PostgreSQL** (see below).

---

## Features

- **Authentication**: JWT login; role-based access (Employee / Admin)
- **Employee Management**: CRUD employees, search, pagination (Admin only)
- **Leave Requests**: Apply leave (annual, sick, unpaid, other); overlap prevention; leave balance check
- **Approval Workflow**: Approve/reject with audit log (Admin)
- **Dashboard**: Stats (total employees, pending/approved/rejected leaves)
- **My Leaves**: Filter by status and date range; pagination

---

## Project Structure

```
├── backend/                 # Golang API
│   ├── cmd/server/          # main.go
│   ├── config/              # Config load
│   ├── internal/
│   │   ├── handler/         # HTTP handlers
│   │   ├── service/         # Business logic
│   │   ├── repository/      # DB access
│   │   ├── models/          # Domain models
│   │   ├── middleware/       # Auth, RBAC
│   │   └── database/         # DB connection + AutoMigrate
│   ├── pkg/utils/
│   └── migrations/          # SQL schema + seed
├── frontend/                # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/        # API client
│       └── store/            # Zustand auth
└── docs/
    ├── ARCHITECTURE.md
    └── API.md
```

---

## Prerequisites

- **Go 1.21+**
- **Node.js 18+** and npm/yarn
- **PostgreSQL 14+**

---

## Database Setup

1. Create a database:

```bash
createdb leave_management
```

2. Run migrations (optional if you use AutoMigrate; recommended for production):

```bash
psql -d leave_management -f backend/migrations/001_schema.sql
psql -d leave_management -f backend/migrations/002_seed.sql
```

Seed users (password for all: **password**):

- **Admin**: `admin@company.com`
- **Employees**: `john.doe@company.com`, `jane.smith@company.com`

---

## Backend Setup

1. Go to backend and install dependencies:

```bash
cd backend
go mod tidy
```

2. Create `.env` in `backend/` (or set environment variables):

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=leave_management
DB_SSLMODE=disable
JWT_SECRET=your-secret-key-change-in-production
```

3. Run the server:

```bash
go run ./cmd/server
```

API base: `http://localhost:8080`

---

## Frontend Setup

1. Install dependencies and run dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open **http://localhost:3000**. The Vite proxy forwards `/api` to the backend.

3. Login with **admin@company.com** / **password**.

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/register` | No | Register |
| GET | `/api/dashboard/stats` | Yes | Dashboard stats |
| GET | `/api/leaves/me` | Yes | My leaves (query: status, from, to, limit, offset) |
| POST | `/api/leaves` | Yes | Apply leave |
| GET | `/api/employees` | Admin | List employees (query: search, limit, offset) |
| POST | `/api/employees` | Admin | Create employee |
| GET | `/api/employees/:id` | Admin | Get employee |
| PUT | `/api/employees/:id` | Admin | Update employee |
| DELETE | `/api/employees/:id` | Admin | Delete employee |
| GET | `/api/leaves` | Admin | List all leaves |
| PATCH | `/api/leaves/:id/status` | Admin | Approve/reject leave |

See **docs/API.md** for request/response details.

---

## Production Build

- **Vercel + MongoDB**: Deploy to Vercel; set `MONGODB_URI` and `JWT_SECRET`. See [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md).
- **Go + PostgreSQL**: **Backend**: `cd backend && go build -o server ./cmd/server`  
  **Frontend**: `cd frontend && npm run build` → serve `dist/` and proxy `/api` to the backend.

---



## License

Internal use. All rights reserved.
