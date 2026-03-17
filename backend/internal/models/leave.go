package models

import "time"

// Leave status constants
const (
	LeaveStatusPending  = "pending"
	LeaveStatusApproved = "approved"
	LeaveStatusRejected = "rejected"
)

// Leave type constants
const (
	LeaveTypeAnnual = "annual"
	LeaveTypeSick   = "sick"
	LeaveTypeUnpaid = "unpaid"
	LeaveTypeOther  = "other"
)

// Leave represents a leave request
type Leave struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	UserID    int       `json:"user_id" gorm:"not null;index"`
	StartDate time.Time `json:"start_date" gorm:"type:date;not null"`
	EndDate   time.Time `json:"end_date" gorm:"type:date;not null"`
	Status    string    `json:"status" gorm:"size:50;default:pending;index"`
	Reason    string    `json:"reason" gorm:"type:text"`
	LeaveType string    `json:"leave_type" gorm:"size:50;default:annual"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"` // serialized as "user" in API
}

// TableName overrides table name
func (Leave) TableName() string {
	return "leaves"
}

// LeaveWithUser is used when we need leave + user info (e.g. approval list)
type LeaveWithUser struct {
	Leave
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

// LeaveAuditLog records who approved/rejected
type LeaveAuditLog struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	LeaveID   int       `json:"leave_id" gorm:"not null;index"`
	ActorID   int       `json:"actor_id" gorm:"not null;index"`
	Action    string    `json:"action" gorm:"size:50;not null"` // approved | rejected
	Comment   string    `json:"comment" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName overrides table name
func (LeaveAuditLog) TableName() string {
	return "leave_audit_log"
}
