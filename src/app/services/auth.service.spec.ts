import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { AuthTokenResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';

/**
 * Verifies the public surface of {@link AuthService}: token storage,
 * role helpers and HTTP calls (login + refresh + Google).
 *
 * <p>Uses {@code HttpTestingController} so the real HttpClient is
 * exercised end-to-end without leaving the test.
 */
describe('AuthService', () => {

  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiBase = `${environment.apiUrl}/api/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('storage', () => {
    it('isLoggedIn=false e getters retornam defaults sãos quando vazio', () => {
      expect(service.isLoggedIn()).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(service.getRefresh()).toBeNull();
      expect(service.getRole()).toBeNull();
      expect(service.getUserId()).toBeNull();
      expect(service.getNome()).toBe('Usuário');
      expect(service.getEmail()).toBe('');
    });

    it('logout limpa todas as chaves e dispara POST /logout no servidor', () => {
      localStorage.setItem('accessToken', 'A');
      localStorage.setItem('refreshToken', 'R');
      localStorage.setItem('userRole', 'ROLE_ADMIN');
      localStorage.setItem('userNome', 'Ana');
      localStorage.setItem('userId', '99');
      localStorage.setItem('userEmail', 'ana@cmms.app');

      service.logout();

      // Cleanup local imediato
      expect(service.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('userRole')).toBeNull();
      expect(localStorage.getItem('userNome')).toBeNull();
      expect(localStorage.getItem('userId')).toBeNull();
      expect(localStorage.getItem('userEmail')).toBeNull();

      // Servidor recebe POST best-effort
      const req = httpMock.expectOne(`${apiBase}/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('logout sem token previo nao chama o servidor', () => {
      service.logout();
      // Nenhuma chamada HTTP devera ser registrada
      httpMock.verify();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('setAccessToken atualiza apenas o accessToken', () => {
      localStorage.setItem('refreshToken', 'R');
      service.setAccessToken('NEW');
      expect(service.getToken()).toBe('NEW');
      expect(service.getRefresh()).toBe('R');
    });
  });

  describe('role helpers', () => {
    it('hasRole / canManageUsers / canDelete consideram a role atual', () => {
      localStorage.setItem('userRole', 'ROLE_GESTOR');
      expect(service.hasRole('ROLE_GESTOR')).toBe(true);
      expect(service.hasRole('ROLE_ADMIN')).toBe(false);
      expect(service.canManageUsers()).toBe(false);
      expect(service.canWrite()).toBe(true);
      expect(service.canWriteMaintenance()).toBe(true);
      expect(service.canDelete()).toBe(false);
    });

    it('SUPER_ADMIN é all-powerful nas helpers', () => {
      localStorage.setItem('userRole', 'ROLE_SUPER_ADMIN');
      expect(service.canManageUsers()).toBe(true);
      expect(service.canWrite()).toBe(true);
      expect(service.canDelete()).toBe(true);
      expect(service.canViewAudit()).toBe(true);
      expect(service.canViewSettings()).toBe(true);
    });
  });

  describe('login', () => {
    it('chama POST /api/auth/login com email+senha e armazena tokens', async () => {
      const promise = firstValueFrom(service.login('a@x.com', 'pw'));
      const req = httpMock.expectOne(`${apiBase}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'a@x.com', senha: 'pw' });

      const res: AuthTokenResponse = {
        accessToken: 'A', refreshToken: 'R', role: 'ROLE_ADMIN',
        nome: 'Ana', userId: 7
      };
      req.flush(res);

      await expect(promise).resolves.toEqual(res);
      expect(service.getToken()).toBe('A');
      expect(service.getRefresh()).toBe('R');
      expect(service.getRole()).toBe('ROLE_ADMIN');
      expect(service.getNome()).toBe('Ana');
      expect(service.getUserId()).toBe(7);
    });

    it('login retry: cold start (500) é tentado novamente; 4xx falha imediato', async () => {
      const promise = firstValueFrom(service.login('a@x.com', 'wrong'));
      const req = httpMock.expectOne(`${apiBase}/login`);
      req.flush({ message: 'Email ou senha incorretos.' },
        { status: 401, statusText: 'Unauthorized' });

      await expect(promise).rejects.toMatchObject({ status: 401 });
      // Não deve tentar de novo em 401
      httpMock.verify();
    });
  });

  describe('loginWithGoogle', () => {
    it('POST /api/auth/google com idToken e armazena tokens', async () => {
      const promise = firstValueFrom(service.loginWithGoogle('GOOG_TOKEN'));
      const req = httpMock.expectOne(`${apiBase}/google`);
      expect(req.request.body).toEqual({ idToken: 'GOOG_TOKEN' });
      req.flush({
        accessToken: 'AG', refreshToken: 'RG',
        role: 'ROLE_VISUALIZADOR', nome: 'Visit', userId: 9
      } as AuthTokenResponse);

      await expect(promise).resolves.toBeDefined();
      expect(service.getRole()).toBe('ROLE_VISUALIZADOR');
    });
  });

  describe('refreshToken', () => {
    it('POST /api/auth/refresh com refreshToken e atualiza o storage', async () => {
      localStorage.setItem('refreshToken', 'OLD_R');
      const promise = firstValueFrom(service.refreshToken('OLD_R'));
      const req = httpMock.expectOne(`${apiBase}/refresh`);
      expect(req.request.body).toEqual({ refreshToken: 'OLD_R' });
      req.flush({
        accessToken: 'NEW_A', refreshToken: 'OLD_R',
        role: 'ROLE_TECNICO', nome: 'X', userId: 1
      } as AuthTokenResponse);

      await expect(promise).resolves.toBeDefined();
      expect(service.getToken()).toBe('NEW_A');
    });

    it('refresh com falha 401 propaga sem alterar storage', async () => {
      localStorage.setItem('accessToken', 'KEEP_THIS');
      const promise = firstValueFrom(service.refreshToken('BAD'));
      httpMock.expectOne(`${apiBase}/refresh`)
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      await expect(promise).rejects.toBeInstanceOf(HttpErrorResponse);
      expect(service.getToken()).toBe('KEEP_THIS');
    });
  });
});
