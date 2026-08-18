package com.drip.marketplace.controller;

import com.drip.marketplace.dto.DashboardResponse;
import com.drip.marketplace.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// datos agregados para el dashboard del panel de admin. Protegido a
// nivel de SecurityConfig con /api/admin/** -> hasRole("ADMIN")
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(defaultValue = "mes") String rango
    ) {
        return ResponseEntity.ok(dashboardService.getDashboard(rango));
    }
}