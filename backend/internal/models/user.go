package models

import (
	"time"

	"gorm.io/gorm"
)

// Role constants
const (
	RoleEmployee = "employee"
	RoleAdmin    = "admin"
)

// User represents an employee or admin
type User struct {
	ID                  int            `json:"id" gorm:"primaryKey"`
	Name                string         `json:"name" gorm:"size:255;not null"`
	Email               string         `json:"email" gorm:"size:255;uniqueIndex;not null"`
	PasswordHash        string         `json:"-" gorm:"column:password_hash;size:255;not null"`
	Role                string         `json:"role" gorm:"size:50;default:employee"`
	AnnualLeaveBalance  int            `json:"annual_leave_balance" gorm:"default:20"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName overrides table name
func (User) TableName() string {
	return "users"
}

// UserResponse is the safe DTO for API responses (no password)
type UserResponse struct {
	ID                 int       `json:"id"`
	Name               string    `json:"name"`
	Email              string    `json:"email"`
	Role               string    `json:"role"`
	AnnualLeaveBalance int       `json:"annual_leave_balance"`
	CreatedAt          time.Time `json:"created_at"`
}

// ToResponse converts User to UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:                 u.ID,
		Name:               u.Name,
		Email:              u.Email,
		Role:               u.Role,
		AnnualLeaveBalance: u.AnnualLeaveBalance,
		CreatedAt:          u.CreatedAt,
	}
}
