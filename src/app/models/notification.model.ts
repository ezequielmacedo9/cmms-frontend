/**
 * Mirrors {@code NotificationDTO} from the backend.
 *
 * <p>Stable contract — the polling loop and the bell panel rely on
 * these exact field names.
 */
export type NotificationType =
  | 'OVERDUE_MAINTENANCE'
  | 'INFO'
  | 'WARNING'
  | 'ERROR';

export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ApiNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link?: string | null;
}
