import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, tap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthTokenResponse } from '../models/auth.model';
import { UserRole } from '../models/user.model';

/**
 * Owns authentication state on the client: token storage, role checks
 * and the HTTP calls that mint or refresh tokens.
 *
 * <p>Tokens live in {@code localStorage} for now — switching to HttpOnly
 * cookies is tracked as a future security task. Anything that reads or
 * writes auth state should go through this service, never through
 * `localStorage` directly.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  // Storage keys — centralised so a future migration touches only this file.
  private static readonly KEY_ACCESS  = 'accessToken';
  private static readonly KEY_REFRESH = 'refreshToken';
  private static readonly KEY_ROLE    = 'userRole';
  private static readonly KEY_NOME    = 'userNome';
  private static readonly KEY_ID      = 'userId';
  private static readonly KEY_EMAIL   = 'userEmail';

  /**
   * Logs in with email/password. Retries on transient (>=500) failures to
   * cover Render free-tier cold starts; surfaces 4xx errors immediately.
   */
  login(email: string, senha: string): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.apiUrl}/login`, { email, senha }).pipe(
      retry({
        count: 6,
        delay: (error) => {
          // Only retry on server-side or network errors.
          if (error.status && error.status > 0 && error.status < 500) throw error;
          return timer(5000);
        }
      }),
      tap(res => this.storeTokens(res))
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.apiUrl}/google`, { idToken })
      .pipe(tap(res => this.storeTokens(res)));
  }

  refreshToken(token: string): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.apiUrl}/refresh`, { refreshToken: token })
      .pipe(tap(res => this.storeTokens(res)));
  }

  logout(): void {
    [
      AuthService.KEY_ACCESS, AuthService.KEY_REFRESH, AuthService.KEY_ROLE,
      AuthService.KEY_NOME,   AuthService.KEY_ID,      AuthService.KEY_EMAIL
    ].forEach(k => localStorage.removeItem(k));
  }

  getToken(): string | null    { return localStorage.getItem(AuthService.KEY_ACCESS); }
  getRefresh(): string | null  { return localStorage.getItem(AuthService.KEY_REFRESH); }
  getRole(): UserRole | null   { return localStorage.getItem(AuthService.KEY_ROLE) as UserRole | null; }
  getNome(): string            { return localStorage.getItem(AuthService.KEY_NOME) ?? 'Usuário'; }
  getEmail(): string           { return localStorage.getItem(AuthService.KEY_EMAIL) ?? ''; }
  getUserId(): number | null   {
    const id = localStorage.getItem(AuthService.KEY_ID);
    return id ? Number(id) : null;
  }
  isLoggedIn(): boolean        { return !!this.getToken(); }

  /** Imperative setter used by the auth interceptor when refreshing the access token. */
  setAccessToken(token: string): void {
    localStorage.setItem(AuthService.KEY_ACCESS, token);
  }

  hasRole(...roles: UserRole[]): boolean {
    const current = this.getRole();
    return current != null && roles.includes(current);
  }

  canManageUsers(): boolean      { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }
  canWrite(): boolean            { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR'); }
  canWriteMaintenance(): boolean { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_TECNICO'); }
  canDelete(): boolean           { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }
  canViewAudit(): boolean        { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }
  canViewSettings(): boolean     { return this.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'); }

  // ── helpers ──────────────────────────────────────────────────────────

  private storeTokens(res: AuthTokenResponse): void {
    if (res.accessToken)  localStorage.setItem(AuthService.KEY_ACCESS,  res.accessToken);
    if (res.refreshToken) localStorage.setItem(AuthService.KEY_REFRESH, res.refreshToken);
    if (res.role)         localStorage.setItem(AuthService.KEY_ROLE,    res.role);
    if (res.nome)         localStorage.setItem(AuthService.KEY_NOME,    res.nome);
    if (res.userId)       localStorage.setItem(AuthService.KEY_ID,      String(res.userId));
    if (res.email)        localStorage.setItem(AuthService.KEY_EMAIL,   res.email);
  }
}
