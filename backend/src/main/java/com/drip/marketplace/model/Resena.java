package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


// Valoracion de un producto por parte de un usuario que ya lo compro
// y recibio (pedido en estado ENTREGADO). Un usuario solo puede dejar
// una resena por producto: si vuelve a valorar el mismo, se actualiza
// la existente en vez de crear una duplicada.

@Data
@Document(collection = "resenas")
public class Resena {

    @Id
    private String id;

    private String productoId;
    private String usuarioId;
    private String usuarioNombre; 
    // copiado en el momento de crear, para no tener que unir con Usuario al listar

    private int estrellas; // 1 a 5
    private String comentario;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
    private int numEdiciones = 0;
    private List<EdicionHistorial> historial = new ArrayList<>();

    @Data
    public static class EdicionHistorial {
        private int estrellas;
        private String comentario;
        private LocalDateTime fecha;
    }
}