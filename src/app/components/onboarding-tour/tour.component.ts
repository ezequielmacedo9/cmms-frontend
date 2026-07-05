import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TourStep } from './tour.model';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Tour overlay rendered by {@link OnboardingTourService}. Spotlight the
 * current step's target and shows a tooltip card with title + description
 * + Skip / Voltar / Próximo / Concluir actions.
 *
 * <p>Layout strategy: a fixed full-viewport overlay with a clip-path
 * that punches a rounded-rect hole around the highlighted element. No
 * heavy dependency — pure DOM measurement on each step change.
 */
@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './tour.component.html',
  styleUrl: './tour.component.css'
})
export class TourComponent implements OnChanges, OnDestroy {

  @Input() steps: TourStep[] = [];
  @Input() current = 0;
  @Output() advance  = new EventEmitter<void>();
  @Output() goBack   = new EventEmitter<void>();
  @Output() skip     = new EventEmitter<void>();
  @Output() complete = new EventEmitter<void>();

  @ViewChild('tooltipEl') tooltipEl?: ElementRef<HTMLElement>;

  /** Geometry of the highlighted target — updated on step change + resize. */
  spotlight = { top: 0, left: 0, width: 0, height: 0, ready: false };
  /** Tooltip position. */
  tooltip   = { top: 0, left: 0, placement: 'bottom' as 'top'|'bottom'|'left'|'right' };

  private resizeListener = () => this.refreshGeometry();
  private scrollListener = () => this.refreshGeometry();

  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    window.addEventListener('resize', this.resizeListener);
    window.addEventListener('scroll', this.scrollListener, true);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    // Defer to next animation frame so the highlighted element has had
    // time to render (router transitions may still be in flight).
    requestAnimationFrame(() => this.refreshGeometry());
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
    window.removeEventListener('scroll', this.scrollListener, true);
  }

  // ── derived ──────────────────────────────────────────────────────────

  get step(): TourStep | undefined { return this.steps[this.current]; }
  get isFirst(): boolean { return this.current === 0; }
  get isLast(): boolean  { return this.current >= this.steps.length - 1; }

  // ── keyboard ─────────────────────────────────────────────────────────

  @HostListener('document:keydown.escape')      onEsc()   { this.skip.emit(); }
  @HostListener('document:keydown.arrowRight')  onRight() { if (!this.isLast) this.advance.emit(); else this.complete.emit(); }
  @HostListener('document:keydown.arrowLeft')   onLeft()  { if (!this.isFirst) this.goBack.emit(); }
  @HostListener('document:keydown.enter')       onEnter() {
    if (this.isLast) this.complete.emit(); else this.advance.emit();
  }

  // ── internals ────────────────────────────────────────────────────────

  private refreshGeometry(): void {
    const step = this.step;
    if (!step) { this.spotlight.ready = false; return; }

    const target = document.querySelector<HTMLElement>(step.selector);
    if (!target) {
      // Target missing — show the tooltip centered with no spotlight.
      this.spotlight = { top: 0, left: 0, width: 0, height: 0, ready: false };
      this.tooltip = { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 180, placement: 'bottom' };
      this.cdr.markForCheck();
      return;
    }

    const rect = target.getBoundingClientRect();
    const pad = 8;
    this.spotlight = {
      top:    Math.max(0, rect.top    - pad),
      left:   Math.max(0, rect.left   - pad),
      width:  rect.width  + pad * 2,
      height: rect.height + pad * 2,
      ready:  true
    };

    // Scroll the target into view if needed (without animation jankiness
    // — target was likely already visible from the previous step).
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    this.tooltip = this.computeTooltipPosition(rect, step.placement ?? 'bottom');
    this.cdr.markForCheck();
  }

  private computeTooltipPosition(rect: DOMRect, placement: 'top'|'bottom'|'left'|'right') {
    const tooltipWidth = 360;
    const tooltipHeightEstimate = 200;
    const gap = 16;
    const margin = 12;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top  = rect.top - tooltipHeightEstimate - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top  = rect.top + rect.height / 2 - tooltipHeightEstimate / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top  = rect.top + rect.height / 2 - tooltipHeightEstimate / 2;
        left = rect.right + gap;
        break;
      default: // bottom
        top  = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Clamp inside the viewport.
    top  = Math.max(margin, Math.min(top,  window.innerHeight - tooltipHeightEstimate - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth  - tooltipWidth          - margin));

    return { top, left, placement };
  }
}
