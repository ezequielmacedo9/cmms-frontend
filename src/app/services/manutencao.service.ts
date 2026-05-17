import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Manutencao } from '../models/manutencao.model';
import { PagedResponse } from '../models/paged-response.model';
import { environment } from '../../environments/environment';

export interface ManutencaoPageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class ManutencaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/manutencoes`;

  listar(): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(this.apiUrl, { params: new HttpParams().set('unpaged', 'true') });
  }

  listarPaged(query: ManutencaoPageQuery = {}): Observable<PagedResponse<Manutencao>> {
    return this.http.get<PagedResponse<Manutencao>>(this.apiUrl, { params: pageParams(query) });
  }

  listarPorMaquina(maquinaId: number): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(`${this.apiUrl}/maquina/${maquinaId}`,
      { params: new HttpParams().set('unpaged', 'true') });
  }

  listarPorMaquinaPaged(maquinaId: number, query: ManutencaoPageQuery = {}): Observable<PagedResponse<Manutencao>> {
    return this.http.get<PagedResponse<Manutencao>>(
      `${this.apiUrl}/maquina/${maquinaId}`, { params: pageParams(query) });
  }

  cadastrar(maquinaId: number, manutencao: Manutencao): Observable<Manutencao> {
    return this.http.post<Manutencao>(`${this.apiUrl}/${maquinaId}`, manutencao);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

function pageParams(q: ManutencaoPageQuery): HttpParams {
  let p = new HttpParams();
  if (q.page !== undefined) p = p.set('page', q.page);
  if (q.size !== undefined) p = p.set('size', q.size);
  if (q.sort)               p = p.set('sort', q.sort);
  return p;
}
