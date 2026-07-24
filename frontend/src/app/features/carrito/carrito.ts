import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../core/carrito';
import { AuthService } from '../../core/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito implements OnInit {
  items: ItemCarrito[] = [];
  procesando = false;
  error = '';

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarItems();
  }

  private cargarItems(): void {
    this.items = this.carritoService.getItems();
  }

  getTotal(): number {
    return this.carritoService.getTotal();
  }

  getStockDisponible(item: ItemCarrito): number {
    const tallaStock = item.producto.tallas.find(t => t.talla === item.talla);
    return tallaStock ? tallaStock.stock : 0;
  }

  incrementar(index: number): void {
    const item = this.items[index];
    if (item.cantidad < this.getStockDisponible(item)) {
      this.carritoService.updateCantidad(index, item.cantidad + 1);
      this.cargarItems();
    }
  }

  decrementar(index: number): void {
    const item = this.items[index];
    if (item.cantidad > 1) {
      this.carritoService.updateCantidad(index, item.cantidad - 1);
      this.cargarItems();
    }
  }

  quitar(index: number): void {
    this.carritoService.removeItem(index);
    this.cargarItems();
  }

  finalizarCompra(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.items.length === 0) return;

    this.procesando = true;
    this.error = '';

    const body = {
      items: this.items.map(i => ({
        productoId: i.producto.id,
        talla: i.talla,
        color: i.color,
        cantidad: i.cantidad
      })),
      direccionEnvio: {
        calle: 'Calle Falsa 123',
        ciudad: 'Vigo',
        cp: '36200'
      }
    };

    this.http.post(`${environment.apiUrl}/pedidos`, body).subscribe({
      next: () => {
        this.carritoService.clear();
        this.cargarItems();
        this.procesando = false;
        alert('¡Pedido realizado con éxito!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.procesando = false;
        this.error = err.error?.error || 'Error al procesar el pedido';
      }
    });
  }
}