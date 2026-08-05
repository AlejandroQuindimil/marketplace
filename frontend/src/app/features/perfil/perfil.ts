import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth';
import { PedidoService, Pedido } from '../../core/pedido';
import { UsuarioService, Direccion } from '../../core/usuario';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario: { id: string; nombre: string; email: string; rol: string } | null = null;
  pedidos: Pedido[] = [];
  loadingPedidos = true;
  tallasPreferidas: Record<string, string> = {};
  direcciones: Direccion[] = [];

  prefijoTelefono = '+34';
  numeroTelefono = '';
  recibirNewsletter = false;
  guardandoTelefono = false;
  mensajeTelefono = '';

  // Lista de prefijos habituales (no exhaustiva: cubre España + los países
  // más frecuentes en un marketplace de moda hispanohablante/europeo)
  paises: { prefijo: string; nombre: string; bandera: string }[] = [
    { prefijo: '+34', nombre: 'España', bandera: '🇪🇸' },
    { prefijo: '+351', nombre: 'Portugal', bandera: '🇵🇹' },
    { prefijo: '+33', nombre: 'Francia', bandera: '🇫🇷' },
    { prefijo: '+39', nombre: 'Italia', bandera: '🇮🇹' },
    { prefijo: '+44', nombre: 'Reino Unido', bandera: '🇬🇧' },
    { prefijo: '+49', nombre: 'Alemania', bandera: '🇩🇪' },
    { prefijo: '+1', nombre: 'EE. UU. / Canadá', bandera: '🇺🇸' },
    { prefijo: '+52', nombre: 'México', bandera: '🇲🇽' },
    { prefijo: '+54', nombre: 'Argentina', bandera: '🇦🇷' },
    { prefijo: '+55', nombre: 'Brasil', bandera: '🇧🇷' },
    { prefijo: '+56', nombre: 'Chile', bandera: '🇨🇱' },
    { prefijo: '+57', nombre: 'Colombia', bandera: '🇨🇴' }
  ];

  tabActiva: 'perfil' | 'pedidos' | 'devoluciones' | 'tallas' | 'ayuda' = 'perfil';

  // Controla que pedido tiene abierto el desglose de articulos
  pedidoExpandido: string | null = null;

  // Formulario de direccion: null = modo "añadir", numero = editando esa posicion
  mostrandoFormDireccion = false;
  editandoDireccionIndex: number | null = null;
  nuevaDireccion: Direccion = { calle: '', ciudad: '', cp: '' };

  categorias = ['CAMISETAS', 'PANTALONES', 'ZAPATILLAS', 'ACCESORIOS', 'ABRIGOS'];
  categoriaLabels: Record<string, string> = {
    CAMISETAS: 'Camisetas',
    PANTALONES: 'Pantalones',
    ZAPATILLAS: 'Zapatillas',
    ACCESORIOS: 'Accesorios',
    ABRIGOS: 'Abrigos'
  };

  // Control de validacion de direccion  
  validandoDireccion = false;
  errorDireccion = '';

  // Ventana maxima para poder solicitar devolucion tras la entrega
  private readonly DIAS_LIMITE_DEVOLUCION = 30;

  constructor(
    private authService: AuthService,
    private pedidoService: PedidoService,
    private usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.authService.getUsuario();
    this.cargarPedidos();
    this.cargarDatosUsuario();

    this.route.queryParams.subscribe(params => {
      if (params['tab']) this.tabActiva = params['tab'];
    });
  }

  cambiarTab(tab: typeof this.tabActiva): void {
    this.tabActiva = tab;
  }

  // --- Pedidos ---

  private cargarPedidos(): void {
    this.pedidoService.misPedidos().subscribe({
      next: (data) => {
        this.pedidos = data.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loadingPedidos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPedidos = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleDesglose(pedidoId: string): void {
    this.pedidoExpandido = this.pedidoExpandido === pedidoId ? null : pedidoId;
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      PAGADO: 'Pagado',
      ENVIADO: 'Enviado',
      ENTREGADO: 'Entregado'
    };
    return labels[estado] || estado;
  }

  // Un pedido es devolvible si esta ENTREGADO y no han pasado mas de
  // DIAS_LIMITE_DEVOLUCION dias desde que se creo (aproximamos la fecha
  // de entrega con la de creacion, ya que no guardamos una fecha de
  // entrega real en este proyecto de demo)
  esDevolvible(pedido: Pedido): boolean {
    if (pedido.estado !== 'ENTREGADO') return false;
    const dias = (Date.now() - new Date(pedido.createdAt).getTime()) / 86400000;
    return dias <= this.DIAS_LIMITE_DEVOLUCION;
  }

  diasRestantesDevolucion(pedido: Pedido): number {
    const dias = (Date.now() - new Date(pedido.createdAt).getTime()) / 86400000;
    return Math.max(0, Math.ceil(this.DIAS_LIMITE_DEVOLUCION - dias));
  }

  get pedidosDevolvibles(): Pedido[] {
    return this.pedidos.filter(p => this.esDevolvible(p));
  }

  // --- Direcciones ---

  private cargarDatosUsuario(): void {
    this.usuarioService.me().subscribe({
      next: (data) => {
        this.tallasPreferidas = data.tallasPreferidas || {};
        this.direcciones = data.direcciones || [];
        this.parsearTelefono(data.telefono || '');
        this.recibirNewsletter = data.recibirNewsletter;
        this.cdr.detectChanges();
      }
    });
  }

  // El backend guarda el telefono como un unico string (ej. "+34 612345678").
  // Lo separamos en prefijo + numero para poder mostrar el selector de pais;
  // si no reconocemos un prefijo con "+" al principio, asumimos España y
  // tratamos todo el valor guardado como el numero.
  private parsearTelefono(telefono: string): void {
    const match = telefono.match(/^(\+\d{1,3})\s*(.*)$/);
    if (match) {
      this.prefijoTelefono = match[1];
      this.numeroTelefono = match[2];
    } else {
      this.prefijoTelefono = '+34';
      this.numeroTelefono = telefono.replace(/\D/g, '');
    }
  }

  // index = null -> modo "añadir"; index = numero -> modo "editar" esa posicion,
  // precargando el formulario con los datos ya guardados
  abrirFormDireccion(index: number | null = null): void {
    this.editandoDireccionIndex = index;
    this.errorDireccion = '';
    this.nuevaDireccion = index !== null
      ? { ...this.direcciones[index] }
      : { calle: '', ciudad: '', cp: '' };
    this.mostrandoFormDireccion = true;
  }

  cerrarFormDireccion(): void {
    this.mostrandoFormDireccion = false;
    this.editandoDireccionIndex = null;
    this.errorDireccion = '';
    this.nuevaDireccion = { calle: '', ciudad: '', cp: '' };
  }

  guardarDireccion(): void {
  this.errorDireccion = '';

  if (!this.nuevaDireccion.calle || !this.nuevaDireccion.ciudad || !this.nuevaDireccion.cp) {
    this.errorDireccion = 'Rellena todos los campos.';
    return;
  }

  if (!/^\d{5}$/.test(this.nuevaDireccion.cp)) {
    this.errorDireccion = 'El código postal debe tener 5 dígitos.';
    return;
  }

  this.validandoDireccion = true;

  const query = `${this.nuevaDireccion.calle}, ${this.nuevaDireccion.cp} ${this.nuevaDireccion.ciudad}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;

  this.http.get<any[]>(url).subscribe({
    next: (resultados) => {
      this.validandoDireccion = false;

      if (!resultados || resultados.length === 0) {
        this.errorDireccion = 'No hemos podido verificar esta dirección. Revisa que sea correcta.';
        this.cdr.detectChanges();
        return;
      }

      // Nominatim puede devolver una coincidencia "aproximada" (resuelve la
      // calle e ignora un CP o ciudad que no le cuadran) en vez de fallar
      // directamente. Comprobamos que el resultado encontrado coincide de
      // verdad con lo escrito antes de darlo por válido.
      const direccionEncontrada = resultados[0];
      const cpEncontrado: string | undefined = direccionEncontrada.address?.postcode;
      const ciudadEncontrada: string = (
        direccionEncontrada.address?.city ||
        direccionEncontrada.address?.town ||
        direccionEncontrada.address?.village ||
        ''
      ).toLowerCase();

      if (cpEncontrado && cpEncontrado !== this.nuevaDireccion.cp) {
        this.errorDireccion = `El código postal no coincide con la dirección encontrada (se esperaba ${cpEncontrado}).`;
        this.cdr.detectChanges();
        return;
      }

      if (ciudadEncontrada && !ciudadEncontrada.includes(this.nuevaDireccion.ciudad.trim().toLowerCase())) {
        this.errorDireccion = 'La ciudad no coincide con la dirección encontrada. Revisa que sea correcta.';
        this.cdr.detectChanges();
        return;
      }

      // Direccion verificada de verdad: creamos o editamos segun el modo
      const peticion = this.editandoDireccionIndex !== null
        ? this.usuarioService.updateDireccion(this.editandoDireccionIndex, this.nuevaDireccion)
        : this.usuarioService.addDireccion(this.nuevaDireccion);

      peticion.subscribe({
        next: (direcciones) => {
          this.direcciones = direcciones;
          this.cerrarFormDireccion();
          this.cdr.detectChanges();
        }
      });
    },
    error: () => {
      this.validandoDireccion = false;
      this.errorDireccion = 'No se pudo verificar la dirección ahora mismo. Inténtalo de nuevo.';
      this.cdr.detectChanges();
    }
  });
}

  // Filtra sobre la marcha cualquier caracter que no sea digito, y limita
  // a 5 (longitud de un CP español), para que no se puedan teclear letras
  // ni codigos postales mas largos de lo esperado.
  onCpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, 5);
    if (soloDigitos !== input.value) {
      input.value = soloDigitos;
    }
    this.nuevaDireccion.cp = soloDigitos;
  }

  eliminarDireccion(index: number): void {
    this.usuarioService.removeDireccion(index).subscribe({
      next: (direcciones) => {
        this.direcciones = direcciones;
        this.cdr.detectChanges();
      }
    });
  }

  marcarPredeterminada(index: number): void {
    this.usuarioService.marcarDireccionPredeterminada(index).subscribe({
      next: (direcciones) => {
        this.direcciones = direcciones;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Datos de contacto ---

  guardarTelefono(): void {
    this.guardandoTelefono = true;
    this.mensajeTelefono = '';
    const telefonoCompleto = this.numeroTelefono ? `${this.prefijoTelefono} ${this.numeroTelefono}` : '';
    this.usuarioService.updateTelefono(telefonoCompleto).subscribe({
      next: () => {
        this.guardandoTelefono = false;
        this.mensajeTelefono = 'Guardado.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoTelefono = false;
        this.mensajeTelefono = 'No se pudo guardar. Inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  // Mismo patron que onCpInput: filtra sobre la marcha cualquier caracter
  // que no sea digito. 15 es la longitud maxima de un numero segun el
  // estandar E.164 (prefijo aparte). Ademas reformatea visualmente en
  // grupos de 3 (666 555 666); por dentro se guardan solo los digitos,
  // sin espacios, para no complicar la validacion ni el envio al backend.
  onNumeroTelefonoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, 15);
    this.numeroTelefono = soloDigitos;

    const formateado = this.formatearNumero(soloDigitos);
    if (input.value !== formateado) {
      input.value = formateado;
    }
  }

  formatearNumero(digitos: string): string {
    return digitos.replace(/(\d{3})(?=\d)/g, '$1 ');
  }

  // --- Comunicaciones ---

  toggleNewsletter(): void {
    const nuevoValor = !this.recibirNewsletter;
    this.usuarioService.updateNewsletter(nuevoValor).subscribe({
      next: () => {
        this.recibirNewsletter = nuevoValor;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Tallas ---

  opcionesTalla(categoria: string): string[] {
    if (categoria === 'ZAPATILLAS') {
      const tallas: string[] = [];
      for (let i = 28; i <= 50; i++) tallas.push(i.toString());
      return tallas;
    }
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }

  guardarTalla(categoria: string, talla: string): void {
    if (!talla) return;
    this.usuarioService.updateTalla(categoria, talla).subscribe({
      next: () => {
        this.tallasPreferidas[categoria] = talla;
        this.cdr.detectChanges();
      }
    });
  }
}