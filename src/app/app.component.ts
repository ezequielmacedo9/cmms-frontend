import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private pingUrl = 'https://cmms-backend-8y7h.onrender.com/ping';
  private intervalId: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.ping();
    this.intervalId = setInterval(() => this.ping(), 14 * 60 * 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  private ping() {
    this.http.get(this.pingUrl, { responseType: 'text' }).subscribe({ error: () => {} });
  }
}
