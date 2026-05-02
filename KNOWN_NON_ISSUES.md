# Known Non-Issues (Browser Console Noise)

These messages appear in browser DevTools but are **not bugs** in this application.

## `runtime.lastError: The message port closed before a response was received`

**Origin:** Chrome browser extensions (ad-blockers, password managers, Grammarly, etc.).  
**Verify:** Open the app in a private/incognito window with extensions disabled — the error disappears.  
**Action:** None. The `main.ts` suppresses these via `stopImmediatePropagation()` so they don't clutter the console.

## `Browsing Topics API removed from Permissions-Policy`

**Origin:** Informational Chrome message when a server sends `Permissions-Policy: interest-cohort=()` or disables `browsing-topics`. This is intentional — we explicitly disable these tracking APIs.  
**Action:** The `vercel.json` includes an explicit `browsing-topics=()` directive which silences this warning.

## `ResizeObserver loop limit exceeded`

**Origin:** Angular Material + certain layout patterns. Non-fatal browser notification, not a JavaScript error.  
**Action:** Suppressed in `main.ts`. If it causes visual glitches, investigate the specific component.

---

**Real errors to investigate:** HTTP 4xx/5xx from our API, unhandled promise rejections from application code, Sentry alerts. These will appear clearly in the Sentry dashboard (Fase 6).
