import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { vi } from 'vitest';

import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

/** Encodes a payload as a fake JWT (header.payload.signature). */
function makeToken(payload: object): string {
  const enc = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${enc('{"alg":"HS256"}')}.${enc(JSON.stringify(payload))}.sig`;
}

describe('authGuard', () => {
  let auth: {
    getToken: () => string | null;
    getRefresh: () => string | null;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    auth = {
      getToken:   () => null,
      getRefresh: () => null,
      logout:     vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([], withDisabledInitialNavigation()),
        { provide: AuthService, useValue: auth }
      ]
    });
  });

  function runGuard(url = '/dashboard'): boolean | UrlTree {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() =>
      authGuard(route, state) as boolean | UrlTree
    );
  }

  it('sem token: devolve UrlTree para /login com returnUrl', () => {
    auth.getToken = () => null;
    const result = runGuard('/maquinas');
    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(tree.queryParams['returnUrl']).toBe('/maquinas');
  });

  it('token expirado SEM refresh: faz logout e redireciona para /login', () => {
    auth.getToken   = () => makeToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    auth.getRefresh = () => null;
    const result = runGuard('/dashboard');
    expect(auth.logout).toHaveBeenCalled();
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('token expirado COM refresh: deixa passar (interceptor vai refrescar)', () => {
    auth.getToken   = () => makeToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    auth.getRefresh = () => 'REFRESH_TOKEN';
    expect(runGuard('/dashboard')).toBe(true);
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('token válido: deixa passar', () => {
    auth.getToken = () => makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(runGuard('/dashboard')).toBe(true);
  });

  it('returnUrl não é preservado quando o usuário tenta acessar /login', () => {
    auth.getToken = () => null;
    const result = runGuard('/login');
    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(tree.queryParams['returnUrl']).toBeUndefined();
  });
});
