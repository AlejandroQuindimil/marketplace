import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DashboardService, DashboardData } from '../../../core/dashboard';

Chart.register(...registerables);

// paleta de marca compartida por todas las graficas del dashboard:
// PRIMARIO = metrica protagonista, SECUNDARIO = su contraparte comparativa,
// ALERTA = negativo / necesita atencion. Nada de color "porque si": cada
// grafica usa estos tres con el mismo significado en todo el dashboard.
const COLOR = {
  primario: '#08d9d6',
  primarioTexto: '#049a98', // misma familia que el primario pero con contraste legible sobre blanco
  secundario: '#ffe600',
  alerta: '#ff2e63',
  completado: '#049a98',
  grid: '#eef0f7',
  ticks: '#9aa0b3'
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit, AfterViewInit {
  @ViewChild('graficoVentas') graficoVentasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoEstados') graficoEstadosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoTop') graficoTopRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoAov') graficoAovRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoClientes') graficoClientesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoRotacion') graficoRotacionRef!: ElementRef<HTMLCanvasElement>;

  data: DashboardData | null = null;
  loading = true;
  rangoActivo = 'mes';

  private chartVentas: Chart | null = null;
  private chartEstados: Chart | null = null;
  private chartTop: Chart | null = null;
  private chartAov: Chart | null = null;
  private chartClientes: Chart | null = null;
  private chartRotacion: Chart | null = null;

  rangos = [
    { valor: 'semana', label: '7 días' },
    { valor: 'mes', label: '1 mes' },
    { valor: '3meses', label: '3 meses' },
    { valor: '6meses', label: '6 meses' },
    { valor: '1anio', label: '1 año' },
    { valor: '2anios', label: '2 años' },
    { valor: '3anios', label: '3 años' },
    { valor: '5anios', label: '5 años' }
  ];

  private vistaLista = false;

  // degradado vertical de un color hacia transparente, para el relleno
  // de las graficas de area (mismo tratamiento visual en todas)
  private crearGradiente(ctx: CanvasRenderingContext2D, colorHex: string, alturaPx = 260): CanvasGradient {
    const gradiente = ctx.createLinearGradient(0, 0, 0, alturaPx);
    gradiente.addColorStop(0, this.hexAAlfa(colorHex, 0.28));
    gradiente.addColorStop(1, this.hexAAlfa(colorHex, 0));
    return gradiente;
  }

  private hexAAlfa(hex: string, alfa: number): string {
    const valor = hex.replace('#', '');
    const r = parseInt(valor.substring(0, 2), 16);
    const g = parseInt(valor.substring(2, 4), 16);
    const b = parseInt(valor.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alfa})`;
  }

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.vistaLista = true;
    if (this.data) this.pintarGraficas();
  }

  trackByValor(_index: number, rango: { valor: string; label: string }): string {
    return rango.valor;
  }

  trackByProductoId(_index: number, producto: { id: string | number }): string | number {
    return producto.id;
  }

  cambiarRango(rango: string): void {
    if (rango === this.rangoActivo) return;
    this.rangoActivo = rango;
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.loading = true;
    this.dashboardService.getDashboard(this.rangoActivo).subscribe({
      next: (data) => {
        this.data = data;
        this.construirHeatmap(); // hay que rellenar heatmapMatriz ANTES de detectChanges(),
                                  // porque la tabla del heatmap se pinta ya en este ciclo
                                  // y si sigue en [] rompe con "can't access property X of undefined"
        this.loading = false;
        this.cdr.detectChanges();
        if (this.vistaLista) this.pintarGraficas();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private pintarGraficas(): void {
    if (!this.data) return;

    this.pintarGraficoVentas();
    this.pintarGraficoAov();
    this.pintarGraficoClientes();
    this.pintarGraficoEstados();
    this.pintarGraficoTop();
    this.pintarGraficoRotacion();

  }

  private pintarGraficoVentas(): void {
    if (this.chartVentas) this.chartVentas.destroy();
    if (!this.graficoVentasRef) return;

    const labels = this.data!.ventasPorDia.map(p => p.fecha);
    const valores = this.data!.ventasPorDia.map(p => p.total);
    const ctx = this.graficoVentasRef.nativeElement.getContext('2d')!;

    this.chartVentas = new Chart(this.graficoVentasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ventas (€)',
          data: valores,
          borderColor: COLOR.primarioTexto,
          backgroundColor: this.crearGradiente(ctx, COLOR.primario, 300),
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: COLOR.primarioTexto,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: COLOR.grid }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
          x: { grid: { display: false }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } }
        }
      }
    });
  }

  private pintarGraficoEstados(): void {
    if (this.chartEstados) this.chartEstados.destroy();
    if (!this.graficoEstadosRef) return;

    const entradas = Object.entries(this.data!.pedidosPorEstado);
    // orden logico del ciclo de vida del pedido: esperando -> pagado -> en
    // transito -> completado, con cancelado como unico estado "de alerta"
    const coloresPorEstado: Record<string, string> = {
      PENDIENTE: COLOR.secundario,
      PAGADO: COLOR.primarioTexto,
      ENVIADO: COLOR.primario,
      ENTREGADO: COLOR.completado,
      CANCELADO: COLOR.alerta
    };

    this.chartEstados = new Chart(this.graficoEstadosRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: entradas.map(([k]) => k),
        datasets: [{
          data: entradas.map(([, v]) => v),
          backgroundColor: entradas.map(([k]) => coloresPorEstado[k] || COLOR.ticks),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'circle', font: { size: 11, family: "'Inter', sans-serif" }, color: COLOR.ticks }
          }
        }
      }
    });
  }

  private pintarGraficoTop(): void {
    if (this.chartTop) this.chartTop.destroy();
    if (!this.graficoTopRef) return;

    this.chartTop = new Chart(this.graficoTopRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.data!.topProductos.map(p => p.nombre),
        datasets: [{
          label: 'Unidades vendidas',
          data: this.data!.topProductos.map(p => p.unidades),
          backgroundColor: COLOR.primario,
          borderRadius: 4,
          barThickness: 16
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { color: COLOR.grid }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
          y: { grid: { display: false }, ticks: { color: COLOR.ticks, font: { size: 11 } } }
        }
      }
    });
  }

  private pintarGraficoAov(): void {
  if (this.chartAov) this.chartAov.destroy();
  if (!this.graficoAovRef) return;

  const labels = this.data!.aovPorDia.map(p => p.fecha);
  const valores = this.data!.aovPorDia.map(p => p.ticketMedio);
  const ctx = this.graficoAovRef.nativeElement.getContext('2d')!;

  this.chartAov = new Chart(this.graficoAovRef.nativeElement, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Ticket medio (€)',
        data: valores,
        borderColor: COLOR.secundario,
        backgroundColor: this.crearGradiente(ctx, COLOR.secundario, 240),
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: COLOR.secundario,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: COLOR.grid }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
        x: { grid: { display: false }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } }
      }
    }
  });
  }

  private pintarGraficoClientes(): void {
  if (this.chartClientes) this.chartClientes.destroy();
  if (!this.graficoClientesRef) return;

  const labels = this.data!.clientesPorDia.map(p => p.fecha);

  this.chartClientes = new Chart(this.graficoClientesRef.nativeElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Nuevos',
          data: this.data!.clientesPorDia.map(p => p.nuevos),
          backgroundColor: COLOR.primario,
          borderRadius: 3,
          barThickness: 14
        },
        {
          label: 'Recurrentes',
          data: this.data!.clientesPorDia.map(p => p.recurrentes),
          backgroundColor: COLOR.secundario,
          borderRadius: 3,
          barThickness: 14
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'circle', font: { size: 11, family: "'Inter', sans-serif" }, color: COLOR.ticks } }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
        y: { stacked: true, beginAtZero: true, grid: { color: COLOR.grid }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } }
      }
    }
  });
  }

  private pintarGraficoRotacion(): void {
  if (this.chartRotacion) this.chartRotacion.destroy();
  if (!this.graficoRotacionRef) return;

  const datos = this.data!.rotacionPorCategoria;

  this.chartRotacion = new Chart(this.graficoRotacionRef.nativeElement, {
    type: 'bar',
    data: {
      labels: datos.map(d => d.categoria),
      datasets: [{
        label: 'Rotación (%)',
        data: datos.map(d => Math.round(d.ratioRotacion * 100)),
        // alta rotacion = va bien (primario); media = vigilar (secundario);
        // baja = alerta real, se esta acumulando stock sin vender
        backgroundColor: datos.map(d =>
          d.ratioRotacion >= 0.5 ? COLOR.primario : d.ratioRotacion >= 0.2 ? COLOR.secundario : COLOR.alerta
        ),
        borderRadius: 4,
        barThickness: 14
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const d = datos[ctx.dataIndex];
              return `Vendidas: ${d.unidadesVendidas} · Stock: ${d.stockActual}`;
            }
          }
        }
      },
      scales: {
        x: { beginAtZero: true, max: 100, grid: { color: COLOR.grid }, ticks: { color: COLOR.ticks, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
        y: { grid: { display: false }, ticks: { color: COLOR.ticks, font: { size: 11 } } }
      }
    }
  });
}


diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
horasDelDia = Array.from({ length: 24 }, (_, i) => i);

// matriz [dia][hora] con el numero de pedidos, para pintar la tabla
heatmapMatriz: number[][] = [];
heatmapMaximo = 1;

private construirHeatmap(): void {
  if (!this.data) return;

  // inicializamos 7x24 a 0
  this.heatmapMatriz = Array.from({ length: 7 }, () => Array(24).fill(0));
  this.heatmapMaximo = 1;

  for (const punto of this.data.heatmapPedidos) {
    const filaDia = punto.diaSemana - 1; // 1=lunes -> indice 0
    this.heatmapMatriz[filaDia][punto.hora] = punto.pedidos;
    if (punto.pedidos > this.heatmapMaximo) this.heatmapMaximo = punto.pedidos;
  }
}

// intensidad de 0 a 1 para pintar el color de fondo de cada celda
intensidad(dia: number, hora: number): number {
  return this.heatmapMatriz[dia]?.[hora] / this.heatmapMaximo || 0;
}

}