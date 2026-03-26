import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WakeupService {
  private http = inject(HttpClient);
  private pingUrl = 'https://cmms-backend-8y7h.onrender.com/actuator/health';

  ping() {
    return this.http.get(this.pingUrl).pipe(catchError(() => of(null)));
  }
}