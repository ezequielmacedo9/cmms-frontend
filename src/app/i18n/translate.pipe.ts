import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * `{{ 'Texto em português' | t }}` — translates using the active dictionary.
 * Pure: the language only changes via reload, so the result is stable.
 */
@Pipe({ name: 't', standalone: true })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string | null | undefined): string {
    return key ? this.i18n.t(key) : '';
  }
}
