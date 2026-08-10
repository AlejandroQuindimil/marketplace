package com.drip.marketplace.service;

import com.drip.marketplace.dto.PedidoDTO;
import com.drip.marketplace.model.Pedido;
import com.drip.marketplace.model.Producto;
import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.PedidoRepository;
import com.drip.marketplace.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    // Demo: sin sistema logistico real, simulamos el avance del pedido.
    // Pasados estos dias desde la creacion, si no esta ya entregado, se
    // marca automaticamente como ENTREGADO al consultarlo.
    private static final long DIAS_HASTA_ENTREGA_DEMO = 3;

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

            tallaStock.setStock(tallaStock.getStock() - itemDto.getCantidad());
            productoRepository.save(producto);

            Pedido.ItemPedido item = new Pedido.ItemPedido();
            item.setProductoId(producto.getId());
            item.setNombre(producto.getNombre());
            item.setImagen(producto.getImagenes().isEmpty() ? null : producto.getImagenes().get(0));
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
        List<Pedido> pedidos = pedidoRepository.findByUsuarioId(usuarioId);
        pedidos.forEach(this::autoActualizarEstado);
        return pedidos;
    }

    public Pedido findById(String id, String usuarioId) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (!pedido.getUsuarioId().equals(usuarioId)) {
            throw new IllegalArgumentException("No tienes permiso para ver este pedido");
        }

        autoActualizarEstado(pedido);
        return pedido;
    }

    /** Simula el avance PENDIENTE -> ENTREGADO tras unos dias, solo para
     * poder probar el flujo de devoluciones sin depender de un sistema
     * logistico real. Guarda el cambio si aplica. */
    private void autoActualizarEstado(Pedido pedido) {
        if (pedido.getEstado() == Pedido.Estado.ENTREGADO) return;

        long dias = Duration.between(pedido.getCreatedAt(), LocalDateTime.now()).toDays();
        if (dias >= DIAS_HASTA_ENTREGA_DEMO) {
            pedido.setEstado(Pedido.Estado.ENTREGADO);
            pedidoRepository.save(pedido);
        }
    }
}