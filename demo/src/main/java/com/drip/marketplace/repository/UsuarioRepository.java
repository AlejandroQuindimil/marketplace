package com.drip.marketplace.repository;

import com.drip.marketplace.model.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * Repositorio de Usuario. Interfaz sin implementacion: Spring Data genera
 * la consulta automaticamente a partir del nombre del metodo.
 */
public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    /** Usado en login para buscar al usuario por su email. */
    Optional<Usuario> findByEmail(String email);
    
    /** Usado en registro para comprobar que el email no este ya en uso. */
    boolean existsByEmail(String email);
}