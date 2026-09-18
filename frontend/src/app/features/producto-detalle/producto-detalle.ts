import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductoService, Producto } from '../../core/producto';
import { FavoritoService } from '../../core/favorito';
import { AuthService } from '../../core/auth';
import { CarritoService } from '../../core/carrito';
import { ToastService } from '../../core/toast';
import { ResenaService, Resena } from '../../core/resena';
import { FormsModule } from '@angular/forms';

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


  resenas: Resena[] = [];
  mediaEstrellas = 0;
  totalResenas = 0;
  puedeValorar = false;

  // formulario de nueva valoracion
  nuevaEstrellas = 0;
  nuevoComentario = '';
  enviandoResena = false;
  errorResena = '';
  resenaEnviada = false;

  misResenaExistente: Resena | null = null;
  limiteEdicionesAlcanzado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private favoritoService: FavoritoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private carritoService: CarritoService,
    private toastService: ToastService,
    private resenaService: ResenaService, 
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
      this.misResenaExistente = null;
      this.limiteEdicionesAlcanzado = false;

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
        this.cargarResenas(data.id);
        if (this.authService.isLoggedIn()) {
          this.comprobarSiPuedeValorar(data.id);
        }
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


  private cargarResenas(productoId: string): void {
  this.resenaService.listar(productoId).subscribe({
    next: (res) => {
      this.resenas = res.resenas;
      this.mediaEstrellas = res.media;
      this.totalResenas = res.total;
      this.cdr.detectChanges();
    }
  });
}

private comprobarSiPuedeValorar(productoId: string): void {
  this.resenaService.puedoValorar(productoId).subscribe({
    next: (res) => {
      this.puedeValorar = res.puedeValorar;
      this.misResenaExistente = res.miResena;
      this.limiteEdicionesAlcanzado = res.limiteEdicionesAlcanzado;

      if (res.miResena) {
        this.nuevaEstrellas = res.miResena.estrellas;
        this.nuevoComentario = res.miResena.comentario;
      }

      this.cdr.detectChanges();
    }
  });
}

seleccionarEstrellas(n: number): void {
  this.nuevaEstrellas = n;
}

// Muestra solo las 3 primeras letras del nombre del autor de la reseña,
// seguidas de asteriscos, para proteger su privacidad.
ofuscarNombre(nombre: string): string {
  if (!nombre) return '';
  const visible = nombre.trim().slice(0, 3);
  return `${visible}${'*'.repeat(10)}`;
}

enviarResena(): void {
  if (!this.producto) return;

  this.errorResena = '';

  if (this.nuevaEstrellas === 0) {
    this.errorResena = 'Selecciona una puntuación.';
    return;
  }
  if (!this.nuevoComentario.trim()) {
    this.errorResena = 'Escribe un comentario.';
    return;
  }
  if (this.nuevoComentario.trim().length > 500) {
    this.errorResena = 'El comentario no puede superar los 500 caracteres.';
    return;
  }

  this.enviandoResena = true;

  this.resenaService.crear(this.producto.id, this.nuevaEstrellas, this.nuevoComentario.trim()).subscribe({
    next: () => {
      this.enviandoResena = false;
      this.resenaEnviada = true;
      this.cargarResenas(this.producto!.id);
    },
    error: (err) => {
      this.enviandoResena = false;
      this.errorResena = err.error?.error || 'No se pudo enviar la valoración.';
      this.cdr.detectChanges();
    }
  });
}
}