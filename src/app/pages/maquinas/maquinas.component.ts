import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { MaquinaService } from '../../services/maquina.service';
import { ManutencaoService } from '../../services/manutencao.service';
import { NotificationService } from '../../services/notification.service';
import { Maquina } from '../../models/maquina.model';
import { Manutencao } from '../../models/manutencao.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maquinas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCardModule, MatDialogModule, MatProgressSpinnerModule
  ],
  templateUrl: './maquinas.component.html',
  styleUrl: './maquinas.component.css'
})
export class MaquinasComponent implements OnInit, OnDestroy {
  private maquinaService = inject(MaquinaService);
  private manutencaoService = inject(ManutencaoService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private subs = new Subscription();

  maquinas: Maquina[] = [];
  dataSource = new MatTableDataSource<Maquina>([]);
  displayedColumns = ['nome', 'setor', 'status', 'acoes'];
  showForm = false;
  editando = false;
  salvando = false;
  deletandoId: number | null = null;
  form: Maquina = { nome: '', setor: '', status: 'ATIVO' };

  // Search
  searchTerm = '';
  filterStatus = '';

  // History modal
  showHistory = false;
  historyMaquina: Maquina | null = null;
  historicoManutencoes: Manutencao[] = [];
  carregandoHistorico = false;

  ngOnInit() { this.carregar(); }

  ngOnDestroy() { this.subs.unsubscribe(); }

  carregar() {
    const sub = this.maquinaService.listar().subscribe(data => {
      this.maquinas = data;
      this.applyFilter();
    });
    this.subs.add(sub);
  }

  applyFilter() {
    let filtered = [...this.maquinas];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.nome.toLowerCase().includes(term) || m.setor.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus) {
      filtered = filtered.filter(m => m.status === this.filterStatus);
    }
    this.dataSource.data = filtered;
  }

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

    const sub = op.subscribe({
      next: () => {
        this.salvando = false;
        this.showForm = false;
        this.notify.success(this.editando ? 'Máquina atualizada!' : 'Máquina cadastrada!');
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
    const sub = this.maquinaService.deletar(id).subscribe({
      next: () => {
        this.notify.success('Máquina removida!');
        this.carregar();
      },
      error: () => this.notify.error('Erro ao excluir.')
    });
    this.subs.add(sub);
  }

  cancelarDelete() {
    this.deletandoId = null;
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
      },
      error: () => {
        this.carregandoHistorico = false;
        this.notify.error('Erro ao carregar histórico.');
      }
    });
    this.subs.add(sub);
  }

  fecharHistorico() {
    this.showHistory = false;
    this.historyMaquina = null;
    this.historicoManutencoes = [];
  }

  exportarCSV() {
    const header = 'ID,Nome,Setor,Status,Intervalo Preventiva (dias),Última Manutenção';
    const rows = this.dataSource.data.map(m =>
      `${m.id ?? ''},${this.csvEscape(m.nome)},${this.csvEscape(m.setor)},${m.status},${m.intervaloPreventivaDias ?? 0},${m.dataUltimaManutencao ?? ''}`
    );
    this.downloadCsv([header, ...rows].join('\n'), 'maquinas.csv');
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
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

  cancelar() { this.showForm = false; }
  voltar() { this.router.navigate(['/dashboard']); }

  trackById(_index: number, item: Maquina): number {
    return item.id!;
  }
}
