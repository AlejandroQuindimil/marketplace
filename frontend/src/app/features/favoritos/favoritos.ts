import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FavoritoService } from '../../core/favorito';
import { AuthService } from '../../core/auth';
import { Producto } from '../../core/producto';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.css'
})
export class Favoritos implements OnInit {
  productos: Producto[] = [];
  loading = true;

  constructor(
    private favoritoService: FavoritoService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.favoritoService.getFavoritos().subscribe({
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

  quitarFavorito(productoId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.favoritoService.remove(productoId).subscribe(() => {
      this.productos = this.productos.filter(p => p.id !== productoId);
      this.cdr.detectChanges();
    });
  }
}