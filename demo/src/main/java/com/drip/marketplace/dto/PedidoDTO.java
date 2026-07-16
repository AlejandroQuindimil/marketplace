package com.drip.marketplace.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class PedidoDTO {

    @NotEmpty(message = "El pedido debe tener al menos un producto")
    @Valid
    private List<ItemDTO> items;

    @NotNull(message = "La dirección de envío es obligatoria")
    @Valid
    private DireccionDTO direccionEnvio;

    @Data
    public static class ItemDTO {
        @NotBlank(message = "El productoId es obligatorio")
        private String productoId;

        @NotBlank(message = "La talla es obligatoria")
        private String talla;

        @NotBlank(message = "El color es obligatorio")
        private String color;

        @NotNull(message = "La cantidad es obligatoria")
        @Positive(message = "La cantidad debe ser positiva")
        private Integer cantidad;
    }

    @Data
    public static class DireccionDTO {
        @NotBlank(message = "La calle es obligatoria")
        private String calle;

        @NotBlank(message = "La ciudad es obligatoria")
        private String ciudad;

        @NotBlank(message = "El código postal es obligatorio")
        private String cp;
    }
}