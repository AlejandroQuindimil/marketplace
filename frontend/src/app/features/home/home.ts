import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router} from '@angular/router';
import { ProductoService, Producto } from '../../core/producto';
import { AuthService } from '../../core/auth';
import { FavoritoService } from '../../core/favorito';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})

export class Home implements OnInit {
  destacados: Producto[] = [];
  loading = true;
  usuario: { nombre: string } | null = null;

  favoritoIds: Set<string> = new Set();

  constructor(
    private productoService: ProductoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private favoritoService: FavoritoService,
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();

    if (this.authService.isLoggedIn()) {
      this.favoritoService.getFavoritos().subscribe({
        next: (favs) => {
          this.favoritoIds = new Set(favs.map(f => f.id));
          this.cdr.detectChanges();
        }
      });
    }

    this.productoService.findDestacados().subscribe({
      next: (data) => {
        this.destacados = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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

  logout(): void {
    this.authService.logout();
    this.usuario = null;
  }


}