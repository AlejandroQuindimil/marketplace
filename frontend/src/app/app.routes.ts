import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Catalogo } from './features/catalogo/catalogo';
import { ProductoDetalle } from './features/producto-detalle/producto-detalle';
import { Favoritos } from './features/favoritos/favoritos';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'productos', component: Catalogo },
  { path: 'productos/:id', component: ProductoDetalle },
  { path: 'favoritos', component: Favoritos },
];