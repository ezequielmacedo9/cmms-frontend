import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly i18n = inject(I18nService);
  private nextId = 0;
  toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info') {
    const id = this.nextId++;
    // Single funnel for every toast — translate here so callers keep pt keys.
    this.toasts.update(t => [...t, { id, message: this.i18n.t(message), type }].slice(-3));
    setTimeout(() => this.dismiss(id), 3500);
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string)   { this.show(message, 'error'); }
  warning(message: string) { this.show(message, 'warning'); }
  info(message: string)    { this.show(message, 'info'); }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
