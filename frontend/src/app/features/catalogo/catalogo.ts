import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductoService, Producto } from '../../core/producto';
import { environment } from '../../environments/environment';

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.terminoBusqueda = params['buscar'] || '';
      this.categoriaActiva = params['categoria'] || '';
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
      this.productoService.findAll(this.categoriaActiva || undefined).subscribe({
        next: (data) => { this.productos = data; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    }
  }
}