package com.drip.marketplace.controller;

import com.drip.marketplace.model.Producto;
import com.drip.marketplace.service.FavoritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST de favoritos. Requiere estar autenticado (cualquier rol);
 * gestiona los favoritos del usuario que hace la peticion, nunca los de otro.
 */
@RestController
@RequestMapping("/api/favoritos")
@RequiredArgsConstructor
public class FavoritoController {

    // Servicio que maneja la lógica de favoritos
    private final FavoritoService favoritoService;

    /** Lista los productos favoritos del usuario autenticado. */
    @GetMapping
    public ResponseEntity<List<Producto>> getFavoritos(Authentication authentication) {
        String usuarioId = authentication.getName();
        return ResponseEntity.ok(favoritoService.getFavoritos(usuarioId));
    }

    /** Añade un producto a favoritos. 404 si el producto no existe. */
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

    /** Quita un producto de favoritos. */
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