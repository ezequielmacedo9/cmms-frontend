import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError, isApiError } from '../models/api-error.model';
import { NotificationService } from '../services/notification.service';

/**
 * Centralised HTTP error handling.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Parse the backend {@link ApiError} envelope, log it with traceId
 *       so support can correlate with backend logs.</li>
 *   <li>Surface a single, user-friendly toast for any unhandled HTTP
 *       failure. Components remain free to also catch the error and show
 *       inline UI, but they no longer NEED to do anything.</li>
 *   <li>Stay silent on 401 (handled by {@code authInterceptor}, which will
 *       redirect to login) and on aborted requests (status 0 from a CORS
 *       preflight or page navigation).</li>
 * </ul>
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 belongs to the auth interceptor; aborted/cancelled requests have status 0.
      if (err.status === 401 || err.status === 0) {
        return throwError(() => err);
      }

      const apiError = extractApiError(err);
      logError(req.method, req.url, err, apiError);

      // Suppress toasts for endpoints that are expected to fail noisily
      // (file downloads with their own handling, presence checks, etc.).
      if (!shouldSuppressToast(req.url)) {
        notify.error(humanMessage(apiError, err));
      }

      return throwError(() => err);
    })
  );
};

function extractApiError(err: HttpErrorResponse): ApiError | undefined {
  return isApiError(err.error) ? err.error : undefined;
}

function humanMessage(apiError: ApiError | undefined, err: HttpErrorResponse): string {
  if (apiError?.message) return apiError.message;
  switch (err.status) {
    case 0:   return 'Sem conexão com o servidor.';
    case 400: return 'Requisição inválida.';
    case 403: return 'Você não tem permissão para esta ação.';
    case 404: return 'Recurso não encontrado.';
    case 409: return 'Conflito ao salvar — verifique os dados.';
    case 422: return 'Dados inválidos.';
    case 429: return 'Muitas tentativas. Aguarde alguns instantes.';
    case 500: return 'Erro interno do servidor. Tente novamente mais tarde.';
    case 502:
    case 503:
    case 504: return 'Serviço indisponível no momento.';
    default:  return 'Erro inesperado ao processar a requisição.';
  }
}

function logError(
  method: string,
  url: string,
  err: HttpErrorResponse,
  apiError: ApiError | undefined,
): void {
  const traceId = apiError?.traceId ?? '-';
  const code    = apiError?.code    ?? `HTTP_${err.status}`;
  // eslint-disable-next-line no-console
  console.error(
    `[${traceId}] ${method} ${url} → ${err.status} ${code}`,
    apiError ?? err.error ?? err.message
  );
}

/** Endpoints where the component owns its own error UX. Add sparingly. */
function shouldSuppressToast(url: string): boolean {
  return url.includes('/api/auth/validate-reset-token')
      || url.includes('/api/wakeup')
      || url.endsWith('/ping');
}
