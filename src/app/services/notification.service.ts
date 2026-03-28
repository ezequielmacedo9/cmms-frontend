import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toast = inject(ToastService);

  success(message: string) { this.toast.success(message); }
  error(message: string)   { this.toast.error(message); }
  warning(message: string) { this.toast.warning(message); }
  info(message: string)    { this.toast.info(message); }
}
