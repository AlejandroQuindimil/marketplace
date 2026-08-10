package com.drip.marketplace.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

// Documento MongoDB de un usuario registrado
@Data
@Document(collection = "usuarios")
public class Usuario {

    @Id
    private String id;

    private String nombre;
    private String email;
    private String password; // se guarda con bcrypt

    private Rol rol = Rol.USER;

    private String telefono = "";
    private boolean recibirNewsletter = false;

    private List<String> favoritos = new ArrayList<>();
    private List<Direccion> direcciones = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private Map<String, String> tallasPreferidas = new HashMap<>();

    // --- Verificacion de email ---
    // false hasta que confirme el codigo que le llega por correo
    private boolean verified = false;

    // codigo OTP de 6 digitos que se manda por email
    private String verificationCode;

    // el codigo deja de ser valido pasado este momento (24h desde el registro)
    private LocalDateTime tokenExpiration;

    public enum Rol {
        USER, ADMIN
    }

    @Data
    public static class Direccion {
        private String calle;
        private String ciudad;
        private String cp;
        private boolean predeterminada = false;
    }
}