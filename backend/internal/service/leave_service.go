package service

import (
	"errors"
	"time"

	"leave-management/internal/models"
	"leave-management/internal/repository"

	"gorm.io/gorm"
)

var (
	ErrLeaveNotFound     = errors.New("leave not found")
	ErrOverlappingLeave  = errors.New("you have an overlapping leave request (approved or pending)")
	ErrInsufficientBalance = errors.New("insufficient annual leave balance")
	ErrInvalidDates      = errors.New("end date must be on or after start date")
	ErrOnlyPending       = errors.New("only pending leaves can be approved or rejected")
)

// LeaveService handles leave application and approval logic
type LeaveService struct {
	leaveRepo *repository.LeaveRepository
	userRepo  *repository.UserRepository
}

// NewLeaveService creates a new LeaveService
func NewLeaveService(leaveRepo *repository.LeaveRepository, userRepo *repository.UserRepository) *LeaveService {
	return &LeaveService{leaveRepo: leaveRepo, userRepo: userRepo}
}

// Apply creates a new leave request with overlap check and balance check for annual leave
func (s *LeaveService) Apply(userID int, startDate, endDate time.Time, reason, leaveType string) (*models.Leave, error) {
	if endDate.Before(startDate) {
		return nil, ErrInvalidDates
	}
	overlap, err := s.leaveRepo.OverlappingExists(userID, startDate, endDate, 0)
	if err != nil {
		return nil, err
	}
	if overlap {
		return nil, ErrOverlappingLeave
	}
	if leaveType == models.LeaveTypeAnnual {
		user, err := s.userRepo.GetByID(userID)
		if err != nil {
			return nil, err
		}
		days := int(endDate.Sub(startDate).Hours()/24) + 1
		if user.AnnualLeaveBalance < days {
			return nil, ErrInsufficientBalance
		}
	}
	leave := &models.Leave{
		UserID:    userID,
		StartDate: startDate,
		EndDate:   endDate,
		Status:    models.LeaveStatusPending,
		Reason:    reason,
		LeaveType: leaveType,
	}
	if leaveType == "" {
		leave.LeaveType = models.LeaveTypeAnnual
	}
	if err := s.leaveRepo.Create(leave); err != nil {
		return nil, err
	}
	return leave, nil
}

// GetByID returns a single leave (with user if needed)
func (s *LeaveService) GetByID(id int, withUser bool) (*models.Leave, error) {
	l, err := s.leaveRepo.GetByID(id, withUser)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLeaveNotFound
		}
		return nil, err
	}
	return l, nil
}

// GetMyLeaves returns leaves for the given user with filters and pagination
func (s *LeaveService) GetMyLeaves(userID int, status string, from, to *time.Time, limit, offset int) ([]models.Leave, int64, error) {
	return s.leaveRepo.GetByUserID(userID, status, from, to, limit, offset)
}

// ListAll returns all leaves for admin with filters and pagination
func (s *LeaveService) ListAll(status string, from, to *time.Time, limit, offset int) ([]models.Leave, int64, error) {
	return s.leaveRepo.ListAll(status, from, to, limit, offset)
}

// UpdateStatus approves or rejects a leave and writes audit log; deducts balance for approved annual leave
func (s *LeaveService) UpdateStatus(leaveID, actorID int, status, comment string) error {
	if status != models.LeaveStatusApproved && status != models.LeaveStatusRejected {
		return ErrOnlyPending
	}
	leave, err := s.leaveRepo.GetByID(leaveID, true)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrLeaveNotFound
		}
		return err
	}
	if leave.Status != models.LeaveStatusPending {
		return ErrOnlyPending
	}
	if err := s.leaveRepo.UpdateStatus(leaveID, status); err != nil {
		return err
	}
	// Audit log
	action := "approved"
	if status == models.LeaveStatusRejected {
		action = "rejected"
	}
	_ = s.leaveRepo.CreateAuditLog(&models.LeaveAuditLog{
		LeaveID: leaveID,
		ActorID: actorID,
		Action:  action,
		Comment: comment,
	})
	// Deduct annual leave balance when approved
	if status == models.LeaveStatusApproved && leave.LeaveType == models.LeaveTypeAnnual && leave.User != nil {
		days := int(leave.EndDate.Sub(leave.StartDate).Hours()/24) + 1
		user, _ := s.userRepo.GetByID(leave.UserID)
		if user != nil && user.AnnualLeaveBalance >= days {
			user.AnnualLeaveBalance -= days
			_ = s.userRepo.Update(user)
		}
	}
	return nil
}
