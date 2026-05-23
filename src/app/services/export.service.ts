import { Injectable } from '@angular/core';

export interface CsvColumn<T> {
  /** Header label shown in the CSV. */
  header: string;
  /** Extracts the cell value from a row — may return any primitive or Date. */
  value: (row: T) => string | number | boolean | Date | null | undefined;
}

export interface CsvOptions {
  /** Delimiter between cells. Default ';' (Excel pt-BR friendly). */
  delimiter?: string;
  /** Add BOM so Excel auto-detects UTF-8. Default true. */
  bom?: boolean;
}

/**
 * Single point for export-to-file features. Today only CSV; can grow to
 * cover XLSX (proxy to backend), JSON, copy-to-clipboard etc. without
 * touching the callers.
 *
 * <p>Used by every list page that has a "Exportar CSV" button — replaces
 * three separate copies of csvEscape + downloadCsv that lived in
 * maquinas/manutencoes/estoque components.
 */
@Injectable({ providedIn: 'root' })
export class ExportService {

  /**
   * Builds a CSV string from {@code rows} using {@code columns} for
   * header order and cell extraction, then triggers a browser download.
   *
   * @param filename Base name (without extension)
   */
  downloadCsv<T>(rows: T[], columns: CsvColumn<T>[], filename: string, options?: CsvOptions): void {
    const csv = this.buildCsv(rows, columns, options);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    this.triggerDownload(blob, this.timestampedName(filename, 'csv'));
  }

  /** Pure builder, exposed for tests / preview. */
  buildCsv<T>(rows: T[], columns: CsvColumn<T>[], options?: CsvOptions): string {
    const delim = options?.delimiter ?? ';';
    const useBom = options?.bom ?? true;

    const header = columns.map(c => this.escape(c.header, delim)).join(delim);
    const body = rows.map(row =>
      columns.map(c => this.escape(this.formatCell(c.value(row)), delim)).join(delim)
    ).join('\r\n');

    return (useBom ? '\uFEFF' : '') + header + '\r\n' + body;
  }

  // ── helpers ──────────────────────────────────────────────────────────

  private formatCell(value: unknown): string {
    if (value == null) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return value ? 'sim' : 'não';
    return String(value);
  }

  /**
   * RFC 4180-compliant escape. Wraps in double-quotes when the value
   * contains the delimiter, quote, newline or carriage return; existing
   * quotes are doubled.
   */
  private escape(value: string, delimiter: string): string {
    const needsQuoting =
      value.includes(delimiter) ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r');
    if (!needsQuoting) return value;
    return '"' + value.replace(/"/g, '""') + '"';
  }

  private timestampedName(base: string, ext: string): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    return `${base}_${yyyy}${mm}${dd}_${hh}${mi}.${ext}`;
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Release the object URL in the next tick so the download has time to start.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
