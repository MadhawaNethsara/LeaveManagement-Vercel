package service

import (
	"errors"
	"time"

	"leave-management/internal/models"
	"leave-management/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailExists        = errors.New("email already registered")
)

// AuthService handles authentication logic
type AuthService struct {
	userRepo  *repository.UserRepository
	jwtSecret []byte
}

// NewAuthService creates a new AuthService
func NewAuthService(userRepo *repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: []byte(jwtSecret)}
}

// Register creates a new user (employee). Admin can be created via seed or first user.
func (s *AuthService) Register(name, email, password, role string) (*models.User, error) {
	existing, _ := s.userRepo.GetByEmail(email)
	if existing != nil {
		return nil, ErrEmailExists
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &models.User{
		Name:         name,
		Email:        email,
		PasswordHash: string(hash),
		Role:         role,
		AnnualLeaveBalance: 20,
	}
	if role == "" {
		user.Role = models.RoleEmployee
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

// Login validates credentials and returns JWT and user
func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}
	token, err := s.generateJWT(user)
	if err != nil {
		return nil, "", err
	}
	return user, token, nil
}

type claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) generateJWT(user *models.User) (string, error) {
	exp := time.Now().Add(24 * time.Hour)
	c := claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return t.SignedString(s.jwtSecret)
}

// ValidateToken parses and validates JWT, returns claims or error
func (s *AuthService) ValidateToken(tokenString string) (*claims, error) {
	t, err := jwt.ParseWithClaims(tokenString, &claims{}, func(t *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if c, ok := t.Claims.(*claims); ok && t.Valid {
		return c, nil
	}
	return nil, errors.New("invalid token")
}
