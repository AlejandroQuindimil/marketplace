package com.drip.marketplace.service;

import com.drip.marketplace.dto.LoginRequest;
import com.drip.marketplace.dto.RegisterRequest;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Logica de registro y login. PasswordEncoder (bcrypt) se inyecta desde
 * el bean definido en SecurityConfig.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public Usuario register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe una cuenta con ese email");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        /* La contraseña nunca se guarda en texto plano: se cifra con bcrypt
        * antes de persistirla
        */
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));

        return usuarioRepository.save(usuario);
    }

    public Usuario login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email o contraseña incorrectos"));

        // matches() compara el texto plano recibido contra el hash guardad
        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            /* Mismo mensaje de error tanto si el email no existe como si
            * la contraseña es incorrecta, para no revelar a un posible
            * atacante que emails estan registrados en el sistema
            */
            throw new IllegalArgumentException("Email o contraseña incorrectos");
        }

        return usuario;
    }
}