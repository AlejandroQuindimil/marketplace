import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { Toast } from './shared/components/toast/toast';
import { BackToTop } from './shared/components/back-to-top/back-to-top';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Footer, Toast, BackToTop],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'frontend';
  esRutaAdmin = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // comprobamos la ruta actual al arrancar (por si se entra
    // directamente por URL a /admin/...)
    this.esRutaAdmin = this.router.url.startsWith('/admin');

    // y la volvemos a comprobar en cada navegacion, para que al salir
    // de /admin vuelvan a aparecer navbar y footer sin recargar la pagina
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.esRutaAdmin = (event as NavigationEnd).url.startsWith('/admin');
      });
  }
}