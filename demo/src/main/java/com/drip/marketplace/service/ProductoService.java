package com.drip.marketplace.service;

import com.drip.marketplace.dto.ProductoDTO;
import com.drip.marketplace.model.Producto;
import com.drip.marketplace.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Logica de negocio de productos. El Controller delega aqui toda la
 * validacion y acceso a datos; el Repository solo hace consultas simples.
 */
@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    /**
     * Filtra por categoria y/o genero, combinandolos si ambos vienen
     * informados. Si no se pasa ninguno, devuelve el catalogo completo.
     */
    public List<Producto> findAll(Producto.Categoria categoria, Producto.Genero genero) {
        if (genero != null && categoria != null) {
            return productoRepository.findByGeneroAndCategoria(genero, categoria);
        }
        if (genero != null) {
            return productoRepository.findByGenero(genero);
        }
        if (categoria != null) {
            return productoRepository.findByCategoria(categoria);
        }
        return productoRepository.findAll();
    }

    public List<Producto> findDestacados() {
        return productoRepository.findByDestacadoTrue();
    }

    public Producto findById(String id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
    }

    public Producto create(ProductoDTO dto) {
        Producto producto = new Producto();
        mapDtoToProducto(dto, producto);
        return productoRepository.save(producto);
    }

    /** Reutiliza mapDtoToProducto: busca el producto existente y le
     * sobreescribe los mismos campos que en create(), en vez de duplicar
     * la logica de mapeo. */
    public Producto update(String id, ProductoDTO dto) {
        Producto producto = findById(id);
        mapDtoToProducto(dto, producto);
        return productoRepository.save(producto);
    }

    public void delete(String id) {
        if (!productoRepository.existsById(id)) {
            throw new IllegalArgumentException("Producto no encontrado");
        }
        productoRepository.deleteById(id);
    }

    /** Copia los campos del DTO recibido al Producto de MongoDB.
     * Centraliza el mapeo para que create() y update() no lo dupliquen. */
    private void mapDtoToProducto(ProductoDTO dto, Producto producto) {
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setPrecioAnterior(dto.getPrecioAnterior());
        producto.setCategoria(dto.getCategoria());
        producto.setGenero(dto.getGenero());
        producto.setImagenes(dto.getImagenes());
        producto.setTallas(dto.getTallas());
        producto.setColores(dto.getColores());
        producto.setMarca(dto.getMarca());
        producto.setDestacado(dto.isDestacado());
    }

    /** Busqueda por nombre, usada cuando el frontend manda ?buscar=. */
    public List<Producto> buscar(String query) {
        return productoRepository.findByNombreContainingIgnoreCase(query);
    }
}