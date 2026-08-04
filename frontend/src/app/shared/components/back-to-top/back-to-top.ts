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

  @HostListener('window:scroll')
  onScroll(): void {
    this.visible = window.scrollY > this.UMBRAL_PX;
  }

  subir(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}