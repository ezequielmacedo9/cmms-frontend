import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, senha }).pipe(
      tap((res: any) => this.storeTokens(res))
    );
  }

  loginWithGoogle(idToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/google`, { idToken }).pipe(
      tap((res: any) => this.storeTokens(res))
    );
  }

  private storeTokens(res: any) {
    if (res.accessToken)  localStorage.setItem('accessToken',  res.accessToken);
    if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
    if (res.role)         localStorage.setItem('userRole',     res.role);
    if (res.nome)         localStorage.setItem('userNome',     res.nome);
    if (res.userId)       localStorage.setItem('userId',       String(res.userId));
    if (res.email)        localStorage.setItem('userEmail',    res.email);
  }

  refreshToken(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, { refreshToken: token });
  }

  logout(): void {
    ['accessToken', 'refreshToken', 'userRole', 'userNome', 'userId', 'userEmail'].forEach(k =>
      localStorage.removeItem(k)
    );
  }

  getToken(): string | null    { return localStorage.getItem('accessToken'); }
  getRole(): UserRole | null   { return localStorage.getItem('userRole') as UserRole | null; }
  getNome(): string            { return localStorage.getItem('userNome') ?? 'Usuário'; }
  getEmail(): string           { return localStorage.getItem('userEmail') ?? ''; }
  getUserId(): number | null   { const id = localStorage.getItem('userId'); return id ? Number(id) : null; }
  isLoggedIn(): boolean        { return !!this.getToken(); }

  hasRole(...roles: UserRole[]): boolean {
    const current = this.getRole();
    return current != null && roles.includes(current);
  }

  canManageUsers(): boolean    { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }
  canWrite(): boolean          { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR'); }
  canWriteMaintenance(): boolean { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_TECNICO'); }
  canDelete(): boolean         { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }
  canViewAudit(): boolean      { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }
  canViewSettings(): boolean   { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }
}
