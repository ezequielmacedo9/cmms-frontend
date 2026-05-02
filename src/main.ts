import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';

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
