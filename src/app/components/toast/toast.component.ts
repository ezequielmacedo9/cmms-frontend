import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../services/toast.service';

/**
 * Top-of-screen toast tray. Renders the queue from {@link ToastService}
 * with semantic colours, animated SVG icons (success draws the check,
 * error shakes) and an auto-dismiss progress bar.
 *
 * <p>Pure read-only: the service is the source of truth for the queue
 * and the dismissal timer.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notificações">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast--{{ t.type }}"
             role="status"
             aria-live="polite"
             (click)="toast.dismiss(t.id)">

          <div class="toast-icon" [attr.aria-label]="iconLabel[t.type]">
            <ng-container [ngSwitch]="t.type">
              <svg *ngSwitchCase="'success'" class="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" class="i-check__ring"/>
                <path d="M7.5 12.5 L10.5 15.5 L16.5 9" class="i-check__mark"/>
              </svg>
              <svg *ngSwitchCase="'error'" class="i-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
              <svg *ngSwitchCase="'warning'" class="i-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3 L22 21 L2 21 Z"/>
                <line x1="12" y1="10" x2="12" y2="14"/>
                <circle cx="12" cy="17" r="0.6" fill="currentColor"/>
              </svg>
              <svg *ngSwitchDefault class="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="11" x2="12" y2="16"/>
                <circle cx="12" cy="8" r="0.6" fill="currentColor"/>
              </svg>
            </ng-container>
          </div>

          <span class="toast-msg">{{ t.message }}</span>

          <button class="toast-close" (click)="$event.stopPropagation(); toast.dismiss(t.id)"
                  aria-label="Fechar notificação">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="6" y1="6" x2="18" y2="18"/>
              <line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
          </button>

          <div class="toast-progress" aria-hidden="true"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px 12px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      pointer-events: all;
      min-width: 300px;
      max-width: 440px;
      backdrop-filter: blur(20px);
      border: 1px solid;
      box-shadow: 0 10px 40px rgba(0,0,0,0.45);
      overflow: hidden;
      animation: toast-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(40px) scale(0.96); }
      to   { opacity: 1; transform: translateX(0)    scale(1); }
    }

    /* Type colors */
    .toast--success { background: rgba(6,20,14,0.94);  border-color: rgba(16,185,129,0.35); color: #4ade80; }
    .toast--error   { background: rgba(20,6,6,0.94);   border-color: rgba(239,68,68,0.35);  color: #f87171; }
    .toast--warning { background: rgba(20,14,4,0.94);  border-color: rgba(245,158,11,0.35); color: #fbbf24; }
    .toast--info    { background: rgba(6,8,20,0.94);   border-color: rgba(99,102,241,0.35); color: #a5b4fc; }

    /* Icon block — sized to leave room for the SVG strokes */
    .toast-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toast-icon svg { width: 22px; height: 22px; display: block; }

    /* Animated success check — ring grows in, path draws */
    .i-check__ring {
      transform-origin: center;
      animation: ring-in 360ms 60ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .i-check__mark {
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      animation: draw-mark 320ms 320ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @keyframes ring-in {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    @keyframes draw-mark {
      to { stroke-dashoffset: 0; }
    }

    /* Error icon — subtle horizontal shake */
    .i-error { animation: shake 360ms 60ms ease-in-out both; }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-2px); }
      40%      { transform: translateX( 2px); }
      60%      { transform: translateX(-1px); }
      80%      { transform: translateX( 1px); }
    }

    .toast-msg { flex: 1; line-height: 1.4; color: rgba(255,255,255,0.95); }

    .toast-close {
      background: none; border: none; cursor: pointer;
      color: inherit; opacity: 0.45; padding: 4px;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      transition: opacity 160ms, background 160ms;
    }
    .toast-close svg { width: 14px; height: 14px; }
    .toast-close:hover { opacity: 1; background: rgba(255,255,255,0.06); }
    .toast-close:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 1px;
      opacity: 1;
    }

    /* Auto-dismiss progress bar — purely decorative; the timer lives in
       the service. Uses the toast's own color so it stays semantic. */
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      width: 100%;
      background: currentColor;
      opacity: 0.5;
      transform-origin: left center;
      animation: toast-progress 3500ms linear forwards;
    }
    @keyframes toast-progress {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast, .i-check__ring, .i-check__mark, .i-error, .toast-progress {
        animation-duration: 0.001ms !important;
      }
      .i-check__mark { stroke-dashoffset: 0 !important; }
    }
  `]
})
export class ToastComponent {
  readonly toast = inject(ToastService);

  readonly iconLabel: Record<ToastType, string> = {
    success: 'Sucesso',
    error:   'Erro',
    warning: 'Aviso',
    info:    'Informação'
  };
}
