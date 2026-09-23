import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Resena {
  id: string;
  productoId: string;
  usuarioId: string;
  usuarioNombre: string;
  estrellas: number;
  comentario: string;
  createdAt: string;
  updatedAt?: string;
  numEdiciones: number;
}

export interface ResenasResponse {
  resenas: Resena[];
  media: number;
  total: number;
}

export interface ResenaAdmin {
  id: string;
  productoId: string;
  productoNombre: string;
  usuarioNombre: string;
  estrellas: number;
  comentario: string;
  createdAt: string;
  updatedAt: string | null;
  numEdiciones: number;
}

// Version anterior de una reseña (la que había justo antes de editarla)
export interface EdicionResena {
  comentario: string;
  estrellas: number;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class ResenaService {
  constructor(private http: HttpClient) {}

  listar(productoId: string): Observable<ResenasResponse> {
    return this.http.get<ResenasResponse>(`${environment.apiUrl}/productos/${productoId}/resenas`);
  }

  puedoValorar(productoId: string): Observable<{ puedeValorar: boolean; miResena: Resena | null; limiteEdicionesAlcanzado: boolean }> {
    return this.http.get<{ puedeValorar: boolean; miResena: Resena | null; limiteEdicionesAlcanzado: boolean }>(`${environment.apiUrl}/productos/${productoId}/resenas/puedo-valorar`);
  }

  crear(productoId: string, estrellas: number, comentario: string): Observable<Resena> {
    return this.http.post<Resena>(`${environment.apiUrl}/productos/${productoId}/resenas`, { estrellas, comentario });
  }

  listarAdmin(): Observable<ResenaAdmin[]> {
    return this.http.get<ResenaAdmin[]>(`${environment.apiUrl}/admin/resenas`);
  }

  historialAdmin(id: string): Observable<EdicionResena[]> {
    return this.http.get<EdicionResena[]>(`${environment.apiUrl}/admin/resenas/${id}/historial`);
  }

  eliminarAdmin(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/admin/resenas/${id}`);
  }
}