import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('bar1') bar1!: ElementRef;
  @ViewChild('bar2') bar2!: ElementRef;
  @ViewChild('bar3') bar3!: ElementRef;
  @ViewChild('bar4') bar4!: ElementRef;

  private router = inject(Router);
  private maquinaService = inject(MaquinaService);
  private manutencaoService = inject(ManutencaoService);
  private pecaService = inject(PecaService);

  totalMaquinas = 0;
  totalManutencoes = 0;
  totalPecas = 0;
  totalPendencias = 0;
  sidebarExpanded = false;

  displayMaquinas = 0;
  displayManutencoes = 0;
  displayPecas = 0;
  displayPendencias = 0;

  ngOnInit() {
    this.maquinaService.listar().subscribe(m => {
      this.totalMaquinas = m.length;
      this.animateNumber('displayMaquinas', m.length);
    });
    this.manutencaoService.listar().subscribe(m => {
      this.totalManutencoes = m.length;
      this.animateNumber('displayManutencoes', m.length);
    });
    this.pecaService.listar().subscribe(p => {
      this.totalPecas = p.length;
      this.animateNumber('displayPecas', p.length);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.bar1.nativeElement.style.width = '98%';
      this.bar2.nativeElement.style.width = '100%';
      this.bar3.nativeElement.style.width = '100%';
      this.bar4.nativeElement.style.width = '60%';
    }, 400);
  }

  private animateNumber(prop: 'displayMaquinas' | 'displayManutencoes' | 'displayPecas' | 'displayPendencias', target: number) {
    const duration = 1000;
    const steps = 40;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += Math.ceil(target / steps);
      if (current >= target) {
        (this as any)[prop] = target;
        clearInterval(timer);
      } else {
        (this as any)[prop] = current;
      }
    }, interval);
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}