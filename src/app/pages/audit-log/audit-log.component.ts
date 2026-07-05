import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AuditEntry {
  id: number;
  userEmail: string;
  userId: number;
  acao: string;
  recurso: string;
  recursoId: string;
  detalhes: string;
  ip: string;
  timestamp: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.css'
})
export class AuditLogComponent implements OnInit {
  private http = inject(HttpClient);

  entries: AuditEntry[] = [];
  total = 0;
  totalPages = 0;
  page = 0;
  size = 20;
  loading = true;
  search = '';
  searchDebounce: any;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params: any = { page: this.page, size: this.size };
    if (this.search.trim()) params.email = this.search.trim();
    this.http.get<Page<AuditEntry>>(`${environment.apiUrl}/api/audit-logs`, { params }).subscribe({
      next: p => {
        this.entries = p.content;
        this.total = p.totalElements;
        this.totalPages = p.totalPages;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page = 0; this.load(); }, 400);
  }

  goPage(n: number) { if (n < 0 || n >= this.totalPages) return; this.page = n; this.load(); }

  get pages(): number[] {
    const total = this.totalPages;
    const cur   = this.page;
    const range: number[] = [];
    for (let i = Math.max(0, cur - 2); i <= Math.min(total - 1, cur + 2); i++) range.push(i);
    return range;
  }

  actionClass(acao: string): string {
    if (['LOGIN', 'GOOGLE_LOGIN'].includes(acao)) return 'badge-success';
    if (['LOGIN_FAILED', 'ACCOUNT_LOCKED'].includes(acao)) return 'badge-danger';
    if (['DELETE', 'DISABLE'].includes(acao)) return 'badge-warning';
    if (['CREATE', 'REGISTER'].includes(acao)) return 'badge-info';
    return 'badge-neutral';
  }
}
