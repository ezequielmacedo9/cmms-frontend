import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { WakeupService } from './services/wakeup.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private wakeup = inject(WakeupService);
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
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
