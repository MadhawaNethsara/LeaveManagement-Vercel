/**
 * Seed MongoDB with initial users (same as PostgreSQL seed).
 * Run: MONGODB_URI="your-uri" node api/seed.js
 * Default password for all: "password"
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./lib/models/User')

const SEED_USERS = [
  { name: 'Admin User', email: 'admin@company.com', role: 'admin', annual_leave_balance: 25 },
  { name: 'John Doe', email: 'john.doe@company.com', role: 'employee', annual_leave_balance: 18 },
  { name: 'Jane Smith', email: 'jane.smith@company.com', role: 'employee', annual_leave_balance: 20 },
]

async function seed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('Set MONGODB_URI or MONGO_URI')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const hash = await bcrypt.hash('password', 10)
  for (const u of SEED_USERS) {
    const existing = await User.findOne({ email: u.email, deleted_at: null })
    if (!existing) {
      await User.create({ ...u, password_hash: hash })
      console.log('Created:', u.email)
    } else {
      console.log('Exists:', u.email)
    }
  }
  await mongoose.disconnect()
  console.log('Seed done.')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
