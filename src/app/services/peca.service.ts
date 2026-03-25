import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PecaRequest, PecaResponse } from '../models/peca.model';

@Injectable({ providedIn: 'root' })
export class PecaService {

  private http = inject(HttpClient);
  
  private apiUrl = 'https://cmms-backend-8y7h.onrender.com/api/pecas';

  listar(): Observable<PecaResponse[]> {
    return this.http.get<PecaResponse[]>(this.apiUrl);
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