package com.drip.marketplace.service;

import com.drip.marketplace.dto.ResenaDTO;
import com.drip.marketplace.model.Pedido;
import com.drip.marketplace.model.Resena;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.PedidoRepository;
import com.drip.marketplace.repository.ResenaRepository;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResenaService {

    private static final int MAX_EDICIONES = 3;

    private final ResenaRepository resenaRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;

    public List<Resena> findByProducto(String productoId) {
        return resenaRepository.findByProductoIdOrderByCreatedAtDesc(productoId);
    }

    // Comprueba si el usuario tiene derecho a valorar este producto:
    // necesita al menos un pedido ENTREGADO que contenga ese productoId.
    // Se usa tanto para decidir si mostrar el formulario en el frontend
    // como para validar antes de guardar (nunca confiamos solo en el
    // frontend para esto).
    public boolean puedeValorar(String usuarioId, String productoId) {
        List<Pedido> pedidos = pedidoRepository.findByUsuarioId(usuarioId);

        return pedidos.stream()
                .filter(p -> p.getEstado() == Pedido.Estado.ENTREGADO)
                .flatMap(p -> p.getItems().stream())
                .anyMatch(item -> item.getProductoId().equals(productoId));
    }

    public Optional<Resena> obtenerResenaDeUsuario(String usuarioId, String productoId) {
        return resenaRepository.findByProductoIdAndUsuarioId(productoId, usuarioId);
    }

    public Resena crearOActualizar(String usuarioId, String productoId, ResenaDTO dto) {
        if (!puedeValorar(usuarioId, productoId)) {
            throw new IllegalArgumentException("Solo puedes valorar productos que hayas recibido");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Optional<Resena> existente = resenaRepository.findByProductoIdAndUsuarioId(productoId, usuarioId);
        Resena resena;

        if (existente.isPresent()) {
            resena = existente.get();

            if (resena.getNumEdiciones() >= MAX_EDICIONES) {
                throw new IllegalArgumentException(
                        "Has alcanzado el máximo de " + MAX_EDICIONES + " ediciones para esta valoración");
            }

            // guardamos el estado anterior en el historial antes de sobrescribirlo
            Resena.EdicionHistorial version = new Resena.EdicionHistorial();
            version.setEstrellas(resena.getEstrellas());
            version.setComentario(resena.getComentario());
            version.setFecha(resena.getUpdatedAt() != null ? resena.getUpdatedAt() : resena.getCreatedAt());
            resena.getHistorial().add(version);

            resena.setNumEdiciones(resena.getNumEdiciones() + 1);
            resena.setUpdatedAt(LocalDateTime.now());
        } else {
            resena = new Resena();
            resena.setProductoId(productoId);
            resena.setUsuarioId(usuarioId);
        }

        resena.setUsuarioNombre(usuario.getNombre());
        resena.setEstrellas(dto.getEstrellas());
        resena.setComentario(dto.getComentario());

        return resenaRepository.save(resena);
    }

    public double mediaEstrellas(String productoId) {
        List<Resena> resenas = findByProducto(productoId);
        if (resenas.isEmpty()) return 0;
        return resenas.stream().mapToInt(Resena::getEstrellas).average().orElse(0);
    }
}