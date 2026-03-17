package service

import "leave-management/internal/repository"

// DashboardStats holds aggregate counts for dashboard
type DashboardStats struct {
	TotalEmployees  int64 `json:"total_employees"`
	PendingLeaves   int64 `json:"pending_leaves"`
	ApprovedLeaves  int64 `json:"approved_leaves"`
	RejectedLeaves  int64 `json:"rejected_leaves"`
}

// DashboardService provides dashboard metrics
type DashboardService struct {
	userRepo  *repository.UserRepository
	leaveRepo *repository.LeaveRepository
}

// NewDashboardService creates a new DashboardService
func NewDashboardService(userRepo *repository.UserRepository, leaveRepo *repository.LeaveRepository) *DashboardService {
	return &DashboardService{userRepo: userRepo, leaveRepo: leaveRepo}
}

// GetAdminStats returns global stats for admin dashboard
func (s *DashboardService) GetAdminStats() (*DashboardStats, error) {
	_, total, err := s.userRepo.List("", 0, 0)
	if err != nil {
		return nil, err
	}
	pending, approved, rejected, err := s.leaveRepo.CountByStatus(nil)
	if err != nil {
		return nil, err
	}
	return &DashboardStats{
		TotalEmployees: total,
		PendingLeaves:  pending,
		ApprovedLeaves: approved,
		RejectedLeaves: rejected,
	}, nil
}

// GetEmployeeStats returns leave counts for the given user
func (s *DashboardService) GetEmployeeStats(userID int) (*DashboardStats, error) {
	pending, approved, rejected, err := s.leaveRepo.CountByStatus(&userID)
	if err != nil {
		return nil, err
	}
	return &DashboardStats{
		TotalEmployees: 0,
		PendingLeaves:  pending,
		ApprovedLeaves: approved,
		RejectedLeaves: rejected,
	}, nil
}
