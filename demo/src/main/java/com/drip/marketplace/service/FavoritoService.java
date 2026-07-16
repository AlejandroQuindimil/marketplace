package com.drip.marketplace.service;

import com.drip.marketplace.model.Producto;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.ProductoRepository;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoritoService {

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

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

        if (!usuario.getFavoritos().contains(productoId)) {
            usuario.getFavoritos().add(productoId);
            usuarioRepository.save(usuario);
        }
    }

    public void removeFavorito(String usuarioId, String productoId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.getFavoritos().remove(productoId);
        usuarioRepository.save(usuario);
    }
}