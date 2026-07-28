package com.drip.marketplace.repository;

import com.drip.marketplace.model.Pedido;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * Repositorio de Pedido. Interfaz sin implementacion: Spring Data genera
 * la consulta automaticamente a partir del nombre del metodo.
 */
public interface PedidoRepository extends MongoRepository<Pedido, String> {
    /** Usado en "mis pedidos" para listar el historial de un usuario. */
    List<Pedido> findByUsuarioId(String usuarioId);
}