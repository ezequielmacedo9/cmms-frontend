import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Manutencao } from '../models/manutencao.model';

@Injectable({ providedIn: 'root' })
export class ManutencaoService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/manutencoes';

  listar(): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(this.apiUrl);
  }

  cadastrar(maquinaId: number, manutencao: Manutencao): Observable<Manutencao> {
    return this.http.post<Manutencao>(`${this.apiUrl}/${maquinaId}`, manutencao);
  }
}