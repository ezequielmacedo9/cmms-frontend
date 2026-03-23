import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MaquinaService } from '../../services/maquina.service';
import { Maquina } from '../../models/maquina.model';

@Component({
  selector: 'app-maquinas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './maquinas.component.html',
  styleUrl: './maquinas.component.css'
})
export class MaquinasComponent implements OnInit {

  private maquinaService = inject(MaquinaService);

  maquinas: Maquina[] = [];
  displayedColumns = ['nome', 'setor', 'status', 'acoes'];
  showForm = false;
  editando = false;

  form: Maquina = {
    nome: '',
    setor: '',
    status: 'ATIVO'
  };

  ngOnInit() {
    this.carregar();
  }

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
    if (this.editando && this.form.id) {
      this.maquinaService.atualizar(this.form.id, this.form).subscribe(() => {
        this.carregar();
        this.showForm = false;
      });
    } else {
      this.maquinaService.cadastrar(this.form).subscribe(() => {
        this.carregar();
        this.showForm = false;
      });
    }
  }

  deletar(id: number) {
    if (confirm('Deseja realmente excluir esta máquina?')) {
      this.maquinaService.deletar(id).subscribe(() => this.carregar());
    }
  }

  cancelar() {
    this.showForm = false;
  }
}