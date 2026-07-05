import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

/**
 * Self-service onboarding: creates a company (tenant) + first admin in one
 * step and logs the user straight into their isolated workspace.
 */
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  template: `
    <div class="auth-wrap">
      <div class="auth-card ui-card">
        <div class="auth-head">
          <div class="auth-logo" aria-hidden="true"><mat-icon>precision_manufacturing</mat-icon></div>
          <h1 class="auth-title">{{ 'Crie sua conta' | t }}</h1>
          <p class="auth-sub">{{ 'Comece agora — leva menos de um minuto.' | t }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" novalidate>
          <label class="auth-field">
            <span class="auth-label">{{ 'Nome da empresa' | t }}</span>
            <input class="ui-input" type="text" name="empresaNome" [(ngModel)]="empresaNome"
                   placeholder="Ex: Indústria Acme Ltda" autocomplete="organization" required />
          </label>

          <label class="auth-field">
            <span class="auth-label">{{ 'Seu nome' | t }}</span>
            <input class="ui-input" type="text" name="nome" [(ngModel)]="nome"
                   placeholder="Ex: Ana Souza" autocomplete="name" required />
          </label>

          <label class="auth-field">
            <span class="auth-label">E-mail</span>
            <input class="ui-input" type="email" name="email" [(ngModel)]="email"
                   placeholder="voce@empresa.com" autocomplete="email" required />
          </label>

          <label class="auth-field">
            <span class="auth-label">{{ 'Senha' | t }}</span>
            <div class="auth-pass">
              <input class="ui-input" [type]="showPassword() ? 'text' : 'password'"
                     name="senha" [(ngModel)]="senha" [placeholder]="'Mínimo 8 caracteres, com letras e números' | t"
                     autocomplete="new-password" required />
              <button type="button" class="auth-pass-toggle" (click)="togglePassword()"
                      [attr.aria-label]="(showPassword() ? 'Ocultar senha' : 'Mostrar senha') | t">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (senha && !senhaValida) {
              <span class="auth-hint auth-hint--warn">{{ 'A senha precisa de ao menos 8 caracteres, com letras e números.' | t }}</span>
            }
          </label>

          @if (errorMessage()) {
            <div class="auth-error" role="alert">
              <mat-icon>error_outline</mat-icon> {{ errorMessage() | t }}
            </div>
          }

          <button type="submit" class="ui-btn ui-btn--primary ui-btn--lg auth-submit"
                  [disabled]="carregando() || !formValido">
            @if (carregando()) { <mat-spinner diameter="18"></mat-spinner> {{ 'Criando...' | t }} }
            @else { {{ 'Criar conta' | t }} }
          </button>
        </form>

        <p class="auth-foot">
          {{ 'Já tem uma conta?' | t }}
          <a routerLink="/login" class="auth-link">{{ 'Entrar' | t }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(1200px 600px at 50% -10%, rgba(139,92,246,0.18), transparent 60%),
        var(--bg, #0a0a18);
    }
    .auth-card {
      width: min(440px, 100%);
      padding: 32px 28px;
    }
    .auth-head { text-align: center; margin-bottom: 22px; }
    .auth-logo {
      width: 52px; height: 52px; margin: 0 auto 14px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 14px;
      background: linear-gradient(135deg, #7c3aed, #a78bfa);
      box-shadow: 0 8px 28px rgba(124,58,237,0.45);
    }
    .auth-logo mat-icon { color: #fff; }
    .auth-title { margin: 0; font-size: var(--fs-xl, 1.4rem); font-weight: var(--fw-bold, 700); color: var(--text, #fafafa); letter-spacing: -0.02em; }
    .auth-sub { margin: 4px 0 0; font-size: var(--fs-sm, 0.8125rem); color: var(--text-2, rgba(255,255,255,0.6)); }

    .auth-field { display: block; margin-bottom: 14px; }
    .auth-label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-2, rgba(255,255,255,0.7)); margin-bottom: 6px; }

    .auth-pass { position: relative; }
    .auth-pass .ui-input { padding-right: 44px; }
    .auth-pass-toggle {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 6px;
      color: var(--text-3, rgba(255,255,255,0.5)); display: flex; border-radius: 8px;
    }
    .auth-pass-toggle:hover { color: var(--text, #fff); }
    .auth-pass-toggle mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .auth-hint { display: block; margin-top: 6px; font-size: 0.72rem; }
    .auth-hint--warn { color: var(--warning, #fbbf24); }

    .auth-error {
      display: flex; align-items: center; gap: 8px;
      background: var(--danger-muted, rgba(239,68,68,0.12));
      color: var(--danger, #f87171);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 10px; padding: 10px 12px; margin: 4px 0 14px;
      font-size: 0.8125rem;
    }
    .auth-error mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .auth-submit {
      width: 100%; margin-top: 6px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    }

    .auth-foot { text-align: center; margin: 18px 0 0; font-size: 0.8125rem; color: var(--text-2, rgba(255,255,255,0.6)); }
    .auth-link { color: var(--accent, #a78bfa); font-weight: 600; text-decoration: none; }
    .auth-link:hover { text-decoration: underline; }
  `]
})
export class SignupComponent {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  empresaNome = '';
  nome = '';
  email = '';
  senha = '';

  readonly showPassword = signal(false);
  readonly carregando   = signal(false);
  readonly errorMessage = signal('');

  get emailValido(): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email.trim());
  }

  get senhaValida(): boolean {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/.test(this.senha);
  }

  get formValido(): boolean {
    return !!this.empresaNome.trim() && !!this.nome.trim() && this.emailValido && this.senhaValida;
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  onSubmit(): void {
    if (this.carregando() || !this.formValido) return;
    this.carregando.set(true);
    this.errorMessage.set('');

    this.auth.register(this.empresaNome.trim(), this.nome.trim(), this.email.trim(), this.senha)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          if (err.status === 409) {
            this.errorMessage.set('Este e-mail já está cadastrado. Faça login.');
          } else if (err.status === 400) {
            this.errorMessage.set('Verifique os dados informados.');
          } else if (err.status === 0) {
            this.errorMessage.set('Servidor indisponível. Tente novamente em instantes.');
          } else {
            this.errorMessage.set('Erro ao criar conta. Tente novamente.');
          }
          this.carregando.set(false);
        }
      });
  }
}
