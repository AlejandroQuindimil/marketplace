import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductoService, Producto } from '../../core/producto';
import { environment } from '../../environments/environment';
import { FavoritoService } from '../../core/favorito';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  productos: Producto[] = [];
  loading = true;
  categoriaActiva = '';
  terminoBusqueda = '';
  generoActivo = '';

  favoritoIds: Set<string> = new Set();

  categorias = [
    { valor: '', label: 'Todos' },
    { valor: 'CAMISETAS', label: 'Camisetas' },
    { valor: 'PANTALONES', label: 'Pantalones' },
    { valor: 'ZAPATILLAS', label: 'Zapatillas' },
    { valor: 'ACCESORIOS', label: 'Accesorios' },
    { valor: 'ABRIGOS', label: 'Abrigos' }
  ];

  constructor(
    private productoService: ProductoService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private favoritoService: FavoritoService,
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
    this.favoritoService.getFavoritos().subscribe({
      next: (favs) => {
        this.favoritoIds = new Set(favs.map(f => f.id));
        this.cdr.detectChanges();
      }
    });
  }
    this.route.queryParams.subscribe(params => {
    this.terminoBusqueda = params['buscar'] || '';
    this.categoriaActiva = params['categoria'] || '';
    this.generoActivo = params['genero'] || '';
    this.cargarProductos();
  });
  }

  filtrarPor(categoria: string): void {
    this.router.navigate(['/productos'], { queryParams: { categoria } });
  }

  quitarBusqueda(): void {
    this.router.navigate(['/productos']);
  }

  private cargarProductos(): void {
    this.loading = true;

    if (this.terminoBusqueda) {
      const url = `${environment.apiUrl}/productos?buscar=${encodeURIComponent(this.terminoBusqueda)}`;
      this.http.get<Producto[]>(url).subscribe({
        next: (data) => { this.productos = data; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    } else {
      this.productoService.findAll(this.categoriaActiva || undefined, this.generoActivo || undefined).subscribe({
      next: (data) => { this.productos = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
    }
  }

  toggleFavorito(productoId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.favoritoIds.has(productoId)) {
      this.favoritoService.remove(productoId).subscribe(() => {
        this.favoritoIds.delete(productoId);
        this.cdr.detectChanges();
      });
    } else {
      this.favoritoService.add(productoId).subscribe(() => {
        this.favoritoIds.add(productoId);
        this.cdr.detectChanges();
      });
    }
  }

  imagenIndexPorProducto: Map<string, number> = new Map();

  getImagenActiva(p: Producto): string {
    const index = this.imagenIndexPorProducto.get(p.id) || 0;
    return p.imagenes[index] || p.imagenes[0];
  }

  cambiarImagen(p: Producto, direccion: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const actual = this.imagenIndexPorProducto.get(p.id) || 0;
    const total = p.imagenes.length;
    const nuevo = (actual + direccion + total) % total;
    this.imagenIndexPorProducto.set(p.id, nuevo);
  }
}