import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { PecaService } from '../../services/peca.service';
import { PecaRequest, PecaResponse } from '../../models/peca.model';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatCardModule
  ],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css'
})
export class EstoqueComponent implements OnInit {

  private pecaService = inject(PecaService);

  pecas: PecaResponse[] = [];
  displayedColumns = ['codigo', 'nome', 'quantidade', 'custo', 'vidaUtil', 'acoes'];
  showForm = false;
  salvando = false;
  editando = false;
  editandoId: number | null = null;

  form: PecaRequest = {
    nome: '', codigo: '', quantidadeEmEstoque: 0, custoUnitario: 0, vidaUtilHoras: 0
  };

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.pecaService.listar().subscribe(data => this.pecas = data);
  }

  novoRegistro() {
    this.form = { nome: '', codigo: '', quantidadeEmEstoque: 0, custoUnitario: 0, vidaUtilHoras: 0 };
    this.editando = false;
    this.editandoId = null;
    this.showForm = true;
  }

  editar(peca: PecaResponse) {
    this.form = {
      nome: peca.nome,
      codigo: peca.codigo,
      quantidadeEmEstoque: peca.quantidadeEmEstoque,
      custoUnitario: peca.custoUnitario,
      vidaUtilHoras: peca.vidaUtilHoras
    };
    this.editando = true;
    this.editandoId = peca.id!;
    this.showForm = true;
  }

  salvar() {
  this.salvando = true;
  const op = this.editando && this.editandoId
    ? this.pecaService.atualizar(this.editandoId, this.form)
    : this.pecaService.cadastrar(this.form);

  op.subscribe({
    next: () => {
      this.salvando = false;
      this.showForm = false;
      this.carregar();
    },
    error: () => {
      this.salvando = false;
      this.showForm = false;
      setTimeout(() => this.carregar(), 1000);
    }
  });
}

  deletar(id: number) {
    if (confirm('Deseja excluir esta peça?')) {
      this.pecaService.deletar(id).subscribe(() => this.carregar());
    }
  }

  cancelar() {
    this.showForm = false;
  }
}