import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  nombre = '';
  email = '';
  password = '';
  error = '';
  success = false;
  loading = false;

   constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
  this.error = '';
  this.loading = true;

  this.authService.register({ nombre: this.nombre, email: this.email, password: this.password }).subscribe({
    next: (res) => {
      this.loading = false;
      // ya no hay sesion que iniciar: mandamos a la pantalla de codigo
      this.router.navigate(['/verificar-email'], { queryParams: { email: res.email } });
    },
    error: (err) => {
      this.loading = false;
      this.error = err.error?.error || 'Error al registrarse';
    }
  });
  }
}