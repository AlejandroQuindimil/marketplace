package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "pedidos")
public class Pedido {

    @Id
    private String id;

    private String usuarioId;
    private List<ItemPedido> items = new ArrayList<>();

    private Double total;
    private Estado estado = Estado.PENDIENTE;

    private Usuario.Direccion direccionEnvio;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Estado {
        PENDIENTE, PAGADO, ENVIADO, ENTREGADO
    }

    @Data
    public static class ItemPedido {
        private String productoId;
        private String talla;
        private String color;
        private Integer cantidad;
        private Double precio; // precio en el momento de la compra
    }
}