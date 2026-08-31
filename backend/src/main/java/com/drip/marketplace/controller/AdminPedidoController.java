package com.drip.marketplace.controller;

import com.drip.marketplace.model.Pedido;
import com.drip.marketplace.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// gestion de pedidos desde el panel admin. Protegido por
// /api/admin/** -> hasRole("ADMIN") en SecurityConfig
@RestController
@RequestMapping("/api/admin/pedidos")
@RequiredArgsConstructor
public class AdminPedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public ResponseEntity<List<Pedido>> findAll() {
        return ResponseEntity.ok(pedidoService.findAllAdmin());
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        try {
            Pedido.Estado nuevoEstado = Pedido.Estado.valueOf(body.get("estado"));
            Pedido pedido = pedidoService.cambiarEstado(id, nuevoEstado);
            return ResponseEntity.ok(pedido);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado no válido o pedido no encontrado"));
        }
    }
}