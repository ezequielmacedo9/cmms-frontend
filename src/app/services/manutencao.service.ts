import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Manutencao } from '../models/manutencao.model';

@Injectable({ providedIn: 'root' })
export class ManutencaoService {
  private http = inject(HttpClient);
  private apiUrl = 'https://cmms-backend-8y7h.onrender.com/api/manutencoes';

  listar(): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(this.apiUrl);
  }

  listarPorMaquina(maquinaId: number): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(`${this.apiUrl}/maquina/${maquinaId}`);
  }

  cadastrar(maquinaId: number, manutencao: Manutencao): Observable<Manutencao> {
    return this.http.post<Manutencao>(`${this.apiUrl}/${maquinaId}`, manutencao);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
