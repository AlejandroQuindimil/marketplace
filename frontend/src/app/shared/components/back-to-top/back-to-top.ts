import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.css'
})
export class BackToTop implements OnInit, OnDestroy {
  visible = false;

  // en móvil, el botón solo se muestra (en su versión "solo icono") en
  // home, favoritos, catálogo y perfil; en el resto de páginas se oculta.
  // En escritorio no aplica esta restricción, se mantiene como estaba.
  visibleEnRutaMovil = true;

  private readonly UMBRAL_PX = 400;
  // Distancia al final de la página a partir de la cual se oculta el botón,
  // para no solaparse con el contenido del footer (línea de copyright, etc.)
  private readonly MARGEN_FINAL_PX = 220;

  private readonly RUTAS_ICONO_MOVIL = ['/', '/favoritos', '/productos', '/perfil'];

  private routeSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.actualizarRuta(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe(evento => this.actualizarRuta(evento.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private actualizarRuta(url: string): void {
    const ruta = url.split('?')[0];
    this.visibleEnRutaMovil = this.RUTAS_ICONO_MOVIL.includes(ruta);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const distanciaAlFinal = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    const cercaDelFinal = distanciaAlFinal < this.MARGEN_FINAL_PX;
    this.visible = window.scrollY > this.UMBRAL_PX && !cercaDelFinal;
  }

  subir(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}