package com.drip.marketplace.controller;

import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.drip.marketplace.service.AuthService;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "nombre", usuario.getNombre(),
                "email", usuario.getEmail(),
                "rol", usuario.getRol().name(),
                "telefono", usuario.getTelefono(),
                "recibirNewsletter", usuario.isRecibirNewsletter(),
                "tallasPreferidas", usuario.getTallasPreferidas(),
                "direcciones", usuario.getDirecciones()
        ));
    }

    @PutMapping("/tallas")
    public ResponseEntity<?> updateTalla(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.getTallasPreferidas().put(body.get("categoria"), body.get("talla"));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuario.getTallasPreferidas());
    }

    // Añade una nueva dirección de envío a la lista del usuario.
    @PostMapping("/direcciones")
    public ResponseEntity<?> addDireccion(
            @RequestBody Usuario.Direccion direccion,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.getDirecciones().add(direccion);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuario.getDirecciones());
    }

    // Edita calle/ciudad/cp de una dirección existente (mantiene si era la predeterminada).
    @PutMapping("/direcciones/{index}")
    public ResponseEntity<?> updateDireccion(
            @PathVariable int index,
            @RequestBody Usuario.Direccion direccion,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (index < 0 || index >= usuario.getDirecciones().size()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dirección no encontrada"));
        }

        Usuario.Direccion existente = usuario.getDirecciones().get(index);
        existente.setCalle(direccion.getCalle());
        existente.setCiudad(direccion.getCiudad());
        existente.setCp(direccion.getCp());
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuario.getDirecciones());
    }

    // Elimina una dirección por su posición en la lista.
    @DeleteMapping("/direcciones/{index}")
    public ResponseEntity<?> removeDireccion(
            @PathVariable int index,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (index < 0 || index >= usuario.getDirecciones().size()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dirección no encontrada"));
        }

        usuario.getDirecciones().remove(index);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuario.getDirecciones());
    }

    // Marca una dirección como predeterminada y desmarca el resto.
    @PutMapping("/direcciones/{index}/predeterminada")
    public ResponseEntity<?> marcarPredeterminada(
            @PathVariable int index,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (index < 0 || index >= usuario.getDirecciones().size()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dirección no encontrada"));
        }

        for (int i = 0; i < usuario.getDirecciones().size(); i++) {
            usuario.getDirecciones().get(i).setPredeterminada(i == index);
        }
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuario.getDirecciones());
    }

    @PutMapping("/telefono")
    public ResponseEntity<?> updateTelefono(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.setTelefono(body.getOrDefault("telefono", ""));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of("telefono", usuario.getTelefono()));
    }

    @PutMapping("/newsletter")
    public ResponseEntity<?> updateNewsletter(
            @RequestBody Map<String, Boolean> body,
            Authentication authentication
    ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.setRecibirNewsletter(Boolean.TRUE.equals(body.get("recibirNewsletter")));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of("recibirNewsletter", usuario.isRecibirNewsletter()));
    }

        // re-autenticacion ligera: comprueba la contraseña del usuario logueado
        // sin tocar el JWT, usada como segunda barrera antes de entrar al panel admin
        @PostMapping("/verificar-password")
        public ResponseEntity<?> verificarPassword(
                @RequestBody Map<String, String> body,
                Authentication authentication
        ) {
        Usuario usuario = usuarioRepository.findById(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        boolean valido = authService.verifyPassword(usuario, body.get("password"));

        if (!valido) {
                return ResponseEntity.status(401).body(Map.of("valido", false));
        }

        return ResponseEntity.ok(Map.of("valido", true));
        }
}