package com.drip.marketplace.service;

import com.drip.marketplace.dto.DashboardResponse;
import com.drip.marketplace.model.Pedido;
import com.drip.marketplace.model.Producto;
import com.drip.marketplace.repository.PedidoRepository;
import com.drip.marketplace.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

// calcula todos los agregados que necesita el dashboard de admin:
// ventas por dia, pedidos por estado, productos mas vendidos, stock bajo,
// comparativa de ingresos, AOV en el tiempo, clientes nuevos/recurrentes,
// rotacion de stock por categoria y heatmap de pedidos por dia/hora
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
        response.setAovPorDia(calcularAovPorDia(pedidos));
        response.setPedidosPorEstado(agruparPorEstado(pedidos));
        response.setTopProductos(calcularTopProductos(pedidos));
        response.setComparativaIngresos(calcularComparativaIngresos(rango, desde));
        response.setClientesPorDia(calcularClientesPorDia(pedidos));
        response.setHeatmapPedidos(calcularHeatmapPedidos(pedidos));

        List<Producto> productos = productoRepository.findAll();
        response.setValorStockTotal(calcularValorStock(productos));
        response.setStockBajo(calcularStockBajo(productos));
        response.setRotacionPorCategoria(calcularRotacionPorCategoria(pedidos, productos));

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

    // AOV de cada dia: total vendido ese dia / numero de pedidos ese dia.
    // Reutiliza el mismo agrupado por fecha que ya usamos para
    // ventasPorDia, en vez de recorrer los pedidos otra vez
    private List<DashboardResponse.PuntoAov> calcularAovPorDia(List<Pedido> pedidos) {
        Map<LocalDate, List<Pedido>> porDia = pedidos.stream()
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().toLocalDate()));

        return porDia.entrySet().stream()
                .map(e -> {
                    double totalDia = e.getValue().stream().mapToDouble(Pedido::getTotal).sum();
                    double aov = e.getValue().isEmpty() ? 0 : totalDia / e.getValue().size();
                    return new DashboardResponse.PuntoAov(e.getKey(), aov);
                })
                .sorted(Comparator.comparing(DashboardResponse.PuntoAov::getFecha))
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

    // compara el total de ventas del rango actual contra el mismo rango
    // justo antes: si el rango es "mes", compara este mes vs el anterior,
    // usando la MISMA duracion en dias para que la comparacion sea justa
    private DashboardResponse.ComparativaPeriodo calcularComparativaIngresos(String rango, LocalDateTime desdeActual) {
        LocalDateTime ahora = LocalDateTime.now();
        long duracionDias = Duration.between(desdeActual, ahora).toDays();

        LocalDateTime desdeAnterior = desdeActual.minusDays(duracionDias);
        LocalDateTime hastaAnterior = desdeActual;

        List<Pedido> pedidosAnteriores = pedidoRepository.findByCreatedAtAfter(desdeAnterior).stream()
                .filter(p -> p.getCreatedAt().isBefore(hastaAnterior))
                .toList();

        List<Pedido> pedidosActuales = pedidoRepository.findByCreatedAtAfter(desdeActual);

        double totalActual = pedidosActuales.stream().mapToDouble(Pedido::getTotal).sum();
        double totalAnterior = pedidosAnteriores.stream().mapToDouble(Pedido::getTotal).sum();

        return new DashboardResponse.ComparativaPeriodo(totalActual, totalAnterior);
    }

    // Para cada pedido del rango, determina si es el PRIMER pedido de ese
    // usuario en TODA la historia (cliente nuevo) o si ya tenia pedidos
    // anteriores (cliente recurrente), y agrupa el resultado por dia.
    //
    // Importante: consultamos el historial completo por usuario, no solo
    // dentro del rango elegido, porque un cliente puede haber comprado
    // hace 8 meses y volver ahora — eso lo convierte en recurrente aunque
    // dentro del rango actual solo aparezca una vez.
    private List<DashboardResponse.PuntoClientes> calcularClientesPorDia(List<Pedido> pedidos) {
        // cache para no repetir la consulta si el mismo usuario aparece
        // varias veces en el rango
        Map<String, LocalDateTime> primerPedidoPorUsuario = new HashMap<>();

        Map<LocalDate, long[]> contadorPorDia = new TreeMap<>(); // [nuevos, recurrentes]

        for (Pedido pedido : pedidos) {
            String usuarioId = pedido.getUsuarioId();

            LocalDateTime fechaPrimerPedido = primerPedidoPorUsuario.computeIfAbsent(usuarioId, id ->
                    pedidoRepository.findByUsuarioId(id).stream()
                            .map(Pedido::getCreatedAt)
                            .min(LocalDateTime::compareTo)
                            .orElse(pedido.getCreatedAt())
            );

            LocalDate dia = pedido.getCreatedAt().toLocalDate();
            long[] contador = contadorPorDia.computeIfAbsent(dia, d -> new long[2]);

            // si este pedido ES el primer pedido de su usuario, cuenta como
            // "nuevo" ese dia; si no, es un cliente que ya compraba antes
            boolean esPrimerPedido = pedido.getCreatedAt().equals(fechaPrimerPedido);
            if (esPrimerPedido) {
                contador[0]++;
            } else {
                contador[1]++;
            }
        }

        return contadorPorDia.entrySet().stream()
                .map(e -> new DashboardResponse.PuntoClientes(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();
    }

    // Cruza los items vendidos (por productoId) con el catalogo actual
    // para saber la categoria de cada venta, y las suma junto al stock
    // actual de esa misma categoria.
    private List<DashboardResponse.RotacionCategoria> calcularRotacionPorCategoria(
            List<Pedido> pedidos, List<Producto> productos) {

        // mapa rapido productoId -> categoria, para no consultar Mongo
        // producto a producto dentro del bucle de items vendidos
        Map<String, Producto.Categoria> categoriaPorProductoId = productos.stream()
                .collect(Collectors.toMap(Producto::getId, Producto::getCategoria));

        Map<Producto.Categoria, Long> vendidasPorCategoria = new HashMap<>();
        for (Pedido p : pedidos) {
            for (Pedido.ItemPedido item : p.getItems()) {
                Producto.Categoria categoria = categoriaPorProductoId.get(item.getProductoId());
                // si el producto se borro despues de venderse, no podemos
                // saber su categoria: lo ignoramos en vez de romper el calculo
                if (categoria == null) continue;
                vendidasPorCategoria.merge(categoria, (long) item.getCantidad(), Long::sum);
            }
        }

        Map<Producto.Categoria, Integer> stockPorCategoria = new HashMap<>();
        for (Producto p : productos) {
            int stockProducto = p.getTallas().stream().mapToInt(Producto.TallaStock::getStock).sum();
            stockPorCategoria.merge(p.getCategoria(), stockProducto, Integer::sum);
        }

        // unimos las categorias que aparecen en ventas O en stock, para no
        // perder categorias con stock pero sin ventas en el rango
        Set<Producto.Categoria> todasLasCategorias = new HashSet<>();
        todasLasCategorias.addAll(vendidasPorCategoria.keySet());
        todasLasCategorias.addAll(stockPorCategoria.keySet());

        return todasLasCategorias.stream()
                .map(cat -> new DashboardResponse.RotacionCategoria(
                        cat.name(),
                        vendidasPorCategoria.getOrDefault(cat, 0L),
                        stockPorCategoria.getOrDefault(cat, 0)
                ))
                .sorted(Comparator.comparingDouble(DashboardResponse.RotacionCategoria::getRatioRotacion).reversed())
                .toList();
    }

    // Agrupa los pedidos por (dia de la semana, hora) para el heatmap.
    // Solo devolvemos las combinaciones que realmente tienen al menos un
    // pedido, en vez de rellenar las 168 celdas (7 dias x 24h) vacias — el
    // frontend puede pintar el resto como 0 sin necesitar el dato explicito.
    private List<DashboardResponse.PuntoHeatmap> calcularHeatmapPedidos(List<Pedido> pedidos) {
        Map<String, Long> contador = pedidos.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().getDayOfWeek().getValue() + "-" + p.getCreatedAt().getHour(),
                        Collectors.counting()
                ));

        return contador.entrySet().stream()
                .map(e -> {
                    String[] partes = e.getKey().split("-");
                    return new DashboardResponse.PuntoHeatmap(
                            Integer.parseInt(partes[0]),
                            Integer.parseInt(partes[1]),
                            e.getValue()
                    );
                })
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
                String imagen = p.getImagenes().isEmpty() ? null : p.getImagenes().get(0);
                resultado.add(new DashboardResponse.ProductoStockBajo(p.getId(), p.getNombre(), imagen, stockTotal));
            }
        }

        resultado.sort(Comparator.comparingInt(DashboardResponse.ProductoStockBajo::getStockTotal));
        return resultado;
    }
}