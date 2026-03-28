import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" (click)="toast.dismiss(t.id)">
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
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
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      pointer-events: all;
      min-width: 280px;
      max-width: 400px;
      backdrop-filter: blur(20px);
      border: 1px solid;
      animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(40px) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    .toast-success {
      background: rgba(6,20,14,0.97);
      border-color: rgba(16,185,129,0.3);
      color: #4ade80;
    }
    .toast-error {
      background: rgba(20,6,6,0.97);
      border-color: rgba(239,68,68,0.3);
      color: #f87171;
    }
    .toast-warning {
      background: rgba(20,14,4,0.97);
      border-color: rgba(245,158,11,0.3);
      color: #fbbf24;
    }
    .toast-info {
      background: rgba(6,8,20,0.97);
      border-color: rgba(99,102,241,0.3);
      color: #a5b4fc;
    }
    .toast-icon { font-size: 15px; flex-shrink: 0; }
    .toast-msg { flex: 1; line-height: 1.4; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      color: inherit; opacity: 0.4; font-size: 11px; padding: 0;
      flex-shrink: 0;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
  icons: Record<string, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
}
