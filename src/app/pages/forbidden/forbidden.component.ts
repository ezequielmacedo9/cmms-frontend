import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { ROLE_LABELS, UserRole } from '../../models/user.model';

/**
 * 403 — Forbidden. Reached when {@code roleGuard} denies a route.
 *
 * <p>The view tells the user which role they currently have and what was
 * required — useful for support and for users mid-onboarding who haven't
 * been granted the right permissions yet.
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './forbidden.component.html',
  styleUrls: ['../not-found/not-found.component.css', './forbidden.component.css']
})
export class ForbiddenComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);

  get currentRole(): UserRole | null { return this.auth.getRole(); }
  get currentRoleLabel(): string {
    return this.currentRole ? (ROLE_LABELS[this.currentRole] ?? this.currentRole) : '—';
  }

  goBack(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/dashboard']);
  }
}
