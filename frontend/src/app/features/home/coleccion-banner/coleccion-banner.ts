import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-coleccion-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './coleccion-banner.html',
  styleUrl: './coleccion-banner.css'
})
export class ColeccionBanner {
  @Input() titulo = '';
  @Input() descripcion = '';
  @Input() imagenes: string[] = [];
  @Input() ctaTexto = 'Ver colección';
  /** Query params para el botón, p.ej. { genero: 'HOMBRE' } */
  @Input() ctaQueryParams: { categoria?: string; genero?: string } = {};

  indiceImagen = 0;
  

  siguienteImagen(): void {
    if (this.imagenes.length < 2) { return; }
    this.indiceImagen = (this.indiceImagen + 1) % this.imagenes.length;
  }
}