package com.drip.marketplace.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

// respuesta completa del dashboard: todo lo que el frontend necesita
// para pintar las graficas en una sola llamada, evitando ir pidiendo
// pieza a pieza
@Data
public class DashboardResponse {

    private double totalVentas;
    private long totalPedidos;
    private double ticketMedio;
    private double valorStockTotal;

    // ventas agrupadas por dia dentro del rango elegido, para el
    // grafico de linea
    private List<PuntoVenta> ventasPorDia;

    // cuantos pedidos hay en cada estado (PENDIENTE, PAGADO...), para
    // el grafico de tarta
    private Map<String, Long> pedidosPorEstado;

    // los 5 productos mas vendidos en el rango, por unidades
    private List<ProductoVendido> topProductos;

    // productos con stock total por debajo del umbral de aviso
    private List<ProductoStockBajo> stockBajo;

    // TODO: no hay backend de devoluciones todavia (el boton "Solicitar
    // devolucion" del perfil es solo visual, no persiste nada). Se deja
    // en 0 a proposito hasta que exista ese modelo.
    private long devolucionesSolicitadas = 0;

    @Data
    public static class PuntoVenta {
        private LocalDate fecha;
        private double total;
        private long pedidos;

        public PuntoVenta(LocalDate fecha, double total, long pedidos) {
            this.fecha = fecha;
            this.total = total;
            this.pedidos = pedidos;
        }
    }

    @Data
    public static class ProductoVendido {
        private String nombre;
        private long unidades;

        public ProductoVendido(String nombre, long unidades) {
            this.nombre = nombre;
            this.unidades = unidades;
        }
    }

    @Data
    public static class ProductoStockBajo {
        private String id;
        private String nombre;
        private String imagen;
        private int stockTotal;

        public ProductoStockBajo(String id, String nombre, String imagen, int stockTotal) {
            this.id = id;
            this.nombre = nombre;
            this.imagen = imagen;
            this.stockTotal = stockTotal;
        }
    }

    // comparativa del periodo actual contra el inmediatamente anterior de
    // la misma duracion (ej: si el rango es "mes", compara este mes vs el
    // mes justo anterior)
    private ComparativaPeriodo comparativaIngresos;

    @Data
    public static class ComparativaPeriodo {
        private double totalActual;
        private double totalAnterior;
        private double variacionPorcentaje; // positivo = crecio, negativo = bajo

        public ComparativaPeriodo(double totalActual, double totalAnterior) {
            this.totalActual = totalActual;
            this.totalAnterior = totalAnterior;
            // evitamos division por cero si el periodo anterior no tuvo ventas
            this.variacionPorcentaje = totalAnterior == 0
                    ? (totalActual > 0 ? 100 : 0)
                    : ((totalActual - totalAnterior) / totalAnterior) * 100;
        }
    }

    // evolucion del ticket medio dia a dia dentro del rango elegido
    private List<PuntoAov> aovPorDia;

    @Data
    public static class PuntoAov {
        private LocalDate fecha;
        private double ticketMedio;

        public PuntoAov(LocalDate fecha, double ticketMedio) {
            this.fecha = fecha;
            this.ticketMedio = ticketMedio;
        }
    }

    // clientes nuevos vs recurrentes agrupados por dia, para ver si el
    // negocio depende de adquisicion constante o tiene retencion real
    private List<PuntoClientes> clientesPorDia;

    @Data
    public static class PuntoClientes {
        private LocalDate fecha;
        private long nuevos;
        private long recurrentes;

        public PuntoClientes(LocalDate fecha, long nuevos, long recurrentes) {
            this.fecha = fecha;
            this.nuevos = nuevos;
            this.recurrentes = recurrentes;
        }
    }

    // rotacion de stock por categoria: cuanto se ha vendido de cada
    // categoria en el rango, comparado con el stock que queda ahora mismo
    private List<RotacionCategoria> rotacionPorCategoria;

    @Data
    public static class RotacionCategoria {
        private String categoria;
        private long unidadesVendidas;
        private int stockActual;
        // ratio simple: vendidas / (vendidas + stock actual). Cerca de 1 =
        // se vende casi todo lo que entra; cerca de 0 = se acumula stock
        private double ratioRotacion;

        public RotacionCategoria(String categoria, long unidadesVendidas, int stockActual) {
            this.categoria = categoria;
            this.unidadesVendidas = unidadesVendidas;
            this.stockActual = stockActual;
            long base = unidadesVendidas + stockActual;
            this.ratioRotacion = base == 0 ? 0 : (double) unidadesVendidas / base;
        }
    }

    // mapa de calor: cuantos pedidos hay por combinacion de dia de la
    // semana (1=lunes...7=domingo) y franja horaria (0-23h)
    private List<PuntoHeatmap> heatmapPedidos;

    @Data
    public static class PuntoHeatmap {
        private int diaSemana; // 1 = lunes, 7 = domingo (ISO-8601)
        private int hora;      // 0 a 23
        private long pedidos;

        public PuntoHeatmap(int diaSemana, int hora, long pedidos) {
            this.diaSemana = diaSemana;
            this.hora = hora;
            this.pedidos = pedidos;
        }
    }
}