import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  mensaje = signal<string | null>(null);

  show(texto: string, duracionMs: number = 2500): void {
    this.mensaje.set(texto);
    setTimeout(() => this.mensaje.set(null), duracionMs);
  }
}