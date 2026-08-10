package com.drip.marketplace.service;

import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

// tarea de mantenimiento: borra cuentas que nunca llegaron a verificar
// su email pasados unos dias, para no dejar basura acumulandose en la BD
@Component
@RequiredArgsConstructor
public class LimpiezaUsuariosTask {

    private final UsuarioRepository usuarioRepository;

    // cuentas sin verificar con mas antiguedad que esto se consideran
    // abandonadas y se eliminan
    private static final int DIAS_LIMITE = 3;

    // cron = "segundo minuto hora dia mes diaSemana"
    // esto se ejecuta todos los dias a las 4:00 de la madrugada, hora en
    // la que hay poco trafico y no molesta a nadie
    @Scheduled(cron = "0 0 4 * * *")
    public void limpiarCuentasNoVerificadas() {
        LocalDateTime limite = LocalDateTime.now().minusDays(DIAS_LIMITE);

        List<Usuario> cuentasAbandonadas = usuarioRepository.findByVerifiedFalseAndCreatedAtBefore(limite);

        if (cuentasAbandonadas.isEmpty()) {
            return;
        }

        usuarioRepository.deleteAll(cuentasAbandonadas);

        // dejamos un rastro en el log para poder auditar que la limpieza
        // esta funcionando, sin esto seria un proceso completamente invisible
        System.out.println("Limpieza automatica: " + cuentasAbandonadas.size() + " cuentas sin verificar eliminadas");
    }
}