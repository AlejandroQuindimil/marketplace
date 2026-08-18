package com.drip.marketplace.controller;

import com.drip.marketplace.model.Producto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// expone que categorias son validas para cada genero, para que el
// formulario de admin filtre el desplegable de categoria segun el
// genero elegido, sin duplicar esta logica en el frontend
@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    // mapa fijo en el backend: es la fuente de verdad de que
    // categoria pertenece a que genero(s)
    private static final Map<Producto.Genero, List<Producto.Categoria>> CATEGORIAS_POR_GENERO = Map.of(
            Producto.Genero.HOMBRE, List.of(
                    Producto.Categoria.CAMISETAS, Producto.Categoria.POLOS, Producto.Categoria.CAMISAS,
                    Producto.Categoria.SUDADERAS, Producto.Categoria.JERSEYS,
                    Producto.Categoria.PANTALONES, Producto.Categoria.VAQUEROS, Producto.Categoria.SHORTS,
                    Producto.Categoria.ZAPATILLAS, Producto.Categoria.BOTAS,
                    Producto.Categoria.ABRIGOS, Producto.Categoria.CHAQUETAS,
                    Producto.Categoria.ROPA_INTERIOR
            ),
            Producto.Genero.MUJER, List.of(
                    Producto.Categoria.CAMISETAS, Producto.Categoria.CAMISAS,
                    Producto.Categoria.SUDADERAS, Producto.Categoria.JERSEYS,
                    Producto.Categoria.PANTALONES, Producto.Categoria.VAQUEROS, Producto.Categoria.SHORTS,
                    Producto.Categoria.FALDAS, Producto.Categoria.VESTIDOS,
                    Producto.Categoria.ZAPATILLAS, Producto.Categoria.BOTAS,
                    Producto.Categoria.ABRIGOS, Producto.Categoria.CHAQUETAS,
                    Producto.Categoria.ROPA_INTERIOR
            ),
            Producto.Genero.UNISEX, List.of(
                    Producto.Categoria.ACCESORIOS
            )
    );

    @GetMapping("/{genero}")
    public ResponseEntity<List<Producto.Categoria>> categoriasPorGenero(@PathVariable Producto.Genero genero) {
        return ResponseEntity.ok(CATEGORIAS_POR_GENERO.getOrDefault(genero, List.of()));
    }
}