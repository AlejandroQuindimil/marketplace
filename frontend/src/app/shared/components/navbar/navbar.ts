import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Heart, ShoppingCart, Search } from 'lucide-angular';
import { AuthService } from '../../../core/auth';
import { CarritoService } from '../../../core/carrito';
import { HostListener, ElementRef } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  usuario: { nombre: string } | null = null;
  busqueda = '';
  totalCarrito = 0;
  generos = [
    { valor: 'HOMBRE', label: 'Hombre' },
    { valor: 'MUJER', label: 'Mujer' }
  ];

columnasMenuHombre = [
  {
    items: [
      { valor: '', label: 'Todo Hombre', destacado: true },
      { valor: '', label: 'Novedades' },
      
    ]
  },
  {
    items: [
      { valor: 'PANTALONES', label: 'Pantalones', destacado: true },
      { valor: 'CHAQUETAS', label: 'Chaquetas y Chalecos' },
      { valor: 'JERSEYS', label: 'Punto' },
      { valor: 'SUDADERAS', label: 'Sudaderas' }
    ]
  },
  {
    items: [
      { valor: 'CAMISAS', label: 'Camisas', destacado: true },
      { valor: 'CAMISETAS', label: 'Camisetas y Polos' },
      { valor: 'VAQUEROS', label: 'Vaqueros' },
      { valor: 'ABRIGOS', label: 'Petos' }
    ]
  },
  {
    items: [
      { valor: 'SHORTS', label: 'Shorts y Bañadores', destacado: true },
      { valor: 'ROPA_INTERIOR', label: 'Ropa Interior' },
      { valor: 'ACCESORIOS', label: 'Accesorios' },
      { valor: '', label: 'Gadgets' }
    ]
  },
  {
    items: [
      { valor: 'ZAPATILLAS', label: 'Zapatillas', destacado: true },
      { valor: '', label: 'Colaboraciones' },
      { valor: '', label: 'Rebajas' }
    ]
  }
];

columnasMenuMujer = [
  {
    items: [
      { valor: '', label: 'Todo Mujer', destacado: true },
      { valor: '', label: 'Novedades' },
    ]
  },
  {
    items: [
      { valor: 'VESTIDOS', label: 'Vestidos', destacado: true },
      { valor: 'FALDAS', label: 'Faldas' },
      { valor: 'PANTALONES', label: 'Pantalones' },
      { valor: 'VAQUEROS', label: 'Vaqueros' }
    ]
  },
  {
    items: [
      { valor: 'CAMISETAS', label: 'Camisetas y Tops', destacado: true },
      { valor: 'CAMISAS', label: 'Camisas y Blusas' },
      { valor: 'JERSEYS', label: 'Punto' },
      { valor: 'SUDADERAS', label: 'Sudaderas' }
    ]
  },
  {
    items: [
      { valor: 'ABRIGOS', label: 'Abrigos', destacado: true },
      { valor: 'CHAQUETAS', label: 'Chaquetas' },
      { valor: 'ROPA_INTERIOR', label: 'Ropa Interior' },
      { valor: 'ACCESORIOS', label: 'Accesorios' }
    ]
  },
  {
    items: [
      { valor: 'ZAPATILLAS', label: 'Zapatos', destacado: true },
      { valor: '', label: 'Colaboraciones' },
      { valor: '', label: 'Rebajas' }
    ]
  }
];

  readonly UserIcon = User;
  readonly HeartIcon = Heart;
  readonly CartIcon = ShoppingCart;
  readonly SearchIcon = Search;

  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public carritoService: CarritoService,
    private elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
  this.usuario = this.authService.getUsuario();
  this.actualizarContadorCarrito();

  this.router.events.subscribe(() => {
    this.usuario = this.authService.getUsuario();
    this.actualizarContadorCarrito();
    const params = this.route.snapshot.queryParams;
    this.busqueda = params['buscar'] || '';
  });
}

@HostListener('document:click', ['$event'])
onClickOutside(event: Event): void {
  if (this.menuAbierto && !this.elementRef.nativeElement.contains(event.target)) {
    this.menuAbierto = false;
  }
}
menuAbierto = false;

toggleMenu(): void {
  this.menuAbierto = !this.menuAbierto;
}

cerrarMenu(): void {
  this.menuAbierto = false;
}

actualizarContadorCarrito(): void {
  this.totalCarrito = this.carritoService.getCount();
}
  buscar(): void {
    if (this.busqueda.trim()) {
      this.router.navigate(['/productos'], { queryParams: { buscar: this.busqueda.trim() } });
    }
  }

  logout(): void {
  this.authService.logout();
  this.usuario = null;
  window.location.href = '/';
  }

generoAbierto: string | null = null;
private cerrarTimeout: any = null;

abrirSubmenu(genero: string): void {
  if (this.cerrarTimeout) {
    clearTimeout(this.cerrarTimeout);
    this.cerrarTimeout = null;
  }
  this.generoAbierto = genero;
}

cerrarSubmenuConRetraso(): void {
  this.cerrarTimeout = setTimeout(() => {
    this.generoAbierto = null;
  }, 150);
}

cerrarSubmenuInmediato(): void {
  if (this.cerrarTimeout) clearTimeout(this.cerrarTimeout);
  this.generoAbierto = null;
}

get columnasMenuActivo() {
  return this.generoAbierto === 'MUJER' ? this.columnasMenuMujer : this.columnasMenuHombre;
}
}
