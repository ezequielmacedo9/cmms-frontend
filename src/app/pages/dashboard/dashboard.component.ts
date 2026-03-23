import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MaquinaService } from '../../services/maquina.service';
import { ManutencaoService } from '../../services/manutencao.service';
import { PecaService } from '../../services/peca.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private maquinaService = inject(MaquinaService);
  private manutencaoService = inject(ManutencaoService);
  private pecaService = inject(PecaService);

  totalMaquinas = 0;
  totalManutencoes = 0;
  totalPecas = 0;
  totalPendencias = 0;
  sidebarExpanded = false;

  ngOnInit() {
    this.maquinaService.listar().subscribe(m => this.totalMaquinas = m.length);
    this.manutencaoService.listar().subscribe(m => this.totalManutencoes = m.length);
    this.pecaService.listar().subscribe(p => this.totalPecas = p.length);
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }
}