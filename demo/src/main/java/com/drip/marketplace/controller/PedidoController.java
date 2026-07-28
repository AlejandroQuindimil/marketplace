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

/**
 * Controlador REST de pedidos. Todas las rutas requieren estar autenticado
 * (no hay reglas de rol especificas para pedidos en SecurityConfig, asi
 * que cualquier usuario logueado puede crear y consultar SUS PROPIOS pedidos).
 */
@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    /**
     * Crea un pedido a partir del carrito enviado por el frontend.
     * El usuarioId nunca llega en el body: se obtiene siempre del JWT
     * (authentication.getName()), para que nadie pueda crear un pedido
     * en nombre de otro usuario manipulando la peticion.
     * PedidoService valida stock y calcula el total real; si algo falla
     * (producto no encontrado, sin stock), devuelve 400 con el motivo.
     */
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

    /**
     * Devuelve el historial de pedidos del usuario autenticado (nunca de otro).
     */
    @GetMapping("/mis-pedidos")
    public ResponseEntity<List<Pedido>> misPedidos(Authentication authentication) {
        String usuarioId = authentication.getName();
        return ResponseEntity.ok(pedidoService.misPedidos(usuarioId));
    }

    /**
     * Detalle de un pedido concreto. PedidoService comprueba internamente
     * que el pedido pertenece al usuario que lo pide; si no, o si no existe,
     * se devuelve 404 en ambos casos (para no revelar si el id existe o de
     * quien es).
     */
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