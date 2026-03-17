package service

import (
	"errors"

	"leave-management/internal/models"
	"leave-management/internal/repository"

	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

// UserService handles employee CRUD and business rules
type UserService struct {
	repo *repository.UserRepository
}

// NewUserService creates a new UserService
func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// Create creates a new employee (or admin). Password must be hashed by caller or use Register.
func (s *UserService) Create(user *models.User) error {
	existing, _ := s.repo.GetByEmail(user.Email)
	if existing != nil {
		return ErrEmailExists
	}
	return s.repo.Create(user)
}

// GetByID returns user by id
func (s *UserService) GetByID(id int) (*models.User, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return u, nil
}

// List returns paginated users with optional search
func (s *UserService) List(search string, limit, offset int) ([]models.User, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.List(search, limit, offset)
}

// Update updates user (exclude password if not changing)
func (s *UserService) Update(user *models.User) error {
	_, err := s.repo.GetByID(user.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	return s.repo.Update(user)
}

// Delete soft-deletes user
func (s *UserService) Delete(id int) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	return s.repo.Delete(id)
}
