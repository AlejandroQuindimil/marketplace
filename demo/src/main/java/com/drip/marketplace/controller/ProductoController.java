package com.drip.marketplace.controller;

import com.drip.marketplace.dto.ProductoDTO;
import com.drip.marketplace.model.Producto;
import com.drip.marketplace.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<Producto>> findAll(
            @RequestParam(required = false) Producto.Categoria categoria
    ) {
        return ResponseEntity.ok(productoService.findAll(categoria));
    }

    @GetMapping("/destacados")
    public ResponseEntity<List<Producto>> findDestacados() {
        return ResponseEntity.ok(productoService.findDestacados());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(productoService.findById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Producto> create(@Valid @RequestBody ProductoDTO dto) {
        return ResponseEntity.ok(productoService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody ProductoDTO dto) {
        try {
            return ResponseEntity.ok(productoService.update(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            productoService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Producto eliminado"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}