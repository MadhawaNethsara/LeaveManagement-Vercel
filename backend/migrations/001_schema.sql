-- Leave Management System - PostgreSQL Schema
-- Run this migration to create all tables, indexes, and constraints.

-- Enable UUID extension (optional, we use SERIAL for simplicity)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (employees + admins)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    annual_leave_balance INTEGER NOT NULL DEFAULT 20 CHECK (annual_leave_balance >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- LEAVES (leave requests)
-- ============================================
CREATE TABLE IF NOT EXISTS leaves (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason      TEXT,
    leave_type  VARCHAR(50) NOT NULL DEFAULT 'annual' CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'other')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX idx_leaves_created_at ON leaves(created_at DESC);

-- ============================================
-- LEAVE AUDIT LOG (who approved/rejected)
-- ============================================
CREATE TABLE IF NOT EXISTS leave_audit_log (
    id          SERIAL PRIMARY KEY,
    leave_id    INTEGER NOT NULL REFERENCES leaves(id) ON DELETE CASCADE,
    actor_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'rejected')),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_leave_id ON leave_audit_log(leave_id);
CREATE INDEX idx_audit_actor_id ON leave_audit_log(actor_id);

-- ============================================
-- TRIGGER: update updated_at on users
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS leaves_updated_at ON leaves;
CREATE TRIGGER leaves_updated_at
    BEFORE UPDATE ON leaves
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
