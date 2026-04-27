import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ReportEntity = 'manutencoes' | 'maquinas' | 'estoque';
export type ReportFormat = 'pdf' | 'xlsx';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/relatorios`;

  download(entity: ReportEntity, format: ReportFormat): Observable<Blob> {
    return this.http.get(`${this.base}/${entity}?format=${format}`, {
      responseType: 'blob'
    });
  }

  triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  getQrCodeUrl(maquinaId: number): string {
    return `${environment.apiUrl}/api/maquinas/${maquinaId}/qrcode`;
  }
}
