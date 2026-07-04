import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { MaquinaService } from '../../services/maquina.service';
import { ManutencaoService } from '../../services/manutencao.service';
import { NotificationService } from '../../services/notification.service';
import { ExportService } from '../../services/export.service';
import { ReportService } from '../../services/report.service';
import { ConfirmDialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { TableState } from '../../services/table-state';
import { Maquina } from '../../models/maquina.model';
import { Manutencao } from '../../models/manutencao.model';
import { ActivatedRoute, Router } from '@angular/router';
import { EmptyStateComponent } from '../../components/empty-state.component';

@Component({
  selector: 'app-maquinas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule,
    EmptyStateComponent
  ],
  templateUrl: './maquinas.component.html',
  styleUrl: './maquinas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaquinasComponent implements OnInit, OnDestroy {
  private maquinaService = inject(MaquinaService);
  private manutencaoService = inject(ManutencaoService);
  private notify = inject(NotificationService);
  private exporter = inject(ExportService);
  private reports = inject(ReportService);
  private confirm = inject(ConfirmDialogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private subs = new Subscription();

  /** Machine id coming from a QR-code deep link (?id=...), consumed once. */
  private deepLinkId: number | null = null;

  /** Source list straight from the API — the dropdown filter narrows this. */
  maquinas: Maquina[] = [];

  /** Search + sort + pagination, signal-driven. */
  readonly table = new TableState<Maquina>(
    m => [m.nome, m.setor, m.status, m.prioridade],
    { column: 'nome', direction: 'asc' }
  );

  showForm = false;
  editando = false;
  salvando = false;
  form: Maquina = { nome: '', setor: '', status: 'ATIVO' };

  carregando = true;
  searchTerm = '';
  filterStatus = '';

  // History modal
  showHistory = false;
  historyMaquina: Maquina | null = null;
  historicoManutencoes: Manutencao[] = [];
  carregandoHistorico = false;

  ngOnInit() {
    const raw = this.route.snapshot.queryParamMap.get('id');
    this.deepLinkId = raw && /^\d+$/.test(raw) ? Number(raw) : null;
    this.carregar();
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  carregar() {
    this.carregando = true;
    const sub = this.maquinaService.listar().subscribe({
      next: data => {
        this.maquinas = data;
        this.applyFilter();
        this.carregando = false;
        this.consumeDeepLink();
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
    this.subs.add(sub);
  }

  /**
   * QR-code deep link: after the list loads, focus the referenced machine —
   * narrows the table to it and opens its history modal.
   */
  private consumeDeepLink() {
    if (this.deepLinkId == null) return;
    const alvo = this.maquinas.find(m => m.id === this.deepLinkId);
    this.deepLinkId = null;
    if (!alvo) {
      this.notify.error('Máquina do QR code não encontrada.');
      return;
    }
    this.searchTerm = alvo.nome;
    this.onSearch();
    this.verHistorico(alvo);
  }

  /** Re-feeds the table with the status-filtered slice (search stays applied). */
  applyFilter() {
    const rows = this.filterStatus
      ? this.maquinas.filter(m => m.status === this.filterStatus)
      : this.maquinas;
    this.table.setData(rows);
  }

  onSearch() { this.table.setSearch(this.searchTerm); }
  onSort(column: string) { this.table.toggleSort(column); }
  sortDir(column: string) { return this.table.directionOf(column); }

  novoRegistro() {
    this.form = { nome: '', setor: '', status: 'ATIVO' };
    this.editando = false;
    this.showForm = true;
  }

  editar(maquina: Maquina) {
    this.form = { ...maquina };
    this.editando = true;
    this.showForm = true;
  }

  salvar() {
    if (!this.form.nome?.trim() || !this.form.setor?.trim()) {
      this.notify.error('Preencha nome e setor');
      return;
    }
    this.salvando = true;
    const op = this.editando && this.form.id
      ? this.maquinaService.atualizar(this.form.id, this.form)
      : this.maquinaService.cadastrar(this.form);

    const isEditing = this.editando;
    const sub = op.subscribe({
      next: (saved) => {
        this.salvando = false;
        this.showForm = false;
        this.notify.success(isEditing ? 'Máquina atualizada!' : 'Máquina cadastrada!');
        if (isEditing) {
          this.maquinas = this.maquinas.map(m => m.id === saved.id ? saved : m);
        } else {
          this.maquinas = [...this.maquinas, saved];
        }
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {
        this.salvando = false;
        this.notify.error('Erro ao salvar. Tente novamente.');
      }
    });
    this.subs.add(sub);
  }

  async confirmarExclusao(maquina: Maquina) {
    const ok = await this.confirm.ask({
      title: 'Excluir máquina?',
      message: `"${maquina.nome}" será removida permanentemente. Esta ação não pode ser desfeita.`,
      variant: 'danger',
      confirmLabel: 'Excluir'
    });
    if (ok && maquina.id != null) this.deletar(maquina.id);
  }

  private deletar(id: number) {
    const sub = this.maquinaService.deletar(id).subscribe({
      next: () => {
        this.notify.success('Máquina removida!');
        this.maquinas = this.maquinas.filter(m => m.id !== id);
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Erro ao excluir.')
    });
    this.subs.add(sub);
  }

  verHistorico(maquina: Maquina) {
    this.historyMaquina = maquina;
    this.showHistory = true;
    this.historicoManutencoes = [];
    this.carregandoHistorico = true;
    const sub = this.manutencaoService.listarPorMaquina(maquina.id!).subscribe({
      next: (data) => {
        this.historicoManutencoes = data;
        this.carregandoHistorico = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregandoHistorico = false;
        this.notify.error('Erro ao carregar histórico.');
        this.cdr.markForCheck();
      }
    });
    this.subs.add(sub);
  }

  fecharHistorico() {
    this.showHistory = false;
    this.historyMaquina = null;
    this.historicoManutencoes = [];
  }

  /** Downloads the printable QR label that deep-links back to this machine. */
  baixarQr(m: Maquina) {
    if (m.id == null) return;
    const sub = this.reports.downloadQrCode(m.id).subscribe({
      next: blob => this.reports.triggerDownload(blob, `maquina-${m.id}-qr.png`),
      error: () => this.notify.error('Erro ao gerar o QR code.')
    });
    this.subs.add(sub);
  }

  exportarCSV() {
    this.exporter.downloadCsv(this.table.filtered(), [
      { header: 'ID',                           value: m => m.id ?? '' },
      { header: 'Nome',                         value: m => m.nome },
      { header: 'Setor',                        value: m => m.setor },
      { header: 'Status',                       value: m => m.status },
      { header: 'Intervalo Preventiva (dias)',  value: m => m.intervaloPreventivaDias ?? 0 },
      { header: 'Última Manutenção',            value: m => m.dataUltimaManutencao ?? '' }
    ], 'maquinas');
  }

  cancelar() { this.showForm = false; }
  voltar() { this.router.navigate(['/dashboard']); }

  trackById(_index: number, item: Maquina): number {
    return item.id!;
  }
}
