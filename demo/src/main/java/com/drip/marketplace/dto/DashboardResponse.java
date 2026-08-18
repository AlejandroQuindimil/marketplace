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
        private int stockTotal;

        public ProductoStockBajo(String id, String nombre, int stockTotal) {
            this.id = id;
            this.nombre = nombre;
            this.stockTotal = stockTotal;
        }
    }
}