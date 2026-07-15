package com.drip.marketplace.repository;

import com.drip.marketplace.model.Producto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProductoRepository extends MongoRepository<Producto, String> {
    List<Producto> findByCategoria(Producto.Categoria categoria);
    List<Producto> findByDestacadoTrue();
}