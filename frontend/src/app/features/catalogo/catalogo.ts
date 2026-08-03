import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductoService, Producto } from '../../core/producto';
import { environment } from '../../environments/environment';
import { FavoritoService } from '../../core/favorito';
import { AuthService } from '../../core/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  // Productos tal como llegan del backend (sin filtros locales aplicados)
  productosOriginales: Producto[] = [];
  // Lo que realmente se muestra en pantalla, tras aplicar rebajas/talla/color/marca/precio
  productos: Producto[] = [];

  loading = true;
  categoriaActiva = '';
  terminoBusqueda = '';
  generoActivo = '';
  rebajasActivo = false;

  favoritoIds: Set<string> = new Set();
  imagenIndexPorProducto: Map<string, number> = new Map();

  // Nivel superior del catalogo, igual que la navbar
  topFiltros = [
    { label: 'Novedades', genero: '', accesorios: false },
    { label: 'Hombre', genero: 'HOMBRE', accesorios: false },
    { label: 'Mujer', genero: 'MUJER', accesorios: false },
    { label: 'Accesorios', genero: '', accesorios: true },
    { label: 'Rebajas', genero: '', accesorios: false, rebajas: true }
  ];

  // Subcategorias que aparecen solo tras elegir Hombre o Mujer.
  // Los `valor` tienen que coincidir EXACTAMENTE con el campo `categoria`
  // que se guarda en Mongo para cada producto (ver script de seed).
  categoriasPorGenero: Record<string, { valor: string; label: string }[]> = {
    HOMBRE: [
      { valor: '', label: 'Todo' },
      { valor: 'CAMISETAS', label: 'Camisetas y Polos' },
      { valor: 'CAMISAS', label: 'Camisas' },
      { valor: 'JERSEYS', label: 'Punto' },
      { valor: 'SUDADERAS', label: 'Sudaderas' },
      { valor: 'PANTALONES', label: 'Pantalones' },
      { valor: 'VAQUEROS', label: 'Vaqueros' },
      { valor: 'SHORTS', label: 'Shorts' },
      { valor: 'CHAQUETAS', label: 'Chaquetas' },
      { valor: 'ABRIGOS', label: 'Abrigos' },
      { valor: 'ROPA_INTERIOR', label: 'Ropa interior' },
      { valor: 'ACCESORIOS', label: 'Accesorios' },
      { valor: 'ZAPATILLAS', label: 'Zapatillas y Botas' }
    ],
    MUJER: [
      { valor: '', label: 'Todo' },
      { valor: 'VESTIDOS', label: 'Vestidos' },
      { valor: 'FALDAS', label: 'Faldas' },
      { valor: 'CAMISETAS', label: 'Camisetas y Tops' },
      { valor: 'CAMISAS', label: 'Camisas y Blusas' },
      { valor: 'JERSEYS', label: 'Punto' },
      { valor: 'SUDADERAS', label: 'Sudaderas' },
      { valor: 'PANTALONES', label: 'Pantalones' },
      { valor: 'VAQUEROS', label: 'Vaqueros' },
      { valor: 'CHAQUETAS', label: 'Chaquetas' },
      { valor: 'ABRIGOS', label: 'Abrigos' },
      { valor: 'ROPA_INTERIOR', label: 'Ropa interior' },
      { valor: 'ACCESORIOS', label: 'Accesorios' },
      { valor: 'ZAPATILLAS', label: 'Zapatos' }
    ]
  };

  // --- Panel de filtros avanzados (talla, color, marca, precio) ---
  mostrarPanelFiltros = false;
  filtroTalla = '';
  filtroColor = '';
  filtroMarca = '';

  // Rango de precio: limites disponibles segun los productos cargados,
  // y valores actualmente seleccionados por el usuario (slider + inputs)
  precioMinLimite = 0;
  precioMaxLimite = 500;
  filtroPrecioMin = 0;
  filtroPrecioMax = 500;

  constructor(
    private productoService: ProductoService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private favoritoService: FavoritoService,
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.favoritoService.getFavoritos().subscribe({
        next: (favs) => {
          this.favoritoIds = new Set(favs.map(f => f.id));
          this.cdr.detectChanges();
        }
      });
    }

    this.route.queryParams.subscribe(params => {
      this.terminoBusqueda = params['buscar'] || '';
      this.categoriaActiva = params['categoria'] || '';
      this.generoActivo = params['genero'] || '';
      this.rebajasActivo = params['rebajas'] === 'true';
      // Al cambiar de pagina (subcategoria, genero, busqueda...) los filtros
      // avanzados de la pagina anterior ya no tienen por que ser validos
      // para el nuevo listado (p.ej. una talla o marca que no exista aqui),
      // asi que se resetean para no acabar mostrando "0 productos" en
      // silencio. El rango de precio se resetea aparte, en
      // recalcularLimitesPrecio(), una vez sabemos los precios del listado.
      this.filtroTalla = '';
      this.filtroColor = '';
      this.filtroMarca = '';
      this.cargarProductos();
    });
  }

  // --- Navegacion de nivel superior e subcategorias ---

  seleccionarTop(item: { genero: string; accesorios?: boolean; rebajas?: boolean }): void {
    const queryParams: any = { genero: item.genero };
    if (item.accesorios) queryParams.categoria = 'ACCESORIOS';
    if (item.rebajas) queryParams.rebajas = 'true';
    this.router.navigate(['/productos'], { queryParams });
  }

  filtrarPor(categoria: string): void {
    this.router.navigate(['/productos'], {
      queryParams: { genero: this.generoActivo, categoria, rebajas: this.rebajasActivo || null }
    });
  }

  quitarBusqueda(): void {
    this.router.navigate(['/productos']);
  }

  esTopActivo(item: any): boolean {
    if (item.rebajas) return this.rebajasActivo;
    if (item.accesorios) return this.categoriaActiva === 'ACCESORIOS' && !this.generoActivo;
    return this.generoActivo === item.genero && !this.rebajasActivo && !(item.accesorios);
  }

  // --- Carga desde backend + filtros locales ---

  private cargarProductos(): void {
    this.loading = true;

    if (this.terminoBusqueda) {
      const url = `${environment.apiUrl}/productos?buscar=${encodeURIComponent(this.terminoBusqueda)}`;
      this.http.get<Producto[]>(url).subscribe({
        next: (data) => this.onProductosCargados(data),
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    } else {
      this.productoService.findAll(this.categoriaActiva || undefined, this.generoActivo || undefined).subscribe({
        next: (data) => this.onProductosCargados(data),
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    }
  }

  private onProductosCargados(data: Producto[]): void {
    this.productosOriginales = data;
    this.loading = false;
    this.recalcularLimitesPrecio();
    this.aplicarFiltrosLocales();
  }

  // Ajusta los limites del slider al rango real de precios del catalogo
  // cargado, y reinicia la seleccion actual a esos limites.
  private recalcularLimitesPrecio(): void {
    if (this.productosOriginales.length === 0) {
      this.precioMinLimite = 0;
      this.precioMaxLimite = 500;
    } else {
      const precios = this.productosOriginales.map(p => p.precio);
      this.precioMinLimite = Math.floor(Math.min(...precios));
      this.precioMaxLimite = Math.ceil(Math.max(...precios));
      if (this.precioMaxLimite <= this.precioMinLimite) {
        this.precioMaxLimite = this.precioMinLimite + 1;
      }
    }
    this.filtroPrecioMin = this.precioMinLimite;
    this.filtroPrecioMax = this.precioMaxLimite;
  }

  // Recalcula this.productos aplicando rebajas + talla + color + marca + precio
  // sobre this.productosOriginales. Se hace en el cliente porque el catalogo
  // es pequeno; con un catalogo grande de verdad esto pasaria al backend.
  aplicarFiltrosLocales(): void {
    let resultado = this.productosOriginales;

    if (this.rebajasActivo) {
      resultado = resultado.filter(p => p.precioAnterior && p.precioAnterior > p.precio);
    }
    if (this.filtroTalla) {
      resultado = resultado.filter(p => p.tallas.some(t => t.talla === this.filtroTalla && t.stock > 0));
    }
    if (this.filtroColor) {
      resultado = resultado.filter(p => p.colores.includes(this.filtroColor));
    }
    if (this.filtroMarca) {
      resultado = resultado.filter(p => p.marca === this.filtroMarca);
    }
    resultado = resultado.filter(
      p => p.precio >= this.filtroPrecioMin && p.precio <= this.filtroPrecioMax
    );

    this.productos = resultado;
    this.cdr.detectChanges();
  }

  // Opciones unicas disponibles para los desplegables, calculadas a partir
  // de los productos ya cargados (no de todo el catalogo)
  get opcionesTallas(): string[] {
    const set = new Set<string>();
    this.productosOriginales.forEach(p => p.tallas.forEach(t => set.add(t.talla)));
    return Array.from(set).sort();
  }

  get opcionesColores(): string[] {
    const set = new Set<string>();
    this.productosOriginales.forEach(p => p.colores.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }

  get opcionesMarcas(): string[] {
    const set = new Set<string>();
    this.productosOriginales.forEach(p => set.add(p.marca));
    return Array.from(set).sort();
  }

  toggleFiltros(): void {
    this.mostrarPanelFiltros = !this.mostrarPanelFiltros;
  }

  limpiarFiltrosLocales(): void {
    this.filtroTalla = '';
    this.filtroColor = '';
    this.filtroMarca = '';
    this.filtroPrecioMin = this.precioMinLimite;
    this.filtroPrecioMax = this.precioMaxLimite;
    this.aplicarFiltrosLocales();
  }

  // --- Filtro de precio: slider de doble tirador + inputs numericos ---
  //
  // Los <input type="range"> ya solo aceptan numeros por naturaleza del
  // control, pero los cuadros de texto son de entrada libre, asi que
  // saneamos cada pulsacion para admitir unicamente digitos (0-9) y evitar
  // que se cuele cualquier otro caracter (scripts, comillas, etc).
  private soloDigitos(valor: string): string {
    return valor.replace(/[^0-9]/g, '');
  }

  onSliderMinChange(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value);
    this.filtroPrecioMin = Math.min(valor, this.filtroPrecioMax);
    this.aplicarFiltrosLocales();
  }

  onSliderMaxChange(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value);
    this.filtroPrecioMax = Math.max(valor, this.filtroPrecioMin);
    this.aplicarFiltrosLocales();
  }

  onPrecioMinInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = this.soloDigitos(input.value);
    input.value = limpio;

    if (limpio === '') { return; }

    let valor = Number(limpio);
    valor = Math.max(this.precioMinLimite, Math.min(valor, this.precioMaxLimite));
    this.filtroPrecioMin = Math.min(valor, this.filtroPrecioMax);
    this.aplicarFiltrosLocales();
  }

  onPrecioMaxInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = this.soloDigitos(input.value);
    input.value = limpio;

    if (limpio === '') { return; }

    let valor = Number(limpio);
    valor = Math.max(this.precioMinLimite, Math.min(valor, this.precioMaxLimite));
    this.filtroPrecioMax = Math.max(valor, this.filtroPrecioMin);
    this.aplicarFiltrosLocales();
  }

  // Bloquea cualquier tecla que no sea un digito o una tecla de control
  // (flechas, borrar, tab...) directamente en el teclado, como primera
  // barrera antes del saneado por regex de arriba.
  bloquearNoNumerico(event: KeyboardEvent): void {
    const teclasPermitidas = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'
    ];
    if (teclasPermitidas.includes(event.key)) { return; }
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Posicion (%) de cada tirador dentro del slider, usada para pintar la
  // barra resaltada entre el minimo y el maximo seleccionados.
  get precioMinPorcentaje(): number {
    const rango = this.precioMaxLimite - this.precioMinLimite;
    if (rango <= 0) { return 0; }
    return ((this.filtroPrecioMin - this.precioMinLimite) / rango) * 100;
  }

  get precioMaxPorcentaje(): number {
    const rango = this.precioMaxLimite - this.precioMinLimite;
    if (rango <= 0) { return 100; }
    return ((this.filtroPrecioMax - this.precioMinLimite) / rango) * 100;
  }

  // --- Favoritos (sin cambios) ---

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

  getImagenActiva(p: Producto): string {
    const index = this.imagenIndexPorProducto.get(p.id) || 0;
    return p.imagenes[index] || p.imagenes[0];
  }

  cambiarImagen(p: Producto, direccion: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const actual = this.imagenIndexPorProducto.get(p.id) || 0;
    const total = p.imagenes.length;
    const nuevo = (actual + direccion + total) % total;
    this.imagenIndexPorProducto.set(p.id, nuevo);
  }
}