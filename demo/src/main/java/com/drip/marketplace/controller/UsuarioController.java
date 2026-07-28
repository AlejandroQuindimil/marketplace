package com.drip.marketplace.controller;

import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST con datos del propio usuario autenticado: perfil basico
 * y tallas preferidas por categoria. Requiere estar logueado (no hay reglas
 * publicas para /api/usuarios/** en SecurityConfig).
 */
@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

     // Se llama directamente al repository (sin Service intermedio) porque
    // aqui no hay logica de negocio, solo lectura/escritura simple de campos.
    private final UsuarioRepository usuarioRepository;

    /**
     * Devuelve los datos del usuario autenticado (nunca la password,
     * que se construye a mano el Map de respuesta en vez de devolver
     * la entidad Usuario completa).
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "nombre", usuario.getNombre(),
                "email", usuario.getEmail(),
                "rol", usuario.getRol().name(),
                "tallasPreferidas", usuario.getTallasPreferidas()
        ));
    }

     /**
     * Guarda o actualiza la talla preferida de una categoria concreta.
     * El body espera {"categoria": "CAMISETAS", "talla": "M"}; se usa un
     * Map en vez de un DTO porque es una operacion muy simple de una
     * sola clave-valor sobre el Map tallasPreferidas del usuario.
     */
    @PutMapping("/tallas")
    public ResponseEntity<?> updateTalla(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String categoria = body.get("categoria");
        String talla = body.get("talla");

        usuario.getTallasPreferidas().put(categoria, talla);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuario.getTallasPreferidas());
    }
}