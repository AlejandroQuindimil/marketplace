package com.drip.marketplace.controller;

import com.drip.marketplace.model.Producto;
import com.drip.marketplace.service.FavoritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favoritos")
@RequiredArgsConstructor
public class FavoritoController {

    private final FavoritoService favoritoService;

    @GetMapping
    public ResponseEntity<List<Producto>> getFavoritos(Authentication authentication) {
        String usuarioId = authentication.getName();
        return ResponseEntity.ok(favoritoService.getFavoritos(usuarioId));
    }

    @PostMapping("/{productoId}")
    public ResponseEntity<?> addFavorito(@PathVariable String productoId, Authentication authentication) {
        try {
            String usuarioId = authentication.getName();
            favoritoService.addFavorito(usuarioId, productoId);
            return ResponseEntity.ok(Map.of("message", "Añadido a favoritos"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{productoId}")
    public ResponseEntity<?> removeFavorito(@PathVariable String productoId, Authentication authentication) {
        try {
            String usuarioId = authentication.getName();
            favoritoService.removeFavorito(usuarioId, productoId);
            return ResponseEntity.ok(Map.of("message", "Eliminado de favoritos"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}