import { ApplicationRef, ComponentRef, Injectable, createComponent, inject, EnvironmentInjector } from '@angular/core';
import { firstValueFrom, Subject, take } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';

export interface ConfirmOptions {
  title: string;
  message?: string;
  variant?: 'warning' | 'danger' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Default true. When false, only the buttons (or Escape) close it. */
  dismissOnBackdrop?: boolean;
}

/**
 * Single point of access for confirmation dialogs. Replaces every
 * scattered {@code window.confirm} and bespoke modal scattered across
 * components with one consistent visual + behaviour.
 *
 * <p>Usage in a component:
 * <pre>
 * if (await this.confirm.ask({
 *   title: 'Excluir máquina?',
 *   message: 'Esta ação não pode ser desfeita.',
 *   variant: 'danger',
 *   confirmLabel: 'Excluir'
 * })) {
 *   this.service.deletar(id).subscribe(...);
 * }
 * </pre>
 *
 * <p>Only one dialog at a time is allowed — opening a second closes the
 * first to keep the UX deterministic.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {

  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);

  private activeRef: ComponentRef<ConfirmDialogComponent> | null = null;

  /**
   * Opens the dialog and resolves with {@code true} when the user
   * confirms, {@code false} on cancel / backdrop / Escape.
   */
  ask(options: ConfirmOptions): Promise<boolean> {
    this.dismissActive();

    const ref = createComponent(ConfirmDialogComponent, {
      environmentInjector: this.envInjector
    });

    ref.instance.title             = options.title;
    ref.instance.message           = options.message;
    ref.instance.variant           = options.variant ?? 'warning';
    ref.instance.confirmLabel      = options.confirmLabel ?? 'Confirmar';
    ref.instance.cancelLabel       = options.cancelLabel  ?? 'Cancelar';
    ref.instance.dismissOnBackdrop = options.dismissOnBackdrop ?? true;

    // Hot-mount into the DOM and the change-detection tree.
    document.body.appendChild(ref.location.nativeElement);
    this.appRef.attachView(ref.hostView);

    this.activeRef = ref;

    const done$ = new Subject<boolean>();
    ref.instance.confirmed.pipe(take(1)).subscribe(() => { done$.next(true);  done$.complete(); });
    ref.instance.cancelled.pipe(take(1)).subscribe(() => { done$.next(false); done$.complete(); });

    return firstValueFrom(done$).finally(() => this.destroy(ref));
  }

  private dismissActive(): void {
    if (this.activeRef) this.destroy(this.activeRef);
  }

  private destroy(ref: ComponentRef<ConfirmDialogComponent>): void {
    this.appRef.detachView(ref.hostView);
    ref.destroy();
    if (this.activeRef === ref) this.activeRef = null;
  }
}
