package com.drip.marketplace.service;

import com.drip.marketplace.dto.LoginRequest;
import com.drip.marketplace.dto.RegisterRequest;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService; // lo creamos en la parte 2

    // para generar codigos aleatorios de 6 cifras
    private final SecureRandom random = new SecureRandom();

    public Usuario register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe una cuenta con ese email");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));

        // la cuenta nace sin verificar, con su codigo y caducidad de 24h
        usuario.setVerified(false);
        usuario.setVerificationCode(generarCodigo());
        usuario.setTokenExpiration(LocalDateTime.now().plusHours(24));

        Usuario guardado = usuarioRepository.save(usuario);

        // mandamos el correo despues de guardar, para no perder el
        // registro si el envio de email fallara por lo que sea
        emailService.enviarCodigoVerificacion(guardado.getEmail(), guardado.getVerificationCode());

        return guardado;
    }

    public Usuario login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Email o contraseña incorrectos");
        }

        // ojo: la comprobacion de verified se hace en el controller,
        // porque ahi es donde decidimos el codigo HTTP (403) a devolver
        return usuario;
    }

    public void changePassword(Usuario usuario, String actual, String nueva) {
        if (!passwordEncoder.matches(actual, usuario.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        usuario.setPassword(passwordEncoder.encode(nueva));
        usuarioRepository.save(usuario);
    }

    // 6 cifras, con ceros a la izquierda si toca (ej: 004392)
    private String generarCodigo() {
        int numero = random.nextInt(1_000_000);
        return String.format("%06d", numero);
    }

    // valida el codigo recibido contra el guardado en Mongo, comprobando
    // que no haya caducado, y marca la cuenta como verificada si todo cuadra
    public void verifyEmail(String email, String code) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (usuario.isVerified()) {
            // ya estaba verificada, no hace falta hacer nada mas: no lo
            // tratamos como error para que el frontend pueda reintentar sin drama
            return;
        }

        if (usuario.getTokenExpiration() == null || LocalDateTime.now().isAfter(usuario.getTokenExpiration())) {
            throw new IllegalArgumentException("El código ha caducado, solicita uno nuevo");
        }

        if (usuario.getVerificationCode() == null || !usuario.getVerificationCode().equals(code)) {
            throw new IllegalArgumentException("Código incorrecto");
        }

        usuario.setVerified(true);
        // limpiamos el codigo tras usarlo, ya no debe servir para nada mas
        usuario.setVerificationCode(null);
        usuarioRepository.save(usuario);
    }

    // genera un codigo nuevo y lo reenvia, por si el primero caduco o no llego
    public void resendVerificationCode(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (usuario.isVerified()) {
            throw new IllegalArgumentException("Esta cuenta ya está verificada");
        }

        usuario.setVerificationCode(generarCodigo());
        usuario.setTokenExpiration(LocalDateTime.now().plusHours(24));
        usuarioRepository.save(usuario);

        emailService.enviarCodigoVerificacion(usuario.getEmail(), usuario.getVerificationCode());
    }

    // re-verifica la contraseña de un usuario ya logueado, sin generar
    // ningun token nuevo: solo confirma que sigue siendo quien dice ser
    // antes de dejarle entrar a una zona sensible (panel admin)
    public boolean verifyPassword(Usuario usuario, String password) {
        return passwordEncoder.matches(password, usuario.getPassword());
    }
}