-- Seed data for development and demo
-- Default password for all seed users: "password" (bcrypt cost 10)
-- Admin: admin@company.com / password
-- Employees: john.doe@company.com, jane.smith@company.com / password

INSERT INTO users (name, email, password_hash, role, annual_leave_balance) VALUES
('Admin User', 'admin@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 25),
('John Doe', 'john.doe@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 18),
('Jane Smith', 'jane.smith@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 20)
ON CONFLICT (email) DO NOTHING;
