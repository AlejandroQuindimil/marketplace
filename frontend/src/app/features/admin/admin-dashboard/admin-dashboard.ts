import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DashboardService, DashboardData } from '../../../core/dashboard';

Chart.register(...registerables);

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

  data: DashboardData | null = null;
  loading = true;
  rangoActivo = 'mes';

  private chartVentas: Chart | null = null;
  private chartEstados: Chart | null = null;
  private chartTop: Chart | null = null;

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
    this.pintarGraficoEstados();
    this.pintarGraficoTop();
  }

  private pintarGraficoVentas(): void {
    if (this.chartVentas) this.chartVentas.destroy();
    if (!this.graficoVentasRef) return;

    const labels = this.data!.ventasPorDia.map(p => p.fecha);
    const valores = this.data!.ventasPorDia.map(p => p.total);

    this.chartVentas = new Chart(this.graficoVentasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ventas (€)',
          data: valores,
          borderColor: '#0f6e64',
          backgroundColor: 'rgba(15,110,100,0.08)',
          tension: 0.3,
          fill: true,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private pintarGraficoEstados(): void {
    if (this.chartEstados) this.chartEstados.destroy();
    if (!this.graficoEstadosRef) return;

    const entradas = Object.entries(this.data!.pedidosPorEstado);
    const coloresPorEstado: Record<string, string> = {
      PENDIENTE: '#eab308',
      PAGADO: '#0f6e64',
      ENVIADO: '#6366f1',
      ENTREGADO: '#2f7d4f'
    };

    this.chartEstados = new Chart(this.graficoEstadosRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: entradas.map(([k]) => k),
        datasets: [{
          data: entradas.map(([, v]) => v),
          backgroundColor: entradas.map(([k]) => coloresPorEstado[k] || '#ccc'),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
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
          backgroundColor: '#0f6e64',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { color: '#f0f0f0' } },
          y: { grid: { display: false } }
        }
      }
    });
  }
}