package main

import (
	"log"

	"leave-management/config"
	"leave-management/internal/database"
	"leave-management/internal/handler"
	"leave-management/internal/middleware"
	"leave-management/internal/repository"
	"leave-management/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("config load:", err)
	}

	db, err := database.NewDB(cfg)
	if err != nil {
		log.Fatal("database:", err)
	}

	// Repositories
	userRepo := repository.NewUserRepository(db)
	leaveRepo := repository.NewLeaveRepository(db)

	// Services
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret)
	userSvc := service.NewUserService(userRepo)
	leaveSvc := service.NewLeaveService(leaveRepo, userRepo)
	dashSvc := service.NewDashboardService(userRepo, leaveRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authSvc)
	empHandler := handler.NewEmployeeHandler(userSvc)
	leaveHandler := handler.NewLeaveHandler(leaveSvc)
	dashHandler := handler.NewDashboardHandler(dashSvc)

	// Middleware
	authMiddleware := middleware.AuthMiddleware(authSvc)

	r := gin.Default()

	// CORS for frontend
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Public
	api := r.Group("/api")
	api.POST("/auth/login", authHandler.Login)
	api.POST("/auth/register", authHandler.Register)

	// Protected
	prot := api.Group("")
	prot.Use(authMiddleware)
	{
		prot.GET("/dashboard/stats", dashHandler.GetStats)
		prot.GET("/leaves/me", leaveHandler.GetMyLeaves)
		prot.POST("/leaves", leaveHandler.Apply)
	}

	// Admin only
	admin := prot.Group("")
	admin.Use(middleware.RequireAdmin())
	{
		admin.GET("/employees", empHandler.List)
		admin.GET("/employees/:id", empHandler.GetByID)
		admin.POST("/employees", empHandler.Create)
		admin.PUT("/employees/:id", empHandler.Update)
		admin.DELETE("/employees/:id", empHandler.Delete)
		admin.GET("/leaves", leaveHandler.ListAll)
		admin.PATCH("/leaves/:id/status", leaveHandler.UpdateStatus)
	}

	addr := ":" + cfg.ServerPort
	log.Println("Server listening on", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
