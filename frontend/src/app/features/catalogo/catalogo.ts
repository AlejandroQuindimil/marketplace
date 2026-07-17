import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService, Producto } from '../../core/producto';

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  filtrarPor(categoria: string): void {
    this.categoriaActiva = categoria;
    this.cargarProductos();
  }

  private cargarProductos(): void {
    this.loading = true;
    this.productoService.findAll(this.categoriaActiva || undefined).subscribe({
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
}