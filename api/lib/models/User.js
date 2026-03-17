const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
    annual_leave_balance: { type: Number, default: 20, min: 0 },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
)

userSchema.index({ deleted_at: 1 })

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    delete ret.password_hash
    return ret
  },
})

const User = mongoose.model('User', userSchema)
module.exports = User
