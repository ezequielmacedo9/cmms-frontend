import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { CommonModule } from '@angular/common';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(12px)' })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('150ms ease', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        animate('250ms 100ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true })
    ])
  ])
]);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeAnimations]
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

  getRouteState(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] || outlet?.activatedRoute?.routeConfig?.path || 'unknown';
  }
}
