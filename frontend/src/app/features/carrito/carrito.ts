import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../core/carrito';
import { AuthService } from '../../core/auth';
import { UsuarioService, Direccion } from '../../core/usuario';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito implements OnInit {
  items: ItemCarrito[] = [];
  procesando = false;
  error = '';

  // --- Datos de envio ---
  direcciones: Direccion[] = [];
  direccionSeleccionadaIndex: number | null = null;
  mostrandoNuevaDireccion = false;
  nuevaDireccion: Direccion = { calle: '', ciudad: '', cp: '' };
  errorDireccion = '';
  guardandoDireccion = false;

  telefono = '';
  telefonoEditable = false;
  guardandoTelefono = false;

  // Metodo de pago: solo interfaz, no se procesa ningun cobro real
  metodoPago: 'tarjeta' | 'paypal' | 'contrareembolso' = 'tarjeta';

  mostrandoCheckout = false;

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarItems();
    if (this.authService.isLoggedIn()) {
      this.cargarDatosUsuario();
    }
  }

  private cargarItems(): void {
    this.items = this.carritoService.getItems();
  }

  private cargarDatosUsuario(): void {
    this.usuarioService.me().subscribe({
      next: (data) => {
        this.direcciones = data.direcciones || [];
        this.telefono = data.telefono || '';
        this.telefonoEditable = !this.telefono;

        // Preselecciona la predeterminada si existe, si no la primera
        const idxPredeterminada = this.direcciones.findIndex(d => d.predeterminada);
        this.direccionSeleccionadaIndex = this.direcciones.length > 0
          ? (idxPredeterminada >= 0 ? idxPredeterminada : 0)
          : null;

        // Si no tiene ninguna direccion guardada, abrimos el formulario directamente
        this.mostrandoNuevaDireccion = this.direcciones.length === 0;

        this.cdr.detectChanges();
      }
    });
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

  // --- Direccion de envio ---

  seleccionarDireccion(index: number): void {
    this.direccionSeleccionadaIndex = index;
    this.mostrandoNuevaDireccion = false;
  }

  toggleNuevaDireccion(): void {
    this.mostrandoNuevaDireccion = !this.mostrandoNuevaDireccion;
    this.errorDireccion = '';
    if (!this.mostrandoNuevaDireccion) {
      this.nuevaDireccion = { calle: '', ciudad: '', cp: '' };
    }
  }

  onCpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, 5);
    if (soloDigitos !== input.value) input.value = soloDigitos;
    this.nuevaDireccion.cp = soloDigitos;
  }

  guardarNuevaDireccion(): void {
    this.errorDireccion = '';

    if (!this.nuevaDireccion.calle || !this.nuevaDireccion.ciudad || !this.nuevaDireccion.cp) {
      this.errorDireccion = 'Rellena todos los campos.';
      return;
    }
    if (!/^\d{5}$/.test(this.nuevaDireccion.cp)) {
      this.errorDireccion = 'El código postal debe tener 5 dígitos.';
      return;
    }

    this.guardandoDireccion = true;

    this.usuarioService.addDireccion(this.nuevaDireccion).subscribe({
      next: (direcciones) => {
        this.direcciones = direcciones;
        this.direccionSeleccionadaIndex = direcciones.length - 1; // la recien creada
        this.mostrandoNuevaDireccion = false;
        this.guardandoDireccion = false;
        this.nuevaDireccion = { calle: '', ciudad: '', cp: '' };
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoDireccion = false;
        this.errorDireccion = 'No se pudo guardar la dirección. Inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  // --- Telefono ---

  activarEdicionTelefono(): void {
    this.telefonoEditable = true;
  }

  guardarTelefono(): void {
    if (!this.telefono) return;
    this.guardandoTelefono = true;

    this.usuarioService.updateTelefono(this.telefono).subscribe({
      next: () => {
        this.guardandoTelefono = false;
        this.telefonoEditable = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoTelefono = false;
        this.cdr.detectChanges();
      }
    });
  }

  get checkoutCompleto(): boolean {
  return this.direccionLista && !!this.telefono && !this.telefonoEditable;
  }

  abrirCheckout(): void {
  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/login']);
    return;
  }
  this.mostrandoCheckout = true;
  }



  // --- Finalizar compra ---

  get direccionLista(): boolean {
    return this.direccionSeleccionadaIndex !== null && !this.mostrandoNuevaDireccion;
  }

  finalizarCompra(): void {
  if (!this.checkoutCompleto || this.items.length === 0) return;

  this.error = '';
  const direccion = this.direcciones[this.direccionSeleccionadaIndex!];
  this.procesando = true;

  const body = {
    items: this.items.map(i => ({
      productoId: i.producto.id,
      talla: i.talla,
      color: i.color,
      cantidad: i.cantidad
    })),
    direccionEnvio: {
      calle: direccion.calle,
      ciudad: direccion.ciudad,
      cp: direccion.cp
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