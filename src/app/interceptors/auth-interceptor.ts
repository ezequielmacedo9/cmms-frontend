import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken');
  const router = inject(Router);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const http = inject(HttpClient);
          return http.post<any>(`${environment.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
            switchMap((res) => {
              localStorage.setItem('accessToken', res.accessToken);
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
              return next(retried);
            }),
            catchError(() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
