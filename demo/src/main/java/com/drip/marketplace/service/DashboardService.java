package com.drip.marketplace.service;

import com.drip.marketplace.dto.DashboardResponse;
import com.drip.marketplace.model.Pedido;
import com.drip.marketplace.model.Producto;
import com.drip.marketplace.repository.PedidoRepository;
import com.drip.marketplace.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

// calcula todos los agregados que necesita el dashboard de admin:
// ventas por dia, pedidos por estado, productos mas vendidos y stock bajo
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    // por debajo de este numero de unidades totales, un producto se
    // marca como "stock bajo" en el dashboard
    private static final int UMBRAL_STOCK_BAJO = 10;

    public DashboardResponse getDashboard(String rango) {
        LocalDateTime desde = calcularFechaInicio(rango);
        List<Pedido> pedidos = pedidoRepository.findByCreatedAtAfter(desde);

        DashboardResponse response = new DashboardResponse();

        response.setTotalPedidos(pedidos.size());
        response.setTotalVentas(pedidos.stream().mapToDouble(Pedido::getTotal).sum());
        response.setTicketMedio(pedidos.isEmpty() ? 0 : response.getTotalVentas() / pedidos.size());

        response.setVentasPorDia(agruparVentasPorDia(pedidos));
        response.setPedidosPorEstado(agruparPorEstado(pedidos));
        response.setTopProductos(calcularTopProductos(pedidos));

        List<Producto> productos = productoRepository.findAll();
        response.setValorStockTotal(calcularValorStock(productos));
        response.setStockBajo(calcularStockBajo(productos));

        return response;
    }

    // traduce el codigo de rango que manda el frontend (semana, mes,
    // 3meses...) a una fecha de corte concreta
    private LocalDateTime calcularFechaInicio(String rango) {
        LocalDateTime ahora = LocalDateTime.now();
        return switch (rango) {
            case "semana" -> ahora.minusWeeks(1);
            case "mes" -> ahora.minusMonths(1);
            case "3meses" -> ahora.minusMonths(3);
            case "6meses" -> ahora.minusMonths(6);
            case "1anio" -> ahora.minusYears(1);
            case "2anios" -> ahora.minusYears(2);
            case "3anios" -> ahora.minusYears(3);
            case "5anios" -> ahora.minusYears(5);
            default -> ahora.minusMonths(1); // fallback razonable
        };
    }

    private List<DashboardResponse.PuntoVenta> agruparVentasPorDia(List<Pedido> pedidos) {
        // agrupamos por fecha (sin hora) sumando total y contando pedidos
        Map<LocalDate, List<Pedido>> porDia = pedidos.stream()
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().toLocalDate()));

        return porDia.entrySet().stream()
                .map(e -> new DashboardResponse.PuntoVenta(
                        e.getKey(),
                        e.getValue().stream().mapToDouble(Pedido::getTotal).sum(),
                        e.getValue().size()
                ))
                .sorted(Comparator.comparing(DashboardResponse.PuntoVenta::getFecha))
                .toList();
    }

    private Map<String, Long> agruparPorEstado(List<Pedido> pedidos) {
        return pedidos.stream()
                .collect(Collectors.groupingBy(p -> p.getEstado().name(), Collectors.counting()));
    }

    private List<DashboardResponse.ProductoVendido> calcularTopProductos(List<Pedido> pedidos) {
        // sumamos cantidad vendida por nombre de producto a traves de
        // todos los pedidos del rango, y nos quedamos con el top 5
        Map<String, Long> unidadesPorProducto = new HashMap<>();

        for (Pedido p : pedidos) {
            for (Pedido.ItemPedido item : p.getItems()) {
                unidadesPorProducto.merge(item.getNombre(), (long) item.getCantidad(), Long::sum);
            }
        }

        return unidadesPorProducto.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> new DashboardResponse.ProductoVendido(e.getKey(), e.getValue()))
                .toList();
    }

    private double calcularValorStock(List<Producto> productos) {
        double total = 0;
        for (Producto p : productos) {
            int stockProducto = p.getTallas().stream().mapToInt(Producto.TallaStock::getStock).sum();
            total += stockProducto * p.getPrecio();
        }
        return total;
    }

    private List<DashboardResponse.ProductoStockBajo> calcularStockBajo(List<Producto> productos) {
        List<DashboardResponse.ProductoStockBajo> resultado = new ArrayList<>();

        for (Producto p : productos) {
            int stockTotal = p.getTallas().stream().mapToInt(Producto.TallaStock::getStock).sum();
            if (stockTotal < UMBRAL_STOCK_BAJO) {
                resultado.add(new DashboardResponse.ProductoStockBajo(p.getId(), p.getNombre(), stockTotal));
            }
        }

        resultado.sort(Comparator.comparingInt(DashboardResponse.ProductoStockBajo::getStockTotal));
        return resultado;
    }
}