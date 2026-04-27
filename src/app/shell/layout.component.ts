import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';
import { ROLE_LABELS, ROLE_CSS } from '../models/user.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  private router = inject(Router);
  readonly auth  = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly notif = inject(NotificationService);

  showBell = signal(false);

  get userName()      { return this.auth.getNome(); }
  get userRole()      { return this.auth.getRole(); }
  get userRoleLabel() { return this.userRole ? (ROLE_LABELS[this.userRole] ?? this.userRole) : ''; }
  get userRoleCSS()   { return this.userRole ? (ROLE_CSS[this.userRole] ?? '') : ''; }
  get userInitial()   { return this.userName.charAt(0).toUpperCase(); }
  get canManageUsers(){ return this.auth.canManageUsers(); }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleBell() { this.showBell.update(v => !v); }

  closeBell() { this.showBell.set(false); }

  dismiss(id: string) { this.notif.dismiss(id); }

  markAllRead() {
    this.notif.markAllRead();
    this.showBell.set(false);
  }
}
