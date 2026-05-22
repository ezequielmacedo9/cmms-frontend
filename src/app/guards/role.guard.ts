import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Allows the route only when the current user has one of {@code allowedRoles}.
 *
 * <p>Failure modes:
 * <ul>
 *   <li>Not logged in → redirect to {@code /login}.</li>
 *   <li>Logged in but without the right role → redirect to {@code /403}.</li>
 * </ul>
 *
 * Returning {@link UrlTree} keeps activation atomic — Router cancels and
 * navigates in one step, no flicker.
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    const role = auth.getRole();
    if (!role || !allowedRoles.includes(role)) {
      return router.createUrlTree(['/403']);
    }
    return true;
  };
};
