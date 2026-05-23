import { Signal, WritableSignal, computed, signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: string;
  direction: SortDirection;
}

/**
 * Reusable in-memory table state — search + sort + simple pagination —
 * built around Angular signals so any component can adopt it without
 * pulling a third-party data table.
 *
 * <p>Designed for the {@code ?unpaged=true} flows where we already have
 * the full list client-side. Pages backed by {@code Page<T>} from the
 * backend should keep using their server-driven pagination.
 *
 * <p>Usage:
 * <pre>
 * private table = new TableState&lt;Maquina&gt;(
 *   row =&gt; [row.nome, row.setor, row.status],
 *   { column: 'nome', direction: 'asc' }
 * );
 *
 * readonly view = this.table.view;       // signal&lt;Maquina[]&gt;
 * readonly page = this.table.page;       // signal&lt;number&gt;
 *
 * this.maquinaService.listar().subscribe(rows =&gt; this.table.setData(rows));
 *
 * onSearch(q: string) { this.table.setSearch(q); }
 * onSort(col: string) { this.table.toggleSort(col); }
 * </pre>
 */
export class TableState<T extends Record<string, unknown>> {

  /** Raw input list. */
  private readonly _data = signal<T[]>([]);
  /** Free text search applied to {@code searchFields}. */
  private readonly _search = signal('');
  /** Current sort column + direction. */
  private readonly _sort = signal<SortState | null>(null);
  /** Page index (0-based). */
  private readonly _page = signal(0);
  /** Page size. */
  private readonly _pageSize = signal(20);

  /** Filtered + sorted full list. */
  readonly filtered: Signal<T[]>;
  /** Slice for the current page. */
  readonly view: Signal<T[]>;
  /** Total pages derived from filtered.length / pageSize. */
  readonly totalPages: Signal<number>;

  // Public read-only signals
  readonly data    = this._data.asReadonly();
  readonly search  = this._search.asReadonly();
  readonly sort    = this._sort.asReadonly();
  readonly page    = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  constructor(
    /** Returns the searchable text columns for a row. */
    private readonly searchFields: (row: T) => Array<string | number | null | undefined>,
    initialSort?: SortState
  ) {
    if (initialSort) this._sort.set(initialSort);

    this.filtered = computed(() => {
      const q = this._search().trim().toLowerCase();
      const sorted = this.applySort(this._data());
      if (!q) return sorted;
      return sorted.filter(row =>
        this.searchFields(row)
          .some(field => field != null && String(field).toLowerCase().includes(q))
      );
    });

    this.totalPages = computed(() =>
      Math.max(1, Math.ceil(this.filtered().length / this._pageSize()))
    );

    this.view = computed(() => {
      const start = this._page() * this._pageSize();
      return this.filtered().slice(start, start + this._pageSize());
    });
  }

  // ── mutators ─────────────────────────────────────────────────────────

  setData(rows: T[]): void {
    this._data.set(rows ?? []);
    this._page.set(0);
  }

  setSearch(q: string): void {
    this._search.set(q ?? '');
    this._page.set(0);
  }

  toggleSort(column: string): void {
    const current = this._sort();
    if (current?.column === column) {
      this._sort.set({ column, direction: current.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      this._sort.set({ column, direction: 'asc' });
    }
    this._page.set(0);
  }

  setSort(sort: SortState | null): void {
    this._sort.set(sort);
    this._page.set(0);
  }

  setPage(page: number): void {
    const total = this.totalPages();
    const clamped = Math.max(0, Math.min(page, total - 1));
    this._page.set(clamped);
  }

  nextPage(): void { this.setPage(this._page() + 1); }
  prevPage(): void { this.setPage(this._page() - 1); }

  setPageSize(size: number): void {
    if (size > 0) {
      this._pageSize.set(size);
      this._page.set(0);
    }
  }

  /** Returns 'asc' | 'desc' | null for a column — useful for sort indicators. */
  directionOf(column: string): SortDirection | null {
    const s = this._sort();
    return s && s.column === column ? s.direction : null;
  }

  // ── helpers ──────────────────────────────────────────────────────────

  private applySort(rows: T[]): T[] {
    const s = this._sort();
    if (!s) return rows;

    // Avoid mutating the caller-supplied list.
    const copy = [...rows];
    const dir = s.direction === 'asc' ? 1 : -1;

    copy.sort((a, b) => {
      const va = (a as Record<string, unknown>)[s.column];
      const vb = (b as Record<string, unknown>)[s.column];
      return compare(va, vb) * dir;
    });
    return copy;
  }
}

/**
 * Three-way compare that handles null/undefined sensibly and falls back
 * to localised string comparison for non-numeric values.
 */
function compare(a: unknown, b: unknown): number {
  // Nulls sink to the bottom regardless of sort direction (caller flips sign).
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;

  const da = toDate(a);
  const db = toDate(b);
  if (da && db) return da.getTime() - db.getTime();

  return String(a).localeCompare(String(b), 'pt-BR',
    { numeric: true, sensitivity: 'base' });
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
