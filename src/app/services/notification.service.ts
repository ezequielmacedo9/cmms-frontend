import { Injectable, inject, signal, computed } from '@angular/core';
import { ToastService } from './toast.service';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  read: boolean;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toast = inject(ToastService);

  private _items = signal<AppNotification[]>([]);

  readonly items       = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter(n => !n.read).length);

  private push(type: AppNotification['type'], message: string) {
    const n: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      message,
      read: false,
      timestamp: new Date()
    };
    this._items.update(prev => [n, ...prev].slice(0, 30));
  }

  success(message: string) { this.toast.success(message); this.push('success', message); }
  error(message: string)   { this.toast.error(message);   this.push('error', message); }
  warning(message: string) { this.toast.warning(message); this.push('warning', message); }
  info(message: string)    { this.toast.info(message);    this.push('info', message); }

  markAllRead() {
    this._items.update(ns => ns.map(n => ({ ...n, read: true })));
  }

  dismiss(id: string) {
    this._items.update(ns => ns.filter(n => n.id !== id));
  }

  clearAll() { this._items.set([]); }
}
