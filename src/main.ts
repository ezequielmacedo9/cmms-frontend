import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';
import { environment } from './environments/environment';

// Error monitoring (best-effort). Loaded lazily ONLY when a DSN is configured,
// so it adds nothing to the initial bundle when disabled. Sentry installs its
// own global error / unhandledrejection handlers on init.
if (environment.sentryDsn) {
  import('@sentry/browser')
    .then((Sentry) => {
      Sentry.init({
        dsn: environment.sentryDsn,
        environment: environment.production ? 'production' : 'development',
        tracesSampleRate: 0,
      });
    })
    .catch(() => { /* monitoring must never break the app */ });
}

// Suppress browser-extension noise from reaching the console.
// These errors originate from Chrome extensions (ad-blockers, password managers, etc.)
// and are unrelated to application code. See KNOWN_NON_ISSUES.md.
window.addEventListener('error', (e) => {
  if (/runtime\.lastError|message port closed|ResizeObserver loop/i.test(e.message ?? '')) {
    e.stopImmediatePropagation();
    return false;
  }
  return true;
}, true);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
