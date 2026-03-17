package handler

import (
	"net/http"
	"strconv"

	"leave-management/internal/models"
	"leave-management/internal/service"
	"leave-management/pkg/utils"

	"github.com/gin-gonic/gin"
)

// EmployeeHandler handles employee CRUD HTTP
type EmployeeHandler struct {
	userSvc *service.UserService
}

// NewEmployeeHandler creates EmployeeHandler
func NewEmployeeHandler(userSvc *service.UserService) *EmployeeHandler {
	return &EmployeeHandler{userSvc: userSvc}
}

// List godoc
// @Summary List employees
// @Tags employees
// @Produce json
// @Param search query string false "Search by name or email"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /api/employees [get]
func (h *EmployeeHandler) List(c *gin.Context) {
	search := c.DefaultQuery("search", "")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 {
		limit = 20
	}
	users, total, err := h.userSvc.List(search, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list employees"})
		return
	}
	res := make([]models.UserResponse, len(users))
	for i := range users {
		res[i] = users[i].ToResponse()
	}
	c.JSON(http.StatusOK, gin.H{"data": res, "total": total})
}

// GetByID godoc
// @Summary Get employee by ID
// @Tags employees
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]string
// @Router /api/employees/{id} [get]
func (h *EmployeeHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	user, err := h.userSvc.GetByID(id)
	if err != nil {
		if err == service.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get employee"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": user.ToResponse()})
}

// CreateRequest for creating employee
type CreateEmployeeRequest struct {
	Name               string `json:"name" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	Password           string `json:"password" binding:"required,min=6"`
	Role               string `json:"role"`
	AnnualLeaveBalance int    `json:"annual_leave_balance"`
}

// Create godoc
// @Summary Create employee (admin)
// @Tags employees
// @Accept json
// @Produce json
// @Param body body CreateEmployeeRequest true "User"
// @Success 201 {object} map[string]interface{}
// @Failure 400,409 {object} map[string]string
// @Router /api/employees [post]
func (h *EmployeeHandler) Create(c *gin.Context) {
	var req CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	u := models.User{
		Name:               req.Name,
		Email:              req.Email,
		Role:               req.Role,
		AnnualLeaveBalance: req.AnnualLeaveBalance,
	}
	if u.Role == "" {
		u.Role = models.RoleEmployee
	}
	if u.AnnualLeaveBalance <= 0 {
		u.AnnualLeaveBalance = 20
	}
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
		return
	}
	u.PasswordHash = hash
	if err := h.userSvc.Create(&u); err != nil {
		if err == service.ErrEmailExists {
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create employee"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": u.ToResponse()})
}

// Update godoc
// @Summary Update employee
// @Tags employees
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400,404 {object} map[string]string
// @Router /api/employees/{id} [put]
func (h *EmployeeHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	user, err := h.userSvc.GetByID(id)
	if err != nil {
		if err == service.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get employee"})
		return
	}
	var req struct {
		Name               *string `json:"name"`
		Email              *string `json:"email"`
		Role               *string `json:"role"`
		AnnualLeaveBalance *int    `json:"annual_leave_balance"`
		Password           *string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.AnnualLeaveBalance != nil {
		user.AnnualLeaveBalance = *req.AnnualLeaveBalance
	}
	if req.Password != nil && *req.Password != "" {
		hash, err := utils.HashPassword(*req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
			return
		}
		user.PasswordHash = hash
	}
	if err := h.userSvc.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update employee"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": user.ToResponse()})
}

// Delete godoc
// @Summary Delete employee
// @Tags employees
// @Param id path int true "User ID"
// @Success 204
// @Failure 400,404 {object} map[string]string
// @Router /api/employees/{id} [delete]
func (h *EmployeeHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.userSvc.Delete(id); err != nil {
		if err == service.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete employee"})
		return
	}
	c.Status(http.StatusNoContent)
}
