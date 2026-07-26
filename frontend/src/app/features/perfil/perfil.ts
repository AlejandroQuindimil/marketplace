import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';
import { PedidoService, Pedido } from '../../core/pedido';
import { UsuarioService } from '../../core/usuario';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario: { id: string; nombre: string; email: string; rol: string } | null = null;
  pedidos: Pedido[] = [];
  loadingPedidos = true;
  tallasPreferidas: Record<string, string> = {};

  tabActiva: 'perfil' | 'pedidos' | 'devoluciones' | 'tallas' | 'ayuda' = 'perfil';

  categorias = ['CAMISETAS', 'PANTALONES', 'ZAPATILLAS', 'ACCESORIOS', 'ABRIGOS'];
  categoriaLabels: Record<string, string> = {
    CAMISETAS: 'Camisetas',
    PANTALONES: 'Pantalones',
    ZAPATILLAS: 'Zapatillas',
    ACCESORIOS: 'Accesorios',
    ABRIGOS: 'Abrigos'
  };

  constructor(
    private authService: AuthService,
    private pedidoService: PedidoService,
    private usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

 ngOnInit(): void {
  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/login']);
    return;
  }

  this.usuario = this.authService.getUsuario();
  this.cargarPedidos();
  this.cargarTallas();

  this.route.queryParams.subscribe(params => {
    const tab = params['tab'];
    if (tab) {
      this.tabActiva = tab;
    }
  });
}

  cambiarTab(tab: typeof this.tabActiva): void {
    this.tabActiva = tab;
  }

  private cargarPedidos(): void {
    this.pedidoService.misPedidos().subscribe({
      next: (data) => {
        this.pedidos = data.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loadingPedidos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPedidos = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarTallas(): void {
    this.usuarioService.me().subscribe({
      next: (data) => {
        this.tallasPreferidas = data.tallasPreferidas || {};
        this.cdr.detectChanges();
      }
    });
  }

  opcionesTalla(categoria: string): string[] {
    if (categoria === 'ZAPATILLAS') {
      const tallas: string[] = [];
      for (let i = 28; i <= 50; i++) {
        tallas.push(i.toString());
      }
      return tallas;
    }
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }


  guardarTalla(categoria: string, talla: string): void {
    if (!talla) return;

    this.usuarioService.updateTalla(categoria, talla).subscribe({
      next: () => {
        this.tallasPreferidas[categoria] = talla;
        this.cdr.detectChanges();
      }
    });
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
}