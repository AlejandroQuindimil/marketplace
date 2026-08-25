import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ItemPedido {
  productoId: string;
  nombre: string;
  imagen: string | null;
  talla: string;
  color: string;
  cantidad: number;
  precio: number;
}

export interface Pedido {
  id: string;
  usuarioId: string;
  items: ItemPedido[];
  total: number;
  estado: string;
  direccionEnvio: { calle: string; ciudad: string; cp: string };
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  misPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/mis-pedidos`);
  }

  misTodosPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${environment.apiUrl}/admin/pedidos`);
  }

  cambiarEstado(id: string, estado: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${environment.apiUrl}/admin/pedidos/${id}/estado`, { estado });
  }
}