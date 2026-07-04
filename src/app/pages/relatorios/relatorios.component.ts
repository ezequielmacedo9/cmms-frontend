import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReportService, ReportEntity, RelatorioGerencial } from '../../services/report.service';
import { NotificationService } from '../../services/notification.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.css'
})
export class RelatoriosComponent implements OnInit {
  private reportSvc = inject(ReportService);
  private notify    = inject(NotificationService);

  downloading = signal<string | null>(null);
  gerencial   = signal<RelatorioGerencial | null>(null);
  carregandoGerencial = signal(true);

  ngOnInit(): void {
    this.reportSvc.getGerencial().subscribe({
      next: g => { this.gerencial.set(g); this.carregandoGerencial.set(false); },
      error: () => this.carregandoGerencial.set(false)
    });
  }

  formatBRL(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  }

  reports: ReportCard[] = [
    { id: 'manutencoes', title: 'Manutenções',  description: 'Histórico completo de ordens de serviço e manutenções preventivas/corretivas.', icon: 'build',       color: '#7c3aed' },
    { id: 'maquinas',    title: 'Máquinas',      description: 'Inventário de ativos com status, localização e dados técnicos.', icon: 'precision_manufacturing', color: '#0ea5e9' },
    { id: 'estoque',     title: 'Estoque',        description: 'Posição atual de peças e insumos com valores e quantidades.', icon: 'inventory_2',  color: '#10b981' },
  ];

  download(id: string, format: 'pdf' | 'xlsx') {
    const key = `${id}-${format}`;
    if (this.downloading()) return;
    this.downloading.set(key);
    this.reportSvc.download(id as ReportEntity, format).subscribe({
      next: blob => {
        const ext  = format === 'pdf' ? 'pdf' : 'xlsx';
        const name = `relatorio-${id}-${new Date().toISOString().slice(0,10)}.${ext}`;
        this.reportSvc.triggerDownload(blob, name);
        this.notify.success(`Relatório de ${id} baixado com sucesso`);
        this.downloading.set(null);
      },
      error: () => {
        this.notify.error('Erro ao gerar relatório. Tente novamente.');
        this.downloading.set(null);
      }
    });
  }

  isDownloading(id: string, format: string) { return this.downloading() === `${id}-${format}`; }

  /**
   * Triggers the browser's native print dialog. The global @media print
   * stylesheet strips chrome (sidebar/topbar/toasts) and forces a clean
   * white-on-black layout that fits A4.
   */
  printPage(): void {
    window.print();
  }
}
