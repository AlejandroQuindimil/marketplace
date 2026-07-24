import { Injectable, signal } from '@angular/core';
import { Producto } from './producto';
import { AuthService } from './auth';

export interface ItemCarrito {
  producto: Producto;
  talla: string;
  color: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  contador = signal(0);

  constructor(private authService: AuthService) {
    this.contador.set(this.calcularContador());
  }

  private getStorageKey(): string {
    const usuario = this.authService.getUsuario();
    return usuario ? `carrito_${usuario.id}` : 'carrito_guest';
  }

  getItems(): ItemCarrito[] {
    const data = localStorage.getItem(this.getStorageKey());
    return data ? JSON.parse(data) : [];
  }

  private saveItems(items: ItemCarrito[]): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(items));
    this.contador.set(this.calcularContador());
  }

  private calcularContador(): number {
    return this.getItems().reduce((sum, i) => sum + i.cantidad, 0);
  }

  addItem(producto: Producto, talla: string, color: string, cantidad: number = 1): void {
    const items = this.getItems();
    const existente = items.find(
      i => i.producto.id === producto.id && i.talla === talla && i.color === color
    );
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      items.push({ producto, talla, color, cantidad });
    }
    this.saveItems(items);
  }

  updateCantidad(index: number, cantidad: number): void {
    const items = this.getItems();
    if (items[index]) {
      items[index].cantidad = cantidad;
      this.saveItems(items);
    }
  }

  removeItem(index: number): void {
    const items = this.getItems();
    items.splice(index, 1);
    this.saveItems(items);
  }

  clear(): void {
    localStorage.removeItem(this.getStorageKey());
    this.contador.set(0);
  }

  getTotal(): number {
    return this.getItems().reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0);
  }

  getCount(): number {
    return this.calcularContador();
  }

  mergeGuestCartOnLogin(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) return;

    const guestKey = 'carrito_guest';
    const userKey = `carrito_${usuario.id}`;

    const guestData = localStorage.getItem(guestKey);
    const guestItems: ItemCarrito[] = guestData ? JSON.parse(guestData) : [];

    if (guestItems.length === 0) {
      this.contador.set(this.calcularContador());
      return;
    }

    const userData = localStorage.getItem(userKey);
    const userItems: ItemCarrito[] = userData ? JSON.parse(userData) : [];

    guestItems.forEach(gi => {
      const existente = userItems.find(
        ui => ui.producto.id === gi.producto.id && ui.talla === gi.talla && ui.color === gi.color
      );
      if (existente) {
        existente.cantidad += gi.cantidad;
      } else {
        userItems.push(gi);
      }
    });

    localStorage.setItem(userKey, JSON.stringify(userItems));
    localStorage.removeItem(guestKey);
    this.contador.set(this.calcularContador());
  }
}