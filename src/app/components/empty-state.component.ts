import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EmptyKind = 'inbox' | 'search' | 'rocket' | 'package' | 'gear' | 'check';

/**
 * Reusable empty-state block. Picks a stylized SVG illustration based on
 * the {@link kind} input and renders title + hint + optional CTA slot.
 *
 * Usage:
 * ```html
 * <app-empty-state
 *     kind="package"
 *     title="Nenhum item cadastrado"
 *     hint="Clique em Adicionar para começar.">
 *   <button class="ui-btn ui-btn--primary">Adicionar</button>
 * </app-empty-state>
 * ```
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ui-empty">
      <div [ngSwitch]="kind" class="empty-illustration" aria-hidden="true">

        <svg *ngSwitchCase="'inbox'" viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="es-grad-inbox" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#a78bfa"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <rect x="40" y="40" width="120" height="70" rx="10" fill="rgba(139,92,246,0.10)" stroke="url(#es-grad-inbox)" stroke-width="1.5"/>
          <path d="M40 80 L70 80 L80 95 L120 95 L130 80 L160 80" stroke="url(#es-grad-inbox)" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="100" cy="35" r="4" fill="#a78bfa"/>
          <circle cx="75" cy="28" r="2.5" fill="rgba(167,139,250,0.6)"/>
          <circle cx="125" cy="28" r="2.5" fill="rgba(167,139,250,0.6)"/>
        </svg>

        <svg *ngSwitchCase="'search'" viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="es-grad-search" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#a78bfa"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <circle cx="85" cy="60" r="30" stroke="url(#es-grad-search)" stroke-width="3" fill="rgba(139,92,246,0.08)"/>
          <line x1="108" y1="83" x2="135" y2="110" stroke="url(#es-grad-search)" stroke-width="3" stroke-linecap="round"/>
          <line x1="70" y1="58" x2="100" y2="58" stroke="rgba(167,139,250,0.5)" stroke-width="2" stroke-linecap="round"/>
          <line x1="70" y1="66" x2="90" y2="66" stroke="rgba(167,139,250,0.3)" stroke-width="2" stroke-linecap="round"/>
        </svg>

        <svg *ngSwitchCase="'rocket'" viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="es-grad-rocket" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#a78bfa"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <path d="M100 20 Q120 50 120 80 L120 95 L80 95 L80 80 Q80 50 100 20Z" fill="url(#es-grad-rocket)" opacity="0.85"/>
          <circle cx="100" cy="60" r="6" fill="#fafafa"/>
          <path d="M80 80 L65 90 L80 90 Z" fill="rgba(167,139,250,0.6)"/>
          <path d="M120 80 L135 90 L120 90 Z" fill="rgba(167,139,250,0.6)"/>
          <path d="M90 95 L95 115 L100 102 L105 115 L110 95" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        </svg>

        <svg *ngSwitchCase="'package'" viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="es-grad-pkg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#a78bfa"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <path d="M100 30 L150 55 L150 105 L100 130 L50 105 L50 55 Z" fill="rgba(139,92,246,0.12)" stroke="url(#es-grad-pkg)" stroke-width="1.8"/>
          <path d="M50 55 L100 80 L150 55" stroke="url(#es-grad-pkg)" stroke-width="1.8" fill="none"/>
          <line x1="100" y1="80" x2="100" y2="130" stroke="url(#es-grad-pkg)" stroke-width="1.8"/>
          <line x1="70" y1="42" x2="120" y2="67" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        </svg>

        <svg *ngSwitchCase="'gear'" viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="es-grad-gear" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#a78bfa"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <g transform="translate(100 70)">
            <g class="empty-illustration__spin">
              <circle r="32" fill="rgba(139,92,246,0.08)" stroke="url(#es-grad-gear)" stroke-width="2"/>
              <circle r="12" fill="url(#es-grad-gear)"/>
              <g stroke="url(#es-grad-gear)" stroke-width="6" stroke-linecap="round">
                <line x1="0" y1="-32" x2="0" y2="-42"/>
                <line x1="0" y1="32"  x2="0" y2="42"/>
                <line x1="-32" y1="0" x2="-42" y2="0"/>
                <line x1="32" y1="0"  x2="42" y2="0"/>
                <line x1="-22" y1="-22" x2="-29" y2="-29"/>
                <line x1="22" y1="22"   x2="29" y2="29"/>
                <line x1="-22" y1="22"  x2="-29" y2="29"/>
                <line x1="22" y1="-22"  x2="29" y2="-29"/>
              </g>
            </g>
          </g>
        </svg>

        <svg *ngSwitchDefault viewBox="0 0 200 140" fill="none">
          <defs>
            <linearGradient id="es-grad-check" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#22c55e"/>
              <stop offset="1" stop-color="#16a34a"/>
            </linearGradient>
          </defs>
          <circle cx="100" cy="70" r="40" fill="rgba(34,197,94,0.10)" stroke="url(#es-grad-check)" stroke-width="2"/>
          <path d="M82 70 L96 84 L122 58" stroke="url(#es-grad-check)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

      </div>

      <div class="ui-empty__title">{{ title }}</div>
      @if (hint) {
        <div class="ui-empty__hint">{{ hint }}</div>
      }
      <div class="ui-empty__actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .empty-illustration {
      width: 160px;
      height: 110px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 4px 14px rgba(139, 92, 246, 0.20));
    }
    .empty-illustration svg { width: 100%; height: 100%; }
    .empty-illustration__spin { animation: emptySpin 14s linear infinite; transform-origin: center; }
    @keyframes emptySpin { to { transform: rotate(360deg); } }
    .ui-empty__actions { margin-top: var(--space-3); }
    @media (prefers-reduced-motion: reduce) {
      .empty-illustration__spin { animation: none; }
    }
  `]
})
export class EmptyStateComponent {
  @Input() kind: EmptyKind = 'inbox';
  @Input() title = 'Sem dados ainda.';
  @Input() hint?: string;
}
