import { ApplicationConfig, inject, isDevMode, provideAppInitializer } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';
import { errorInterceptor } from './interceptors/error-interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { I18nService } from './i18n/i18n.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Loads the en/es dictionary (if selected) before first render.
    provideAppInitializer(() => inject(I18nService).init()),
    provideAnimations(),
    // Interceptor order matters: `authInterceptor` handles 401 (refresh /
    // redirect to login); `errorInterceptor` shows a toast for everything
    // else. Auth runs first so a successful refresh never triggers a toast.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ]
};
