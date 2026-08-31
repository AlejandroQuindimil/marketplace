package com.drip.marketplace.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filtro que se ejecuta en CADA peticion HTTP (OncePerRequestFilter),
 * antes de que Spring Security compruebe las reglas de SecurityConfig.
 * Lee el JWT del header Authorization, lo valida, y si es correcto,
 * autentica al usuario para el resto de esta peticion.
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        /* Sin header o con formato distinto a "Bearer <token>": dejamos
        * pasar la peticion sin autenticar. Las rutas publicas (ej. GET
        * productos) funcionaran igual; las protegidas seran rechazadas
        * mas adelante por SecurityConfig al no haber autenticacion.
        */
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (jwtUtil.isTokenValid(token)) {
            Claims claims = jwtUtil.extractClaims(token);
            String usuarioId = claims.getSubject();
            String rol = claims.get("rol", String.class);

            // Prefijo "ROLE_" por convencion de Spring Security: es lo que
            // espera internamente hasRole("ADMIN") para encajar con esta authority
            var authority = new SimpleGrantedAuthority("ROLE_" + rol);

            /* El primer parametro (principal) es lo que despues se lee con
            * authentication.getName() en los controllers — por eso ahi
            * se obtiene directamente el usuarioId, no un objeto completo
            */
            var authentication = new UsernamePasswordAuthenticationToken(
                    usuarioId, null, List.of(authority)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}