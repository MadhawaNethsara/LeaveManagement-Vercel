const mongoose = require('mongoose')

const leaveSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reason: { type: String },
    leave_type: {
      type: String,
      enum: ['annual', 'sick', 'unpaid', 'other'],
      default: 'annual',
    },
  },
  { timestamps: true }
)

leaveSchema.index({ user_id: 1 })
leaveSchema.index({ status: 1 })
leaveSchema.index({ start_date: 1, end_date: 1 })

leaveSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    ret.user_id = ret.user_id?.toString?.() || ret.user_id
    delete ret._id
    delete ret.__v
    if (ret.user && ret.user._id) {
      ret.user.id = ret.user._id.toString()
      delete ret.user._id
      delete ret.user.password_hash
    }
    return ret
  },
})

const Leave = mongoose.model('Leave', leaveSchema)
module.exports = Leave
