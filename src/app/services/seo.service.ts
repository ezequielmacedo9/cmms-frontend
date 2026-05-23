import { DestroyRef, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, mergeMap } from 'rxjs';

export interface PageSeo {
  /** Browser tab title. Already prefixed with the brand by app.routes. */
  title?: string;
  description?: string;
  keywords?: string;
  /** Absolute or relative URL of the og:image. */
  ogImage?: string;
  /** Override the og:type — default 'website'. */
  ogType?: string;
}

/**
 * Maintains <title> and SEO meta tags across navigations.
 *
 * <p>Each route can declare its SEO in {@code data.seo} (per-route
 * customisation) or rely on the global defaults installed by this service
 * at boot. Twitter Card + Open Graph tags are kept in sync so links
 * shared on WhatsApp / LinkedIn / Twitter render proper previews.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {

  private static readonly DEFAULTS: Required<PageSeo> = {
    title:       'CMMS Industrial Suite',
    description: 'Plataforma enterprise de gestão de manutenção industrial: máquinas, ' +
                 'manutenções preventivas e corretivas, estoque de peças e relatórios.',
    keywords:    'CMMS, manutenção industrial, gestão de ativos, manutenção preventiva, ' +
                 'gestão de máquinas, sistema CMMS, indústria 4.0',
    ogImage:     '/icons/icon-512.png',
    ogType:      'website'
  };

  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly title  = inject(Title);
  private readonly meta   = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Installs default tags and wires the auto-update on route changes.
   * Call once at app boot.
   */
  install(): void {
    this.apply(SeoService.DEFAULTS);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.collectLeafData(this.route)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.apply({ ...SeoService.DEFAULTS, ...(data?.seo ?? {}) }));
  }

  /** Programmatic override (e.g. when loading a specific entity). */
  set(seo: PageSeo): void {
    this.apply({ ...SeoService.DEFAULTS, ...seo });
  }

  // ── internals ────────────────────────────────────────────────────────

  private apply(seo: Required<PageSeo>): void {
    if (seo.title) this.title.setTitle(seo.title);

    const url = window.location.href;
    const img = this.absolute(seo.ogImage);

    this.upsert({ name: 'description', content: seo.description });
    this.upsert({ name: 'keywords',    content: seo.keywords });

    // Open Graph
    this.upsert({ property: 'og:title',       content: seo.title });
    this.upsert({ property: 'og:description', content: seo.description });
    this.upsert({ property: 'og:image',       content: img });
    this.upsert({ property: 'og:url',         content: url });
    this.upsert({ property: 'og:type',        content: seo.ogType });
    this.upsert({ property: 'og:site_name',   content: 'CMMS Industrial Suite' });
    this.upsert({ property: 'og:locale',      content: 'pt_BR' });

    // Twitter
    this.upsert({ name: 'twitter:card',        content: 'summary_large_image' });
    this.upsert({ name: 'twitter:title',       content: seo.title });
    this.upsert({ name: 'twitter:description', content: seo.description });
    this.upsert({ name: 'twitter:image',       content: img });

    // Canonical link
    this.setCanonical(url);
  }

  /**
   * Walks the route tree to find the deepest activated child — that's the
   * one that may carry {@code data.seo}.
   */
  private collectLeafData(route: ActivatedRoute): { seo?: PageSeo } | null {
    let r = route;
    while (r.firstChild) r = r.firstChild;
    return r.snapshot.data as { seo?: PageSeo } | null;
  }

  private upsert(tag: { name?: string; property?: string; content: string }): void {
    const selector = tag.name ? `name="${tag.name}"` : `property="${tag.property}"`;
    const existing = this.meta.getTag(selector);
    if (existing) this.meta.updateTag(tag, selector);
    else          this.meta.addTag(tag);
  }

  private absolute(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = window.location.origin;
    return base + (path.startsWith('/') ? path : '/' + path);
  }

  private setCanonical(url: string): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
