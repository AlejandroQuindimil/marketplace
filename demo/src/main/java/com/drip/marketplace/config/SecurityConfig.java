package com.drip.marketplace.config;

import com.drip.marketplace.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


// Configuracion central de seguridad del backend.

// Define tres cosas:
//1. Como se cifran las contraseñas (bcrypt).
//2. Que origenes externos pueden llamar a la API (CORS).
//3. Que rutas son publicas, cuales requieren estar logueado, y cuales
//   requieren ademas el rol ADMIN, ademas de enchufar JwtFilter en la
//   cadena de filtros de Spring Security.


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Filtro que valida el JWT de cada peticion y autentica al usuario
    // antes de que Spring Security compruebe los permisos de la ruta.
    private final JwtFilter jwtFilter;

    
    // Bean usado por AuthService para cifrar y verificar contraseñas.
    // bcrypt incluye salt automatico, por lo que dos usuarios con la
    // misma contraseña nunca tienen el mismo hash guardado en Mongo.
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    
    // Configuracion CORS: el frontend Angular corre en un origen distinto
    // (localhost:4200) al backend (localhost:8080). Sin esto, el navegador
    // bloquearia toda peticion del frontend por politica de mismo origen,
    // aunque el backend funcione perfectamente.
    

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // Cadena de filtros de seguridad: aqui se decide, para cada peticion,
    // si necesita autenticacion, que rol requiere, y en que orden se
    // aplican los filtros (JWT antes que el filtro estandar de Spring).
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Deshabilitamos CSRF porque no usamos cookies de sesion, sino
                // JWT en cabecera Authorization. Si se usaran cookies, habria
                // que habilitar CSRF y generar un token para cada peticion.
                .csrf(csrf -> csrf.disable())

                // Deshabilitamos la creacion de sesiones, porque no usamos
                // sesiones de Spring Security, sino JWT en cabecera Authorization.
                
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Reglas de autorizacion por ruta y metodo HTTP. El orden
                // importa: Spring usa la PRIMERA regla que encaje, asi que
                // las mas especificas (ADMIN) van antes que la generica
                //(anyRequest().authenticated())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/productos/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/productos/**").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/productos/**").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/productos/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                        
                )
                // JwtFilter se ejecuta ANTES del filtro de autenticacion
                // estandar de Spring, para que el usuario ya este
                // autenticado (via JWT) cuando se evaluan las reglas de arriba

                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}