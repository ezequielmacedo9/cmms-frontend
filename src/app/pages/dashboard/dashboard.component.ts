import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import {
  ApexAxisChartSeries, ApexChart, ApexFill, ApexNonAxisChartSeries,
  ApexPlotOptions, ApexResponsive, ApexStroke, ApexTooltip, ApexXAxis,
  ApexYAxis, ApexDataLabels, ApexLegend, ApexGrid, ApexMarkers, ApexStates,
  NgApexchartsModule
} from 'ng-apexcharts';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';

/** Polling cadence for live stats (ms). */
const POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatIconModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(DashboardService);

  // ── reactive state ──────────────────────────────────────────────────
  readonly stats   = signal<DashboardStats | null>(null);
  readonly loading = signal(true);

  // KPI displays with counter animation. Set straight from stats; the
  // visual count-up is done in CSS via @property + transition (no JS interval).
  readonly displayMaquinas    = computed(() => this.stats()?.totalMaquinas       ?? 0);
  readonly displayManutencoes = computed(() => this.stats()?.totalManutencoes    ?? 0);
  readonly displayPecas       = computed(() => this.stats()?.totalPecas          ?? 0);
  readonly displayVencidas    = computed(() => this.stats()?.manutencoesVencidas ?? 0);

  readonly disponibilidade = computed(() => this.stats()?.disponibilidade ?? 0);
  readonly mtbf            = computed(() => this.stats()?.mtbfDias        ?? 0);

  // ── chart options ───────────────────────────────────────────────────
  readonly trendSeries = computed<ApexAxisChartSeries>(() => {
    const months = this.stats()?.ultimosSeisMeses ?? [];
    return [{ name: 'Manutenções', data: months.map(m => m.total) }];
  });
  readonly trendCategories = computed(() => (this.stats()?.ultimosSeisMeses ?? []).map(m => m.label));

  readonly tipoSeries = computed<ApexNonAxisChartSeries>(() => {
    const s = this.stats();
    return [s?.manutencoesPreventivas ?? 0, s?.manutencoesCorretivas ?? 0];
  });

  readonly statusSeries = computed<ApexNonAxisChartSeries>(() => {
    const s = this.stats();
    return [s?.maquinasAtivas ?? 0, s?.maquinasEmManutencao ?? 0, s?.maquinasInativas ?? 0];
  });

  readonly trendChart: Partial<ChartConfig> = chartLineConfig();
  readonly donutTipo:  Partial<DonutConfig> = donutConfig(['#a78bfa', '#f59e0b'], ['Preventivas', 'Corretivas']);
  readonly donutStatus: Partial<DonutConfig> = donutConfig(
    ['#22c55e', '#f59e0b', '#6b7280'],
    ['Ativas', 'Em manutenção', 'Inativas']
  );

  constructor() {
    interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.dashboardService.getStats().pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(s => {
      if (s) this.stats.set(s);
      this.loading.set(false);
    });
  }

  // ── view helpers ────────────────────────────────────────────────────

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  prioridadeLabel(p?: string): string {
    const labels: Record<string, string> = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };
    return labels[p ?? 'MEDIA'] ?? 'Média';
  }

  prioridadeBadgeClass(p?: string): string {
    const map: Record<string, string> = {
      CRITICA: 'ui-badge--danger',
      ALTA:    'ui-badge--warning',
      MEDIA:   'ui-badge--info',
      BAIXA:   'ui-badge--muted'
    };
    return map[p ?? 'MEDIA'] ?? 'ui-badge--info';
  }
}

// ── chart factory helpers (kept out of the class to lighten the change-detection load) ──

interface ChartConfig {
  chart: ApexChart;
  stroke: ApexStroke;
  fill: ApexFill;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  markers: ApexMarkers;
  states: ApexStates;
  colors: string[];
}

interface DonutConfig {
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  responsive: ApexResponsive[];
  tooltip: ApexTooltip;
  states: ApexStates;
}

function chartLineConfig(): Partial<ChartConfig> {
  return {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 600, animateGradually: { enabled: false } },
      foreColor: 'rgba(255,255,255,0.55)',
      background: 'transparent'
    },
    colors: ['#a78bfa'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    grid: {
      borderColor: 'rgba(255,255,255,0.06)',
      strokeDashArray: 4,
      padding: { left: 10, right: 10, top: 0, bottom: 0 }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    markers: { size: 0, hover: { size: 6 } },
    tooltip: { theme: 'dark', x: { show: true } },
    xaxis: {
      axisBorder: { show: false },
      axisTicks:  { show: false },
      labels: { style: { fontFamily: 'Inter', fontSize: '11px' } }
    },
    yaxis: {
      labels: { style: { fontFamily: 'Inter', fontSize: '11px' } }
    },
    states: { hover: { filter: { type: 'lighten' } } }
  };
}

function donutConfig(colors: string[], labels: string[]): Partial<DonutConfig> {
  return {
    chart: {
      type: 'donut',
      height: 240,
      foreColor: 'rgba(255,255,255,0.65)',
      background: 'transparent',
      animations: { enabled: true, speed: 500 }
    },
    colors,
    labels,
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontFamily: 'Inter',
      fontSize: '12px',
      itemMargin: { horizontal: 8, vertical: 4 },
      markers: { size: 6, shape: 'circle' as const }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name:  { fontFamily: 'Inter', fontSize: '12px', color: 'rgba(255,255,255,0.55)' },
            value: { fontFamily: 'Inter', fontSize: '22px', fontWeight: 700, color: '#fafafa' },
            total: {
              show: true, label: 'Total', fontFamily: 'Inter', fontSize: '11px',
              color: 'rgba(255,255,255,0.55)'
            }
          }
        }
      }
    },
    tooltip: { theme: 'dark' },
    states: { hover: { filter: { type: 'lighten' } } },
    responsive: [{
      breakpoint: 560,
      options: { chart: { height: 220 }, legend: { position: 'bottom' } }
    }]
  };
}
