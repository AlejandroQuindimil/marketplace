package com.drip.marketplace.repository;

import com.drip.marketplace.model.Resena;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ResenaRepository extends MongoRepository<Resena, String> {
    List<Resena> findByProductoIdOrderByCreatedAtDesc(String productoId);
    Optional<Resena> findByProductoIdAndUsuarioId(String productoId, String usuarioId);

    // para el panel admin: todas las resenas, mas recientes primero
    List<Resena> findAllByOrderByCreatedAtDesc();
}