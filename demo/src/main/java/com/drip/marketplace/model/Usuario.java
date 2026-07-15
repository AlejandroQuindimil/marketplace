package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "usuarios")
public class Usuario {

    @Id
    private String id;

    private String nombre;
    private String email;
    private String password; // se guarda con bcrypt

    private Rol rol = Rol.USER;

    private List<String> favoritos = new ArrayList<>();
    private List<Direccion> direcciones = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Rol {
        USER, ADMIN
    }

    @Data
    public static class Direccion {
        private String calle;
        private String ciudad;
        private String cp;
    }
}