package com.drip.marketplace.service;

import com.drip.marketplace.dto.ProductoDTO;
import com.drip.marketplace.model.Producto;
import com.drip.marketplace.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    public List<Producto> findAll(Producto.Categoria categoria) {
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

    private void mapDtoToProducto(ProductoDTO dto, Producto producto) {
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setPrecioAnterior(dto.getPrecioAnterior());
        producto.setCategoria(dto.getCategoria());
        producto.setImagenes(dto.getImagenes());
        producto.setTallas(dto.getTallas());
        producto.setColores(dto.getColores());
        producto.setMarca(dto.getMarca());
        producto.setDestacado(dto.isDestacado());
    }
}