import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verificar-email.html',
  styleUrl: './verificar-email.css'
})
export class VerificarEmail implements OnInit, OnDestroy {
  email = '';
  codigo = '';
  error = '';
  mensaje = '';
  verificando = false;
  reenviando = false;

  // Lógica del Timer
  tiempoRestante = 60;
  timerActivo = false;
  private intervalId: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef // Inyectamos el detector de cambios
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
    this.iniciarTimer();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  iniciarTimer(): void {
    this.tiempoRestante = 60;
    this.timerActivo = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      } else {
        this.timerActivo = false;
        clearInterval(this.intervalId);
      }
      // Forzamos a Angular a redibujar el HTML en cada segundo
      this.cdr.detectChanges();
    }, 1000);
  }

  verificar(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.codigo || this.codigo.length !== 6) {
      this.error = 'Introduce el código de 6 dígitos que te hemos enviado.';
      return;
    }

    this.verificando = true;

    this.authService.verifyEmail(this.email, this.codigo).subscribe({
      next: () => {
        this.verificando = false;
        this.mensaje = '¡Cuenta verificada! Ya puedes iniciar sesión.';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.verificando = false;
        this.error = err.error?.error || 'No se pudo verificar el código.';
      }
    });
  }

  reenviarCodigo(): void {
    if (this.timerActivo || this.reenviando) return;

    this.error = '';
    this.mensaje = '';
    this.reenviando = true;

    this.authService.resendCode(this.email).subscribe({
      next: () => {
        this.reenviando = false;
        this.mensaje = 'Te hemos enviado un nuevo código.';
        this.iniciarTimer();
      },
      error: (err) => {
        this.reenviando = false;
        this.error = err.error?.error || 'No se pudo reenviar el código.';
      }
    });
  }
}