import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
import { PecaRequest, PecaResponse } from '../../models/peca.model';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css'
})
export class EstoqueComponent implements OnInit, OnDestroy {
  private pecaService = inject(PecaService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private subs = new Subscription();

  pecas: PecaResponse[] = [];
  displayedColumns = ['codigo', 'nome', 'quantidade', 'custo', 'vidaUtil', 'acoes'];
  showForm = false;
  editando = false;
  salvando = false;
  editandoId: number | null = null;
  deletandoId: number | null = null;
  searchTerm = '';
  pageSize = 10;
  currentPage = 0;
  form: PecaRequest = { nome: '', codigo: '', quantidadeEmEstoque: 0, custoUnitario: 0, vidaUtilHoras: 0 };

  ngOnInit() { this.carregar(); }
  ngOnDestroy() { this.subs.unsubscribe(); }

  get pecasFiltradas(): PecaResponse[] {
    if (!this.searchTerm.trim()) return this.pecas;
    const term = this.searchTerm.toLowerCase();
    return this.pecas.filter(p =>
      p.nome.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.ceil(this.pecasFiltradas.length / this.pageSize) || 1;
  }

  get pagedPecas(): PecaResponse[] {
    const start = this.currentPage * this.pageSize;
    return this.pecasFiltradas.slice(start, start + this.pageSize);
  }

  applyFilter() { this.currentPage = 0; }
  nextPage() { if (this.currentPage < this.totalPages - 1) this.currentPage++; }
  prevPage() { if (this.currentPage > 0) this.currentPage--; }

  carregar() {
    const sub = this.pecaService.listar().subscribe(data => this.pecas = data);
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

    const sub = op.subscribe({
      next: () => {
        this.salvando = false;
        this.showForm = false;
        this.notify.success(this.editando ? 'Peça atualizada!' : 'Peça cadastrada!');
        this.carregar();
      },
      error: () => {
        this.salvando = false;
        this.notify.error('Erro ao salvar. Tente novamente.');
      }
    });
    this.subs.add(sub);
  }

  confirmarDelete(id: number) {
    this.deletandoId = id;
  }

  deletar(id: number) {
    this.deletandoId = null;
    const sub = this.pecaService.deletar(id).subscribe({
      next: () => {
        this.notify.success('Peça removida!');
        this.carregar();
      },
      error: () => this.notify.error('Erro ao excluir.')
    });
    this.subs.add(sub);
  }

  cancelarDelete() {
    this.deletandoId = null;
  }

  exportarCSV() {
    const header = 'ID,Código,Nome,Qtd Estoque,Custo Unitário (R$),Vida Útil (h)';
    const rows = this.pecas.map(p =>
      `${p.id ?? ''},${this.csvEscape(p.codigo)},${this.csvEscape(p.nome)},${p.quantidadeEmEstoque},${p.custoUnitario},${p.vidaUtilHoras}`
    );
    this.downloadCsv([header, ...rows].join('\n'), 'estoque.csv');
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private downloadCsv(content: string, filename: string) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  voltar() { this.router.navigate(['/dashboard']); }
  cancelar() { this.showForm = false; }

  trackById(_index: number, item: PecaResponse): number {
    return item.id!;
  }
}
