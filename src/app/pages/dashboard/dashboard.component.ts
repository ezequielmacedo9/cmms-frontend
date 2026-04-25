import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { MaquinaService } from '../../services/maquina.service';
import { ManutencaoService } from '../../services/manutencao.service';
import { PecaService } from '../../services/peca.service';
import { Maquina } from '../../models/maquina.model';
import { ROLE_LABELS, ROLE_CSS } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('bar1') bar1!: ElementRef;
  @ViewChild('bar2') bar2!: ElementRef;
  @ViewChild('bar3') bar3!: ElementRef;
  @ViewChild('bar4') bar4!: ElementRef;

  private router           = inject(Router);
  private dashboardService = inject(DashboardService);
  private maquinaService   = inject(MaquinaService);
  private manutencaoService= inject(ManutencaoService);
  private pecaService      = inject(PecaService);
  readonly theme           = inject(ThemeService);
  readonly auth            = inject(AuthService);

  readonly ROLE_LABELS = ROLE_LABELS;
  readonly ROLE_CSS    = ROLE_CSS;

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private animTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  stats: DashboardStats | null = null;

  displayMaquinas    = 0;
  displayManutencoes = 0;
  displayPecas       = 0;
  displayVencidas    = 0;

  proximasManutencoes: { nome: string; setor: string; diasRestantes: number; urgente: boolean }[] = [];
  barsUltimos6Meses: { mes: string; count: number; pct: number }[] = [];
  loading      = true;
  statsLoading = true;

  get userName()  { return this.auth.getNome(); }
  get userRole()  { return this.auth.getRole(); }
  get userRoleLabel() { return this.userRole ? (ROLE_LABELS[this.userRole] ?? this.userRole) : ''; }
  get userRoleCSS()   { return this.userRole ? (ROLE_CSS[this.userRole] ?? '') : ''; }
  get userInitial()   { return this.userName.charAt(0).toUpperCase(); }
  get canManageUsers(){ return this.auth.canManageUsers(); }

  ngOnInit() {
    this.carregarDados();
    this.pollingInterval = setInterval(() => this.carregarDados(), 30000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.animTimers.forEach(t => clearInterval(t));
    this.animTimers.clear();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.bar1) this.bar1.nativeElement.style.width = '98%';
      if (this.bar2) this.bar2.nativeElement.style.width = '100%';
      if (this.bar3) this.bar3.nativeElement.style.width = '100%';
      if (this.bar4) this.bar4.nativeElement.style.width = '60%';
    }, 600);
  }

  carregarDados() {
    this.dashboardService.getStats().pipe(catchError(() => of(null))).subscribe(s => {
      if (s) {
        this.stats = s;
        this.animateNumber('displayMaquinas',    s.totalMaquinas);
        this.animateNumber('displayManutencoes', s.totalManutencoes);
        this.animateNumber('displayPecas',       s.totalPecas);
        this.animateNumber('displayVencidas',    s.manutencoesVencidas);
        const maxCount = Math.max(...s.ultimosSeisMeses.map(m => m.total), 1);
        this.barsUltimos6Meses = s.ultimosSeisMeses.map(m => ({
          mes: m.label, count: m.total,
          pct: Math.round((m.total / maxCount) * 100)
        }));
        this.statsLoading = false;
      }
      this.loading = false;
    });

    this.maquinaService.listar().pipe(catchError(() => of([]))).subscribe(m => {
      this.computeProximas(m);
    });
  }

  private computeProximas(maquinas: Maquina[]) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    this.proximasManutencoes = maquinas
      .filter(m => m.intervaloPreventivaDias && m.intervaloPreventivaDias > 0)
      .map(m => {
        let diasRestantes: number;
        if (m.dataUltimaManutencao) {
          const ultima  = new Date(m.dataUltimaManutencao);
          const proxima = new Date(ultima);
          proxima.setDate(proxima.getDate() + m.intervaloPreventivaDias!);
          diasRestantes = Math.ceil((proxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          diasRestantes = -999;
        }
        return { nome: m.nome, setor: m.setor, diasRestantes, urgente: diasRestantes <= 3 };
      })
      .filter(m => m.diasRestantes <= 7)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 5);
  }

  onKpiTilt(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const rx = ((event.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * -7;
    const ry = ((event.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) *  7;
    card.style.transform = `translateY(-6px) perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  onKpiLeave(event: MouseEvent) {
    (event.currentTarget as HTMLElement).style.transform = '';
  }

  private animateNumber(
    prop: 'displayMaquinas' | 'displayManutencoes' | 'displayPecas' | 'displayVencidas',
    target: number
  ) {
    const existing = this.animTimers.get(prop);
    if (existing) clearInterval(existing);
    if (target === 0) { (this as any)[prop] = 0; return; }
    const steps = 40;
    let current = 0;
    const timer = setInterval(() => {
      current += Math.ceil(target / steps);
      if (current >= target) {
        (this as any)[prop] = target;
        clearInterval(timer);
        this.animTimers.delete(prop);
      } else {
        (this as any)[prop] = current;
      }
    }, 1000 / steps);
    this.animTimers.set(prop, timer);
  }

  prioridadeLabel(p?: string): string {
    return ({ CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' } as any)[p ?? 'MEDIA'] ?? 'Média';
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
