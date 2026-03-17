const mongoose = require('mongoose')

let cached = global.mongooseConn
if (!cached) cached = global.mongooseConn = { conn: null, promise: null }

async function connectDB() {
  if (cached.conn) return cached.conn
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) throw new Error('Missing MONGODB_URI or MONGO_URI environment variable')
  if (!cached.promise) cached.promise = mongoose.connect(uri)
  cached.conn = await cached.promise
  return cached.conn
}

module.exports = { connectDB }
