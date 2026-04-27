import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfileFull {
  id: number;
  email: string;
  nome: string;
  telefone: string;
  cargo: string;
  departamento: string;
  avatarBase64: string;
  totpEnabled: boolean;
  role: string;
  dataCriacao: string;
  ultimoLogin: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/profile`;

  get(): Observable<UserProfileFull> {
    return this.http.get<UserProfileFull>(this.base);
  }

  update(data: Partial<UserProfileFull>): Observable<UserProfileFull> {
    return this.http.put<UserProfileFull>(this.base, data);
  }

  uploadAvatar(avatarBase64: string): Observable<{ avatarBase64: string }> {
    return this.http.post<{ avatarBase64: string }>(`${this.base}/avatar`, { avatarBase64 });
  }

  changePassword(senhaAtual: string, novaSenha: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/password`, { senhaAtual, novaSenha });
  }

  setup2fa(): Observable<{ secret: string; qrCodeDataUri: string; manualEntryKey: string }> {
    return this.http.post<any>(`${this.base}/2fa/setup`, {});
  }

  verify2fa(code: string): Observable<{ message: string }> {
    return this.http.post<any>(`${this.base}/2fa/verify`, { code });
  }

  disable2fa(senha: string): Observable<{ message: string }> {
    return this.http.delete<any>(`${this.base}/2fa`, { body: { senha } });
  }
}
