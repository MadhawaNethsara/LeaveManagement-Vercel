package handler

import (
	"net/http"

	"leave-management/internal/service"

	"github.com/gin-gonic/gin"
)

// DashboardHandler handles dashboard stats
type DashboardHandler struct {
	dashSvc *service.DashboardService
}

// NewDashboardHandler creates DashboardHandler
func NewDashboardHandler(dashSvc *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashSvc: dashSvc}
}

// GetStats returns dashboard stats. Admin: global; Employee: own leave counts.
// @Summary Get dashboard stats
// @Tags dashboard
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/dashboard/stats [get]
func (h *DashboardHandler) GetStats(c *gin.Context) {
	role, _ := c.Get("role")
	stats := new(service.DashboardStats)
	var err error
	if role == "admin" {
		stats, err = h.dashSvc.GetAdminStats()
	} else {
		userID, _ := c.Get("user_id")
		stats, err = h.dashSvc.GetEmployeeStats(userID.(int))
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get stats"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}
