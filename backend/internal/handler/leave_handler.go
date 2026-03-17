package handler

import (
	"net/http"
	"strconv"
	"time"

	"leave-management/internal/service"

	"github.com/gin-gonic/gin"
)

// LeaveHandler handles leave HTTP
type LeaveHandler struct {
	leaveSvc *service.LeaveService
}

// NewLeaveHandler creates LeaveHandler
func NewLeaveHandler(leaveSvc *service.LeaveService) *LeaveHandler {
	return &LeaveHandler{leaveSvc: leaveSvc}
}

// ApplyRequest body
type ApplyLeaveRequest struct {
	StartDate string `json:"start_date" binding:"required"`
	EndDate   string `json:"end_date" binding:"required"`
	Reason    string `json:"reason"`
	LeaveType string `json:"leave_type"`
}

// Apply godoc
// @Summary Apply for leave
// @Tags leaves
// @Accept json
// @Produce json
// @Param body body ApplyLeaveRequest true "Leave request"
// @Success 201 {object} map[string]interface{}
// @Failure 400,409 {object} map[string]string
// @Router /api/leaves [post]
func (h *LeaveHandler) Apply(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid := userID.(int)
	var req ApplyLeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: start_date and end_date required"})
		return
	}
	start, err1 := time.Parse("2006-01-02", req.StartDate)
	end, err2 := time.Parse("2006-01-02", req.EndDate)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dates must be YYYY-MM-DD"})
		return
	}
	leaveType := req.LeaveType
	if leaveType == "" {
		leaveType = "annual"
	}
	leave, err := h.leaveSvc.Apply(uid, start, end, req.Reason, leaveType)
	if err != nil {
		switch err {
		case service.ErrInvalidDates:
			c.JSON(http.StatusBadRequest, gin.H{"error": "end date must be on or after start date"})
		case service.ErrOverlappingLeave:
			c.JSON(http.StatusConflict, gin.H{"error": "you have an overlapping leave (approved or pending)"})
		case service.ErrInsufficientBalance:
			c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient annual leave balance"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to apply leave"})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": leave})
}

// GetMyLeaves godoc
// @Summary Get my leaves
// @Tags leaves
// @Produce json
// @Param status query string false "pending|approved|rejected"
// @Param from query string false "YYYY-MM-DD"
// @Param to query string false "YYYY-MM-DD"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /api/leaves/me [get]
func (h *LeaveHandler) GetMyLeaves(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid := userID.(int)
	status := c.Query("status")
	fromStr, toStr := c.Query("from"), c.Query("to")
	var from, to *time.Time
	if fromStr != "" {
		t, err := time.Parse("2006-01-02", fromStr)
		if err == nil {
			from = &t
		}
	}
	if toStr != "" {
		t, err := time.Parse("2006-01-02", toStr)
		if err == nil {
			to = &t
		}
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 {
		limit = 20
	}
	leaves, total, err := h.leaveSvc.GetMyLeaves(uid, status, from, to, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list leaves"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": leaves, "total": total})
}

// ListAll godoc
// @Summary List all leaves (admin)
// @Tags leaves
// @Produce json
// @Param status query string false "pending|approved|rejected"
// @Param from query string false "YYYY-MM-DD"
// @Param to query string false "YYYY-MM-DD"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /api/leaves [get]
func (h *LeaveHandler) ListAll(c *gin.Context) {
	status := c.Query("status")
	fromStr, toStr := c.Query("from"), c.Query("to")
	var from, to *time.Time
	if fromStr != "" {
		t, err := time.Parse("2006-01-02", fromStr)
		if err == nil {
			from = &t
		}
	}
	if toStr != "" {
		t, err := time.Parse("2006-01-02", toStr)
		if err == nil {
			to = &t
		}
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 {
		limit = 20
	}
	leaves, total, err := h.leaveSvc.ListAll(status, from, to, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list leaves"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": leaves, "total": total})
}

// UpdateStatusRequest body
type UpdateLeaveStatusRequest struct {
	Status  string `json:"status" binding:"required"`
	Comment string `json:"comment"`
}

// UpdateStatus godoc
// @Summary Approve or reject leave (admin)
// @Tags leaves
// @Accept json
// @Produce json
// @Param id path int true "Leave ID"
// @Param body body UpdateLeaveStatusRequest true "Status"
// @Success 200 {object} map[string]string
// @Failure 400,404 {object} map[string]string
// @Router /api/leaves/{id}/status [patch]
func (h *LeaveHandler) UpdateStatus(c *gin.Context) {
	actorID, _ := c.Get("user_id")
	aid := actorID.(int)
	leaveID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req UpdateLeaveStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status required (approved or rejected)"})
		return
	}
	if req.Status != "approved" && req.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be approved or rejected"})
		return
	}
	if err := h.leaveSvc.UpdateStatus(leaveID, aid, req.Status, req.Comment); err != nil {
		switch err {
		case service.ErrLeaveNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "leave not found"})
		case service.ErrOnlyPending:
			c.JSON(http.StatusBadRequest, gin.H{"error": "only pending leaves can be approved or rejected"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}
