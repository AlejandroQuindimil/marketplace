package com.drip.marketplace.repository;

import com.drip.marketplace.model.Producto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * Repositorio de Producto. Interfaz sin implementacion: Spring Data genera
 * la consulta automaticamente a partir del nombre del metodo.
 */
public interface ProductoRepository extends MongoRepository<Producto, String> {
    List<Producto> findByCategoria(Producto.Categoria categoria);
    List<Producto> findByDestacadoTrue();
    // IgnoreCase para que la busqueda no distinga mayus/minus;
    // Containing para que busque coincidencias parciales, no exactas
    List<Producto> findByNombreContainingIgnoreCase(String nombre);
}