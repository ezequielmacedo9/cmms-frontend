import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { ShortcutsHelpComponent } from './components/shortcuts-help/shortcuts-help.component';
import { WakeupService } from './services/wakeup.service';
import { KeyboardShortcutsService } from './services/keyboard-shortcuts.service';
import { NotificationPollingService } from './services/notification-polling.service';
import { SeoService } from './services/seo.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, ShortcutsHelpComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly wakeup = inject(WakeupService);
  private readonly shortcuts = inject(KeyboardShortcutsService);
  private readonly notifications = inject(NotificationPollingService);
  private readonly seo = inject(SeoService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    if (!environment.googleClientId) {
      console.error('[CMMS] ERRO: environment.googleClientId não configurado. Login com Google indisponível.');
    }
    if (!environment.apiUrl) {
      console.error('[CMMS] ERRO: environment.apiUrl não configurado. Backend inacessível.');
    }

    this.wakeup.ping().subscribe();
    this.intervalId = setInterval(() => this.wakeup.ping().subscribe(), 10 * 60 * 1000);

    // Bind global keyboard shortcuts once at startup.
    this.shortcuts.install();

    // Start the notifications polling loop (60s). Pauses automatically
    // when the user is logged out — see NotificationPollingService.
    this.notifications.start();

    // Keep <title> and OG/Twitter meta tags in sync with the active route.
    this.seo.install();
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
