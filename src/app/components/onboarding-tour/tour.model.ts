export interface TourStep {
  /** CSS selector for the element to highlight. */
  selector: string;
  /** Step title displayed above the description. */
  title: string;
  /** Body text (may include short instructions). */
  description: string;
  /**
   * Where to anchor the tooltip relative to the target.
   * Default: 'bottom'.
   */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourOptions {
  /** Persist completion under this key. Default 'cmms.tour.completed'. */
  storageKey?: string;
}
