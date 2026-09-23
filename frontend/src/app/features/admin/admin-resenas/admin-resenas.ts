import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResenaService, ResenaAdmin, EdicionResena } from '../../../core/resena';

type Orden = 'recientes' | 'antiguas' | 'estrellasDesc' | 'estrellasAsc' | 'editadas';

@Component({
  selector: 'app-admin-resenas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-resenas.html',
  styleUrl: './admin-resenas.css'
})
export class AdminResenas implements OnInit {
  resenas: ResenaAdmin[] = [];
  loading = true;
  filtroEstrellas = 0; // 0 = todas
  filtroTexto = '';
  soloEditadas = false;
  orden: Orden = 'recientes';

  // Historial de ediciones (carga bajo demanda)
  abiertas = new Set<number | string>();
  cargandoHistorial = new Set<number | string>();
  errorHistorial = new Set<number | string>();
  historiales = new Map<number | string, EdicionResena[]>();

  constructor(
    private resenaService: ResenaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarResenas();
  }

  private cargarResenas(): void {
    this.loading = true;
    this.resenaService.listarAdmin().subscribe({
      next: (data) => {
        this.resenas = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get resenasFiltradas(): ResenaAdmin[] {
    let resultado = this.resenas;

    if (this.filtroEstrellas > 0) {
      resultado = resultado.filter(r => r.estrellas === this.filtroEstrellas);
    }

    if (this.soloEditadas) {
      resultado = resultado.filter(r => r.numEdiciones > 0);
    }

    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(r =>
        r.productoNombre.toLowerCase().includes(texto) ||
        r.comentario.toLowerCase().includes(texto) ||
        r.usuarioNombre.toLowerCase().includes(texto)
      );
    }

    return this.ordenar(resultado);
  }

  get promedioEstrellas(): string {
    if (this.resenas.length === 0) return '0.0';
    const suma = this.resenas.reduce((acc, r) => acc + r.estrellas, 0);
    return (suma / this.resenas.length).toFixed(1);
  }

  private ordenar(lista: ResenaAdmin[]): ResenaAdmin[] {
    const copia = [...lista];
    switch (this.orden) {
      case 'antiguas':
        return copia.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'estrellasDesc':
        return copia.sort((a, b) => b.estrellas - a.estrellas);
      case 'estrellasAsc':
        return copia.sort((a, b) => a.estrellas - b.estrellas);
      case 'editadas':
        return copia.sort((a, b) => b.numEdiciones - a.numEdiciones);
      case 'recientes':
      default:
        return copia.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  inicial(nombre: string): string {
    return nombre?.trim().charAt(0).toUpperCase() || '?';
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroEstrellas = 0;
    this.soloEditadas = false;
  }

  toggleHistorial(r: ResenaAdmin): void {
    if (this.abiertas.has(r.id)) {
      this.abiertas.delete(r.id);
      return;
    }
    this.abiertas.add(r.id);
    if (this.historiales.has(r.id)) return;

    this.cargandoHistorial.add(r.id);
    this.errorHistorial.delete(r.id);
    this.resenaService.historialAdmin(r.id).subscribe({
      next: (h) => {
        this.historiales.set(r.id, h);
        this.cargandoHistorial.delete(r.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorHistorial.add(r.id);
        this.cargandoHistorial.delete(r.id);
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(resena: ResenaAdmin): void {
    if (!confirm(`¿Eliminar esta reseña de "${resena.productoNombre}"? Esta acción no se puede deshacer.`)) return;

    this.resenaService.eliminarAdmin(resena.id).subscribe({
      next: () => {
        this.resenas = this.resenas.filter(r => r.id !== resena.id);
        this.abiertas.delete(resena.id);
        this.historiales.delete(resena.id);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('No se pudo eliminar la reseña.');
      }
    });
  }
}