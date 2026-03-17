package repository

import (
	"time"

	"leave-management/internal/models"

	"gorm.io/gorm"
)

// LeaveRepository handles leave data access
type LeaveRepository struct {
	db *gorm.DB
}

// NewLeaveRepository creates a new LeaveRepository
func NewLeaveRepository(db *gorm.DB) *LeaveRepository {
	return &LeaveRepository{db: db}
}

// Create inserts a new leave request
func (r *LeaveRepository) Create(leave *models.Leave) error {
	return r.db.Create(leave).Error
}

// GetByID returns leave by id, optionally with user preload
func (r *LeaveRepository) GetByID(id int, withUser bool) (*models.Leave, error) {
	var l models.Leave
	q := r.db
	if withUser {
		q = q.Preload("User")
	}
	err := q.First(&l, id).Error
	if err != nil {
		return nil, err
	}
	return &l, nil
}

// GetByUserID returns leaves for a user with optional filters and pagination
func (r *LeaveRepository) GetByUserID(userID int, status string, from, to *time.Time, limit, offset int) ([]models.Leave, int64, error) {
	var leaves []models.Leave
	q := r.db.Model(&models.Leave{}).Where("user_id = ?", userID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if from != nil {
		q = q.Where("end_date >= ?", *from)
	}
	if to != nil {
		q = q.Where("start_date <= ?", *to)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Limit(limit).Offset(offset).Order("created_at DESC").Find(&leaves).Error
	return leaves, total, err
}

// ListAll returns all leaves (admin) with optional filters and pagination
func (r *LeaveRepository) ListAll(status string, from, to *time.Time, limit, offset int) ([]models.Leave, int64, error) {
	var leaves []models.Leave
	q := r.db.Model(&models.Leave{}).Preload("User")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if from != nil {
		q = q.Where("end_date >= ?", *from)
	}
	if to != nil {
		q = q.Where("start_date <= ?", *to)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Limit(limit).Offset(offset).Order("created_at DESC").Find(&leaves).Error
	return leaves, total, err
}

// OverlappingExists returns true if user has an approved or pending leave overlapping [start, end]
func (r *LeaveRepository) OverlappingExists(userID int, start, end time.Time, excludeLeaveID int) (bool, error) {
	var count int64
	q := r.db.Model(&models.Leave{}).Where("user_id = ? AND status IN ?", userID, []string{LeaveStatusPending, LeaveStatusApproved}).
		Where("start_date <= ? AND end_date >= ?", end, start)
	if excludeLeaveID > 0 {
		q = q.Where("id != ?", excludeLeaveID)
	}
	err := q.Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdateStatus updates leave status
func (r *LeaveRepository) UpdateStatus(id int, status string) error {
	return r.db.Model(&models.Leave{}).Where("id = ?", id).Update("status", status).Error
}

// Update updates the leave record
func (r *LeaveRepository) Update(leave *models.Leave) error {
	return r.db.Save(leave).Error
}

// CountByStatus returns count of leaves by status (optionally for a user)
func (r *LeaveRepository) CountByStatus(userID *int) (pending, approved, rejected int64, err error) {
	makeQ := func() *gorm.DB {
		q := r.db.Model(&models.Leave{})
		if userID != nil {
			q = q.Where("user_id = ?", *userID)
		}
		return q
	}
	if err = makeQ().Where("status = ?", models.LeaveStatusPending).Count(&pending).Error; err != nil {
		return
	}
	if err = makeQ().Where("status = ?", models.LeaveStatusApproved).Count(&approved).Error; err != nil {
		return
	}
	if err = makeQ().Where("status = ?", models.LeaveStatusRejected).Count(&rejected).Error; err != nil {
		return
	}
	return pending, approved, rejected, nil
}

// CreateAuditLog inserts an audit log entry
func (r *LeaveRepository) CreateAuditLog(log *models.LeaveAuditLog) error {
	return r.db.Create(log).Error
}

const LeaveStatusPending = "pending"
const LeaveStatusApproved = "approved"
const LeaveStatusRejected = "rejected"
