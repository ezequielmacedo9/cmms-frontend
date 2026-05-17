import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Maquina } from '../models/maquina.model';
import { PagedResponse } from '../models/paged-response.model';
import { environment } from '../../environments/environment';

export interface MaquinaPageQuery {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class MaquinaService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/maquinas`;

  /** Returns every machine in a single request. Use sparingly. */
  listar(): Observable<Maquina[]> {
    return this.http.get<Maquina[]>(this.apiUrl, { params: new HttpParams().set('unpaged', 'true') });
  }

  /** Paged listing — preferred for any UI table. */
  listarPaged(query: MaquinaPageQuery = {}): Observable<PagedResponse<Maquina>> {
    return this.http.get<PagedResponse<Maquina>>(this.apiUrl, { params: pageParams(query) });
  }

  cadastrar(maquina: Maquina): Observable<Maquina> {
    return this.http.post<Maquina>(this.apiUrl, maquina);
  }

  atualizar(id: number, maquina: Maquina): Observable<Maquina> {
    return this.http.put<Maquina>(`${this.apiUrl}/${id}`, maquina);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

function pageParams(q: MaquinaPageQuery): HttpParams {
  let p = new HttpParams();
  if (q.page  !== undefined) p = p.set('page',  q.page);
  if (q.size  !== undefined) p = p.set('size',  q.size);
  if (q.sort)                p = p.set('sort',  q.sort);
  if (q.q)                   p = p.set('q',     q.q);
  if (q.status)              p = p.set('status', q.status);
  return p;
}
