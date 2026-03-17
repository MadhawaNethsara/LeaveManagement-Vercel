# Deploy Leave Management to Vercel with MongoDB

This project runs on **Vercel** (frontend + serverless API) and uses **MongoDB** instead of PostgreSQL.

---

## 1. MongoDB setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or use any MongoDB connection string).
2. Create a database (e.g. `leave_management`). Collections will be created automatically.
3. Copy your connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/leave_management`).

---

## 2. Seed the database (optional)

From the project root, with `MONGODB_URI` set:

```bash
npm install
MONGODB_URI="your-mongodb-connection-string" node api/seed.js
```

Default seed users (password for all: **password**):

- **Admin**: `admin@company.com`
- **Employees**: `john.doe@company.com`, `jane.smith@company.com`

---

## 3. Deploy to Vercel

1. Push your code to GitHub (or connect your repo in Vercel).
2. In [Vercel](https://vercel.com): **New Project** → import this repo.
3. **Environment variables** (Project → Settings → Environment Variables):

   | Name          | Value                    |
   |---------------|--------------------------|
   | `MONGODB_URI` | Your MongoDB connection string |
   | `JWT_SECRET`  | A long random secret (e.g. from `openssl rand -hex 32`) |

4. **Build & Output** (if not auto-detected):

   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install` (runs at root; installs both root and frontend deps if needed)

   If the frontend is in a subfolder, ensure the root `package.json` build runs from `frontend`. You can set in Vercel:

   - Build command: `npm run build`
   - (Root `package.json` already has `"build": "cd frontend && npm ci && npm run build"`)

5. Deploy. The API is served under `/api/*` (e.g. `/api/auth/login`, `/api/leaves/me`).

---

## 4. Run locally with MongoDB

1. Create a `.env` file in the project root (see `.env.example`):

   ```
   MONGODB_URI=mongodb://localhost:27017/leave_management
   JWT_SECRET=dev-secret
   ```

2. Install and run:

   ```bash
   npm install
   node api/seed.js
   npm run dev:api
   ```

   API: `http://localhost:8080`

3. In another terminal, run the frontend and proxy `/api` to the local API:

   ```bash
   cd frontend && npm install && npm run dev
   ```

   Update `frontend/vite.config.ts` so the `/api` proxy target is `http://localhost:8080` (it already points to the Go backend; change it to `8080` when using the Node API).

---

## API endpoints (unchanged)

Same as the Go/PostgreSQL version:

- `POST /api/auth/login`, `POST /api/auth/register`
- `GET /api/dashboard/stats`
- `GET/POST /api/leaves`, `GET /api/leaves/me`, `PATCH /api/leaves/:id/status`
- `GET/POST/PUT/DELETE /api/employees`, `GET /api/employees/:id`

IDs are MongoDB ObjectIds (strings); the frontend works with string IDs.
