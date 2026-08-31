package com.drip.marketplace.repository;

import com.drip.marketplace.model.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);

    // busca cuentas sin verificar creadas antes de una fecha dada,
    // para la limpieza programada
    List<Usuario> findByVerifiedFalseAndCreatedAtBefore(LocalDateTime fecha);
}