import {
  ApplicationRef, ComponentRef, EnvironmentInjector, Injectable,
  createComponent, inject, signal
} from '@angular/core';
import { TourComponent } from './tour.component';
import { TourOptions, TourStep } from './tour.model';

/**
 * Orchestrates the onboarding tour. Mounts a single {@link TourComponent}
 * dynamically (no CDK Dialog needed) and walks the user through the
 * provided steps.
 *
 * <p>Usage from a component (typically the dashboard after first login):
 * <pre>
 * if (!this.tour.hasCompleted()) {
 *   this.tour.start([
 *     { selector: '.nav-item[href="/maquinas"]',
 *       title: 'Suas máquinas',
 *       description: 'Comece cadastrando os equipamentos do parque.' },
 *     ...
 *   ]);
 * }
 * </pre>
 *
 * <p>Completion is persisted in {@code localStorage} so the tour only
 * runs once per device.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingTourService {

  private static readonly DEFAULT_KEY = 'cmms.tour.completed';

  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);

  private active: ComponentRef<TourComponent> | null = null;
  private storageKey = OnboardingTourService.DEFAULT_KEY;

  /** Reactive flag — useful to toggle a "tutorial" button in the UI. */
  readonly running = signal(false);

  /** True when the user has already seen the tour at least once. */
  hasCompleted(key: string = this.storageKey): boolean {
    try { return localStorage.getItem(key) === 'true'; }
    catch { return false; }
  }

  /** Programmatic restart — bypasses the localStorage gate. */
  start(steps: TourStep[], options?: TourOptions): void {
    if (steps.length === 0 || this.active) return;
    if (options?.storageKey) this.storageKey = options.storageKey;

    const ref = createComponent(TourComponent, {
      environmentInjector: this.envInjector
    });

    ref.instance.steps   = steps;
    ref.instance.current = 0;

    ref.instance.advance.subscribe(() => this.advance());
    ref.instance.goBack.subscribe(() => this.goBack());
    ref.instance.skip.subscribe(() => this.finish(/*completed*/ false));
    ref.instance.complete.subscribe(() => this.finish(/*completed*/ true));

    document.body.appendChild(ref.location.nativeElement);
    this.appRef.attachView(ref.hostView);

    this.active = ref;
    this.running.set(true);
  }

  /** Same as start() but no-op when the user has already finished it. */
  startIfFirstTime(steps: TourStep[], options?: TourOptions): void {
    const key = options?.storageKey ?? this.storageKey;
    if (!this.hasCompleted(key)) this.start(steps, options);
  }

  // ── internals ────────────────────────────────────────────────────────

  private advance(): void {
    if (!this.active) return;
    const next = this.active.instance.current + 1;
    if (next >= this.active.instance.steps.length) {
      this.finish(true);
    } else {
      this.active.instance.current = next;
      this.active.changeDetectorRef.markForCheck();
    }
  }

  private goBack(): void {
    if (!this.active) return;
    const prev = Math.max(0, this.active.instance.current - 1);
    this.active.instance.current = prev;
    this.active.changeDetectorRef.markForCheck();
  }

  private finish(completed: boolean): void {
    if (!this.active) return;
    if (completed) {
      try { localStorage.setItem(this.storageKey, 'true'); } catch { /* ignore quota */ }
    }
    this.appRef.detachView(this.active.hostView);
    this.active.destroy();
    this.active = null;
    this.running.set(false);
  }
}
