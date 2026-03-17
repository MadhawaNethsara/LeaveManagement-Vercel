const jwt = require('jsonwebtoken')
const User = require('./models/User')
const mongoose = require('mongoose')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-secret-key'

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) {
    return res.status(401).json({ error: 'authorization required' })
  }
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'invalid authorization header' })
  }
  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET)
    req.user_id = decoded.user_id
    req.userId = decoded.user_id
    req.role = decoded.role
    req.email = decoded.email
    next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' })
  }
}

function requireAdmin(req, res, next) {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'admin access required' })
  }
  next()
}

function toObjectId(id) {
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id)
  }
  return id
}

module.exports = { JWT_SECRET, authMiddleware, requireAdmin, toObjectId }
