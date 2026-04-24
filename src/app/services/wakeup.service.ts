import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WakeupService {
  private http = inject(HttpClient);
  private pingUrl = `${environment.apiUrl}/ping`;

  ping() {
    return this.http.get(this.pingUrl, { responseType: 'text' }).pipe(
      timeout(5000),
      catchError(() => of(null))
    );
  }
}
