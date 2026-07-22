import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService, Producto } from '../../core/producto';
import { FavoritoService } from '../../core/favorito';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css'
})
export class ProductoDetalle implements OnInit {
  producto: Producto | null = null;
  similares: Producto[] = [];
  loading = true;
  tallaSeleccionada = '';
  colorSeleccionado = '';
  imagenActiva = '';
  esFavorito = false;

  // Info estática de referencia (no viene del backend)
  acordeones = [
    {
      titulo: 'Composición y cuidados',
      abierto: false,
      contenido: [
        { label: 'Material exterior', valor: 'Algodón 100%' },
        { label: 'Material interior', valor: 'Tejido de punto' },
        { label: 'Cuidados', valor: 'Lavado a máquina 30°C' }
      ]
    },
    {
      titulo: 'Características del producto',
      abierto: false,
      contenido: [
        { label: 'Cierre', valor: 'Sin cierre' },
        { label: 'Estampado', valor: 'Liso' },
        { label: 'Número de artículo', valor: 'DRP-0001' }
      ]
    },
    {
      titulo: 'Talla y corte',
      abierto: false,
      contenido: [
        { label: 'Corte', valor: 'Regular fit' },
        { label: 'Guía de tallas', valor: 'Consulta nuestra guía de tallas' }
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private favoritoService: FavoritoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.productoService.findById(id).subscribe({
      next: (data) => {
        this.producto = data;
        this.colorSeleccionado = data.colores[0] || '';
        this.imagenActiva = data.imagenes[0] || '';
        this.loading = false;
        this.cdr.detectChanges();
        this.cargarSimilares(data.categoria, data.id);
        this.comprobarFavorito(data.id);
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

    private comprobarFavorito(productoId: string): void {
    if (!this.authService.isLoggedIn()) return;

    this.favoritoService.getFavoritos().subscribe({
      next: (favs) => {
        this.esFavorito = favs.some(f => f.id === productoId);
        this.cdr.detectChanges();
      }
    });
  }

  toggleFavorito(): void {
    if (!this.producto) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.esFavorito) {
      this.favoritoService.remove(this.producto.id).subscribe(() => {
        this.esFavorito = false;
        this.cdr.detectChanges();
      });
    } else {
      this.favoritoService.add(this.producto.id).subscribe(() => {
        this.esFavorito = true;
        this.cdr.detectChanges();
      });
    }
  }

  private cargarSimilares(categoria: string, idActual: string): void {
    this.productoService.findAll(categoria).subscribe({
      next: (data) => {
        this.similares = data.filter(p => p.id !== idActual).slice(0, 10);
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada = talla;
  }

  seleccionarColor(color: string): void {
    this.colorSeleccionado = color;
  }

  seleccionarImagen(img: string): void {
    this.imagenActiva = img;
  }

  toggleAcordeon(index: number): void {
    this.acordeones[index].abierto = !this.acordeones[index].abierto;
  }

  volver(): void {
    window.history.back();
  }
}