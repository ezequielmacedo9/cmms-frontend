import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConfigItem {
  chave: string;
  valor: string;
  grupo: string;
  tipo: string;
  descricao: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/configuracoes`;

  list(): Observable<ConfigItem[]> {
    // Backend defaults to a paged envelope; the settings page wants all keys.
    return this.http.get<ConfigItem[]>(this.base, { params: new HttpParams().set('unpaged', 'true') });
  }

  save(values: Record<string, string>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(this.base, values);
  }
}
