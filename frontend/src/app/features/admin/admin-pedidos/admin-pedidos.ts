import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../../core/pedido';

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pedidos.html',
  styleUrl: './admin-pedidos.css'
})
export class AdminPedidos implements OnInit {
  pedidos: Pedido[] = [];
  loading = true;
  filtroEstado = '';
  pedidoExpandido: string | null = null;

  // valor seleccionado en el <select> de cada pedido, que puede no
  // coincidir todavia con el estado real guardado hasta que se confirma
  estadoSeleccionado: Record<string, string> = {};
  guardandoEstado: Record<string, boolean> = {};

  estados = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO'];

  constructor(
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  private cargarPedidos(): void {
    this.loading = true;
    this.pedidoService.misTodosPedidos().subscribe({
      next: (data) => {
        this.pedidos = data;
        // el select arranca mostrando el estado real de cada pedido
        data.forEach(p => this.estadoSeleccionado[p.id] = p.estado);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get pedidosFiltrados(): Pedido[] {
    if (!this.filtroEstado) return this.pedidos;
    return this.pedidos.filter(p => p.estado === this.filtroEstado);
  }

  toggleDesglose(id: string): void {
    this.pedidoExpandido = this.pedidoExpandido === id ? null : id;
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      PAGADO: 'Pagado',
      ENVIADO: 'Enviado',
      ENTREGADO: 'Entregado'
    };
    return labels[estado] || estado;
  }

  // true si el usuario eligio un estado distinto al guardado y todavia
  // no lo ha confirmado: es lo que activa el boton de confirmar
  hayCambioPendiente(pedido: Pedido): boolean {
    return this.estadoSeleccionado[pedido.id] !== pedido.estado;
  }

  confirmarCambioEstado(pedido: Pedido): void {
    const nuevoEstado = this.estadoSeleccionado[pedido.id];
    if (nuevoEstado === pedido.estado) return;

    this.guardandoEstado[pedido.id] = true;

    this.pedidoService.cambiarEstado(pedido.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        pedido.estado = actualizado.estado;
        this.estadoSeleccionado[pedido.id] = actualizado.estado;
        this.guardandoEstado[pedido.id] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoEstado[pedido.id] = false;
        alert('No se pudo actualizar el estado del pedido.');
        this.cdr.detectChanges();
      }
    });
  }

  cancelarCambioEstado(pedido: Pedido): void {
    this.estadoSeleccionado[pedido.id] = pedido.estado;
  }
}