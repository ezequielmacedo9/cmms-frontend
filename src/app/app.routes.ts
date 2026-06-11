import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role.guard';
import { LayoutComponent } from './shell/layout.component';

/**
 * Top-level routes.
 *
 * Public routes (login, forgot/reset password, 403, 404) ficam fora do
 * {@link LayoutComponent} para não exibir sidebar a quem ainda não está
 * autenticado.
 */
export const routes: Routes = [

  // ── Public ─────────────────────────────────────────────────────────
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Entrar · CMMS'
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent),
    title: 'Criar conta · CMMS'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Recuperar senha · CMMS'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Redefinir senha · CMMS'
  },
  {
    path: '403',
    loadComponent: () => import('./pages/forbidden/forbidden.component').then(m => m.ForbiddenComponent),
    title: '403 — Acesso negado'
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 — Página não encontrada'
  },

  // ── Authenticated (under app shell) ────────────────────────────────
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard · CMMS'
      },
      {
        path: 'maquinas',
        loadComponent: () => import('./pages/maquinas/maquinas.component').then(m => m.MaquinasComponent),
        title: 'Máquinas · CMMS'
      },
      {
        path: 'manutencoes',
        loadComponent: () => import('./pages/manutencoes/manutencoes.component').then(m => m.ManutencoesComponent),
        title: 'Manutenções · CMMS'
      },
      {
        path: 'estoque',
        loadComponent: () => import('./pages/estoque/estoque.component').then(m => m.EstoqueComponent),
        title: 'Estoque · CMMS'
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])],
        title: 'Usuários · CMMS'
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Meu perfil · CMMS'
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])],
        title: 'Configurações · CMMS'
      },
      {
        path: 'relatorios',
        loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR'])],
        title: 'Relatórios · CMMS'
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./pages/audit-log/audit-log.component').then(m => m.AuditLogComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])],
        title: 'Auditoria · CMMS'
      },
      {
        path: 'assinatura',
        loadComponent: () => import('./pages/billing/billing.component').then(m => m.BillingComponent),
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])],
        title: 'Assinatura · CMMS'
      }
    ]
  },

  // ── Catch-all ───────────────────────────────────────────────────────
  // Sem auth guard: usuário pode chegar aqui sem estar logado e a página
  // 404 oferece a navegação adequada (voltar ou ir ao dashboard).
  { path: '**', redirectTo: '/404' }
];
