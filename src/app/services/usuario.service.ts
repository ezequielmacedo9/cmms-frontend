import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/user.model';

export interface ConvidarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  roleNome: string;
}

export interface AlterarRoleDTO {
  roleNome: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(this.apiUrl);
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
