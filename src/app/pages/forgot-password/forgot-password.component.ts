import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  email = '';
  loading = false;
  sent = false;
  error = '';

  submit() {
    if (!this.email || this.loading) return;
    this.loading = true;
    this.error = '';
    this.http.post(`${environment.apiUrl}/api/auth/forgot-password`, { email: this.email }).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.error = 'Erro ao enviar email. Tente novamente.'; this.loading = false; }
    });
  }

  goLogin() { this.router.navigate(['/login']); }
}
