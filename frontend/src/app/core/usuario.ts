import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  me(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  updateTalla(categoria: string, talla: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/tallas`, { categoria, talla });
  }
}