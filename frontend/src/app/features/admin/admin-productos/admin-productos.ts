import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductoService, Producto } from '../../../core/producto';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-productos.html',
  styleUrl: './admin-productos.css'
})
export class AdminProductos implements OnInit {
  productos: Producto[] = [];
  loading = true;
  filtroTexto = '';

  constructor(
    private productoService: ProductoService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  private cargarProductos(): void {
    this.loading = true;
    // el listado de admin trae siempre el catalogo completo, sin
    // filtros de genero/categoria: aqui se gestiona todo de golpe
    this.productoService.findAll().subscribe({
      next: (data) => {
        this.productos = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get productosFiltrados(): Producto[] {
    if (!this.filtroTexto) return this.productos;
    const texto = this.filtroTexto.toLowerCase();
    return this.productos.filter(p =>
      p.nombre.toLowerCase().includes(texto) || p.marca.toLowerCase().includes(texto)
    );
  }

  stockTotal(p: Producto): number {
    return p.tallas.reduce((sum, t) => sum + t.stock, 0);
  }

  editar(id: string): void {
    this.router.navigate(['/admin/productos', id, 'editar']);
  }

  eliminar(id: string, nombre: string): void {
    if (!confirm(`¿Seguro que quieres eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

    this.http.delete(`${environment.apiUrl}/productos/${id}`).subscribe({
      next: () => {
        this.productos = this.productos.filter(p => p.id !== id);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('No se pudo eliminar el producto.');
      }
    });
  }
}