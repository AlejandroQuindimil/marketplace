import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PuntoVenta {
  fecha: string;
  total: number;
  pedidos: number;
}

export interface ProductoVendido {
  nombre: string;
  unidades: number;
}

export interface ProductoStockBajo {
  id: string;
  nombre: string;
  imagen: string | null;
  stockTotal: number;
}

export interface ComparativaPeriodo {
  totalActual: number;
  totalAnterior: number;
  variacionPorcentaje: number;
}

export interface PuntoAov {
  fecha: string;
  ticketMedio: number;
}

export interface PuntoClientes {
  fecha: string;
  nuevos: number;
  recurrentes: number;
}

export interface RotacionCategoria {
  categoria: string;
  unidadesVendidas: number;
  stockActual: number;
  ratioRotacion: number;
}

export interface PuntoHeatmap {
  diaSemana: number;
  hora: number;
  pedidos: number;
}

export interface DashboardData {
  totalVentas: number;
  totalPedidos: number;
  ticketMedio: number;
  valorStockTotal: number;
  ventasPorDia: PuntoVenta[];
  pedidosPorEstado: Record<string, number>;
  topProductos: ProductoVendido[];
  stockBajo: ProductoStockBajo[];
  devolucionesSolicitadas: number;
  comparativaIngresos: ComparativaPeriodo;
  aovPorDia: PuntoAov[];
  clientesPorDia: PuntoClientes[];
  rotacionPorCategoria: RotacionCategoria[];
  heatmapPedidos: PuntoHeatmap[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboard(rango: string): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}?rango=${rango}`);
  }
}