import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'maquinas',
    loadComponent: () => import('./pages/maquinas/maquinas.component').then(m => m.MaquinasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'manutencoes',
    loadComponent: () => import('./pages/manutencoes/manutencoes.component').then(m => m.ManutencoesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'estoque',
    loadComponent: () => import('./pages/estoque/estoque.component').then(m => m.EstoqueComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'login' }
];
