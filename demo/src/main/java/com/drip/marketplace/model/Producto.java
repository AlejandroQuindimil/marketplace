package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "productos")
public class Producto {

    @Id
    private String id;

    private String nombre;
    private String descripcion;
    private Double precio;
    private Double precioAnterior;

    private Categoria categoria;

    private List<String> imagenes = new ArrayList<>();
    private List<TallaStock> tallas = new ArrayList<>();
    private List<String> colores = new ArrayList<>();

    private String marca;
    private boolean destacado = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Categoria {
        CAMISETAS, PANTALONES, ZAPATILLAS, ACCESORIOS, ABRIGOS
    }

    @Data
    public static class TallaStock {
        private String talla;
        private Integer stock;
    }
}