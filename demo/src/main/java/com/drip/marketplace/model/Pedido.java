package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Documento MongoDB que representa un pedido ya realizado. Se crea una
 * unica vez al hacer checkout; a partir de ahi solo deberia cambiar su
 * campo estado (PENDIENTE -> PAGADO -> ENVIADO -> ENTREGADO).
 */
@Data
@Document(collection = "pedidos")
public class Pedido {

    @Id
    private String id;

    // Referencia al usuario, no el objeto completo embebido, para no
    // duplicar datos que cambian (nombre, email) en cada pedido
    private String usuarioId;
    private List<ItemPedido> items = new ArrayList<>();

    private Double total;
    private Estado estado = Estado.PENDIENTE;

    // Reutiliza la misma forma que Usuario.Direccion, embebida aqui tal
    // cual estaba en el momento de la compra
    private Usuario.Direccion direccionEnvio;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Estado {
        PENDIENTE, PAGADO, ENVIADO, ENTREGADO
    }

    /**
     * Un producto dentro del pedido. El campo precio es una COPIA
     * CONGELADA del precio del producto en el momento exacto de la
     * compra — si el precio del producto cambia despues, este pedido
     * ya realizado no se ve afectado retroactivamente.
     */
    @Data
    public static class ItemPedido {
        private String productoId;
        private String talla;
        private String color;
        private Integer cantidad;
        private Double precio; // precio en el momento de la compra
    }
}