import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalMaquinas: number;
  totalManutencoes: number;
  totalPecas: number;
  maquinasAtivas: number;
  maquinasInativas: number;
  maquinasEmManutencao: number;
  manutencoesPreventivas: number;
  manutencoesCorretivas: number;
  manutencoesVencidas: number;
  disponibilidade: number;
  mtbfDias: number;
  ultimosSeisMeses: MonthlyCount[];
  alertasVencidos: OverdueAlert[];
}

export interface MonthlyCount {
  ano: number;
  mes: number;
  label: string;
  total: number;
}

export interface OverdueAlert {
  maquinaId: number;
  maquinaNome: string;
  setor: string;
  diasVencido: number;
  prioridade: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/dashboard`;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }
}
