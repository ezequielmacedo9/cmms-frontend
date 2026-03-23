import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Maquina } from '../models/maquina.model';

@Injectable({ providedIn: 'root' })
export class MaquinaService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/maquinas';

  listar(): Observable<Maquina[]> {
    return this.http.get<Maquina[]>(this.apiUrl);
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