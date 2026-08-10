package com.drip.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// body esperado en POST /api/auth/verify-email
@Data
public class VerifyEmailRequest {

    @NotBlank(message = "El email es obligatorio")
    private String email;

    @NotBlank(message = "El código es obligatorio")
    private String code;
}