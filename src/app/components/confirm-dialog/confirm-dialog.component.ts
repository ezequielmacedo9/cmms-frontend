import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  HostListener, Input, Output, ViewChild, AfterViewInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Visual + behaviour of a single confirmation modal. Pure: receives
 * options as @Input and emits user choice as @Output. The orchestration
 * (overlay attach/detach) lives in {@link ConfirmDialogService}.
 *
 * <p>Why pure? Keeps the component simple to test and lets us reuse it
 * inline (e.g. for embedded confirmations on a page) without going
 * through the service.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent implements AfterViewInit {

  @ViewChild('confirmBtn') confirmBtn?: ElementRef<HTMLButtonElement>;

  @Input() title = 'Tem certeza?';
  @Input() message?: string;
  /** Visual key drives the icon + accent. Default 'warning' fits delete actions. */
  @Input() variant: 'warning' | 'danger' | 'info' = 'warning';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel  = 'Cancelar';
  /** When true (default) the dialog can be dismissed by clicking the backdrop. */
  @Input() dismissOnBackdrop = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  ngAfterViewInit(): void {
    // Focus the confirm button so Enter triggers it and the user gets
    // immediate keyboard control.
    queueMicrotask(() => this.confirmBtn?.nativeElement.focus());
  }

  onBackdrop(): void {
    if (this.dismissOnBackdrop) this.cancelled.emit();
  }

  /** Escape always cancels — same convention as native dialogs. */
  @HostListener('document:keydown.escape')
  onEscape(): void { this.cancelled.emit(); }

  get iconName(): string {
    switch (this.variant) {
      case 'danger':  return 'delete_forever';
      case 'info':    return 'info';
      default:        return 'warning_amber';
    }
  }
}
