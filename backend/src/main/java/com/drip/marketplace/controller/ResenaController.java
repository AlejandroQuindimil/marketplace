package com.drip.marketplace.controller;

import com.drip.marketplace.dto.ResenaDTO;
import com.drip.marketplace.model.Resena;
import com.drip.marketplace.service.ResenaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos/{productoId}/resenas")
@RequiredArgsConstructor
public class ResenaController {

    private final ResenaService resenaService;

    // Listado publico de valoraciones de un producto, con la media incluida. 
    @GetMapping
    public ResponseEntity<?> listar(@PathVariable String productoId) {
        List<Resena> resenas = resenaService.findByProducto(productoId);
        double media = resenaService.mediaEstrellas(productoId);

        return ResponseEntity.ok(Map.of(
                "resenas", resenas,
                "media", media,
                "total", resenas.size()
        ));
    }

    // Si el usuario autenticado puede valorar este producto (compro y le llego),
    // y si ya tiene una reseña existente para poder precargarla en el formulario.
    @GetMapping("/puedo-valorar")
    public ResponseEntity<?> puedoValorar(@PathVariable String productoId, Authentication authentication) {
        boolean puede = resenaService.puedeValorar(authentication.getName(), productoId);
        Resena miResena = resenaService.obtenerResenaDeUsuario(authentication.getName(), productoId).orElse(null);

        Map<String, Object> respuesta = new java.util.HashMap<>();
        respuesta.put("puedeValorar", puede);
        respuesta.put("miResena", miResena);
        respuesta.put("limiteEdicionesAlcanzado", miResena != null && miResena.getNumEdiciones() >= 3);
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @PathVariable String productoId,
            @Valid @RequestBody ResenaDTO dto,
            Authentication authentication
    ) {
        try {
            Resena resena = resenaService.crearOActualizar(authentication.getName(), productoId, dto);
            return ResponseEntity.ok(resena);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}