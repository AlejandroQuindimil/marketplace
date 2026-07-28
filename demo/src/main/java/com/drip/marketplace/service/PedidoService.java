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

/**
 * Logica de creacion y consulta de pedidos. Es el Service con mas
 * responsabilidad del backend: valida stock, lo descuenta, y calcula
 * el total real sin confiar en nada que venga del frontend.
 */
@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    /**
     * Crea un pedido a partir del carrito (PedidoDTO). Por cada item:
     * 1. Busca el producto real en Mongo (nunca se confia en datos del DTO
     *    salvo el productoId, la talla, el color y la cantidad).
     * 2. Busca la talla EXACTA dentro del array de tallas del producto.
     * 3. Comprueba que hay stock suficiente; si no, aborta con un mensaje
     *    claro que el frontend puede mostrar directamente.
     * 4. Descuenta el stock y guarda el producto actualizado.
     * 5. Congela el precio actual del producto en el item del pedido, para
     *    que cambios de precio futuros no afecten a compras ya realizadas.
     *
     * NOTA: el descuento de stock y la creacion del pedido no son atomicos
     * (no usan una transaccion de MongoDB). Para este proyecto es aceptable,
     * pero en produccion real haria falta una transaccion para evitar que
     * dos compras simultaneas se lleven la misma ultima unidad de stock.
     * Se puede cambiar  en el futuro a una transaccion de MongoDB si se quiere,
     * pero es mas  complejo.
     */
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

            /* Congelar el precio actual en el item del pedido — nunca se
            * usa un precio que venga del DTO, siempre el real de Mongo*/
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

    /** Comprueba que el pedido pertenece al usuario que lo pide, para que
    * nadie pueda ver el pedido de otro cambiando el id en la URL. */
    public Pedido findById(String id, String usuarioId) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (!pedido.getUsuarioId().equals(usuarioId)) {
            throw new IllegalArgumentException("No tienes permiso para ver este pedido");
        }

        return pedido;
    }
}