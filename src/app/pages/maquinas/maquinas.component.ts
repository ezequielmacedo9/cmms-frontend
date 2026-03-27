import { Component, inject, OnInit } from '@angular/core';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaquinaService } from '../../services/maquina.service';
import { NotificationService } from '../../services/notification.service';
import { Maquina } from '../../models/maquina.model';

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
export class MaquinasComponent implements OnInit {
  private maquinaService = inject(MaquinaService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  maquinas: Maquina[] = [];
  displayedColumns = ['nome', 'setor', 'status', 'acoes'];
  showForm = false;
  editando = false;
  salvando = false;
  form: Maquina = { nome: '', setor: '', status: 'ATIVO' };

  ngOnInit() { this.carregar(); }

  carregar() {
    this.maquinaService.listar().subscribe(data => this.maquinas = data);
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
    if (this.salvando) return;
    this.salvando = true;
    const op = this.editando && this.form.id
      ? this.maquinaService.atualizar(this.form.id, this.form)
      : this.maquinaService.cadastrar(this.form);

    op.subscribe({
      next: () => {
        this.salvando = false;
        this.showForm = false;
        this.notify.success(this.editando ? 'Máquina atualizada!' : 'Máquina cadastrada!');
        this.carregar();
      },
      error: () => {
        this.salvando = false;
        this.notify.error('Erro ao salvar. Tente novamente.');
        setTimeout(() => this.carregar(), 1000);
      }
    });
  }

  deletar(id: number) {
    if (confirm('Deseja realmente excluir esta máquina?')) {
      this.maquinaService.deletar(id).subscribe({
        next: () => {
          this.notify.success('Máquina removida!');
          this.carregar();
        },
        error: () => this.notify.error('Erro ao excluir.')
      });
    }
  }

  voltar() { this.router.navigate(['/dashboard']); }
  cancelar() { this.showForm = false; }
}