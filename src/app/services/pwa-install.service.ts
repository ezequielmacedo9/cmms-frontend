import { Injectable, signal } from '@angular/core';

/**
 * Captures the {@code beforeinstallprompt} event so the app can show a
 * native install prompt at the right moment (after the user has seen
 * real value) instead of letting the browser nag immediately.
 *
 * <p>Public surface:
 *   - {@code available} signal — true when the prompt can be shown.
 *   - {@code prompt()} — surfaces the native UI; resolves with the
 *     outcome ('accepted' | 'dismissed' | 'unavailable').
 *
 * <p>Listens once at construction; no manual cleanup needed because the
 * service lives the whole session.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {

  private deferred: BeforeInstallPromptEvent | null = null;
  /** True when the browser has fired beforeinstallprompt at least once. */
  readonly available = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      // The browser fires this before showing its own UI. Stash so we
      // can present it ourselves later.
      event.preventDefault();
      this.deferred = event as BeforeInstallPromptEvent;
      this.available.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.available.set(false);
    });
  }

  /**
   * Surfaces the saved install prompt. Returns the user's choice.
   * Calling when no prompt is available resolves with {@code 'unavailable'}.
   */
  async prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferred) return 'unavailable';
    const event = this.deferred;
    this.deferred = null;
    this.available.set(false);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch {
      return 'dismissed';
    }
  }
}

/** Minimal typing for the non-standard beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
