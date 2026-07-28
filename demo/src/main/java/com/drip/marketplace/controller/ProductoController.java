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

/**
 * Controlador REST de productos. Las rutas GET son publicas (cualquiera
 * puede ver el catalogo sin cuenta); POST/PUT/DELETE requieren rol ADMIN,
 * segun las reglas definidas en SecurityConfig.
 */
@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    /**
     * Listado de productos con dos filtros opcionales:
     * - buscar: si viene informado, tiene prioridad y busca por nombre
     *   (se asume que una busqueda explicita del usuario pesa mas que
     *   solo estar navegando por categoria).
     * - categoria: si no hay busqueda, filtra por categoria (o devuelve
     *   todos si tampoco se especifica categoria).
     */
    @GetMapping
    public ResponseEntity<List<Producto>> findAll(
            @RequestParam(required = false) Producto.Categoria categoria,
            @RequestParam(required = false) String buscar
    ) {
        if (buscar != null && !buscar.isBlank()) {
            return ResponseEntity.ok(productoService.buscar(buscar));
        }
        return ResponseEntity.ok(productoService.findAll(categoria));
    }

    /** Productos marcados como destacado=true, para la home. */
    @GetMapping("/destacados")
    public ResponseEntity<List<Producto>> findDestacados() {
        return ResponseEntity.ok(productoService.findDestacados());
    }

    /** Ficha de un producto concreto. 404 si el id no existe. */
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(productoService.findById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** Crea un producto nuevo. Requiere rol ADMIN (ver SecurityConfig). */
    @PostMapping
    public ResponseEntity<Producto> create(@Valid @RequestBody ProductoDTO dto) {
        return ResponseEntity.ok(productoService.create(dto));
    }

    /** Edita un producto existente. Requiere rol ADMIN. */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody ProductoDTO dto) {
        try {
            return ResponseEntity.ok(productoService.update(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

     /** Elimina un producto. Requiere rol ADMIN. */
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
   