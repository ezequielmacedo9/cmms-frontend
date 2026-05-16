import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the bearer token to every outgoing request and transparently
 * handles 401s by refreshing the token exactly once across all concurrent
 * requests (mutex pattern via {@link refreshSubject}).
 *
 * <p>If the refresh itself fails, all queued requests fail and the user
 * is redirected to {@code /login?returnUrl=&lt;current&gt;}.
 */
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  // Never send Authorization on the auth endpoints (login, refresh, google,
  // forgot/reset password). Stops the backend from misreading a stale token.
  const isAuthEndpoint = req.url.includes('/api/auth/');
  const outgoing = (token && !isAuthEndpoint)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthEndpoint) {
        return throwError(() => err);
      }
      return handle401(req, next, auth, router);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  const refresh = auth.getRefresh();
  if (!refresh) {
    return redirectToLogin(auth, router, req.url);
  }

  if (isRefreshing) {
    // A refresh is already in flight — queue and replay when the new token arrives.
    return refreshSubject.pipe(
      filter((newToken): newToken is string => newToken !== null),
      take(1),
      switchMap(newToken =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
      )
    );
  }

  isRefreshing = true;
  refreshSubject.next(null);

  return auth.refreshToken(refresh).pipe(
    switchMap(res => {
      isRefreshing = false;
      refreshSubject.next(res.accessToken);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } }));
    }),
    catchError(refreshErr => {
      isRefreshing = false;
      refreshSubject.next(null);
      return redirectToLogin(auth, router, req.url, refreshErr);
    })
  );
}

function redirectToLogin(
  auth: AuthService,
  router: Router,
  attemptedUrl: string,
  cause?: unknown,
): Observable<never> {
  auth.logout();
  // Preserve the URL the user tried to access (unless it was already the login screen).
  const path = stripOrigin(attemptedUrl);
  const safeReturn = (path && !path.startsWith('/login')) ? path : undefined;
  router.navigate(['/login'], safeReturn ? { queryParams: { returnUrl: safeReturn } } : undefined);
  return throwError(() => cause ?? new Error('Session expired'));
}

/** Drops protocol/host from absolute URLs so the returnUrl stays on this app. */
function stripOrigin(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    if (u.origin !== window.location.origin) return '';
    return u.pathname + u.search;
  } catch {
    return url.startsWith('/') ? url : '';
  }
}
