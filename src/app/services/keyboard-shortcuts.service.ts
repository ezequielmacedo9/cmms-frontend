import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export interface ShortcutBinding {
  /** Description shown in the keyboard help panel. */
  description: string;
  /** Group label, e.g. 'Navegação' or 'Ações rápidas'. */
  group: string;
  /** Display string, e.g. 'Ctrl+K' or '/'. */
  keys: string;
  /** Predicate to match the KeyboardEvent. Return true to fire {@code run}. */
  match: (e: KeyboardEvent) => boolean;
  /** Callback executed when matched. */
  run: () => void;
}

/**
 * Centralised keyboard shortcuts. Registered globally by AppComponent at
 * startup so any route can rely on them. Listens at the {@code window}
 * level but skips events originating from form fields to avoid stealing
 * the user's input.
 *
 * <p>UX choices borrowed from Linear / Notion:
 *   - {@code Ctrl/Cmd+K}  → open command palette (future).
 *   - {@code /}            → focus global search (when present).
 *   - {@code G then D}     → go to dashboard.
 *   - {@code G then M}     → go to máquinas.
 *   - {@code G then N}     → go to manutenções.
 *   - {@code G then E}     → go to estoque.
 *   - {@code ?}            → show keyboard help.
 */
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly destroy$ = new Subject<void>();

  private readonly bindings: ShortcutBinding[] = [];
  private installed = false;

  /** Multi-key combo state ('G' was just pressed, waiting for second key). */
  private gPressedAt = 0;
  private static readonly G_WINDOW_MS = 1200;

  /** Help panel observable — components can subscribe to show/hide a modal. */
  readonly showHelp$ = new Subject<void>();
  /** Global search focus signal — emitted when the user presses '/'. */
  readonly focusGlobalSearch$ = new Subject<void>();
  /** Command palette signal — emitted when the user presses Ctrl/Cmd+K. */
  readonly openCommandPalette$ = new Subject<void>();

  install(): void {
    if (this.installed) return;
    this.installed = true;
    this.registerDefaults();

    fromEvent<KeyboardEvent>(window, 'keydown')
      .pipe(
        filter(e => !this.isEditableTarget(e.target)),
        takeUntil(this.destroy$)
      )
      .subscribe(e => this.dispatch(e));

    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  /** Returns the registered bindings — useful for the help panel UI. */
  list(): ReadonlyArray<ShortcutBinding> {
    return this.bindings;
  }

  // ── internals ────────────────────────────────────────────────────────

  private registerDefaults(): void {
    this.bindings.push(
      {
        keys: 'Ctrl/⌘+K', group: 'Ações rápidas',
        description: 'Abrir paleta de comandos',
        match: e => (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'),
        run:   () => this.openCommandPalette$.next()
      },
      {
        keys: '/', group: 'Ações rápidas',
        description: 'Focar busca global',
        match: e => e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey,
        run:   () => this.focusGlobalSearch$.next()
      },
      {
        keys: '?', group: 'Ações rápidas',
        description: 'Mostrar atalhos de teclado',
        match: e => (e.key === '?' || (e.shiftKey && e.key === '/')) && !e.ctrlKey && !e.metaKey,
        run:   () => this.showHelp$.next()
      },
      // ── G then X combos ──
      this.gCombo('D', 'Dashboard',    '/dashboard'),
      this.gCombo('M', 'Máquinas',     '/maquinas'),
      this.gCombo('N', 'Manutenções',  '/manutencoes'),
      this.gCombo('E', 'Estoque',      '/estoque'),
      this.gCombo('R', 'Relatórios',   '/relatorios'),
      this.gCombo('P', 'Meu perfil',   '/perfil')
    );
  }

  private gCombo(secondKey: string, label: string, route: string): ShortcutBinding {
    return {
      keys: `G ${secondKey}`, group: 'Navegação',
      description: `Ir para ${label}`,
      match: e => this.isGCombo(e, secondKey),
      run:   () => { this.gPressedAt = 0; this.router.navigate([route]); }
    };
  }

  private dispatch(e: KeyboardEvent): void {
    // First, watch for the G prefix so the next key in the window can complete.
    if (!this.gPressedAt && (e.key === 'g' || e.key === 'G')
        && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.gPressedAt = Date.now();
      return;
    }

    for (const b of this.bindings) {
      if (b.match(e)) {
        e.preventDefault();
        b.run();
        return;
      }
    }

    // Expired G prefix — reset.
    if (this.gPressedAt && Date.now() - this.gPressedAt > KeyboardShortcutsService.G_WINDOW_MS) {
      this.gPressedAt = 0;
    }
  }

  private isGCombo(e: KeyboardEvent, secondKey: string): boolean {
    if (!this.gPressedAt) return false;
    if (Date.now() - this.gPressedAt > KeyboardShortcutsService.G_WINDOW_MS) {
      this.gPressedAt = 0;
      return false;
    }
    return e.key.toUpperCase() === secondKey;
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }
}
