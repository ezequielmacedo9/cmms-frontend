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
import { NotificationService } from '../../services/notification.service';
import { ExportService } from '../../services/export.service';
import { ConfirmDialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { TableState } from '../../services/table-state';
import { Manutencao } from '../../models/manutencao.model';
import { Maquina } from '../../models/maquina.model';
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
    this.showForm = true;
  }

  salvar() {
    if (!this.maquinaIdSelecionada) {
      this.notify.error('Selecione uma máquina!');
      return;
    }
    if (this.salvando) return;
    this.salvando = true;
    const sub = this.manutencaoService.cadastrar(this.maquinaIdSelecionada, this.form).subscribe({
      next: (saved) => {
        this.salvando = false;
        this.showForm = false;
        this.notify.success('Manutenção registrada!');
        this.manutencoes = [...this.manutencoes, saved];
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {
        this.salvando = false;
        this.notify.error('Erro ao registrar. Tente novamente.');
      }
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
