import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth.service';
import { AuthTokenResponse } from '../models/auth.model';

/**
 * Verifies the auth interceptor's two critical responsibilities:
 *
 *   1. Attach the bearer token (when present) on non-auth endpoints.
 *   2. On 401, call refresh() and replay the request with the new token.
 *      When refresh itself fails, logout + redirect to /login.
 *
 * We mock {@link AuthService} so {@code refreshToken()} is observable and
 * countable. HTTP traffic goes through {@link HttpTestingController}.
 */
describe('authInterceptor', () => {

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: {
    getToken: ReturnType<typeof vi.fn>;
    getRefresh: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    auth = {
      getToken:     vi.fn(),
      getRefresh:   vi.fn(),
      refreshToken: vi.fn(),
      logout:       vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([], withDisabledInitialNavigation()),
        { provide: AuthService, useValue: auth }
      ]
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router   = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  it('anexa Bearer quando há token e a rota não é /api/auth/', () => {
    auth.getToken.mockReturnValue('ACCESS_TOKEN');

    http.get('/api/maquinas').subscribe();
    const req = httpMock.expectOne('/api/maquinas');
    expect(req.request.headers.get('Authorization')).toBe('Bearer ACCESS_TOKEN');
    req.flush({});
  });

  it('NÃO anexa Authorization em endpoints /api/auth/ mesmo com token presente', () => {
    auth.getToken.mockReturnValue('STALE_TOKEN');

    http.post('/api/auth/login', { email: 'x', senha: 'y' }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({ accessToken: 'NEW', refreshToken: 'R' });
  });

  it('401 sem refresh: faz logout e propaga erro', async () => {
    auth.getToken.mockReturnValue('STALE');
    auth.getRefresh.mockReturnValue(null);

    const promise = firstValueFrom(http.get('/api/maquinas'));
    httpMock.expectOne('/api/maquinas').flush('expired',
      { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toBeDefined();
    expect(auth.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('401 com refresh: chama refreshToken() e replaya request com novo token', async () => {
    auth.getToken.mockReturnValueOnce('STALE').mockReturnValue('NEW_ACCESS');
    auth.getRefresh.mockReturnValue('REFRESH_TOKEN');
    const refreshed: AuthTokenResponse = {
      accessToken: 'NEW_ACCESS',
      refreshToken: 'REFRESH_TOKEN',
      role: 'ROLE_TECNICO',
      nome: 'X',
      userId: 1
    };
    auth.refreshToken.mockReturnValue(of(refreshed));

    const promise = firstValueFrom(http.get<{ ok: boolean }>('/api/maquinas'));

    // 1ª request → 401 (token velho)
    httpMock.expectOne('/api/maquinas').flush('expired',
      { status: 401, statusText: 'Unauthorized' });

    // Retentativa com novo Authorization
    const retry = httpMock.expectOne('/api/maquinas');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer NEW_ACCESS');
    retry.flush({ ok: true });

    await expect(promise).resolves.toEqual({ ok: true });
    expect(auth.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('refresh falha: faz logout e propaga erro', async () => {
    auth.getToken.mockReturnValue('STALE');
    auth.getRefresh.mockReturnValue('REFRESH_TOKEN');
    auth.refreshToken.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    const promise = firstValueFrom(http.get('/api/maquinas'));
    httpMock.expectOne('/api/maquinas').flush('expired',
      { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toBeDefined();
    expect(auth.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('erros que NÃO são 401 são propagados sem touching refresh', async () => {
    auth.getToken.mockReturnValue('OK');
    auth.getRefresh.mockReturnValue('R');

    const promise = firstValueFrom(http.get('/api/maquinas'));
    httpMock.expectOne('/api/maquinas').flush('boom',
      { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toMatchObject({ status: 500 });
    expect(auth.refreshToken).not.toHaveBeenCalled();
  });
});
