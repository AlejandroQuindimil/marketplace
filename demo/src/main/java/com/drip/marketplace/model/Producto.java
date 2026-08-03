package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Documento MongoDB de un producto del catalogo. */
@Data
@Document(collection = "productos")
public class Producto {

    @Id
    @JsonProperty("id") // fuerza que el JSON de salida use "id", no "_id"
    private String id;

    private String nombre;
    private String descripcion;
    private Double precio;
    private Double precioAnterior; // null si no hay descuento activo

    // Enum en vez de String libre: evita valores inconsistentes como
    // "camiseta" / "Camisetas" / "CAMISETA" que romperian los filtros
    private Categoria categoria;

    // Separado de Categoria porque son dos filtros independientes: un
    // usuario puede querer "Hombre" sin importar la prenda, o "Camisetas"
    // sin importar el genero. UNISEX cubre accesorios/productos sin genero
    private Genero genero;
    
    private List<String> imagenes = new ArrayList<>();

    // Array de objetos embebidos en vez de campos sueltos (stockS, stockM...)
    // porque cada producto puede tener un conjunto de tallas totalmente
    // distinto (una gorra solo "Unica", unas zapatillas tallas numericas)
    private List<TallaStock> tallas = new ArrayList<>();
    private List<String> colores = new ArrayList<>();

    private String marca;
    private boolean destacado = false;

    private LocalDateTime createdAt = LocalDateTime.now();

   public enum Categoria {
    CAMISETAS, POLOS, CAMISAS, SUDADERAS, JERSEYS,
    PANTALONES, VAQUEROS, SHORTS,
    VESTIDOS, FALDAS,
    ZAPATILLAS, BOTAS,
    ABRIGOS, CHAQUETAS,
    ACCESORIOS, ROPA_INTERIOR
    }   
    
    public enum Genero {
        HOMBRE, MUJER, UNISEX
    }
    /** Stock disponible para una talla concreta de este producto. */
    @Data
    public static class TallaStock {
        private String talla;
        private Integer stock;
    }
}