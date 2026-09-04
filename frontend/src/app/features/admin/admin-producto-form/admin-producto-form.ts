import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProductoService } from '../../../core/producto';

interface TallaForm {
  talla: string;
  stock: number;
}

interface ColorSwatch {
  nombre: string;
  hex: string;
}

@Component({
  selector: 'app-admin-producto-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-producto-form.html',
  styleUrl: './admin-producto-form.css'
})
export class AdminProductoForm implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  productoId: string | null = null;
  modoEdicion = false;

  loading = false;
  guardando = false;
  error = '';

  nombre = '';
  descripcion = '';
  precio: number = 0;
  precioAnterior: number = 0;
  categoria = '';
  genero = '';
  marca = '';
  destacado = false;

  imagenes: string[] = [''];
  imagenesConError: boolean[] = [false];
  imagenSeleccionada = 0;

  detalles = {
    materialExterior: '',
    materialInterior: '',
    cuidados: '',
    cierre: '',
    estampado: '',
    corte: '',
    guiaTallas: ''
  };

  // opciones sugeridas para los campos de "Detalles del producto": se
  // muestran como desplegable (datalist) pero el campo sigue siendo
  // texto libre, por si el producto necesita un valor que no esta en
  // la lista
  opcionesDetalles = {
    materialExterior: [
      'Algodón 100%', 'Poliéster 100%', 'Algodón/Poliéster', 'Lino',
      'Lana', 'Denim', 'Cuero', 'Piel sintética', 'Nylon', 'Poliamida',
      'Elastano/Spandex', 'Viscosa'
    ],
    materialInterior: [
      'Forro de poliéster', 'Algodón', 'Sherpa', 'Forro polar',
      'Malla transpirable', 'Peluche', 'Sin forro'
    ],
    cuidados: [
      'Lavado a máquina 30°C', 'Lavado a máquina 40°C', 'Lavar a mano',
      'Solo limpieza en seco', 'No usar secadora', 'No planchar',
      'Planchar a baja temperatura', 'No usar lejía'
    ],
    cierre: [
      'Cremallera', 'Botones', 'Cordones', 'Velcro', 'Broche',
      'Cinturón', 'Elástico', 'Sin cierre'
    ],
    estampado: [
      'Liso', 'Rayas', 'Cuadros', 'Floral', 'Animal print',
      'Estampado gráfico', 'Degradado', 'Lunares'
    ],
    corte: [
      'Regular fit', 'Slim fit', 'Oversize', 'Skinny', 'Relaxed fit',
      'Straight fit'
    ],
    guiaTallas: [
      'Consulta nuestra guía de tallas', 'Tallaje estándar',
      'Tallaje grande, pide una talla menos',
      'Tallaje pequeño, pide una talla más'
    ]
  };

  // formatos aceptados para subida de archivo local
  private readonly tiposImagenPermitidos = ['image/png', 'image/jpeg'];
  // indice de la fila para la que se abrio el selector de archivos;
  // null si no hay ninguna subida en curso
  private subiendoParaIndice: number | null = null;
  // true mientras el dialogo nativo de archivos esta abierto o
  // procesando el archivo elegido; bloquea los botones de subida para
  // que un segundo clic no abra un dialogo NUEVO (y cree una fila extra)
  // antes de que el primero termine de procesarse
  subiendoArchivo = false;

  colores: string[] = [];
  tallas: TallaForm[] = [{ talla: '', stock: 0 }];

  generos = ['HOMBRE', 'MUJER', 'UNISEX'];
  categoriasDisponibles: string[] = [];

  // categorias que se consideran calzado, para saber que rango de
  // tallas autogenerar (numeros en vez de XS/S/M/L...)
  private categoriasCalzado = new Set(['ZAPATILLAS', 'BOTAS']);

  // categorias de talla unica (no tiene sentido generar XS..XXL para
  // un cinturon o una gorra one-size)
  private categoriasTallaUnica = new Set(['ACCESORIOS']);

  marcasDisponibles: string[] = [];
  creandoMarcaNueva = false;
  marcaNueva = '';

  paletaColores: ColorSwatch[] = [
    { nombre: 'Blanco',   hex: '#ffffff' },
    { nombre: 'Negro',    hex: '#000000' },
    { nombre: 'Gris',     hex: '#9ca3af' },
    { nombre: 'Rojo',     hex: '#ef4444' },
    { nombre: 'Azul',     hex: '#3b82f6' },
    { nombre: 'Verde',    hex: '#22c55e' },
    { nombre: 'Amarillo', hex: '#eab308' },
    { nombre: 'Naranja',  hex: '#f97316' },
    { nombre: 'Rosa',     hex: '#ec4899' },
    { nombre: 'Morado',   hex: '#a855f7' },
    { nombre: 'Marrón',   hex: '#92400e' },
    { nombre: 'Beige',    hex: '#e7d8c9' },
  ];

  // color personalizado: el usuario elige el hex con el picker, pero
  // guardamos el NOMBRE que le ponga, no el codigo hex crudo, porque
  // un hex no dice nada a quien lea el producto despues
  colorPersonalizadoHex = '#3b82f6';
  colorPersonalizadoNombre = '';

  // recordamos el hex de cada color personalizado de ESTA sesion para
  // pintar su swatch con precision. Si no esta aqui (p.ej. tras recargar
  // la pagina o al editar un producto ya guardado, donde el backend solo
  // tiene el nombre) caemos a un color generado por hash del nombre, ver
  // getColorHex.
  private customColorHexMap: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.productoId = this.route.snapshot.paramMap.get('id');
    this.modoEdicion = !!this.productoId;

    this.cargarMarcas();

    if (this.modoEdicion) {
      this.cargarProducto();
    }
  }

  private cargarMarcas(): void {
    this.http.get<string[]>(`${environment.apiUrl}/productos/marcas`).subscribe({
      next: (marcas) => {
        this.marcasDisponibles = marcas;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarProducto(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/productos/${this.productoId}`).subscribe({
      next: (p) => {
        this.nombre = p.nombre;
        this.descripcion = p.descripcion || '';
        this.precio = p.precio ?? 0;
        this.precioAnterior = p.precioAnterior ?? 0;
        this.genero = p.genero;
        this.categoria = p.categoria;
        this.marca = p.marca;
        this.destacado = p.destacado;
        this.imagenes = p.imagenes.length ? [...p.imagenes] : [''];
        this.imagenesConError = this.imagenes.map(() => false);
        this.imagenSeleccionada = 0;
        this.colores = p.colores.length ? [...p.colores] : [];
        this.tallas = p.tallas.length ? p.tallas.map((t: any) => ({ ...t })) : [{ talla: '', stock: 0 }];

        this.cargarCategoriasPorGenero();

        this.detalles = {
          materialExterior: p.detalles?.materialExterior || '',
          materialInterior: p.detalles?.materialInterior || '',
          cuidados: p.detalles?.cuidados || '',
          cierre: p.detalles?.cierre || '',
          estampado: p.detalles?.estampado || '',
          corte: p.detalles?.corte || '',
          guiaTallas: p.detalles?.guiaTallas || ''
        };

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo cargar el producto.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Genero / Categoria ---

  onCambioGenero(): void {
    this.categoria = '';
    this.cargarCategoriasPorGenero();
  }

  private cargarCategoriasPorGenero(): void {
    if (!this.genero) {
      this.categoriasDisponibles = [];
      return;
    }

    this.http.get<string[]>(`${environment.apiUrl}/categorias/${this.genero}`).subscribe({
      next: (categorias) => {
        this.categoriasDisponibles = categorias;
        this.cdr.detectChanges();
      }
    });
  }

  // al elegir categoria, autogeneramos las tallas tipicas para no
  // obligar a añadirlas una a una a mano. En modo edicion no pisamos
  // las tallas ya guardadas salvo que el usuario pulse "Regenerar".
  onCambioCategoria(): void {
    this.autogenerarTallas(!this.modoEdicion);
  }

  autogenerarTallas(forzar: boolean = true): void {
    if (!this.categoria || !forzar) return;

    let tallasBase: string[];

    if (this.categoriasTallaUnica.has(this.categoria)) {
      tallasBase = ['Única'];
    } else if (this.categoriasCalzado.has(this.categoria)) {
      tallasBase = this.rangoCalzado();
    } else {
      tallasBase = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    }

    this.tallas = tallasBase.map(t => ({ talla: t, stock: 0 }));
  }

  private rangoCalzado(): string[] {
    const tallas: string[] = [];
    for (let i = 38; i <= 51; i++) tallas.push(i.toString());
    return tallas;
  }

  // --- Marca ---

  onSeleccionMarca(valor: string): void {
    if (valor === '__nueva__') {
      this.creandoMarcaNueva = true;
      this.marca = '';
    } else {
      this.creandoMarcaNueva = false;
      this.marca = valor;
    }
  }

  confirmarMarcaNueva(): void {
    if (!this.marcaNueva.trim()) return;
    this.marca = this.marcaNueva.trim();
    this.creandoMarcaNueva = false;
  }

  // --- Precio / stock: nunca negativos ---

  clampPrecio(): void {
    if (this.precio == null || this.precio < 0) this.precio = 0;
  }

  clampPrecioAnterior(): void {
    if (this.precioAnterior == null || this.precioAnterior < 0) this.precioAnterior = 0;
  }

  clampStock(t: TallaForm): void {
    if (t.stock == null || t.stock < 0) t.stock = 0;
  }

  // --- Imagenes ---
  // trackBy por indice: evita que Angular reutilice el DOM de una fila
  // distinta al añadir/quitar imagenes, que era lo que causaba que pegar
  // una URL nueva pareciera sobrescribir la fila de arriba
  trackByIndex(index: number): number {
    return index;
  }

  addImagen(): void {
    this.imagenes.push('');
    this.imagenesConError.push(false);
    this.imagenSeleccionada = this.imagenes.length - 1;
  }

  removeImagen(i: number): void {
    this.imagenes.splice(i, 1);
    this.imagenesConError.splice(i, 1);
    if (this.imagenSeleccionada >= this.imagenes.length) {
      this.imagenSeleccionada = this.imagenes.length - 1;
    }
  }

  seleccionarImagen(i: number): void {
    this.imagenSeleccionada = i;
  }

  get imagenSeleccionadaUrl(): string {
    return this.imagenes[this.imagenSeleccionada] || '';
  }

  onImgError(i: number): void {
    this.imagenesConError[i] = true;
  }

  onImgLoad(i: number): void {
    this.imagenesConError[i] = false;
  }

  // --- Navegacion de la previsualizacion grande (flechas) ---

  imagenAnterior(): void {
    if (this.imagenes.length < 2) return;
    this.imagenSeleccionada = (this.imagenSeleccionada - 1 + this.imagenes.length) % this.imagenes.length;
  }

  imagenSiguiente(): void {
    if (this.imagenes.length < 2) return;
    this.imagenSeleccionada = (this.imagenSeleccionada + 1) % this.imagenes.length;
  }

  // --- Subida de imagen desde archivo (PNG / JPG) ---

  // abre el selector de archivos del sistema para rellenar la fila i.
  // Si ya hay una subida en curso, ignoramos el clic: evita que un
  // doble clic abra un SEGUNDO dialogo (y con "Subir imagen" cree una
  // fila extra) antes de que el primero termine de procesarse.
  abrirSelectorArchivo(i: number): void {
    if (this.subiendoArchivo) return;

    this.subiendoArchivo = true;
    this.subiendoParaIndice = i;
    this.fileInputRef.nativeElement.click();

    // Red de seguridad: si el usuario CANCELA el dialogo sin elegir
    // archivo, en algunos navegadores no llega ningun evento fiable al
    // input (el evento 'cancel' no esta soportado en todos). En cuanto
    // el dialogo se cierra, la ventana siempre recupera el foco, asi
    // que lo usamos como respaldo para desbloquear el boton. El timeout
    // da margen a que 'change' (si hubo archivo) se procese primero.
    const liberarSiNoHuboArchivo = () => {
      window.removeEventListener('focus', liberarSiNoHuboArchivo);
      setTimeout(() => {
        if (this.subiendoParaIndice === i) {
          this.zone.run(() => {
            this.subiendoArchivo = false;
            this.subiendoParaIndice = null;
          });
        }
      }, 300);
    };
    window.addEventListener('focus', liberarSiNoHuboArchivo, { once: true });
  }

  // crea una fila nueva y abre directamente el selector de archivos
  // para ella, para el boton "+ Subir imagen" general
  addImagenDesdeArchivo(): void {
    if (this.subiendoArchivo) return;
    this.addImagen();
    this.abrirSelectorArchivo(this.imagenes.length - 1);
  }

  // se dispara si el navegador soporta el evento 'cancel' del input
  // (Chrome/Edge/Safari recientes): el usuario cerro el dialogo sin
  // elegir archivo. Desbloquea el boton al instante, sin esperar al
  // respaldo del 'focus'.
  onArchivoCancelado(): void {
    this.zone.run(() => {
      this.subiendoArchivo = false;
      this.subiendoParaIndice = null;
    });
  }

  // se dispara al elegir un archivo en el <input type="file"> oculto.
  // Lo convertimos a data URL con FileReader: el resto del componente
  // (preview, imagen grande, guardar) no distingue una data URL de una
  // URL normal, asi que no hace falta tocar nada mas.
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      this.zone.run(() => {
        this.subiendoArchivo = false;
        this.subiendoParaIndice = null;
      });
      return;
    }

    if (!this.tiposImagenPermitidos.includes(archivo.type)) {
      this.zone.run(() => {
        this.error = 'Solo se permiten imágenes en formato PNG o JPG.';
        this.subiendoArchivo = false;
        this.subiendoParaIndice = null;
        this.cdr.detectChanges();
      });
      input.value = '';
      return;
    }

    const indice = this.subiendoParaIndice;
    if (indice === null) {
      this.subiendoArchivo = false;
      return;
    }

    const lector = new FileReader();

    // El dialogo nativo de "elegir archivo" a veces hace que el evento
    // 'load' de FileReader se dispare fuera de la zona de Angular, y la
    // vista no se actualizaba hasta el siguiente evento (por eso hacia
    // falta pulsar el boton dos veces). zone.run() + detectChanges()
    // fuerza el refresco de la vista de forma SINCRONA e inmediata en
    // cuanto termina la lectura, sin esperar al proximo ciclo.
    lector.onload = () => {
      this.zone.run(() => {
        this.imagenes[indice] = lector.result as string;
        this.imagenesConError[indice] = false;
        this.imagenSeleccionada = indice;
        this.subiendoArchivo = false;
        this.subiendoParaIndice = null;
        this.error = '';
        this.cdr.detectChanges();
      });
    };

    lector.onerror = () => {
      this.zone.run(() => {
        this.error = 'No se pudo leer el archivo seleccionado.';
        this.subiendoArchivo = false;
        this.subiendoParaIndice = null;
        this.cdr.detectChanges();
      });
    };

    lector.readAsDataURL(archivo);

    // permite volver a seleccionar el mismo archivo dos veces seguidas
    input.value = '';
  }

  // --- Colores ---

  isColorSeleccionado(nombre: string): boolean {
    return this.colores.includes(nombre);
  }

  toggleColor(nombre: string): void {
    const idx = this.colores.indexOf(nombre);
    if (idx === -1) {
      this.colores.push(nombre);
    } else {
      this.colores.splice(idx, 1);
    }
  }

  removeColorSeleccionado(nombre: string): void {
    this.colores = this.colores.filter(c => c !== nombre);
  }

  // ahora exige un nombre legible (ej: "Verde turquesa") en vez de
  // guardar el hex crudo, que una persona no sabria interpretar despues
  addColorPersonalizado(): void {
    const nombre = this.colorPersonalizadoNombre.trim();

    if (!nombre) return;
    if (this.colores.includes(nombre)) return;

    this.customColorHexMap[nombre] = this.colorPersonalizadoHex;
    this.colores.push(nombre);
    this.colorPersonalizadoNombre = '';
  }

  // Hex a pintar en cada swatch, en orden de prioridad:
  // 1) paleta predefinida (Negro, Azul, etc.)
  // 2) hex elegido en el picker en ESTA sesion (customColorHexMap)
  // 3) color generado por hash del nombre: deterministico, asi un color
  //    como "Verde turquesa" pinta siempre el mismo tono aunque se
  //    recargue la pagina o se edite un producto ya guardado donde el
  //    backend solo almaceno el nombre, no el hex original.
  getColorHex(nombre: string): string {
    const predefinido = this.paletaColores.find(c => c.nombre === nombre);
    if (predefinido) return predefinido.hex;

    if (this.customColorHexMap[nombre]) return this.customColorHexMap[nombre];

    return this.hashColorFromString(nombre);
  }

  private hashColorFromString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 55%)`;
  }

  // --- Tallas ---

  addTalla(): void { this.tallas.push({ talla: '', stock: 0 }); }
  removeTalla(i: number): void { this.tallas.splice(i, 1); }

  // --- Guardar ---

  guardar(): void {
    this.error = '';

    if (!this.nombre || !this.precio || !this.categoria || !this.genero || !this.marca) {
      this.error = 'Rellena al menos nombre, precio, categoría, género y marca.';
      return;
    }

    if (this.precio < 0) this.precio = 0;
    if (this.precioAnterior < 0) this.precioAnterior = 0;
    this.tallas.forEach(t => { if (t.stock < 0) t.stock = 0; });

    const body = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: this.precio,
      precioAnterior: this.precioAnterior || null,
      categoria: this.categoria,
      genero: this.genero,
      marca: this.marca,
      destacado: this.destacado,
      imagenes: this.imagenes.filter(i => i.trim() !== ''),
      colores: this.colores.filter(c => c.trim() !== ''),
      tallas: this.tallas.filter(t => t.talla.trim() !== ''),
      detalles: this.detalles,
    };

    this.guardando = true;

    const peticion = this.modoEdicion
      ? this.http.put(`${environment.apiUrl}/productos/${this.productoId}`, body)
      : this.http.post(`${environment.apiUrl}/productos`, body);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/admin/productos']);
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.error || 'No se pudo guardar el producto.';
        this.cdr.detectChanges();
      }
    });
  }
}