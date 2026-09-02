import { Component, OnDestroy, OnInit, OnChanges, Input, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Producto } from '../../../core/producto';

@Component({
  selector: 'app-ofertas-carrusel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ofertas-carrusel.html',
  styleUrl: './ofertas-carrusel.css'
})
export class OfertasCarrusel implements OnInit, OnChanges, OnDestroy {
  @Input() productos: Producto[] = [];

  // Track extendido con `itemsPerView` clones al principio y al final.
  // OJO: antes solo se clonaba 1 item a cada lado, lo cual solo alcanza
  // si el carrusel muestra 1 producto a la vez. Como aqui se muestran
  // hasta 4 (itemsPerView), cerca del final del recorrido la ventana
  // visible se salia del array (no habia suficientes clones para llenar
  // los 4 huecos) -> aparecia un hueco en blanco y luego el salto brusco
  // al hacer el teletransporte de vuelta al principio real.
  public extendedProductos: Producto[] = [];

  public trackIndex = 1;
  public currentIndex = 0;
  public transitionEnabled = true;

  private isTransitioning = false;
  private transitionWatchdog: any = null;

  private autoPlayIntervalMs = 2000;
  private readonly RESUME_DELAY_MS = 3000;
  private readonly RESUME_DELAY_AFTER_OPEN_MS = 1500;
  private autoPlayTimer: any = null;
  private resumeTimeout: any = null;
  private jumpTimeout: any = null;

  private pointerStartX = 0;
  private pointerStartY = 0;
  private isDragging = false;
  public dragHandled = false;
  private readonly SWIPE_THRESHOLD_PX = 40;

  public isDraggingDots = false;
  private dotsTrackEl: HTMLElement | null = null;
  // Flag propio del scrubber de puntos, independiente de dragHandled,
  // para que un drag en los puntos no bloquee un click en una tarjeta
  // (y viceversa) al compartir la misma variable.
  private dotsDragHandled = false;
  private readonly DOTS_DRAG_THRESHOLD_PX = 4;
  private dotsPointerStartX = 0;

  public itemsPerView = 4;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.itemsPerView = this.calcularItemsPerView();
    this.buildExtended();
    this.trackIndex = this.itemsPerView;
    if (this.extendedProductos.length > 0) {
      this.startAutoPlay();
    }
  }

  ngOnChanges(): void {
    this.buildExtended();
    this.trackIndex = this.itemsPerView;
    this.currentIndex = 0;
    this.stopAutoPlay();
    if (this.extendedProductos.length > 0) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    if (this.jumpTimeout) clearTimeout(this.jumpTimeout);
    if (this.transitionWatchdog) clearTimeout(this.transitionWatchdog);
  }

  // Construye el array extendido con `itemsPerView` clones a cada lado.
  // Usamos modulo para que funcione incluso si hay menos productos que
  // clones necesarios (ej. 2 productos con itemsPerView=4).
  private buildExtended(): void {
    const total = this.productos.length;
    if (total === 0) {
      this.extendedProductos = [];
      return;
    }

    const clones = this.itemsPerView;
    const mod = (n: number, m: number) => ((n % m) + m) % m;

    const head: Producto[] = [];
    const tail: Producto[] = [];
    for (let i = 0; i < clones; i++) {
      head.push(this.productos[mod(total - clones + i, total)]);
      tail.push(this.productos[mod(i, total)]);
    }

    this.extendedProductos = [...head, ...this.productos, ...tail];
  }

  descuento(p: Producto): number {
    if (!p.precioAnterior) return 0;
    return Math.round(((p.precioAnterior - p.precio) / p.precioAnterior) * 100);
  }

  abrirProducto(id: string): void {
    if (this.dragHandled) return;
    this.router.navigate(['/productos', id]);
    this.pauseAutoPlayTemporarily(this.RESUME_DELAY_AFTER_OPEN_MS);
  }

  next(force: boolean = true): void {
    if (this.isTransitioning && !force) return;
    this.advanceSlide(1);
    this.pauseAutoPlayTemporarily();
  }

  prev(force: boolean = true): void {
    if (this.isTransitioning && !force) return;
    this.advanceSlide(-1);
    this.pauseAutoPlayTemporarily();
  }

  // Cambia el estado del carrusel. Se llama tanto desde interacciones de
  // usuario (clic, swipe) como desde el setInterval del autoplay. En el
  // segundo caso, Angular/Zone.js puede no repintar la vista de inmediato
  // aunque las propiedades ya hayan cambiado, dejando el carrusel "quieto"
  // hasta que otra interaccion fuerce un ciclo de deteccion de cambios.
  // detectChanges() fuerza ese repintado ahora mismo, sin esperar a nada mas.
  private advanceSlide(direction: 1 | -1): void {
    this.isTransitioning = true;
    this.transitionEnabled = true;
    this.trackIndex += direction;
    this.syncCurrentIndex();
    this.armTransitionWatchdog();
    this.cdr.detectChanges();
  }

  private armTransitionWatchdog(): void {
    if (this.transitionWatchdog) clearTimeout(this.transitionWatchdog);
    this.transitionWatchdog = setTimeout(() => {
      this.transitionWatchdog = null;
      if (this.isTransitioning) this.onTrackTransitionEnd();
    }, 800);
  }

  goTo(index: number): void {
    if (this.dotsDragHandled) return;
    this.isTransitioning = false;
    if (this.transitionWatchdog) {
      clearTimeout(this.transitionWatchdog);
      this.transitionWatchdog = null;
    }
    this.transitionEnabled = true;
    this.trackIndex = index + this.itemsPerView;
    this.currentIndex = index;
    this.pauseAutoPlayTemporarily();
  }

  // Los "puntos de anclaje" del loop ya no son fijos (0 y total+1), sino
  // que dependen de cuantos clones (itemsPerView) haya a cada lado.
  private syncCurrentIndex(): void {
    const total = this.productos.length;
    if (total === 0) return;

    const clones = this.itemsPerView;
    const cloneLeftIndex = clones - 1;       // clon justo antes del primer item real
    const cloneRightIndex = clones + total;  // clon justo despues del ultimo item real

    if (this.trackIndex < cloneLeftIndex) {
      this.trackIndex = clones + total - 1;
    } else if (this.trackIndex > cloneRightIndex) {
      this.trackIndex = clones;
    }

    if (this.trackIndex === cloneLeftIndex) {
      this.currentIndex = total - 1;
    } else if (this.trackIndex === cloneRightIndex) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = this.trackIndex - clones;
    }
  }

  onTrackTransitionEnd(): void {
    this.isTransitioning = false;
    if (this.transitionWatchdog) {
      clearTimeout(this.transitionWatchdog);
      this.transitionWatchdog = null;
    }

    const total = this.productos.length;
    if (total === 0) return;

    const clones = this.itemsPerView;
    const cloneLeftIndex = clones - 1;
    const cloneRightIndex = clones + total;

    if (this.trackIndex === cloneLeftIndex) {
      this.jumpTo(clones + total - 1);
    } else if (this.trackIndex === cloneRightIndex) {
      this.jumpTo(clones);
    }
  }

  private jumpTo(extendedIndex: number): void {
    this.transitionEnabled = false;
    this.trackIndex = extendedIndex;
    this.syncCurrentIndex();
    this.cdr.detectChanges();
    if (this.jumpTimeout) clearTimeout(this.jumpTimeout);
    this.jumpTimeout = setTimeout(() => {
      this.transitionEnabled = true;
      this.cdr.detectChanges();
    }, 20);
  }

  get trackTransform(): string {
    const paso = 100 / this.itemsPerView;
    return `translateX(-${this.trackIndex * paso}%)`;
  }

  // --- Autoplay ---

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      if (!this.isTransitioning) this.advanceSlide(1);
    }, this.autoPlayIntervalMs);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private pauseAutoPlayTemporarily(delayMs: number = this.RESUME_DELAY_MS): void {
    this.stopAutoPlay();
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    this.resumeTimeout = setTimeout(() => {
      this.resumeTimeout = null;
      this.startAutoPlay();
    }, delayMs);
  }

  onMouseEnter(): void {
    this.stopAutoPlay();
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
  }

  onMouseLeave(): void {
    if (!this.resumeTimeout) this.startAutoPlay();
  }

  // Al ocultar la pestaña, los timers se throttlean; al volver, retomamos
  // limpio y forzamos un repintado por si el estado quedo desincronizado
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.stopAutoPlay();
      if (this.resumeTimeout) {
        clearTimeout(this.resumeTimeout);
        this.resumeTimeout = null;
      }
    } else if (this.extendedProductos.length > 0) {
      this.isTransitioning = false;
      this.startAutoPlay();
      this.cdr.detectChanges();
    }
  }

  onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.dragHandled = false;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.stopAutoPlay();
    const target = event.currentTarget as HTMLElement;
    try { target.setPointerCapture(event.pointerId); } catch {}
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging || this.dragHandled) return;
    const deltaX = event.clientX - this.pointerStartX;
    const deltaY = event.clientY - this.pointerStartY;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    if (Math.abs(deltaX) >= this.SWIPE_THRESHOLD_PX) {
      this.dragHandled = true;
      deltaX < 0 ? this.next() : this.prev();
    }
  }

  onPointerUp(event: PointerEvent): void {
    this.isDragging = false;
    const target = event.currentTarget as HTMLElement;
    try { target.releasePointerCapture(event.pointerId); } catch {}

    if (this.dragHandled) {
      setTimeout(() => { this.dragHandled = false; }, 50);
    } else {
      const elementoReal = document.elementFromPoint(event.clientX, event.clientY);
      const card = elementoReal?.closest('.oferta-card') as HTMLElement | null;
      if (card) {
        const id = card.getAttribute('data-id');
        if (id) this.abrirProducto(id);
      }
    }
    this.pauseAutoPlayTemporarily();
  }

  onDotsPointerDown(event: PointerEvent): void {
    this.isDraggingDots = true;
    this.dotsDragHandled = false;
    this.dotsPointerStartX = event.clientX;
    this.dotsTrackEl = event.currentTarget as HTMLElement;
    this.stopAutoPlay();
    try { this.dotsTrackEl.setPointerCapture(event.pointerId); } catch {}
    // No llamamos a updateDotFromPointer aqui: si es solo un tap sobre un
    // punto concreto, dejamos que lo resuelva el (click) del propio boton.
  }

  onDotsPointerMove(event: PointerEvent): void {
    if (!this.isDraggingDots) return;
    if (!this.dotsDragHandled && Math.abs(event.clientX - this.dotsPointerStartX) < this.DOTS_DRAG_THRESHOLD_PX) {
      return;
    }
    this.dotsDragHandled = true;
    this.updateDotFromPointer(event);
  }

  onDotsPointerUp(event: PointerEvent): void {
    this.isDraggingDots = false;
    if (this.dotsTrackEl) {
      try { this.dotsTrackEl.releasePointerCapture(event.pointerId); } catch {}
    }
    this.dotsTrackEl = null;
    if (this.dotsDragHandled) {
      setTimeout(() => { this.dotsDragHandled = false; }, 50);
    }
    this.pauseAutoPlayTemporarily();
  }

  private updateDotFromPointer(event: PointerEvent): void {
    if (!this.dotsTrackEl || this.productos.length === 0) return;
    const rect = this.dotsTrackEl.getBoundingClientRect();
    if (rect.width === 0) return;

    const relativeX = event.clientX - rect.left;
    const ratio = Math.min(Math.max(relativeX, 0), rect.width) / rect.width;
    const total = this.productos.length;
    let index = Math.floor(ratio * total);
    index = Math.min(Math.max(index, 0), total - 1);

    if (index !== this.currentIndex) {
      this.isTransitioning = false;
      if (this.transitionWatchdog) {
        clearTimeout(this.transitionWatchdog);
        this.transitionWatchdog = null;
      }
      this.transitionEnabled = true;
      this.trackIndex = index + this.itemsPerView;
      this.currentIndex = index;
      this.cdr.detectChanges();
    }
  }

  private calcularItemsPerView(): number {
    const ancho = window.innerWidth;
    if (ancho <= 480) return 2;
    if (ancho <= 900) return 3;
    return 4;
  }

  // Al cambiar itemsPerView tambien cambia cuantos clones hacen falta,
  // asi que hay que reconstruir extendedProductos y reposicionar el
  // track (conservando el producto actual como primer visible).
  @HostListener('window:resize')
  onResize(): void {
    const nuevo = this.calcularItemsPerView();
    if (nuevo === this.itemsPerView) return;

    this.itemsPerView = nuevo;
    this.transitionEnabled = false;
    this.buildExtended();
    this.trackIndex = this.itemsPerView + this.currentIndex;
    this.cdr.detectChanges();

    if (this.jumpTimeout) clearTimeout(this.jumpTimeout);
    this.jumpTimeout = setTimeout(() => {
      this.transitionEnabled = true;
      this.cdr.detectChanges();
    }, 20);
  }
}