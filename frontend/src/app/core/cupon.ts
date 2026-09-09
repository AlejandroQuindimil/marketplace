import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class CuponService {
  private apiUrl = `${environment.apiUrl}/cupon`;

  constructor(private http: HttpClient) {}

  aplicar(codigo: string): Observable<{ valido: boolean; descuento?: number; error?: string }> {
    return this.http.post<any>(`${this.apiUrl}/validarCupon`, { codigo });
  }
}