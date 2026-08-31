package com.drip.marketplace.repository;

import com.drip.marketplace.model.Pedido;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;

import java.util.List;


//Repositorio de Pedido. Interfaz sin implementacion: Spring Data genera
//la consulta automaticamente a partir del nombre del metodo.

public interface PedidoRepository extends MongoRepository<Pedido, String> {
    // Usado en "mis pedidos" para listar el historial de un usuario. 
    List<Pedido> findByUsuarioId(String usuarioId);

    // pedidos creados desde una fecha en adelante, para el dashboard
    List<Pedido> findByCreatedAtAfter(LocalDateTime fecha);

    // para el panel admin: todos los pedidos, sin filtrar por usuario
    List<Pedido> findAllByOrderByCreatedAtDesc();
}