package com.drip.marketplace.service;

import com.drip.marketplace.model.Producto;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.ProductoRepository;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Logica de favoritos. Los ids de producto favorito viven embebidos en
 * el propio documento Usuario (campo favoritos), no en una coleccion
 * aparte, asi que aqui se lee/escribe siempre el Usuario completo.
 */
@Service
@RequiredArgsConstructor
public class FavoritoService {

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

    /** findAllById hace una unica consulta a Mongo para traer todos los
     * productos favoritos de golpe, en vez de uno por uno. */
    public List<Producto> getFavoritos(String usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return productoRepository.findAllById(usuario.getFavoritos());
    }

    public void addFavorito(String usuarioId, String productoId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!productoRepository.existsById(productoId)) {
            throw new IllegalArgumentException("Producto no encontrado");
        }

        // Evita duplicados: si ya estaba en favoritos, no se vuelve a añadir
        if (!usuario.getFavoritos().contains(productoId)) {
            usuario.getFavoritos().add(productoId);
            usuarioRepository.save(usuario);
        }
    }

    public void removeFavorito(String usuarioId, String productoId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // remove() no falla si el id no estaba en la lista, simplemente no
        // hace nada, asi que no hace falta comprobarlo antes
        usuario.getFavoritos().remove(productoId);
        usuarioRepository.save(usuario);
    }
}