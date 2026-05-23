import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of, switchMap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiNotification } from '../models/notification.model';
import { AuthService } from './auth.service';
import { NotificationService as ToastNotifier } from './notification.service';

/**
 * Polls the backend every {@code POLL_INTERVAL_MS} for fresh notifications.
 *
 * <p>Design notes:
 *   - Uses Angular signals so consumers (bell panel, dashboard widget) can
 *     bind the list directly without manual subscriptions.
 *   - Pauses when the user is logged out — no point hammering /api/x while
 *     the login screen is showing.
 *   - Detects new {@code CRITICAL} notifications across polls and forwards
 *     them to the existing toast service for ambient awareness. Avoids
 *     re-toasting the same id on every loop with a {@code seen} set.
 *   - takeUntilDestroyed registers cleanup; service is provided in root
 *     so the timer is shared app-wide.
 */
@Injectable({ providedIn: 'root' })
export class NotificationPollingService {

  private static readonly POLL_INTERVAL_MS = 60_000;

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastNotifier);
  private readonly destroyRef = inject(DestroyRef);

  private readonly endpoint = `${environment.apiUrl}/api/notifications`;
  private readonly _list = signal<ApiNotification[]>([]);
  private readonly _loading = signal(false);
  /** Tracks which notification ids we've already surfaced as toasts. */
  private readonly seen = new Set<string>();
  private installed = false;

  readonly list      = this._list.asReadonly();
  readonly loading   = this._loading.asReadonly();
  readonly critical  = computed(() => this._list().filter(n => n.severity === 'CRITICAL'));
  readonly unreadCnt = computed(() => this._list().length);

  /** Wires the polling loop. Idempotent — safe to call from AppComponent.ngOnInit. */
  start(): void {
    if (this.installed) return;
    this.installed = true;

    timer(0, NotificationPollingService.POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.fetchOnce()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(rows => this.onFetchSuccess(rows));
  }

  /** Forces a fresh fetch outside of the polling cycle. */
  refresh(): void {
    this.fetchOnce().subscribe(rows => this.onFetchSuccess(rows));
  }

  // ── internals ────────────────────────────────────────────────────────

  private fetchOnce() {
    if (!this.auth.isLoggedIn()) return of<ApiNotification[]>([]);
    this._loading.set(true);
    return this.http.get<ApiNotification[]>(this.endpoint).pipe(
      catchError(() => of<ApiNotification[]>([])),
      finalize(() => this._loading.set(false))
    );
  }

  private onFetchSuccess(rows: ApiNotification[]): void {
    this._list.set(rows ?? []);
    if (!rows || rows.length === 0) {
      this.seen.clear(); // queue empty, start fresh
      return;
    }

    // Surface unseen CRITICAL notifications as toasts.
    for (const n of rows) {
      if (n.severity === 'CRITICAL' && !this.seen.has(n.id)) {
        this.toast.warning(`${n.title} — ${n.message}`);
      }
    }
    // Prune ids that no longer come from the server.
    const incoming = new Set(rows.map(r => r.id));
    for (const id of [...this.seen]) {
      if (!incoming.has(id)) this.seen.delete(id);
    }
    // Mark current ids as seen.
    rows.forEach(r => this.seen.add(r.id));
  }
}
