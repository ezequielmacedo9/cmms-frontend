/**
 * Mirrors the backend {@code PagedResponseDTO<T>} envelope.
 * Stable contract — the frontend lists rely on these field names.
 */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
}

/** Type guard. */
export function isPagedResponse<T>(value: unknown): value is PagedResponse<T> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v['content'])
    && typeof v['totalElements'] === 'number'
    && typeof v['page'] === 'number'
    && typeof v['size'] === 'number';
}
