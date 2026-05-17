import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { errorInterceptor } from './error-interceptor';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../models/api-error.model';

/**
 * The error interceptor parses the backend ApiError envelope and surfaces
 * a toast. It must:
 *
 *   - Stay silent on 401 (auth interceptor handles) and 0 (aborted).
 *   - Suppress toasts for endpoints that own their UX (ping, validate-reset-token).
 *   - Prefer the envelope's `message` when present; fall back to a status-specific
 *     friendly text otherwise.
 */
describe('errorInterceptor', () => {

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notify: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    notify = { error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notify }
      ]
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('usa message do envelope ApiError quando presente', async () => {
    const envelope: ApiError = {
      timestamp: '2026-05-17T00:00:00Z',
      status: 404,
      error: 'Not Found',
      code: 'MAQUINA_NOT_FOUND',
      message: 'Máquina não encontrada (id=99).',
      path: '/api/maquinas/99',
      traceId: 'abc-123'
    };

    const promise = firstValueFrom(http.get('/api/maquinas/99'));
    httpMock.expectOne('/api/maquinas/99').flush(envelope,
      { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toBeDefined();
    expect(notify.error).toHaveBeenCalledWith('Máquina não encontrada (id=99).');
  });

  it('usa fallback amigável quando o backend não devolve envelope', async () => {
    const promise = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').flush('boom',
      { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toBeDefined();
    expect(notify.error).toHaveBeenCalledWith(
      'Erro interno do servidor. Tente novamente mais tarde.'
    );
  });

  it('silencia em 401 (deixa o authInterceptor lidar)', async () => {
    const promise = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').flush(null,
      { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toBeDefined();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('silencia em status 0 (request cancelada / network)', async () => {
    const promise = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').error(new ProgressEvent('error'),
      { status: 0, statusText: 'Network' });

    await expect(promise).rejects.toBeDefined();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('silencia no endpoint /ping (suprimido por lista)', async () => {
    const promise = firstValueFrom(http.get('/ping'));
    httpMock.expectOne('/ping').flush('boom',
      { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toBeDefined();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('silencia no endpoint /api/auth/validate-reset-token', async () => {
    const promise = firstValueFrom(http.get('/api/auth/validate-reset-token?token=abc'));
    httpMock.expectOne(r => r.url.includes('validate-reset-token'))
      .flush({ valid: false }, { status: 400, statusText: 'Bad Request' });

    await expect(promise).rejects.toBeDefined();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('mapeia 403 / 409 / 502 para textos friendly específicos', async () => {
    for (const [status, expected] of [
      [403, 'Você não tem permissão para esta ação.'],
      [409, 'Conflito ao salvar — verifique os dados.'],
      [502, 'Serviço indisponível no momento.']
    ] as const) {
      notify.error.mockClear();
      const promise = firstValueFrom(http.get(`/api/x${status}`));
      httpMock.expectOne(`/api/x${status}`)
        .flush(null, { status, statusText: '' });
      await expect(promise).rejects.toBeDefined();
      expect(notify.error).toHaveBeenCalledWith(expected);
    }
  });
});
