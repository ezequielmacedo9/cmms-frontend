import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { WakeupService } from './services/wakeup.service';

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
    this.wakeup.ping().subscribe();
    this.intervalId = setInterval(() => this.wakeup.ping().subscribe(), 14 * 60 * 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
