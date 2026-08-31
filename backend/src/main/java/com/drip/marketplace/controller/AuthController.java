package com.drip.marketplace.controller;

import com.drip.marketplace.dto.LoginRequest;
import com.drip.marketplace.dto.RegisterRequest;
import com.drip.marketplace.dto.VerifyEmailRequest;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.security.JwtUtil;
import com.drip.marketplace.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            Usuario usuario = authService.register(request);

            // ya no devolvemos token aqui: la cuenta no esta verificada
            // todavia, asi que no tiene sentido dejarla entrar de golpe
            return ResponseEntity.ok(Map.of(
                    "message", "Cuenta creada. Revisa tu email para verificarla.",
                    "email", usuario.getEmail()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        try {
            authService.verifyEmail(request.getEmail(), request.getCode());
            return ResponseEntity.ok(Map.of("message", "Cuenta verificada correctamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> body) {
        try {
            authService.resendVerificationCode(body.get("email"));
            return ResponseEntity.ok(Map.of("message", "Código reenviado"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Usuario usuario = authService.login(request);

            // aqui es donde de verdad bloqueamos el acceso si no ha
            // verificado el email, con un 403 especifico para que el
            // frontend sepa distinguirlo de un 401 normal de credenciales
            if (!usuario.isVerified()) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Debes verificar tu email antes de iniciar sesión",
                        "requiresVerification", true,
                        "email", usuario.getEmail()
                ));
            }

            String token = jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol().name());

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
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada"));
    }
}