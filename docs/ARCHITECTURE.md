# Leave Management System — Architecture Overview

## 1. System Overview

Enterprise-grade Leave Management System for internal company use. Supports employees and managers with role-based access, leave requests, approval workflow, and analytics.

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React SPA)                               │
│  Vite + React + Tailwind + React Query + Zustand                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (JSON)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / BACKEND                            │
│  Golang (Gin) — Handlers → Services → Repositories                      │
│  JWT Auth • RBAC Middleware • Validation                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQL
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL                                       │
│  users, leaves, leave_audit_log                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture (Golang)

### Layered Architecture

| Layer        | Responsibility                    | Location           |
|-------------|------------------------------------|--------------------|
| **Handler** | HTTP request/response, validation  | `internal/handler/` |
| **Service** | Business logic, orchestration      | `internal/service/` |
| **Repository** | Data access, queries           | `internal/repository/` |
| **Models**  | Domain entities, DTOs             | `internal/models/`  |
| **Middleware** | Auth, logging, CORS           | `internal/middleware/` |
| **Config**  | Environment, DB connection        | `config/`           |

### Request Flow

```
HTTP Request
    → Middleware (CORS, JWT, RBAC)
    → Handler (bind, validate)
    → Service (business rules, leave balance, overlap check)
    → Repository (DB)
    → Response
```

### Key Design Decisions

- **Gin** for HTTP (performance, middleware ecosystem).
- **Repository pattern** for testability and DB abstraction.
- **JWT** in Authorization header; refresh not required for internal use.
- **Audit log** table for who approved/rejected and when.

---

## 3. Database Design

- **users**: id, name, email, password_hash, role, annual_leave_balance, created_at, updated_at
- **leaves**: id, user_id, start_date, end_date, status, reason, leave_type, created_at, updated_at
- **leave_audit_log**: id, leave_id, actor_id, action, comment, created_at

Indexes on: `users(email)`, `leaves(user_id)`, `leaves(status)`, `leaves(start_date, end_date)` for overlap checks.

---

## 4. Frontend Architecture

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **React Query** for server state (employees, leaves, dashboard)
- **Zustand** for auth state (user, token)
- **React Router** for SPA routing
- **Layout**: Sidebar + main content; role-based menu items

---

## 5. API Style

- RESTful resources: `GET/POST /api/employees`, `POST/PATCH /api/leaves`, etc.
- JSON request/response
- HTTP status: 200, 201, 400, 401, 403, 404, 500
- Consistent envelope: `{ "data": {...} }` or `{ "error": "message" }`

---

## 6. Security

- Passwords hashed with bcrypt
- JWT in `Authorization: Bearer <token>`
- Role checks in middleware (Employee vs Admin)
- Input validation on backend; frontend validation for UX

---

## 7. Project Structure

```
backend/
  cmd/server/          # main.go
  config/              # config load
  internal/
    handler/           # auth, employee, leave, dashboard
    service/
    repository/
    models/
    middleware/
  pkg/utils/
  migrations/          # SQL schema + seed

frontend/
  src/
    components/        # reusable UI
    pages/             # route pages
    hooks/
    services/          # API client
    layouts/
    store/             # Zustand
```

---

*Document version: 1.0 — Leave Management System*
