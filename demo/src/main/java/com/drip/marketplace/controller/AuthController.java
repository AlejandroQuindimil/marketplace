package com.drip.marketplace.controller;

import com.drip.marketplace.dto.LoginRequest;
import com.drip.marketplace.dto.RegisterRequest;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.security.JwtUtil;
import com.drip.marketplace.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST que gestiona la autenticación de usuarios.
 * Expone los endpoints de registro, login y logout bajo /api/auth.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    /**
     * Registra un nuevo usuario en el sistema.
     * Si el email ya existe, AuthService lanza IllegalArgumentException
     * y se devuelve un 400 con el mensaje de error.
     * Si el registro es correcto, genera un JWT y devuelve los datos
     * básicos del usuario junto al token.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // Crea el usuario en MongoDB con la contraseña encriptada con BCrypt
            Usuario usuario = authService.register(request);

            // Genera el JWT con el id, email y rol del usuario recién creado
            String token = jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol().name());

            // Devuelve 200 con el token y los datos básicos del usuario
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "usuario", Map.of(
                            "id", usuario.getId(),
                            "nombre", usuario.getNombre(),
                            "email", usuario.getEmail(),
                            "rol", usuario.getRol().name()
                    )
            ));
        } catch (IllegalArgumentException e) {
            // Email ya registrado u otro error de validación 
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Autentica un usuario existente.
     * Verifica que el email existe y que la contraseña coincide con el hash
     * almacenado en MongoDB. Si algo falla, devuelve 401.
     * Si es correcto, genera un nuevo JWT y devuelve los datos del usuario.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            // Verifica credenciales — lanza excepción si el email no existe
            // o si la contraseña no coincide con el hash BCrypt
            Usuario usuario = authService.login(request);
            
            // Genera el JWT con el id, email y rol del usuario autenticado
            String token = jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol().name());

            // Devuelve 200 con el token y los datos básicos del usuario
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "usuario", Map.of(
                            "id", usuario.getId(),
                            "nombre", usuario.getNombre(),
                            "email", usuario.getEmail(),
                            "rol", usuario.getRol().name()
                    )
            ));
        } catch (IllegalArgumentException e) {
            // Credenciales incorrectas — 401 Unauthorized
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Con JWT stateless no hay nada que invalidar en el servidor —
        // el logout real ocurre en el frontend borrando el token guardado
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada"));
    }
}