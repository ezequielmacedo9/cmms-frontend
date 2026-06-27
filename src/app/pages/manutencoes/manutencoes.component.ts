import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ManutencaoService } from '../../services/manutencao.service';
import { MaquinaService } from '../../services/maquina.service';
import { PecaService } from '../../services/peca.service';
import { NotificationService } from '../../services/notification.service';
import { ExportService } from '../../services/export.service';
import { ConfirmDialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { TableState } from '../../services/table-state';
import { Manutencao } from '../../models/manutencao.model';
import { Maquina } from '../../models/maquina.model';
import { PecaResponse } from '../../models/peca.model';
import { EmptyStateComponent } from '../../components/empty-state.component';

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCardModule, MatProgressSpinnerModule,
    EmptyStateComponent
  ],
  templateUrl: './manutencoes.component.html',
  styleUrl: './manutencoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManutencoesComponent implements OnInit, OnDestroy {
  private manutencaoService = inject(ManutencaoService);
  private maquinaService = inject(MaquinaService);
  private pecaService = inject(PecaService);
  private notify = inject(NotificationService);
  private exporter = inject(ExportService);
  private confirm = inject(ConfirmDialogService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private subs = new Subscription();

  /** Source list straight from the API — the type dropdown narrows this. */
  manutencoes: Manutencao[] = [];
  maquinas: Maquina[] = [];

  /** Search + sort + pagination, signal-driven. */
  readonly table = new TableState<Manutencao>(
    m => [m.maquina?.nome, m.tecnico, m.descricao, m.tipo],
    { column: 'dataManutencao', direction: 'desc' }
  );

  showForm = false;
  salvando = false;
  maquinaIdSelecionada: number | null = null;
  form: Manutencao = { tipo: '', tecnico: '' };

  /** Catalog of parts + the parts the user is adding to the current work order. */
  pecas: PecaResponse[] = [];
  pecasConsumo: { pecaId: number; nome: string; quantidade: number; custo: number }[] = [];
  novaPecaId: number | null = null;
  novaPecaQtd = 1;

  carregando = true;
  searchTerm = '';
  filterTipo = '';

  ngOnInit() {
    this.carregar();
    const sub = this.maquinaService.listar().subscribe(m => {
      this.maquinas = m;
      this.cdr.markForCheck();
    });
    this.subs.add(sub);
    const subP = this.pecaService.listar().subscribe(p => {
      this.pecas = p;
      this.cdr.markForCheck();
    });
    this.subs.add(subP);
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  /** Re-feeds the table with the type-filtered slice (search stays applied). */
  applyFilter() {
    const rows = this.filterTipo
      ? this.manutencoes.filter(m => m.tipo === this.filterTipo)
      : this.manutencoes;
    this.table.setData(rows);
  }

  onSearch() { this.table.setSearch(this.searchTerm); }
  onSort(column: string) { this.table.toggleSort(column); }
  sortDir(column: string) { return this.table.directionOf(column); }

  carregar() {
    this.carregando = true;
    const sub = this.manutencaoService.listar().subscribe({
      next: data => {
        this.manutencoes = data;
        this.applyFilter();
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
    this.subs.add(sub);
  }

  novoRegistro() {
    this.form = { tipo: '', tecnico: '' };
    this.maquinaIdSelecionada = null;
    this.pecasConsumo = [];
    this.novaPecaId = null;
    this.novaPecaQtd = 1;
    this.showForm = true;
  }

  addPeca() {
    if (this.novaPecaId == null || this.novaPecaQtd <= 0) return;
    const peca = this.pecas.find(p => p.id === this.novaPecaId);
    if (!peca) return;
    this.pecasConsumo = [...this.pecasConsumo, {
      pecaId: peca.id!, nome: peca.nome, quantidade: this.novaPecaQtd, custo: peca.custoUnitario
    }];
    this.novaPecaId = null;
    this.novaPecaQtd = 1;
  }

  removePeca(index: number) {
    this.pecasConsumo = this.pecasConsumo.filter((_, i) => i !== index);
  }

  get custoPecasPreview(): number {
    return this.pecasConsumo.reduce((sum, p) => sum + p.quantidade * p.custo, 0);
  }

  salvar() {
    if (!this.maquinaIdSelecionada) {
      this.notify.error('Selecione uma máquina!');
      return;
    }
    if (this.salvando) return;
    this.salvando = true;
    const payload: Manutencao = {
      ...this.form,
      pecas: this.pecasConsumo.length
        ? this.pecasConsumo.map(p => ({ pecaId: p.pecaId, quantidade: p.quantidade }))
        : undefined
    };
    const sub = this.manutencaoService.cadastrar(this.maquinaIdSelecionada, payload).subscribe({
      next: (saved) => {
        this.salvando = false;
        this.showForm = false;
        this.notify.success('Ordem de serviço registrada!');
        this.manutencoes = [...this.manutencoes, saved];
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.salvando = false;
        this.notify.error(err?.status === 403
          ? 'Sem permissão ou limite do plano atingido.'
          : 'Erro ao registrar. Verifique o estoque das peças.');
      }
    });
    this.subs.add(sub);
  }

  concluir(m: Manutencao) {
    if (m.id == null || m.status === 'CONCLUIDA') return;
    const sub = this.manutencaoService.alterarStatus(m.id, 'CONCLUIDA').subscribe({
      next: (saved) => {
        this.notify.success('OS concluída!');
        this.manutencoes = this.manutencoes.map(x => x.id === saved.id ? saved : x);
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Erro ao concluir a OS.')
    });
    this.subs.add(sub);
  }

  async confirmarExclusao(manutencao: Manutencao) {
    const ok = await this.confirm.ask({
      title: 'Excluir manutenção?',
      message: 'Esta ordem de serviço será removida permanentemente. Esta ação não pode ser desfeita.',
      variant: 'danger',
      confirmLabel: 'Excluir'
    });
    if (ok && manutencao.id != null) this.deletar(manutencao.id);
  }

  private deletar(id: number) {
    const sub = this.manutencaoService.deletar(id).subscribe({
      next: () => {
        this.notify.success('Manutenção removida!');
        this.manutencoes = this.manutencoes.filter(m => m.id !== id);
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Erro ao excluir.')
    });
    this.subs.add(sub);
  }

  exportarCSV() {
    this.exporter.downloadCsv(this.table.filtered(), [
      { header: 'ID',         value: m => m.id ?? '' },
      { header: 'Máquina',    value: m => m.maquina?.nome ?? '' },
      { header: 'Tipo',       value: m => m.tipo },
      { header: 'Prioridade', value: m => m.prioridade ?? '' },
      { header: 'Técnico',    value: m => m.tecnico },
      { header: 'Descrição',  value: m => m.descricao ?? '' },
      { header: 'Data',       value: m => m.dataManutencao ?? '' }
    ], 'manutencoes');
  }

  trackById(_index: number, item: Manutencao): number { return item.id!; }

  voltar() { this.router.navigate(['/dashboard']); }
  cancelar() { this.showForm = false; }
}
