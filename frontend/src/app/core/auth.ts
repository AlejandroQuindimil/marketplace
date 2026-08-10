import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface AuthResponse {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // ya no guarda sesion automaticamente: la cuenta no esta verificada
  // todavia, asi que no tiene sentido loguear de golpe
  register(data: RegisterRequest): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${this.apiUrl}/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(tap(res => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('usuario', JSON.stringify(res.usuario));
  }

  getUsuario(): { id: string; nombre: string; email: string; rol: string } | null {
  const data = localStorage.getItem('usuario');
  return data ? JSON.parse(data) : null;
  }

  // manda el codigo introducido por el usuario al backend para validarlo
  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { email, code });
  }

  // pide un codigo nuevo por si el primero caduco o no llego al correo
  resendCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-code`, { email });
  }
}