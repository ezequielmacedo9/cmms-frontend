import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Catch-all 404 page. Cinematic but small — single SVG, two CTAs.
 *
 * <p>Reached either by Angular's wildcard route or by manual navigation
 * to a URL that doesn't exist. The "go back" button uses the browser
 * history so navigating from a deep link still feels right.
 */
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  goBack(): void {
    // History length > 1 only when navigation actually happened in this tab.
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
