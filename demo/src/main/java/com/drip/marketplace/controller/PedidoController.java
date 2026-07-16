package com.drip.marketplace.controller;

import com.drip.marketplace.dto.PedidoDTO;
import com.drip.marketplace.model.Pedido;
import com.drip.marketplace.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<?> crearPedido(@Valid @RequestBody PedidoDTO dto, Authentication authentication) {
        try {
            String usuarioId = authentication.getName();
            Pedido pedido = pedidoService.crearPedido(usuarioId, dto);
            return ResponseEntity.ok(pedido);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/mis-pedidos")
    public ResponseEntity<List<Pedido>> misPedidos(Authentication authentication) {
        String usuarioId = authentication.getName();
        return ResponseEntity.ok(pedidoService.misPedidos(usuarioId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable String id, Authentication authentication) {
        try {
            String usuarioId = authentication.getName();
            Pedido pedido = pedidoService.findById(id, usuarioId);
            return ResponseEntity.ok(pedido);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}