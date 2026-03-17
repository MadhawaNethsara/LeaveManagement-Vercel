const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('./lib/models/User')
const Leave = require('./lib/models/Leave')
const LeaveAuditLog = require('./lib/models/LeaveAuditLog')
const { JWT_SECRET, authMiddleware, requireAdmin, toObjectId } = require('./lib/auth')

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

// --- Auth ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'invalid request' })
    const user = await User.findOne({ email, deleted_at: null })
    if (!user) return res.status(401).json({ error: 'invalid email or password' })
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid email or password' })
    const token = jwt.sign(
      { user_id: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    const u = user.toJSON()
    return res.json({ data: { user: u, token } })
  } catch (e) {
    return res.status(500).json({ error: 'login failed' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role: roleIn } = req.body || {}
    if (!name || !email || !password) return res.status(400).json({ error: 'invalid request' })
    const role = roleIn === 'admin' ? 'admin' : 'employee'
    const existing = await User.findOne({ email, deleted_at: null })
    if (existing) return res.status(409).json({ error: 'email already registered' })
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      password_hash: hash,
      role,
      annual_leave_balance: 20,
    })
    return res.status(201).json({ data: user.toJSON() })
  } catch (e) {
    return res.status(500).json({ error: 'registration failed' })
  }
})

// --- Dashboard (protected) ---
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    if (req.role === 'admin') {
      const total_employees = await User.countDocuments({ deleted_at: null })
      const [pending_leaves, approved_leaves, rejected_leaves] = await Promise.all([
        Leave.countDocuments({ status: 'pending' }),
        Leave.countDocuments({ status: 'approved' }),
        Leave.countDocuments({ status: 'rejected' }),
      ])
      return res.json({
        data: { total_employees, pending_leaves, approved_leaves, rejected_leaves },
      })
    }
    const [pending_leaves, approved_leaves, rejected_leaves] = await Promise.all([
      Leave.countDocuments({ user_id: toObjectId(req.user_id), status: 'pending' }),
      Leave.countDocuments({ user_id: toObjectId(req.user_id), status: 'approved' }),
      Leave.countDocuments({ user_id: toObjectId(req.user_id), status: 'rejected' }),
    ])
    return res.json({
      data: { total_employees: 0, pending_leaves, approved_leaves, rejected_leaves },
    })
  } catch (e) {
    return res.status(500).json({ error: 'failed to get stats' })
  }
})

// --- Leaves (protected) ---
app.get('/api/leaves/me', authMiddleware, async (req, res) => {
  try {
    const { status, from, to, limit = 20, offset = 0 } = req.query
    const filter = { user_id: toObjectId(req.user_id) }
    if (status) filter.status = status
    if (from) filter.end_date = { $gte: new Date(from) }
    if (to) filter.start_date = { $lte: new Date(to) }
    const total = await Leave.countDocuments(filter)
    const leaves = await Leave.find(filter)
      .sort({ created_at: -1 })
      .skip(Number(offset) || 0)
      .limit(Math.min(Number(limit) || 20, 100))
      .lean()
    const data = leaves.map((l) => ({
      ...l,
      id: l._id.toString(),
      user_id: l.user_id?.toString?.(),
    }))
    return res.json({ data, total })
  } catch (e) {
    return res.status(500).json({ error: 'failed to list leaves' })
  }
})

app.post('/api/leaves', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, reason, leave_type: lt } = req.body || {}
    if (!start_date || !end_date) return res.status(400).json({ error: 'invalid request: start_date and end_date required' })
    const start = new Date(start_date)
    const end = new Date(end_date)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'dates must be YYYY-MM-DD' })
    if (end < start) return res.status(400).json({ error: 'end date must be on or after start date' })
    const leaveType = ['annual', 'sick', 'unpaid', 'other'].includes(lt) ? lt : 'annual'
    const userId = toObjectId(req.user_id)

    const overlap = await Leave.findOne({
      user_id: userId,
      status: { $in: ['pending', 'approved'] },
      $and: [{ start_date: { $lte: end } }, { end_date: { $gte: start } }],
    })
    if (overlap) return res.status(409).json({ error: 'you have an overlapping leave (approved or pending)' })

    if (leaveType === 'annual') {
      const user = await User.findById(userId)
      if (!user) return res.status(400).json({ error: 'user not found' })
      const days = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1
      if (user.annual_leave_balance < days) return res.status(400).json({ error: 'insufficient annual leave balance' })
    }

    const leave = await Leave.create({
      user_id: userId,
      start_date: start,
      end_date: end,
      reason: reason || '',
      leave_type: leaveType,
      status: 'pending',
    })
    const data = leave.toJSON()
    return res.status(201).json({ data })
  } catch (e) {
    return res.status(500).json({ error: 'failed to apply leave' })
  }
})

// --- Admin: employees ---
app.get('/api/employees', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query
    const filter = { deleted_at: null }
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }]
    const total = await User.countDocuments(filter)
    const users = await User.find(filter)
      .select('-password_hash')
      .sort({ created_at: 1 })
      .skip(Number(offset) || 0)
      .limit(Math.min(Number(limit) || 20, 100))
      .lean()
    const data = users.map((u) => ({ ...u, id: u._id.toString() }))
    return res.json({ data, total })
  } catch (e) {
    return res.status(500).json({ error: 'failed to list employees' })
  }
})

app.get('/api/employees/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ _id: toObjectId(req.params.id), deleted_at: null })
    if (!user) return res.status(404).json({ error: 'employee not found' })
    return res.json({ data: user.toJSON() })
  } catch (e) {
    return res.status(500).json({ error: 'failed to get employee' })
  }
})

app.post('/api/employees', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role: roleIn, annual_leave_balance } = req.body || {}
    if (!name || !email || !password) return res.status(400).json({ error: 'invalid request' })
    const existing = await User.findOne({ email, deleted_at: null })
    if (existing) return res.status(409).json({ error: 'email already registered' })
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      password_hash: hash,
      role: roleIn === 'admin' ? 'admin' : 'employee',
      annual_leave_balance: annual_leave_balance > 0 ? annual_leave_balance : 20,
    })
    return res.status(201).json({ data: user.toJSON() })
  } catch (e) {
    return res.status(500).json({ error: 'failed to create employee' })
  }
})

app.put('/api/employees/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ _id: toObjectId(req.params.id), deleted_at: null })
    if (!user) return res.status(404).json({ error: 'employee not found' })
    const { name, email, role, annual_leave_balance, password } = req.body || {}
    if (name != null) user.name = name
    if (email != null) user.email = email
    if (role != null) user.role = role
    if (annual_leave_balance != null) user.annual_leave_balance = annual_leave_balance
    if (password && password.length >= 6) user.password_hash = await bcrypt.hash(password, 10)
    await user.save()
    return res.json({ data: user.toJSON() })
  } catch (e) {
    return res.status(500).json({ error: 'failed to update employee' })
  }
})

app.delete('/api/employees/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ _id: toObjectId(req.params.id), deleted_at: null })
    if (!user) return res.status(404).json({ error: 'employee not found' })
    user.deleted_at = new Date()
    await user.save()
    return res.status(204).send()
  } catch (e) {
    return res.status(500).json({ error: 'failed to delete employee' })
  }
})

// --- Admin: leaves list and update status ---
app.get('/api/leaves', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, from, to, limit = 20, offset = 0 } = req.query
    const filter = {}
    if (status) filter.status = status
    if (from) filter.end_date = { $gte: new Date(from) }
    if (to) filter.start_date = { $lte: new Date(to) }
    const total = await Leave.countDocuments(filter)
    const leaves = await Leave.find(filter)
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .skip(Number(offset) || 0)
      .limit(Math.min(Number(limit) || 20, 100))
      .lean()
    const data = leaves.map((l) => {
      const u = l.user_id
      return {
        ...l,
        id: l._id.toString(),
        user_id: u?._id?.toString?.() || l.user_id?.toString?.(),
        user_name: u?.name,
        user_email: u?.email,
      }
    })
    return res.json({ data, total })
  } catch (e) {
    return res.status(500).json({ error: 'failed to list leaves' })
  }
})

app.patch('/api/leaves/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, comment } = req.body || {}
    if (status !== 'approved' && status !== 'rejected') return res.status(400).json({ error: 'status must be approved or rejected' })
    const leave = await Leave.findById(toObjectId(req.params.id)).populate('user_id')
    if (!leave) return res.status(404).json({ error: 'leave not found' })
    if (leave.status !== 'pending') return res.status(400).json({ error: 'only pending leaves can be approved or rejected' })
    leave.status = status
    await leave.save()
    await LeaveAuditLog.create({
      leave_id: leave._id,
      actor_id: toObjectId(req.user_id),
      action: status,
      comment: comment || '',
    })
    if (status === 'approved' && leave.leave_type === 'annual' && leave.user_id) {
      const days = Math.floor((leave.end_date - leave.start_date) / (24 * 60 * 60 * 1000)) + 1
      await User.findByIdAndUpdate(leave.user_id._id, { $inc: { annual_leave_balance: -days } })
    }
    return res.json({ message: 'status updated' })
  } catch (e) {
    return res.status(500).json({ error: 'failed to update status' })
  }
})

module.exports = app
