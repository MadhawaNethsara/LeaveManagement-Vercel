package repository

import (
	"leave-management/internal/models"

	"gorm.io/gorm"
)

// UserRepository handles user data access
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new user
func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// GetByID returns user by id
func (r *UserRepository) GetByID(id int) (*models.User, error) {
	var u models.User
	err := r.db.First(&u, id).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetByEmail returns user by email
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var u models.User
	err := r.db.Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// List returns all users with optional search and pagination
func (r *UserRepository) List(search string, limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	q := r.db.Model(&models.User{})
	if search != "" {
		q = q.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit > 0 {
		if err := q.Limit(limit).Offset(offset).Order("id ASC").Find(&users).Error; err != nil {
			return nil, 0, err
		}
	}
	return users, total, nil
}

// Update updates user
func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

// Delete soft-deletes user
func (r *UserRepository) Delete(id int) error {
	return r.db.Delete(&models.User{}, id).Error
}
