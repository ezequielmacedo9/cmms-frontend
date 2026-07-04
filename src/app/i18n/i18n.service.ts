import { Injectable } from '@angular/core';

export type AppLang = 'pt' | 'en' | 'es';

const STORAGE_KEY = 'appLang';
const SUPPORTED: AppLang[] = ['pt', 'en', 'es'];

/**
 * Lightweight runtime i18n.
 *
 * <p>Keys are the original pt-BR strings, so untranslated text gracefully
 * falls back to Portuguese. Dictionaries for en/es are lazy-loaded once at
 * bootstrap (APP_INITIALIZER) — never shipped in the initial bundle when the
 * app runs in pt. Switching language persists the choice and reloads, which
 * keeps the translate pipe pure (zero change-detection overhead).
 */
@Injectable({ providedIn: 'root' })
export class I18nService {

  readonly lang: AppLang = readStoredLang();

  private dict: Record<string, string> = {};

  /** Loads the dictionary for the active language (no-op for pt). */
  async init(): Promise<void> {
    if (this.lang === 'en') {
      this.dict = (await import('./dict.en')).DICT_EN;
    } else if (this.lang === 'es') {
      this.dict = (await import('./dict.es')).DICT_ES;
    }
  }

  /** Translates a pt-BR key; falls back to the key itself. */
  t(key: string): string {
    return this.dict[key] ?? key;
  }

  /** Persists the new language and reloads so every template re-renders. */
  setLang(lang: AppLang): void {
    if (!SUPPORTED.includes(lang) || lang === this.lang) return;
    localStorage.setItem(STORAGE_KEY, lang);
    location.reload();
  }
}

function readStoredLang(): AppLang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLang | null;
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch { /* storage unavailable (SSR/privacy mode) — default below */ }
  return 'pt';
}
