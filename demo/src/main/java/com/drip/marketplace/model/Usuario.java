package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

/** Documento MongoDB de un usuario registrado. */
@Data
@Document(collection = "usuarios")
public class Usuario {

    @Id
    private String id;

    private String nombre;
    private String email;
    private String password; // se guarda con bcrypt

    private Rol rol = Rol.USER;

    /* Array de ids de producto embebido directamente en el usuario, no una
    * coleccion aparte: la relacion es simple (solo una lista de
    * referencias), no se justifica una coleccion separada para esto
    * */
    private List<String> favoritos = new ArrayList<>();
    private List<Direccion> direcciones = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    // Talla preferida por categoria, ej: {"CAMISETAS": "M", "ZAPATILLAS": "42"}
    private Map<String, String> tallasPreferidas = new HashMap<>();

    public enum Rol {
        USER, ADMIN
    }

    /** Direccion de envio; puede haber varias guardadas por usuario. */
    @Data
    public static class Direccion {
        private String calle;
        private String ciudad;
        private String cp;
    }
}