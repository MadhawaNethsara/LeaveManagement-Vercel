const mongoose = require('mongoose')

const leaveAuditLogSchema = new mongoose.Schema(
  {
    leave_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Leave', required: true },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['approved', 'rejected'], required: true },
    comment: { type: String },
  },
  { timestamps: true }
)

const LeaveAuditLog = mongoose.model('LeaveAuditLog', leaveAuditLogSchema)
module.exports = LeaveAuditLog
