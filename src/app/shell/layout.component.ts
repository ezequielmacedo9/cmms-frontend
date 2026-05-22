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
  imports: [CommonModule, RouterModule, MatIconModule],
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

  readonly showBell = signal(false);
  /** True while the mobile drawer is visible. Ignored on desktop. */
  readonly drawerOpen = signal(false);
  readonly currentTitle = signal('Dashboard');

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
      this.updateTitleFromUrl(this.router.url);
    });
    this.updateTitleFromUrl(this.router.url);
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

  private updateTitleFromUrl(url: string) {
    const segment = url.split('?')[0].split('/')[1] ?? '';
    const match = this.navGroups
      .flatMap(g => g.items)
      .find(i => i.path === `/${segment}`);
    this.currentTitle.set(match?.label ?? 'CMMS');
  }
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
