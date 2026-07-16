import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService, Producto } from '../../core/producto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  destacados: Producto[] = [];
  loading = true;

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.productoService.findDestacados().subscribe({
      next: (data) => {
        this.destacados = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}