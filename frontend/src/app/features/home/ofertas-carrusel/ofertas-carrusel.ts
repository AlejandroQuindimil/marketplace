import { Component, OnDestroy, OnInit, OnChanges, SimpleChanges, Input, HostListener } from '@angular/core';
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
  // Lista real de ofertas que llega desde el componente padre (Home)
  @Input() productos: Producto[] = [];

  // Misma lista con un clon del ultimo al principio y del primero al final,
  // truco para que el loop infinito no se note al llegar a los extremos
  public extendedProductos: Producto[] = [];

  // Posicion actual dentro de extendedProductos (empieza en 1, no en 0, por el clon inicial)
  public trackIndex = 1;

  // Posicion "real" (0 a N-1) para saber que punto de abajo debe estar activo
  public currentIndex = 0;

  // Se desactiva un instante durante el "salto invisible" del loop,
  // para que ese salto no se vea animado
  public transitionEnabled = true;

  private isTransitioning = false;
  // Por si transitionend nunca llega a dispararse (pestaña en segundo plano, etc.)
  private transitionWatchdog: any = null;

  private autoPlayIntervalMs = 5000;
  // Tiempo de pausa tras interactuar manualmente (flechas, dots, swipe)
  private readonly RESUME_DELAY_MS = 3000;
  // Tiempo de pausa tras hacer clic en una tarjeta para abrir el producto
  private readonly RESUME_DELAY_AFTER_OPEN_MS = 1500;
  private autoPlayTimer: any = null;
  private resumeTimeout: any = null;

  // --- Estado del swipe (arrastrar con dedo/raton/trackpad) ---
  private pointerStartX = 0;
  private pointerStartY = 0;
  private isDragging = false;
  // Publico: evita que un swipe se interprete tambien como un clic al soltar
  public dragHandled = false;
  // Distancia minima en px para considerar que fue un swipe y no un tap/clic
  private readonly SWIPE_THRESHOLD_PX = 40;

  // --- Estado del "scrubber" de puntos (arrastrar sobre los dots) ---
  public isDraggingDots = false;
  private dotsTrackEl: HTMLElement | null = null;

  // Cuantas tarjetas se ven a la vez (4 en escritorio, 2 en movil)
  public itemsPerView = 4;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Ajusta itemsPerView al tamano de pantalla actual antes de construir el track
    this.onResize();
    this.buildExtended();
    if (this.extendedProductos.length > 0) {
      this.startAutoPlay();
    }
  }

  ngOnChanges(): void {
    // Si la lista de productos cambia desde fuera (ej: Home recarga datos),
    // reconstruimos el track y reiniciamos el autoplay desde cero
    this.buildExtended();
    this.stopAutoPlay();
    if (this.extendedProductos.length > 0) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    // Limpia todos los timers para no dejar procesos corriendo en segundo plano
    this.stopAutoPlay();
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    if (this.transitionWatchdog) clearTimeout(this.transitionWatchdog);
  }

  // Anade el clon del ultimo producto al principio y del primero al final,
  // para que el carrusel pueda "dar la vuelta" sin cortes visibles
  private buildExtended(): void {
    if (this.productos.length === 0) {
      this.extendedProductos = [];
      return;
    }
    const first = this.productos[0];
    const last = this.productos[this.productos.length - 1];
    this.extendedProductos = [last, ...this.productos, first];
  }

  // Calcula el % de descuento a partir de precio y precioAnterior, para el badge rojo
  descuento(p: Producto): number {
    if (!p.precioAnterior) return 0;
    return Math.round(((p.precioAnterior - p.precio) / p.precioAnterior) * 100);
  }

  // Navega a la ficha del producto (salvo que se acabe de hacer un swipe)
  abrirProducto(id: string): void {
    if (this.dragHandled) return;
    this.router.navigate(['/productos', id]);
    this.pauseAutoPlayTemporarily(this.RESUME_DELAY_AFTER_OPEN_MS);
  }

  // --- Navegacion manual (flechas) ---

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

  // Logica compartida de avance: mueve trackIndex, sincroniza currentIndex
  // y arma el watchdog de seguridad. La usan next()/prev() y el propio autoplay.
  private advanceSlide(direction: 1 | -1): void {
    this.isTransitioning = true;
    this.transitionEnabled = true;
    this.trackIndex += direction;
    this.syncCurrentIndex();
    this.armTransitionWatchdog();
  }

  // Salvaguarda: si transitionend no se dispara, liberamos el lock
  // pasado un tiempo prudente para no dejar el carrusel congelado
  private armTransitionWatchdog(): void {
    if (this.transitionWatchdog) clearTimeout(this.transitionWatchdog);
    this.transitionWatchdog = setTimeout(() => {
      this.transitionWatchdog = null;
      if (this.isTransitioning) this.onTrackTransitionEnd();
    }, 800);
  }

  // Salta directamente a un slide concreto (usado al hacer clic en un punto)
  goTo(index: number): void {
    if (this.dragHandled) return;
    this.isTransitioning = false;
    if (this.transitionWatchdog) {
      clearTimeout(this.transitionWatchdog);
      this.transitionWatchdog = null;
    }
    this.transitionEnabled = true;
    this.trackIndex = index + 1; // +1 por el clon inicial
    this.currentIndex = index;
    this.pauseAutoPlayTemporarily();
  }

  // Traduce trackIndex (que incluye los clones) al indice "real" que usan los puntos
  private syncCurrentIndex(): void {
    const total = this.productos.length;
    if (total === 0) return;
    if (this.trackIndex === 0) {
      this.currentIndex = total - 1;
    } else if (this.trackIndex === total + 1) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = this.trackIndex - 1;
    }
  }

  // Al terminar la animacion, si estamos sobre un clon, saltamos sin
  // transicion al elemento real equivalente: esto es lo que hace el loop infinito
  onTrackTransitionEnd(): void {
    if (this.transitionWatchdog) {
      clearTimeout(this.transitionWatchdog);
      this.transitionWatchdog = null;
    }
    const total = this.productos.length;
    if (total === 0) {
      this.isTransitioning = false;
      return;
    }

    if (this.trackIndex === 0) {
      this.transitionEnabled = false;
      this.trackIndex = total;
      setTimeout(() => { this.transitionEnabled = true; }, 20);
    } else if (this.trackIndex === total + 1) {
      this.transitionEnabled = false;
      this.trackIndex = 1;
      setTimeout(() => { this.transitionEnabled = true; }, 20);
    }

    this.isTransitioning = false;
  }

  // Calcula cuanto desplazar el carrusel en % segun trackIndex e itemsPerView
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

  // Para el autoplay un momento tras una interaccion manual y lo reanuda despues
  private pauseAutoPlayTemporarily(delayMs: number = this.RESUME_DELAY_MS): void {
    this.stopAutoPlay();
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
    this.resumeTimeout = setTimeout(() => {
      this.resumeTimeout = null;
      this.startAutoPlay();
    }, delayMs);
  }

  // Pausa el autoplay mientras el raton esta encima del carrusel
  onMouseEnter(): void {
    this.stopAutoPlay();
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
  }

  // Reanuda el autoplay al sacar el raton (si no hay ya un resume pendiente)
  onMouseLeave(): void {
    if (!this.resumeTimeout) this.startAutoPlay();
  }

  // --- Swipe: arrastrar con dedo/raton/trackpad sobre las tarjetas ---

  // Guarda donde empezo el gesto y "captura" el puntero para seguir
  // recibiendo sus eventos aunque el dedo/raton salga del elemento
  onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.dragHandled = false;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.stopAutoPlay();
    const target = event.currentTarget as HTMLElement;
    try { target.setPointerCapture(event.pointerId); } catch {}
  }

  // Si el movimiento horizontal supera el umbral, avanza/retrocede el
  // slide y marca dragHandled=true (para no confundirlo con un clic)
  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging || this.dragHandled) return;
    const deltaX = event.clientX - this.pointerStartX;
    const deltaY = event.clientY - this.pointerStartY;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return; // gesto vertical: no interceptar

    if (Math.abs(deltaX) >= this.SWIPE_THRESHOLD_PX) {
      this.dragHandled = true;
      deltaX < 0 ? this.next() : this.prev();
    }
  }

  // Libera la captura del puntero. Si no hubo swipe, busca con
  // elementFromPoint que tarjeta hay bajo el dedo/raton y navega a su
  // producto (necesario porque la captura del puntero rompe el click nativo)
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

  // --- Scrubber de puntos: arrastrar el dedo sobre la fila de puntos
  // funciona como un mini-slider, cambiando de producto en vivo ---

  onDotsPointerDown(event: PointerEvent): void {
    this.isDraggingDots = true;
    this.dragHandled = false;
    this.dotsTrackEl = event.currentTarget as HTMLElement;
    this.stopAutoPlay();
    try { this.dotsTrackEl.setPointerCapture(event.pointerId); } catch {}
    this.updateDotFromPointer(event);
  }

  onDotsPointerMove(event: PointerEvent): void {
    if (!this.isDraggingDots) return;
    this.dragHandled = true;
    this.updateDotFromPointer(event);
  }

  onDotsPointerUp(event: PointerEvent): void {
    this.isDraggingDots = false;
    if (this.dotsTrackEl) {
      try { this.dotsTrackEl.releasePointerCapture(event.pointerId); } catch {}
    }
    this.dotsTrackEl = null;
    if (this.dragHandled) {
      setTimeout(() => { this.dragHandled = false; }, 50);
    }
    this.pauseAutoPlayTemporarily();
  }

  // Calcula, segun la posicion X del puntero sobre la fila de puntos,
  // a que producto corresponde y salta ahi directamente
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
      this.trackIndex = index + 1;
      this.currentIndex = index;
    }
  }

  // Recalcula cuantas tarjetas caben por vista si cambia el tamano de ventana
  @HostListener('window:resize')
  onResize(): void {
    this.itemsPerView = window.innerWidth <= 768 ? 2 : 4;
  }
}