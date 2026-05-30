import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { PecaService } from '../../services/peca.service';
import { NotificationService } from '../../services/notification.service';
import { ExportService } from '../../services/export.service';
import { ConfirmDialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { TableState } from '../../services/table-state';
import { PecaRequest, PecaResponse } from '../../models/peca.model';
import { EmptyStateComponent } from '../../components/empty-state.component';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule,
    MatProgressSpinnerModule,
    EmptyStateComponent
  ],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstoqueComponent implements OnInit, OnDestroy {
  private pecaService = inject(PecaService);
  private notify = inject(NotificationService);
  private exporter = inject(ExportService);
  private confirm = inject(ConfirmDialogService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private subs = new Subscription();

  /** Source list straight from the API. */
  pecas: PecaResponse[] = [];

  /** Search + sort + pagination, signal-driven. */
  readonly table = new TableState<PecaResponse>(
    p => [p.nome, p.codigo],
    { column: 'nome', direction: 'asc' }
  );

  showForm = false;
  editando = false;
  salvando = false;
  editandoId: number | null = null;
  carregando = true;
  searchTerm = '';
  form: PecaRequest = { nome: '', codigo: '', quantidadeEmEstoque: 0, custoUnitario: 0, vidaUtilHoras: 0 };

  ngOnInit() { this.carregar(); }
  ngOnDestroy() { this.subs.unsubscribe(); }

  onSearch() { this.table.setSearch(this.searchTerm); }
  onSort(column: string) { this.table.toggleSort(column); }
  sortDir(column: string) { return this.table.directionOf(column); }

  carregar() {
    this.carregando = true;
    const sub = this.pecaService.listar().subscribe({
      next: data => {
        this.pecas = data;
        this.table.setData(this.pecas);
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
    this.form = { nome: '', codigo: '', quantidadeEmEstoque: 0, custoUnitario: 0, vidaUtilHoras: 0 };
    this.editando = false;
    this.editandoId = null;
    this.showForm = true;
  }

  editar(peca: PecaResponse) {
    this.form = {
      nome: peca.nome, codigo: peca.codigo,
      quantidadeEmEstoque: peca.quantidadeEmEstoque,
      custoUnitario: peca.custoUnitario,
      vidaUtilHoras: peca.vidaUtilHoras
    };
    this.editando = true;
    this.editandoId = peca.id!;
    this.showForm = true;
  }

  salvar() {
    if (this.salvando) return;
    this.salvando = true;
    const op = this.editando && this.editandoId
      ? this.pecaService.atualizar(this.editandoId, this.form)
      : this.pecaService.cadastrar(this.form);

    const isEditing = this.editando;
    const sub = op.subscribe({
      next: (saved) => {
        this.salvando = false;
        this.showForm = false;
        this.notify.success(isEditing ? 'Peça atualizada!' : 'Peça cadastrada!');
        if (isEditing) {
          this.pecas = this.pecas.map(p => p.id === saved.id ? saved : p);
        } else {
          this.pecas = [...this.pecas, saved];
        }
        this.table.setData(this.pecas);
        this.cdr.markForCheck();
      },
      error: () => {
        this.salvando = false;
        this.notify.error('Erro ao salvar. Tente novamente.');
      }
    });
    this.subs.add(sub);
  }

  async confirmarExclusao(peca: PecaResponse) {
    const ok = await this.confirm.ask({
      title: 'Excluir peça?',
      message: `"${peca.nome}" (${peca.codigo}) será removida do estoque. Esta ação não pode ser desfeita.`,
      variant: 'danger',
      confirmLabel: 'Excluir'
    });
    if (ok && peca.id != null) this.deletar(peca.id);
  }

  private deletar(id: number) {
    const sub = this.pecaService.deletar(id).subscribe({
      next: () => {
        this.notify.success('Peça removida!');
        this.pecas = this.pecas.filter(p => p.id !== id);
        this.table.setData(this.pecas);
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Erro ao excluir.')
    });
    this.subs.add(sub);
  }

  exportarCSV() {
    this.exporter.downloadCsv(this.table.filtered(), [
      { header: 'ID',                  value: p => p.id ?? '' },
      { header: 'Código',              value: p => p.codigo },
      { header: 'Nome',                value: p => p.nome },
      { header: 'Qtd Estoque',         value: p => p.quantidadeEmEstoque },
      { header: 'Custo Unitário (R$)', value: p => p.custoUnitario },
      { header: 'Vida Útil (h)',       value: p => p.vidaUtilHoras }
    ], 'estoque');
  }

  voltar() { this.router.navigate(['/dashboard']); }
  cancelar() { this.showForm = false; }

  trackById(_index: number, item: PecaResponse): number {
    return item.id!;
  }
}
