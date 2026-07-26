package com.drip.marketplace.controller;

import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

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