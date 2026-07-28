package com.drip.marketplace.dto;

import com.drip.marketplace.model.Producto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

/**
 * Body esperado en POST/PUT /api/productos. Se usa un DTO separado (en vez
 * de recibir Producto directamente) para que el id y createdAt no puedan
 * inyectarse desde el body de la peticion — los controla siempre el backend.
 */
@Data
public class ProductoDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @Positive(message = "El precio debe ser positivo")
    private Double precio;

    // Si viene informado y es mayor que precio, la ficha de producto
    // muestra el descuento tachado en el frontend
    private Double precioAnterior;

    @NotNull(message = "La categoría es obligatoria")
    private Producto.Categoria categoria;

    private List<String> imagenes;
    private List<Producto.TallaStock> tallas;
    private List<String> colores;
    private String marca;
    private boolean destacado;
}