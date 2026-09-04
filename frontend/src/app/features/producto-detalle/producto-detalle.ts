import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductoService, Producto } from '../../core/producto';
import { FavoritoService } from '../../core/favorito';
import { AuthService } from '../../core/auth';
import { CarritoService } from '../../core/carrito';
import { ToastService } from '../../core/toast';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css'
})
export class ProductoDetalle implements OnInit, OnDestroy {
  producto: Producto | null = null;
  similares: Producto[] = [];
  loading = true;
  tallaSeleccionada = '';
  colorSeleccionado = '';
  imagenActiva = '';
  imagenIndexActivo = 0;
  esFavorito = false;

  @ViewChild('similaresCarrusel') similaresCarrusel?: ElementRef<HTMLDivElement>;
  similaresInicio = true;
  similaresFin = false;

  private routeSub?: Subscription;

  // Info estática de referencia (no viene del backend)
  acordeones: { 
    titulo: string;
    abierto: boolean;
    contenido: { label: string; valor: string }[] 
    }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private favoritoService: FavoritoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private carritoService: CarritoService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    // Nos suscribimos a paramMap (en vez de leer snapshot una sola vez) para que
    // el componente reaccione también cuando Angular reutiliza la misma instancia
    // al navegar de un producto a otro (p.ej. desde "Productos similares").
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.cargarProducto(id);
    });
    
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private cargarProducto(id: string): void {
    this.loading = true;
    this.producto = null;
    this.similares = [];
    this.tallaSeleccionada = '';
    this.colorSeleccionado = '';
    this.imagenActiva = '';
    this.imagenIndexActivo = 0;
    this.esFavorito = false;
    this.cdr.detectChanges();

    this.productoService.findById(id).subscribe({
      next: (data) => {
        this.producto = data;
        this.construirAcordeones();
        this.colorSeleccionado = data.colores[0] || '';
        this.imagenActiva = data.imagenes[0] || '';
        this.imagenIndexActivo = 0;
        this.loading = false;
        this.cdr.detectChanges();
        this.cargarSimilares(data.categoria, data.genero, data.id);
        this.comprobarFavorito(data.id);
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

 // construye los acordeones a partir de producto.detalles, incluyendo
// solo las filas que tengan un valor real relleno — si un campo esta
// vacio, esa fila no aparece en vez de mostrar un guion o "N/D"
private construirAcordeones(): void {
  if (!this.producto) return;

  const d = this.producto.detalles;
  if (!d) {
    this.acordeones = [];
    return;
  }

  const soloConValor = (
    item: { label: string; valor: string | undefined }
  ): item is { label: string; valor: string } => !!item.valor;

  const composicion = [
    { label: 'Material exterior', valor: d.materialExterior },
    { label: 'Material interior', valor: d.materialInterior },
    { label: 'Cuidados', valor: d.cuidados }
  ].filter(soloConValor);

  const caracteristicas = [
    { label: 'Cierre', valor: d.cierre },
    { label: 'Estampado', valor: d.estampado }
  ].filter(soloConValor);

  const tallaCorte = [
    { label: 'Corte', valor: d.corte },
    { label: 'Guía de tallas', valor: d.guiaTallas }
  ].filter(soloConValor);

  this.acordeones = [
    { titulo: 'Composición y cuidados', abierto: false, contenido: composicion },
    { titulo: 'Características del producto', abierto: false, contenido: caracteristicas },
    { titulo: 'Talla y corte', abierto: false, contenido: tallaCorte }
  ].filter(acordeon => acordeon.contenido.length > 0);
}

  private comprobarFavorito(productoId: string): void {
    if (!this.authService.isLoggedIn()) return;

    this.favoritoService.getFavoritos().subscribe({
      next: (favs) => {
        this.esFavorito = favs.some(f => f.id === productoId);
        this.cdr.detectChanges();
      }
    });
  }

  toggleFavorito(): void {
    if (!this.producto) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.esFavorito) {
      this.favoritoService.remove(this.producto.id).subscribe(() => {
        this.esFavorito = false;
        this.cdr.detectChanges();
      });
    } else {
      this.favoritoService.add(this.producto.id).subscribe(() => {
        this.esFavorito = true;
        this.cdr.detectChanges();
      });
    }
  }

  private cargarSimilares(categoria: string, genero: string, idActual: string): void {
    // filtra por categoria Y genero, para no mezclar abrigos de hombre
    // con abrigos de mujer en la seccion de similares.
    // Usamos los valores recibidos como parámetro (no this.producto) porque
    // esta llamada es asíncrona: si el usuario navega a otro producto antes
    // de que responda, this.producto ya habría cambiado para entonces.
    this.productoService.findAll(categoria, genero).subscribe({
      next: (data) => {
        // Si mientras esperábamos la respuesta el usuario ya navegó a otro
        // producto, descartamos este resultado para no pisar los similares
        // del producto que se está mostrando ahora.
        if (this.producto?.id !== idActual) return;
        this.similares = data.filter(p => p.id !== idActual).slice(0, 10);
        this.cdr.detectChanges();
        // Esperamos a que Angular renderice el bloque (está detrás de *ngIf)
        // antes de medir el scroll del carrusel.
        setTimeout(() => this.onScrollSimilares());
      }
    });
  }

  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada = talla;
  }

  seleccionarColor(color: string): void {
    this.colorSeleccionado = color;
  }

  seleccionarImagen(img: string): void {
    if (!this.producto) return;
    this.imagenActiva = img;
    this.imagenIndexActivo = this.producto.imagenes.indexOf(img);
  }

  toggleAcordeon(index: number): void {
    this.acordeones[index].abierto = !this.acordeones[index].abierto;
  }

  volver(): void {
    window.history.back();
  }

  anadirAlCarrito(): void {
    if (!this.producto || !this.tallaSeleccionada) return;

    this.carritoService.addItem(
      this.producto,
      this.tallaSeleccionada,
      this.colorSeleccionado,
      1
    );

    this.toastService.show(`${this.producto.nombre} añadido a la cesta`);
  }

  siguienteImagen(): void {
    if (!this.producto) return;
    this.imagenIndexActivo = (this.imagenIndexActivo + 1) % this.producto.imagenes.length;
    this.imagenActiva = this.producto.imagenes[this.imagenIndexActivo];
  }

  anteriorImagen(): void {
    if (!this.producto) return;
    this.imagenIndexActivo =
      (this.imagenIndexActivo - 1 + this.producto.imagenes.length) % this.producto.imagenes.length;
    this.imagenActiva = this.producto.imagenes[this.imagenIndexActivo];
  }

  scrollSimilares(direccion: 1 | -1): void {
    const el = this.similaresCarrusel?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: direccion * (el.clientWidth * 0.9), behavior: 'smooth' });
  }

  onScrollSimilares(): void {
    const el = this.similaresCarrusel?.nativeElement;
    if (!el) return;
    this.similaresInicio = el.scrollLeft <= 0;
    this.similaresFin = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    this.cdr.detectChanges();
  }
}