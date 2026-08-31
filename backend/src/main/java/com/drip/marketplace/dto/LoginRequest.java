package com.drip.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Body esperado en POST /api/auth/login. */
@Data
public class LoginRequest {

    @NotBlank(message = "El email es obligatorio")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}