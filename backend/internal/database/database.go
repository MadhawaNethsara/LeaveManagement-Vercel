package database

import (
	"fmt"

	"leave-management/config"
	"leave-management/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NewDB creates a PostgreSQL connection and runs AutoMigrate
func NewDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&models.User{}, &models.Leave{}, &models.LeaveAuditLog{}); err != nil {
		return nil, err
	}
	return db, nil
}
