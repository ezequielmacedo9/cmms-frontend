import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenExpired } from '../services/jwt.util';

/**
 * Lets the user proceed only when a non-expired access token is present.
 *
 * <ul>
 *   <li>Missing token → redirect to /login with returnUrl.</li>
 *   <li>Expired token with refresh available → let the request flow; the
 *       HTTP {@code authInterceptor} will refresh on the first 401.</li>
 *   <li>Expired token AND no refresh → clear auth state and redirect to login.</li>
 * </ul>
 *
 * Returning a {@link UrlTree} is preferable to imperative navigation because
 * it lets the Router cancel the activation atomically.
 */
export const authGuard: CanActivateFn = (_, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const token = auth.getToken();
  if (!token) return loginRedirect(router, state.url);

  if (isTokenExpired(token)) {
    if (!auth.getRefresh()) {
      auth.logout();
      return loginRedirect(router, state.url);
    }
    // We still let the route activate. The first HTTP call to /api/* will
    // hit 401 and the auth interceptor will refresh atomically (mutex).
  }
  return true;
};

function loginRedirect(router: Router, attemptedUrl: string): UrlTree {
  const safeReturn = attemptedUrl && !attemptedUrl.startsWith('/login') ? attemptedUrl : undefined;
  return router.createUrlTree(
    ['/login'],
    safeReturn ? { queryParams: { returnUrl: safeReturn } } : {}
  );
}
