import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.css'
})
export class BackToTop {
  visible = false;

  private readonly UMBRAL_PX = 400;
  // Distancia al final de la página a partir de la cual se oculta el botón,
  // para no solaparse con el contenido del footer (línea de copyright, etc.)
  private readonly MARGEN_FINAL_PX = 220;

  @HostListener('window:scroll')
  onScroll(): void {
    const distanciaAlFinal = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    const cercaDelFinal = distanciaAlFinal < this.MARGEN_FINAL_PX;
    this.visible = window.scrollY > this.UMBRAL_PX && !cercaDelFinal;
  }

  subir(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}