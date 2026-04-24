import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MaquinaService } from '../../services/maquina.service';
import { ManutencaoService } from '../../services/manutencao.service';
import { PecaService } from '../../services/peca.service';
import { Maquina } from '../../models/maquina.model';
import { Manutencao } from '../../models/manutencao.model';

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

  private router = inject(Router);
  private maquinaService = inject(MaquinaService);
  private manutencaoService = inject(ManutencaoService);
  private pecaService = inject(PecaService);
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private animTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  totalMaquinas = 0;
  totalManutencoes = 0;
  totalPecas = 0;
  totalPendencias = 0;

  displayMaquinas = 0;
  displayManutencoes = 0;
  displayPecas = 0;
  displayPendencias = 0;

  proximasManutencoes: { nome: string; setor: string; diasRestantes: number; urgente: boolean }[] = [];
  barsUltimos6Meses: { mes: string; count: number; pct: number }[] = [];
  loading = true;

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
    let loaded = 0;
    const checkDone = () => { if (++loaded >= 3) this.loading = false; };

    this.maquinaService.listar().pipe(catchError(() => of([]))).subscribe(m => {
      this.totalMaquinas = m.length;
      this.animateNumber('displayMaquinas', m.length);
      this.computeProximas(m);
      checkDone();
    });
    this.manutencaoService.listar().pipe(catchError(() => of([]))).subscribe(m => {
      this.totalManutencoes = m.length;
      this.animateNumber('displayManutencoes', m.length);
      this.computeBarChart(m);
      checkDone();
    });
    this.pecaService.listar().pipe(catchError(() => of([]))).subscribe(p => {
      this.totalPecas = p.length;
      this.animateNumber('displayPecas', p.length);
      checkDone();
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
          const ultima = new Date(m.dataUltimaManutencao);
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

  private computeBarChart(manutencoes: Manutencao[]) {
    const nomeMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const hoje = new Date();
    const keys: string[] = [];
    const labels: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${d.getMonth()}`);
      labels.push(`${nomeMeses[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`);
    }

    const counts: { [k: string]: number } = {};
    keys.forEach(k => counts[k] = 0);

    manutencoes.forEach(m => {
      if (m.dataManutencao) {
        const d = new Date(m.dataManutencao);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (k in counts) counts[k]++;
      }
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    this.barsUltimos6Meses = keys.map((k, i) => ({
      mes: labels[i],
      count: counts[k],
      pct: Math.round((counts[k] / maxVal) * 100)
    }));
  }

  onKpiTilt(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -7;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 7;
    card.style.transform = `translateY(-6px) perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  onKpiLeave(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.style.transform = '';
  }

  private animateNumber(prop: 'displayMaquinas' | 'displayManutencoes' | 'displayPecas' | 'displayPendencias', target: number) {
    const existing = this.animTimers.get(prop);
    if (existing) clearInterval(existing);

    if (target === 0) {
      (this as any)[prop] = 0;
      return;
    }

    const steps = 40;
    const interval = 1000 / steps;
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
    }, interval);
    this.animTimers.set(prop, timer);
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia 👋';
    if (h < 18) return 'Boa tarde 👋';
    return 'Boa noite 👋';
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }
}
