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
  stockTotal: number;
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
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboard(rango: string): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}?rango=${rango}`);
  }
}