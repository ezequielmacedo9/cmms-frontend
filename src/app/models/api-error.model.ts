/**
 * Mirrors the backend `ApiError` envelope. Stable contract — only add
 * optional fields; never repurpose existing ones.
 *
 *  - `code`    : machine-readable identifier (e.g. `MAQUINA_NOT_FOUND`).
 *                Drive UI flows off this, not the human message.
 *  - `message` : human-readable Portuguese string, safe to surface as-is.
 *  - `traceId` : same id appears in backend logs; show it in dev tools
 *                so support can correlate problems quickly.
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  traceId?: string;
  fieldErrors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

/** Type guard for the envelope. */
export function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v['status'] === 'number'
    && typeof v['code'] === 'string'
    && typeof v['message'] === 'string';
}
