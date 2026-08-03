import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto } from '../../../core/producto';

@Component({
  selector: 'app-tendencia-carrusel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tendencia-carrusel.html',
  styleUrl: './tendencia-carrusel.css'
})
export class TendenciaCarrusel implements AfterViewInit, OnChanges, OnDestroy {
  @Input() titulo = '';
  @Input() productos: Producto[] = [];
  @Input() favoritoIds: Set<string> = new Set();
  /** Query params que se aplicarán al pulsar "Ver más productos", p.ej. { genero: 'HOMBRE' } o { categoria: 'ACCESORIOS' } */
  @Input() verMasQueryParams: { categoria?: string; genero?: string } = {};
  /** Color de acento de la franja junto al título: 'hombre' | 'mujer' | 'accesorios' */
  @Input() acento: 'hombre' | 'mujer' | 'accesorios' = 'hombre';

  @Output() toggleFavorito = new EventEmitter<{ productoId: string; event: Event }>();

  @ViewChild('track') track?: ElementRef<HTMLDivElement>;

  puedeIzquierda = false;
  puedeDerecha = false;

  private listenerAsociado = false;
  private readonly onScroll = () => this.actualizarFlechas();

  ngAfterViewInit(): void {
    this.asociarListener();
    // Esperamos un tick a que Angular termine de pintar antes de medir,
    // para no tocar los bindings dentro del mismo ciclo que los comprobó
    // (evita el NG0100 ExpressionChangedAfterItHasBeenCheckedError).
    setTimeout(() => this.actualizarFlechas());
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Los productos llegan de forma asíncrona (HTTP) despues del AfterViewInit
    // inicial, así que recalculamos cada vez que cambia la lista.
    if (changes['productos']) {
      setTimeout(() => {
        this.asociarListener();
        this.actualizarFlechas();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.track && this.listenerAsociado) {
      this.track.nativeElement.removeEventListener('scroll', this.onScroll);
    }
  }

  private asociarListener(): void {
    if (this.track && !this.listenerAsociado) {
      this.track.nativeElement.addEventListener('scroll', this.onScroll, { passive: true });
      this.listenerAsociado = true;
    }
  }

  scroll(direccion: 'izquierda' | 'derecha'): void {
    if (!this.track) { return; }
    const el = this.track.nativeElement;
    const primeraTarjeta = el.querySelector<HTMLElement>('.card');
    const gap = 20; // debe coincidir con el "gap" de .carrusel-track en el CSS
    const distancia = primeraTarjeta ? primeraTarjeta.offsetWidth + gap : el.clientWidth;

    el.scrollBy({
      left: direccion === 'izquierda' ? -distancia : distancia,
      behavior: 'smooth'
    });
  }

  onToggleFavorito(productoId: string, event: Event): void {
    this.toggleFavorito.emit({ productoId, event });
  }

  /** Actualiza si se puede seguir haciendo scroll a cada lado, para atenuar/bloquear las flechas en los extremos. */
  private actualizarFlechas(): void {
    if (!this.track) { return; }
    const el = this.track.nativeElement;
    const margen = 2; // tolerancia por redondeos de subpíxel
    this.puedeIzquierda = el.scrollLeft > margen;
    this.puedeDerecha = el.scrollLeft < el.scrollWidth - el.clientWidth - margen;
  }
}