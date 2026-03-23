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
import { ManutencaoService } from '../../services/manutencao.service';
import { MaquinaService } from '../../services/maquina.service';
import { Manutencao } from '../../models/manutencao.model';
import { Maquina } from '../../models/maquina.model';

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule
  ],
  templateUrl: './manutencoes.component.html',
  styleUrl: './manutencoes.component.css'
})
export class ManutencoesComponent implements OnInit {

  private manutencaoService = inject(ManutencaoService);
  private maquinaService = inject(MaquinaService);

  manutencoes: Manutencao[] = [];
  maquinas: Maquina[] = [];
  displayedColumns = ['maquina', 'tipo', 'tecnico', 'data'];
  showForm = false;

  maquinaIdSelecionada: number | null = null;
  form: Manutencao = { tipo: '', tecnico: '' };

  ngOnInit() {
    this.carregar();
    this.maquinaService.listar().subscribe(m => this.maquinas = m);
  }

  carregar() {
    this.manutencaoService.listar().subscribe(data => this.manutencoes = data);
  }

  novoRegistro() {
    this.form = { tipo: '', tecnico: '' };
    this.maquinaIdSelecionada = null;
    this.showForm = true;
  }

  salvar() {
    if (!this.maquinaIdSelecionada) return;
    this.manutencaoService.cadastrar(this.maquinaIdSelecionada, this.form).subscribe(() => {
      this.carregar();
      this.showForm = false;
    });
  }

  cancelar() {
    this.showForm = false;
  }
}