import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Heart, ShoppingCart, Search } from 'lucide-angular';
import { AuthService } from '../../../core/auth';

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

  readonly UserIcon = User;
  readonly HeartIcon = Heart;
  readonly CartIcon = ShoppingCart;
  readonly SearchIcon = Search;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();

    this.router.events.subscribe(() => {
      const params = this.route.snapshot.queryParams;
      this.busqueda = params['buscar'] || '';
    });
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
}