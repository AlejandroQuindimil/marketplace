import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Catalogo } from './features/catalogo/catalogo';
import { ProductoDetalle } from './features/producto-detalle/producto-detalle';
import { Favoritos } from './features/favoritos/favoritos';
import { Carrito } from './features/carrito/carrito';
import { Perfil } from './features/perfil/perfil';
import { VerificarEmail } from './features/auth/verificar-email/verificar-email';
import { AdminLayout } from './features/admin/admin-layout/admin-layout';
import { adminGuard } from './core/admin-guard';
import { AdminProductos } from './features/admin/admin-productos/admin-productos';
import { AdminProductoForm } from './features/admin/admin-producto-form/admin-producto-form';
import { AdminAcceso } from './features/admin/admin-acceso/admin-acceso';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'productos', component: Catalogo },
  { path: 'productos/:id', component: ProductoDetalle },
  { path: 'favoritos', component: Favoritos },
  { path: 'carrito', component: Carrito },
  { path: 'perfil', component: Perfil },
  { path: 'verificar-email', component: VerificarEmail },
  { path: 'admin/acceso', component: AdminAcceso },

  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: 'productos', component: AdminProductos },
      { path: 'productos/nuevo', component: AdminProductoForm },
      { path: 'productos/:id/editar', component: AdminProductoForm },
      { path: 'dashboard', component: AdminDashboard },
    ]
  }
];