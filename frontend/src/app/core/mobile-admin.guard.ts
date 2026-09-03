import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
 
// Breakpoint alineado con el que ya usas en los CSS (@media max-width: 768px)
const MOBILE_BREAKPOINT = 768;
 
// Bloquea el acceso a rutas de administración desde dispositivos móviles.
// Si detecta pantalla estrecha, redirige al perfil con un query param
// para poder mostrar un aviso ("Accede desde un ordenador de escritorio").
export const mobileAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
 
  const esMovil = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
 
  if (esMovil) {
    return router.createUrlTree(['/perfil'], {
      queryParams: { tab: 'perfil', adminBloqueado: '1' }
    });
  }
 
  return true;
};
 