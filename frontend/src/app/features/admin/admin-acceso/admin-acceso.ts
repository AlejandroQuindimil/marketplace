import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../core/usuario';

@Component({
  selector: 'app-admin-acceso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-acceso.html',
  styleUrl: './admin-acceso.css'
})
export class AdminAcceso {
  password = '';
  error = '';
  verificando = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  confirmar(): void {
    this.error = '';

    if (!this.password) {
      this.error = 'Introduce tu contraseña.';
      return;
    }

    this.verificando = true;

    this.usuarioService.verificarPassword(this.password).subscribe({
      next: (res) => {
        this.verificando = false;
        if (res.valido) {
          // marcamos que se acaba de verificar, el guard del panel
          // admin lo comprueba antes de dejar pasar
          sessionStorage.setItem('adminVerificado', Date.now().toString());
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error = 'Contraseña incorrecta.';
        }
      },
      error: () => {
        this.verificando = false;
        this.error = 'Contraseña incorrecta.';
      }
    });
  }
}