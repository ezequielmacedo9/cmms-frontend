import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';
import { ROLE_CSS, ROLE_LABELS } from '../models/user.model';
import { routeFade } from './route-animations';
import { AppLang, I18nService } from '../i18n/i18n.service';
import { TranslatePipe } from '../i18n/translate.pipe';

/**
 * Application chrome — sidebar + topbar + content slot.
 *
 * <p>Behaviour:
 * <ul>
 *   <li>Desktop (≥960px): persistent sidebar.</li>
 *   <li>Mobile (&lt;960px): off-canvas drawer triggered by the topbar
 *       hamburger; auto-closes on navigation and on Escape.</li>
 * </ul>
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  animations: [routeFade]
})
export class LayoutComponent {

  /**
   * Used as the {@code @routeFade} state key. Angular triggers the
   * transition whenever this value changes between activations — we use
   * the activated route URL because it's unique per navigation.
   */
  prepareRoute(outlet: RouterOutlet): unknown {
    return outlet?.activatedRouteData?.['animation'] ?? outlet?.activatedRoute?.snapshot?.url?.join('/');
  }


  private readonly router = inject(Router);
  readonly auth  = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly notif = inject(NotificationService);
  readonly i18n  = inject(I18nService);

  readonly showBell = signal(false);
  /** True while the mobile drawer is visible. Ignored on desktop. */
  readonly drawerOpen = signal(false);
  readonly currentTitle = signal('Dashboard');
  /**
   * Dynamic breadcrumb derived from the active route. Always starts with
   * the home link (Início → Dashboard) so users have a single click back
   * to safety.
   */
  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  /** Single source of truth for routes — keeps html + breadcrumb in sync. */
  readonly navGroups: ReadonlyArray<NavGroup> = [
    {
      label: 'Operação',
      items: [
        { path: '/dashboard',    icon: 'dashboard',                label: 'Dashboard' },
        { path: '/maquinas',     icon: 'precision_manufacturing',  label: 'Máquinas' },
        { path: '/manutencoes',  icon: 'build',                    label: 'Manutenções' },
        { path: '/estoque',      icon: 'inventory_2',              label: 'Estoque' },
        { path: '/relatorios',   icon: 'assessment',               label: 'Relatórios',
          visible: () => this.canViewReports }
      ]
    },
    {
      label: 'Administração',
      visible: () => this.canManageUsers || this.canViewAudit || this.canViewSettings,
      items: [
        { path: '/usuarios',      icon: 'manage_accounts', label: 'Usuários',
          visible: () => this.canManageUsers },
        { path: '/configuracoes', icon: 'settings',        label: 'Configurações',
          visible: () => this.canViewSettings },
        { path: '/auditoria',     icon: 'manage_search',   label: 'Auditoria',
          visible: () => this.canViewAudit },
        { path: '/assinatura',    icon: 'credit_card',     label: 'Assinatura',
          visible: () => this.canViewSettings }
      ]
    }
  ];

  constructor() {
    // Auto-close the mobile drawer + update breadcrumb on every navigation.
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.drawerOpen.set(false);
      this.refreshNavState(this.router.url);
    });
    this.refreshNavState(this.router.url);
  }

  // ── derived state ────────────────────────────────────────────────────

  get userName()        { return this.auth.getNome(); }
  get userRole()        { return this.auth.getRole(); }
  get userRoleLabel()   { return this.userRole ? (ROLE_LABELS[this.userRole] ?? this.userRole) : ''; }
  get userRoleCSS()     { return this.userRole ? (ROLE_CSS[this.userRole] ?? '') : ''; }
  get userInitial()     { return this.userName.charAt(0).toUpperCase(); }
  get canManageUsers()  { return this.auth.canManageUsers(); }
  get canViewAudit()    { return this.auth.canViewAudit(); }
  get canViewSettings() { return this.auth.canViewSettings(); }
  get canViewReports()  { return this.auth.hasRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR'); }

  /** Returns only the items the current user is allowed to see, in a group. */
  visibleItems(group: NavGroup) {
    return group.items.filter(i => !i.visible || i.visible());
  }
  isGroupVisible(group: NavGroup) {
    return (!group.visible || group.visible()) && this.visibleItems(group).length > 0;
  }

  // ── actions ──────────────────────────────────────────────────────────

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  setLang(lang: string) { this.i18n.setLang(lang as AppLang); }

  toggleBell()    { this.showBell.update(v => !v); }
  closeBell()     { this.showBell.set(false); }
  toggleDrawer()  { this.drawerOpen.update(v => !v); }
  closeDrawer()   { this.drawerOpen.set(false); }
  dismiss(id: string) { this.notif.dismiss(id); }

  markAllRead() {
    this.notif.markAllRead();
    this.showBell.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.drawerOpen()) this.closeDrawer();
    else if (this.showBell()) this.closeBell();
  }

  // ── helpers ──────────────────────────────────────────────────────────

  /**
   * Recomputes both the topbar title and the breadcrumb trail on every
   * navigation. Breadcrumb shape:
   *   Início → <Group> → <Page>
   * Only the leaf is non-clickable.
   */
  private refreshNavState(url: string) {
    const segment = url.split('?')[0].split('/')[1] ?? '';
    const path = `/${segment}`;

    let activeItem: NavItem | undefined;
    let activeGroup: NavGroup | undefined;
    for (const g of this.navGroups) {
      const found = g.items.find(i => i.path === path);
      if (found) { activeItem = found; activeGroup = g; break; }
    }

    this.currentTitle.set(activeItem?.label ?? 'CMMS');

    // Special cases: profile / 403 / 404 not in nav groups.
    if (path === '/perfil') {
      this.breadcrumbs.set([
        { label: 'Início', link: '/dashboard' },
        { label: 'Meu perfil' }
      ]);
      return;
    }

    const trail: BreadcrumbItem[] = [{ label: 'Início', link: '/dashboard' }];
    if (activeGroup && activeItem && activeItem.path !== '/dashboard') {
      trail.push({ label: activeGroup.label });
      trail.push({ label: activeItem.label });
    } else if (activeItem) {
      trail.push({ label: activeItem.label });
    }
    this.breadcrumbs.set(trail);
  }
}

export interface BreadcrumbItem {
  label: string;
  /** When present, renders as a router link. Leaf items leave this undefined. */
  link?: string;
}

interface NavItem {
  path: string;
  icon: string;
  label: string;
  visible?: () => boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  visible?: () => boolean;
}
