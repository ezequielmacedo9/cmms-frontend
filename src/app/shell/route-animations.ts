import { animate, animateChild, group, query, style, transition, trigger } from '@angular/animations';

/**
 * Smooth fade + lift transitions between routes.
 *
 * <p>The animation is intentionally subtle — 220ms with a soft ease-out.
 * Anything longer makes navigation feel sluggish on power users.
 *
 * <p>Applied via {@code <router-outlet>}:
 * <pre>
 * &lt;div [@routeFade]="o.isActivated ? o.activatedRoute : ''"&gt;
 *   &lt;router-outlet #o="outlet"&gt;&lt;/router-outlet&gt;
 * &lt;/div&gt;
 * </pre>
 */
export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    // Both views are present in the DOM during the transition; absolutely
    // position the leaving one so the entering view does not push the layout.
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),

    query(':enter', [
      style({ opacity: 0, transform: 'translateY(8px)' })
    ], { optional: true }),

    group([
      query(':leave', [
        animate('120ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 0, transform: 'translateY(-4px)' }))
      ], { optional: true }),

      query(':enter', [
        animate('220ms 80ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true })
    ]),

    // Let child animations (component fade-ins etc.) play after the outer
    // transition is done.
    query(':enter', animateChild(), { optional: true })
  ])
]);
