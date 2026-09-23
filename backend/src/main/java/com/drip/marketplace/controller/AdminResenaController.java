package com.drip.marketplace.controller;

import com.drip.marketplace.model.Producto;
import com.drip.marketplace.model.Resena;
import com.drip.marketplace.repository.ProductoRepository;
import com.drip.marketplace.repository.ResenaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Moderacion de resenas desde el panel admin. Protegido por
// /api/admin/** -> hasRole("ADMIN") en SecurityConfig.
@RestController
@RequestMapping("/api/admin/resenas")
@RequiredArgsConstructor
public class AdminResenaController {

    private final ResenaRepository resenaRepository;
    private final ProductoRepository productoRepository;

    // Listado completo de resenas, enriquecido con el nombre del producto
    // (la resena en si no lo guarda, solo el productoId).
    // No incluye el historial: se pide bajo demanda en /{id}/historial.
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> findAll() {
        List<Resena> resenas = resenaRepository.findAllByOrderByCreatedAtDesc();

        List<Map<String, Object>> resultado = resenas.stream()
                .map(r -> {
                    String nombreProducto = productoRepository.findById(r.getProductoId())
                            .map(Producto::getNombre)
                            .orElse("Producto eliminado");

                    Map<String, Object> item = new HashMap<>();
                    item.put("id", r.getId());
                    item.put("productoId", r.getProductoId());
                    item.put("productoNombre", nombreProducto);
                    item.put("usuarioNombre", r.getUsuarioNombre());
                    item.put("estrellas", r.getEstrellas());
                    item.put("comentario", r.getComentario());
                    item.put("createdAt", r.getCreatedAt());
                    item.put("updatedAt", r.getUpdatedAt());
                    item.put("numEdiciones", r.getNumEdiciones());
                    return item;
                })
                .toList();

        return ResponseEntity.ok(resultado);
    }

    // Versiones anteriores de una resena, de la mas antigua a la mas reciente.
    // Las resenas editadas antes de implementar el historial devuelven lista vacia.
    @GetMapping("/{id}/historial")
    public ResponseEntity<?> historial(@PathVariable String id) {
        return resenaRepository.findById(id)
                .<ResponseEntity<?>>map(r -> {
                    List<?> historial = r.getHistorial() != null ? r.getHistorial() : List.of();
                    return ResponseEntity.ok(historial);
                })
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(Map.of("error", "Reseña no encontrada")));
    }

    // Elimina una resena inapropiada. El usuario podra volver a valorar
    // el producto despues (su compra sigue siendo valida), pero perdera
    // el historial de ediciones que tuviera hasta ahora.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        if (!resenaRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Reseña no encontrada"));
        }
        resenaRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Reseña eliminada"));
    }
}