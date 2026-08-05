import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Direccion {
  calle: string;
  ciudad: string;
  cp: string;
  predeterminada?: boolean;
}

export interface MeResponse {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono: string;
  recibirNewsletter: boolean;
  tallasPreferidas: Record<string, string>;
  direcciones: Direccion[];
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/me`);
  }

  updateTalla(categoria: string, talla: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/tallas`, { categoria, talla });
  }

  addDireccion(direccion: Direccion): Observable<Direccion[]> {
    return this.http.post<Direccion[]>(`${this.apiUrl}/direcciones`, direccion);
  }

  updateDireccion(index: number, direccion: Direccion): Observable<Direccion[]> {
    return this.http.put<Direccion[]>(`${this.apiUrl}/direcciones/${index}`, direccion);
  }

  removeDireccion(index: number): Observable<Direccion[]> {
    return this.http.delete<Direccion[]>(`${this.apiUrl}/direcciones/${index}`);
  }

  marcarDireccionPredeterminada(index: number): Observable<Direccion[]> {
    return this.http.put<Direccion[]>(`${this.apiUrl}/direcciones/${index}/predeterminada`, {});
  }

  updateTelefono(telefono: string): Observable<{ telefono: string }> {
    return this.http.put<{ telefono: string }>(`${this.apiUrl}/telefono`, { telefono });
  }

  updateNewsletter(recibirNewsletter: boolean): Observable<{ recibirNewsletter: boolean }> {
    return this.http.put<{ recibirNewsletter: boolean }>(`${this.apiUrl}/newsletter`, { recibirNewsletter });
  }
}