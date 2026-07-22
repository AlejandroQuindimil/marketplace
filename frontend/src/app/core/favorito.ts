import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Producto } from './producto';

@Injectable({
  providedIn: 'root',
})
export class FavoritoService {
  private apiUrl = `${environment.apiUrl}/favoritos`;

  constructor(private http: HttpClient) {}

  getFavoritos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  add(productoId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${productoId}`, {});
  }

  remove(productoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${productoId}`);
  }
}