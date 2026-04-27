import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { MaquinaService } from '../../services/maquina.service';
import { Maquina } from '../../models/maquina.model';

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

  private dashboardService = inject(DashboardService);
  private maquinaService   = inject(MaquinaService);

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private animTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  stats: DashboardStats | null = null;

  displayMaquinas    = 0;
  displayManutencoes = 0;
  displayPecas       = 0;
  displayVencidas    = 0;

  barsUltimos6Meses: { mes: string; count: number; pct: number }[] = [];
  loading      = true;
  statsLoading = true;

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

    this.maquinaService.listar().pipe(catchError(() => of([]))).subscribe();
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
}
