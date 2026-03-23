import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MaquinasComponent } from './pages/maquinas/maquinas.component';
import { ManutencoesComponent } from './pages/manutencoes/manutencoes.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'maquinas', component: MaquinasComponent, canActivate: [authGuard] },
  { path: 'manutencoes', component: ManutencoesComponent, canActivate: [authGuard] },
  { path: 'estoque', component: EstoqueComponent, canActivate: [authGuard] },
];