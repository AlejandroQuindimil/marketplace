package com.drip.marketplace.service;

import com.drip.marketplace.dto.PedidoDTO;
import com.drip.marketplace.model.Pedido;
import com.drip.marketplace.model.Producto;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.PedidoRepository;
import com.drip.marketplace.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    public Pedido crearPedido(String usuarioId, PedidoDTO dto) {
        List<Pedido.ItemPedido> itemsPedido = new ArrayList<>();
        double total = 0;

        for (PedidoDTO.ItemDTO itemDto : dto.getItems()) {
            Producto producto = productoRepository.findById(itemDto.getProductoId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Producto no encontrado: " + itemDto.getProductoId()));

            Producto.TallaStock tallaStock = producto.getTallas().stream()
                    .filter(t -> t.getTalla().equals(itemDto.getTalla()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Talla no disponible: " + itemDto.getTalla() + " para " + producto.getNombre()));

            if (tallaStock.getStock() < itemDto.getCantidad()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para " + producto.getNombre() + " talla " + itemDto.getTalla()
                                + " (disponible: " + tallaStock.getStock() + ")");
            }

            // Descontar stock
            tallaStock.setStock(tallaStock.getStock() - itemDto.getCantidad());
            productoRepository.save(producto);

            // Congelar el precio actual en el item del pedido
            Pedido.ItemPedido item = new Pedido.ItemPedido();
            item.setProductoId(producto.getId());
            item.setTalla(itemDto.getTalla());
            item.setColor(itemDto.getColor());
            item.setCantidad(itemDto.getCantidad());
            item.setPrecio(producto.getPrecio());
            itemsPedido.add(item);

            total += producto.getPrecio() * itemDto.getCantidad();
        }

        Usuario.Direccion direccion = new Usuario.Direccion();
        direccion.setCalle(dto.getDireccionEnvio().getCalle());
        direccion.setCiudad(dto.getDireccionEnvio().getCiudad());
        direccion.setCp(dto.getDireccionEnvio().getCp());

        Pedido pedido = new Pedido();
        pedido.setUsuarioId(usuarioId);
        pedido.setItems(itemsPedido);
        pedido.setTotal(total);
        pedido.setDireccionEnvio(direccion);
        pedido.setEstado(Pedido.Estado.PENDIENTE);

        return pedidoRepository.save(pedido);
    }

    public List<Pedido> misPedidos(String usuarioId) {
        return pedidoRepository.findByUsuarioId(usuarioId);
    }

    public Pedido findById(String id, String usuarioId) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (!pedido.getUsuarioId().equals(usuarioId)) {
            throw new IllegalArgumentException("No tienes permiso para ver este pedido");
        }

        return pedido;
    }
}