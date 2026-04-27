import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private http    = inject(HttpClient);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);

  token    = '';
  password = '';
  confirm  = '';
  loading  = false;
  validating = true;
  tokenValid = false;
  done     = false;
  error    = '';

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) { this.validating = false; this.tokenValid = false; return; }
    this.http.get(`${environment.apiUrl}/api/auth/validate-reset-token?token=${this.token}`).subscribe({
      next: () => { this.tokenValid = true; this.validating = false; },
      error: () => { this.tokenValid = false; this.validating = false; }
    });
  }

  get strength(): number {
    let s = 0;
    if (this.password.length >= 8) s++;
    if (/[A-Z]/.test(this.password)) s++;
    if (/[0-9]/.test(this.password)) s++;
    if (/[^A-Za-z0-9]/.test(this.password)) s++;
    return s;
  }

  get strengthLabel(): string {
    return ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][this.strength] ?? '';
  }

  get strengthColor(): string {
    return ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][this.strength] ?? '';
  }

  submit() {
    this.error = '';
    if (this.password.length < 6) { this.error = 'A senha deve ter pelo menos 6 caracteres.'; return; }
    if (this.password !== this.confirm) { this.error = 'As senhas não coincidem.'; return; }
    this.loading = true;
    this.http.post(`${environment.apiUrl}/api/auth/reset-password`, { token: this.token, novaSenha: this.password }).subscribe({
      next: () => { this.done = true; this.loading = false; },
      error: (e) => {
        this.error = e?.error?.message ?? 'Token inválido ou expirado.';
        this.loading = false;
      }
    });
  }

  goLogin() { this.router.navigate(['/login']); }
}
