import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

// protege /admin/**: exige rol ADMIN Y ademas haber confirmado la
// contraseña recientemente (menos de 15 minutos), como segunda barrera
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuario();

  if (!usuario || usuario.rol !== 'ADMIN') {
    router.navigate(['/']);
    return false;
  }

  const verificado = sessionStorage.getItem('adminVerificado');
  const QUINCE_MINUTOS = 15 * 60 * 1000;

  if (!verificado || Date.now() - Number(verificado) > QUINCE_MINUTOS) {
    router.navigate(['/admin/acceso']);
    return false;
  }

  return true;
};