import {
  ChangeDetectionStrategy, Component, HostListener, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeyboardShortcutsService, ShortcutBinding } from '../../services/keyboard-shortcuts.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

interface ShortcutGroup {
  group: string;
  items: ShortcutBinding[];
}

/**
 * Keyboard shortcuts help panel. Mounted once globally (next to the toast
 * tray) and listens to {@link KeyboardShortcutsService.showHelp$} — fired
 * when the user presses {@code ?}. Toggling the same key closes it again.
 *
 * <p>Pure presentation: reads the bindings registered by the service and
 * renders them grouped. Closes on Escape, backdrop click or the X button.
 */
@Component({
  selector: 'app-shortcuts-help',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  template: `
    @if (open()) {
      <div class="sh-backdrop" (click)="close()" aria-hidden="true"></div>

      <div class="sh-panel"
           role="dialog"
           aria-modal="true"
           aria-labelledby="sh-title"
           (click)="$event.stopPropagation()">

        <header class="sh-head">
          <div>
            <h2 id="sh-title" class="sh-title">{{ 'Atalhos de teclado' | t }}</h2>
            <p class="sh-sub">{{ 'Navegue mais rápido pelo sistema' | t }}</p>
          </div>
          <button class="sh-close" type="button" (click)="close()" [attr.aria-label]="'Fechar atalhos' | t">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <div class="sh-body">
          @for (g of groups(); track g.group) {
            <section class="sh-group">
              <h3 class="sh-group-title">{{ g.group | t }}</h3>
              <ul class="sh-list">
                @for (b of g.items; track b.description) {
                  <li class="sh-row">
                    <span class="sh-desc">{{ b.description | t }}</span>
                    <kbd class="sh-keys">{{ b.keys }}</kbd>
                  </li>
                }
              </ul>
            </section>
          }
        </div>

        <footer class="sh-foot">
          {{ 'Pressione' | t }} <kbd class="sh-keys">?</kbd> {{ 'a qualquer momento para abrir esta ajuda.' | t }}
        </footer>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .sh-backdrop {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal, 1000);
      background: rgba(5, 5, 12, 0.72);
      backdrop-filter: blur(4px);
      animation: sh-fade 160ms var(--ease-out, ease-out);
    }

    .sh-panel {
      position: fixed;
      z-index: calc(var(--z-modal, 1000) + 1);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(560px, calc(100vw - 32px));
      max-height: min(80vh, 720px);
      display: flex;
      flex-direction: column;
      background: var(--surface, #12122a);
      border: 1px solid var(--border-strong, rgba(139,92,246,0.2));
      border-radius: var(--radius-lg, 16px);
      box-shadow: var(--shadow-xl, 0 24px 64px rgba(0,0,0,0.5));
      overflow: hidden;
      animation: sh-pop 200ms var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1));
    }

    .sh-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 22px 14px;
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
    }
    .sh-title {
      margin: 0;
      font-size: var(--fs-lg, 1.125rem);
      font-weight: var(--fw-semibold, 600);
      color: var(--text, #fafafa);
      letter-spacing: -0.01em;
    }
    .sh-sub {
      margin: 2px 0 0;
      font-size: var(--fs-sm, 0.8125rem);
      color: var(--text-2, rgba(255,255,255,0.65));
    }
    .sh-close {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--radius-sm, 8px);
      background: transparent;
      color: var(--text-2, rgba(255,255,255,0.65));
      cursor: pointer;
      transition: background 120ms, color 120ms;
    }
    .sh-close:hover { background: rgba(255,255,255,0.06); color: var(--text, #fff); }
    .sh-close mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .sh-body {
      padding: 8px 22px 4px;
      overflow-y: auto;
    }
    .sh-group { padding: 10px 0; }
    .sh-group-title {
      margin: 0 0 8px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent, #8b5cf6);
    }
    .sh-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
    .sh-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px 10px;
      border-radius: var(--radius-sm, 8px);
      transition: background 120ms;
    }
    .sh-row:hover { background: rgba(255,255,255,0.035); }
    .sh-desc { font-size: var(--fs-sm, 0.8125rem); color: var(--text-2, rgba(255,255,255,0.78)); }

    .sh-keys {
      flex-shrink: 0;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 0.75rem;
      color: var(--text, #fafafa);
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border-strong, rgba(139,92,246,0.2));
      border-bottom-width: 2px;
      border-radius: 6px;
      padding: 3px 8px;
      white-space: nowrap;
    }

    .sh-foot {
      padding: 12px 22px;
      border-top: 1px solid var(--border, rgba(255,255,255,0.07));
      font-size: var(--fs-xs, 0.75rem);
      color: var(--text-4, rgba(255,255,255,0.4));
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sh-foot .sh-keys { padding: 1px 6px; }

    @keyframes sh-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes sh-pop {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .sh-backdrop, .sh-panel { animation-duration: 0.001ms !important; }
    }
  `]
})
export class ShortcutsHelpComponent {

  private readonly shortcuts = inject(KeyboardShortcutsService);

  readonly open   = signal(false);
  readonly groups = signal<ShortcutGroup[]>([]);

  constructor() {
    this.shortcuts.showHelp$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.toggle());
  }

  close(): void { this.open.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  private toggle(): void {
    if (this.open()) { this.close(); return; }
    this.groups.set(this.buildGroups());
    this.open.set(true);
  }

  /** Buckets the registered bindings by their {@code group} label. */
  private buildGroups(): ShortcutGroup[] {
    const byGroup = new Map<string, ShortcutBinding[]>();
    for (const binding of this.shortcuts.list()) {
      const bucket = byGroup.get(binding.group) ?? [];
      bucket.push(binding);
      byGroup.set(binding.group, bucket);
    }
    return Array.from(byGroup, ([group, items]) => ({ group, items }));
  }
}
