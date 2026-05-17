import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/user.model';
import { PagedResponse } from '../models/paged-response.model';

export interface ConvidarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  roleNome: string;
}

export interface AlterarRoleDTO {
  roleNome: string;
}

export interface UsuarioPageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/usuarios`;

  listar(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(this.apiUrl, { params: new HttpParams().set('unpaged', 'true') });
  }

  listarPaged(query: UsuarioPageQuery = {}): Observable<PagedResponse<UserProfile>> {
    return this.http.get<PagedResponse<UserProfile>>(this.apiUrl, { params: pageParams(query) });
  }

  getMeuPerfil(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  convidar(dto: ConvidarUsuarioDTO): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.apiUrl}/convidar`, dto);
  }

  alterarRole(id: number, roleNome: string): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${id}/role`, { roleNome });
  }

  ativar(id: number): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${id}/ativar`, {});
  }

  desativar(id: number): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${id}/desativar`, {});
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

function pageParams(q: UsuarioPageQuery): HttpParams {
  let p = new HttpParams();
  if (q.page !== undefined) p = p.set('page', q.page);
  if (q.size !== undefined) p = p.set('size', q.size);
  if (q.sort)               p = p.set('sort', q.sort);
  return p;
}
