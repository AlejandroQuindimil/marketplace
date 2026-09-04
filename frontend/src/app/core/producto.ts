import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface TallaStock {
  talla: string;
  stock: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioAnterior?: number;
  categoria: string;
  genero: string;
  imagenes: string[];
  tallas: TallaStock[];
  colores: string[];
  marca: string;
  destacado: boolean;
  detalles?: DetallesProducto;
}

export interface DetallesProducto {
  materialExterior?: string;
  materialInterior?: string;
  cuidados?: string;
  cierre?: string;
  estampado?: string;
  corte?: string;
  guiaTallas?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  findAll(categoria?: string, genero?: string): Observable<Producto[]> {
    const params: string[] = [];
    if (categoria) params.push(`categoria=${categoria}`);
    if (genero) params.push(`genero=${genero}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<Producto[]>(`${this.apiUrl}${query}`);
  }

  findDestacados(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/destacados`);
  }

  findById(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }
}