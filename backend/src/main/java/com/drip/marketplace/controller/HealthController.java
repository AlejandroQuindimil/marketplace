package com.drip.marketplace.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Endpoint ligero solo para comprobar que el backend esta vivo,
// usado por el cron job externo (cron-job.org) para evitar que
// Render duerma la instancia por inactividad.
@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}