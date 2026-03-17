# Leave Management System — API Documentation

Base URL: `http://localhost:8080/api`

All protected endpoints require header: `Authorization: Bearer <token>`

---

## Auth

### POST /auth/login

Request:
```json
{
  "email": "admin@company.com",
  "password": "password"
}
```

Response `200`:
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@company.com",
      "role": "admin",
      "annual_leave_balance": 25,
      "created_at": "..."
    },
    "token": "eyJhbG..."
  }
}
```

### POST /auth/register

Request:
```json
{
  "name": "New User",
  "email": "user@company.com",
  "password": "secret123",
  "role": "employee"
}
```

Response `201`: `{ "data": { "id", "name", "email", "role", "annual_leave_balance", "created_at" } }`

---

## Dashboard (protected)

### GET /dashboard/stats

Returns counts: `total_employees` (admin only), `pending_leaves`, `approved_leaves`, `rejected_leaves`.

Response `200`:
```json
{
  "data": {
    "total_employees": 10,
    "pending_leaves": 3,
    "approved_leaves": 20,
    "rejected_leaves": 2
  }
}
```

---

## Employees (admin only)

- **GET /employees** — List all. Query: `search`, `limit`, `offset`. Response: `{ "data": [...], "total": N }`
- **GET /employees/:id** — Get one. Response: `{ "data": { ... } }`
- **POST /employees** — Create. Body: `name`, `email`, `password`, `role`, `annual_leave_balance`
- **PUT /employees/:id** — Update. Body: `name`, `email`, `role`, `annual_leave_balance`, `password` (optional)
- **DELETE /employees/:id** — Soft delete. Response: `204`

---

## Leaves

### POST /leaves (protected)

Apply for leave.

Request:
```json
{
  "start_date": "2025-04-01",
  "end_date": "2025-04-05",
  "reason": "Family trip",
  "leave_type": "annual"
}
```

`leave_type`: `annual` | `sick` | `unpaid` | `other`

Response `201`: `{ "data": { "id", "user_id", "start_date", "end_date", "status", "reason", "leave_type", "created_at" } }`

### GET /leaves/me (protected)

My leave requests. Query: `status`, `from`, `to`, `limit`, `offset`.

Response: `{ "data": [...], "total": N }`

### GET /leaves (admin only)

All leave requests. Same query params.

### PATCH /leaves/:id/status (admin only)

Approve or reject.

Request:
```json
{
  "status": "approved",
  "comment": "Approved."
}
```

Response `200`: `{ "message": "status updated" }`

---

## HTTP Status Codes

- `200` OK
- `201` Created
- `204` No Content
- `400` Bad Request (validation, business rule)
- `401` Unauthorized (missing or invalid token)
- `403` Forbidden (insufficient role)
- `404` Not Found
- `409` Conflict (e.g. email exists, overlapping leave)
- `500` Internal Server Error

---

## Errors

Error responses: `{ "error": "message" }`
