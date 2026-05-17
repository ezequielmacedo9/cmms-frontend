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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private subs = new Subscription();

  manutencoes: Manutencao[] = [];
  maquinas: Maquina[] = [];
  displayedColumns = ['maquina', 'tipo', 'tecnico', 'data', 'acoes'];
  showForm = false;
  salvando = false;
  deletandoId: number | null = null;
  maquinaIdSelecionada: number | null = null;
  form: Manutencao = { tipo: '', tecnico: '' };

  carregando = true;
  searchTerm = '';
  filterTipo = '';
  pageSize = 10;
  currentPage = 0;

  ngOnInit() {
    this.carregar();
    const sub = this.maquinaService.listar().subscribe(m => this.maquinas = m);
    this.subs.add(sub);
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  get manutencoesFiltradas(): Manutencao[] {
    let filtered = [...this.manutencoes];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.maquina?.nome.toLowerCase().includes(term) ||
        m.tecnico.toLowerCase().includes(term) ||
        (m.descricao?.toLowerCase().includes(term) ?? false)
      );
    }
    if (this.filterTipo) {
      filtered = filtered.filter(m => m.tipo === this.filterTipo);
    }
    return filtered;
  }

  get totalPages(): number {
    return Math.ceil(this.manutencoesFiltradas.length / this.pageSize) || 1;
  }

  get pagedManutencoes(): Manutencao[] {
    const start = this.currentPage * this.pageSize;
    return this.manutencoesFiltradas.slice(start, start + this.pageSize);
  }

  applyFilter() { this.currentPage = 0; }
  nextPage() { if (this.currentPage < this.totalPages - 1) this.currentPage++; }
  prevPage() { if (this.currentPage > 0) this.currentPage--; }

  carregar() {
    this.carregando = true;
    const sub = this.manutencaoService.listar().subscribe({
      next: data => {
        this.manutencoes = data;
        this.currentPage = 0;
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.salvando = false;
        this.notify.error('Erro ao registrar. Tente novamente.');
      }
    });
    this.subs.add(sub);
  }

  confirmarDelete(id: number) { this.deletandoId = id; }
  cancelarDelete() { this.deletandoId = null; }

  deletar(id: number) {
    this.deletandoId = null;
    const sub = this.manutencaoService.deletar(id).subscribe({
      next: () => {
        this.notify.success('Manutenção removida!');
        this.manutencoes = this.manutencoes.filter(m => m.id !== id);
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Erro ao excluir.')
    });
    this.subs.add(sub);
  }

  exportarCSV() {
    const header = 'ID,Máquina,Tipo,Técnico,Descrição,Data';
    const rows = this.manutencoesFiltradas.map(m =>
      `${m.id ?? ''},${this.csvEscape(m.maquina?.nome ?? '')},${m.tipo},${this.csvEscape(m.tecnico)},${this.csvEscape(m.descricao ?? '')},${m.dataManutencao ?? ''}`
    );
    const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manutencoes.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private csvEscape(v: string): string {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
  }

  trackById(_index: number, item: Manutencao): number { return item.id!; }

  voltar() { this.router.navigate(['/dashboard']); }
  cancelar() { this.showForm = false; }
}
