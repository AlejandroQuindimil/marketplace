import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit, OnDestroy {
  anioActual = new Date().getFullYear();

  // en móvil, el footer solo se muestra en home ("/") y en perfil ("/perfil"...);
  // en el resto de páginas ya lo cubre la barra inferior y sobra
  visibleEnMovil = true;

  private routeSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.actualizarVisibilidad(this.router.url);

    this.routeSub = this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe(evento => this.actualizarVisibilidad(evento.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private actualizarVisibilidad(url: string): void {
    const ruta = url.split('?')[0];
    this.visibleEnMovil = ruta === '/' || ruta.startsWith('/perfil');
  }
}