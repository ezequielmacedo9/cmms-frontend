import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role.guard';
import { LayoutComponent } from './shell/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'maquinas',
        loadComponent: () => import('./pages/maquinas/maquinas.component').then(m => m.MaquinasComponent)
      },
      {
        path: 'manutencoes',
        loadComponent: () => import('./pages/manutencoes/manutencoes.component').then(m => m.ManutencoesComponent)
      },
      {
        path: 'estoque',
        loadComponent: () => import('./pages/estoque/estoque.component').then(m => m.EstoqueComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])]
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])]
      },
      {
        path: 'relatorios',
        loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR'])]
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./pages/audit-log/audit-log.component').then(m => m.AuditLogComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])]
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
