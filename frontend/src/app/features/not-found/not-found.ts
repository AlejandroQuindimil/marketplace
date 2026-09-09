import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../../core/auth';

type ItemKind = 'tag' | 'box' | 'shipping' | 'emptycart';

interface ItemCatcher {
  x: number;
  y: number;
  velocidad: number;
  kind: ItemKind;
  puntos: number;
}

const ITEMS_BUENOS: { kind: ItemKind; puntos: number; peso: number }[] = [
  { kind: 'tag', puntos: 10, peso: 6 },
  { kind: 'box', puntos: 15, peso: 2 },
];

const ITEMS_MALOS: { kind: ItemKind; puntos: number; peso: number }[] = [
  { kind: 'shipping', puntos: -15, peso: 3 },
  { kind: 'emptycart', puntos: -20, peso: 2 },
];

const EMOJIS: Record<ItemKind, string> = {
  tag: '🏷️',
  box: '🎁',
  shipping: '❌',
  emptycart: '☠️',
};

const DURACION_JUEGO = 30; // segundos
const VIDAS_INICIALES = 3;

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animFrame: any = null;

  // Estado del juego
  jugando = false;
  gameOver = false;
  ganado = false;
  puntuacion = 0;
  vidas = VIDAS_INICIALES;
  tiempoRestante = DURACION_JUEGO;

  // puntuación necesaria para ganar el cupón
  readonly OBJETIVO_PUNTOS = 100;

  private cestaX = 0;
  private items: ItemCatcher[] = [];
  private spawnAcumulado = 0;
  private ultimoTimestamp = 0;
  private inicioTiempo = 0;

  private readonly ANCHO = 600;
  private readonly ALTO = 200;
  private readonly SUELO = 190;
  private readonly CESTA_ANCHO = 46;

  cuponGanado = '';
  generandoCupon = false;
  errorCupon = false;
  cuponYaUtilizado = false;
  cuponCopiado = false;
  private timeoutCopiado: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.cestaX = this.ANCHO / 2;
    this.dibujarPantallaInicio();
  }

  ngOnDestroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.timeoutCopiado) clearTimeout(this.timeoutCopiado);
  }

  @HostListener('document:keydown.space', ['$event'])
  onEspacio(event: Event): void {
    event.preventDefault();
    if (!this.jugando) this.iniciarJuego();
  }

  // --- ciclo de vida de la partida ---

  iniciarJuego(): void {
    this.jugando = true;
    this.gameOver = false;
    this.ganado = false;
    this.puntuacion = 0;
    this.vidas = VIDAS_INICIALES;
    this.tiempoRestante = DURACION_JUEGO;
    this.cuponGanado = '';
    this.cuponCopiado = false;
    this.items = [];
    this.cestaX = this.ANCHO / 2;
    this.spawnAcumulado = 0;
    this.inicioTiempo = performance.now();
    this.ultimoTimestamp = this.inicioTiempo;

    this.canvasRef.nativeElement.focus();
    this.animFrame = requestAnimationFrame((t) => this.loop(t));
  }

  onTap(): void {
    if (!this.jugando) {
      this.iniciarJuego();
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.jugando) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const escala = this.ANCHO / rect.width;
    const x = (event.clientX - rect.left) * escala;
    this.cestaX = Math.min(
      this.ANCHO - this.CESTA_ANCHO / 2,
      Math.max(this.CESTA_ANCHO / 2, x),
    );
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.jugando) return;
    if (event.key === 'ArrowLeft') {
      this.cestaX = Math.max(this.CESTA_ANCHO / 2, this.cestaX - 24);
    } else if (event.key === 'ArrowRight') {
      this.cestaX = Math.min(this.ANCHO - this.CESTA_ANCHO / 2, this.cestaX + 24);
    }
  }

  // --- bucle de simulación ---

  private loop(timestamp: number): void {
    if (!this.jugando) return;

    const delta = timestamp - this.ultimoTimestamp;
    this.ultimoTimestamp = timestamp;

    this.actualizar(delta, timestamp);
    this.dibujar();

    if (this.puntuacion >= this.OBJETIVO_PUNTOS) {
      this.terminarJuego(true);
      return;
    }
    if (this.vidas <= 0 || this.tiempoRestante <= 0) {
      this.terminarJuego(false);
      return;
    }

    this.animFrame = requestAnimationFrame((t) => this.loop(t));
  }

  private actualizar(delta: number, timestamp: number): void {
    // cuenta atrás
    this.tiempoRestante = Math.max(
      0,
      DURACION_JUEGO - (timestamp - this.inicioTiempo) / 1000,
    );

    // mover ítems y comprobar colisiones con la cesta
    const supervivientes: ItemCatcher[] = [];
    for (const item of this.items) {
      const nuevaY = item.y + item.velocidad * (delta / 16.67);

      const dentroDeCesta =
        nuevaY >= this.SUELO - 18 &&
        Math.abs(item.x - this.cestaX) < this.CESTA_ANCHO / 2 + 8;

      if (dentroDeCesta) {
        this.resolverCaptura(item);
        continue;
      }
      if (nuevaY >= this.ALTO + 20) {
        continue; // se pierde fuera de pantalla
      }
      supervivientes.push({ ...item, y: nuevaY });
    }
    this.items = supervivientes;

    // generar nuevos ítems poco a poco
    this.spawnAcumulado += delta;
    const spawnCada = 650; // ms aprox entre ítems
    if (this.spawnAcumulado >= spawnCada) {
      this.spawnAcumulado = 0;
      this.items.push(this.crearItem());
    }
  }

  private resolverCaptura(item: ItemCatcher): void {
    this.puntuacion = Math.max(0, this.puntuacion + item.puntos);
    if (item.puntos < 0) {
      this.vidas -= 1;
    }
  }

  private crearItem(): ItemCatcher {
    const bolsa = Math.random() < 0.7 ? ITEMS_BUENOS : ITEMS_MALOS;
    const total = bolsa.reduce((s, i) => s + i.peso, 0);
    let tirada = Math.random() * total;
    const elegido = bolsa.find((i) => (tirada -= i.peso) <= 0) ?? bolsa[0];

    return {
      x: 40 + Math.random() * (this.ANCHO - 80),
      y: -20,
      velocidad: 1.6 + Math.random() * 1.8,
      kind: elegido.kind,
      puntos: elegido.puntos,
    };
  }

  // --- dibujo ---

  private dibujar(): void {
    this.ctx.clearRect(0, 0, this.ANCHO, this.ALTO);

    // suelo
    this.ctx.strokeStyle = '#ddd';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.SUELO);
    this.ctx.lineTo(this.ANCHO, this.SUELO);
    this.ctx.stroke();

    // ítems cayendo
    this.ctx.font = '24px sans-serif';
    this.ctx.textAlign = 'center';
    for (const item of this.items) {
      this.ctx.fillText(EMOJIS[item.kind], item.x, item.y);
    }

    // cesta
    this.ctx.font = '32px sans-serif';
    this.ctx.fillText('🛍️', this.cestaX, this.SUELO + 4);

    // marcador
    this.ctx.fillStyle = '#666';
    this.ctx.font = '13px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.puntuacion} / ${this.OBJETIVO_PUNTOS}`, 10, 20);
    this.ctx.fillText('❤️'.repeat(Math.max(this.vidas, 0)) || '—', 10, 40);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${Math.ceil(this.tiempoRestante)}s`, this.ANCHO - 10, 20);
    this.ctx.textAlign = 'left';
  }

  private dibujarPantallaInicio(): void {
    this.ctx.clearRect(0, 0, this.ANCHO, this.ALTO);
    this.ctx.fillStyle = '#999';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Desliza el dedo · toca para jugar',
      this.ANCHO / 2,
      this.ALTO / 2,
    );
    this.ctx.textAlign = 'left';
  }

  // --- fin de partida y cupón ---

  private terminarJuego(gano: boolean): void {
    this.jugando = false;
    this.gameOver = !gano;
    this.ganado = gano;

    if (this.animFrame) cancelAnimationFrame(this.animFrame);

    if (gano) {
      this.generarCupon();
    } else {
      this.cdr.detectChanges();
    }
  }

  private generarCupon(): void {
    if (!this.authService.isLoggedIn()) {
      // sin sesión no podemos guardar el cupón contra un usuario, así
      // que avisamos en vez de perder la victoria silenciosamente
      this.cdr.detectChanges();
      return;
    }

    this.generandoCupon = true;
    this.errorCupon = false;
    this.http
      .post<{ codigo: string; utilizado: boolean }>(
        `${environment.apiUrl}/cupon/generarCupon`,
        {},
      )
      .subscribe({
        next: (res) => {
          this.cuponGanado = res.codigo;
          this.cuponYaUtilizado = res.utilizado;
          this.generandoCupon = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error generando cupón', err);
          this.generandoCupon = false;
          this.errorCupon = true;
          this.cdr.detectChanges();
        },
      });
  }

  authServiceLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  reintentar(): void {
    this.dibujarPantallaInicio();
    this.gameOver = false;
    this.ganado = false;
  }

  copiarCupon(): void {
    if (!this.cuponGanado) return;

    navigator.clipboard
      .writeText(this.cuponGanado)
      .then(() => {
        this.cuponCopiado = true;
        this.cdr.detectChanges();

        if (this.timeoutCopiado) clearTimeout(this.timeoutCopiado);
        this.timeoutCopiado = setTimeout(() => {
          this.cuponCopiado = false;
          this.cdr.detectChanges();
        }, 2000);
      })
      .catch((err) => {
        console.error('No se pudo copiar el cupón', err);
      });
  }
}