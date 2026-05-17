import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PecaRequest, PecaResponse } from '../models/peca.model';
import { PagedResponse } from '../models/paged-response.model';
import { environment } from '../../environments/environment';

export interface PecaPageQuery {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class PecaService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/pecas`;

  listar(): Observable<PecaResponse[]> {
    return this.http.get<PecaResponse[]>(this.apiUrl, { params: new HttpParams().set('unpaged', 'true') });
  }

  listarPaged(query: PecaPageQuery = {}): Observable<PagedResponse<PecaResponse>> {
    return this.http.get<PagedResponse<PecaResponse>>(this.apiUrl, { params: pageParams(query) });
  }

  cadastrar(peca: PecaRequest): Observable<PecaResponse> {
    return this.http.post<PecaResponse>(this.apiUrl, peca);
  }

  atualizar(id: number, peca: PecaRequest): Observable<PecaResponse> {
    return this.http.put<PecaResponse>(`${this.apiUrl}/${id}`, peca);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

function pageParams(q: PecaPageQuery): HttpParams {
  let p = new HttpParams();
  if (q.page !== undefined) p = p.set('page', q.page);
  if (q.size !== undefined) p = p.set('size', q.size);
  if (q.sort)               p = p.set('sort', q.sort);
  if (q.q)                  p = p.set('q',    q.q);
  return p;
}
