package com.drip.marketplace.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

/**
 * Body esperado en POST /api/pedidos (el carrito que llega del frontend).
 * Notese que ItemDTO NO incluye precio: el precio real se lee siempre del
 * producto en base de datos dentro de PedidoService, nunca de lo que
 * mande el cliente, para que no se pueda manipular el importe a pagar.
 */
@Data
public class PedidoDTO {

    @NotEmpty(message = "El pedido debe tener al menos un producto")
    @Valid
    private List<ItemDTO> items;

    @NotNull(message = "La dirección de envío es obligatoria")
    @Valid
    private DireccionDTO direccionEnvio;

    /** Un item del carrito: que producto, en que talla/color y cuantas unidades. */
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

    /** Direccion de envio del pedido (misma forma que Usuario.Direccion). */
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