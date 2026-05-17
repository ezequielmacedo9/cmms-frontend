import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef,
  ElementRef, OnDestroy, OnInit, ViewChild, inject, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { WakeupService } from '../../services/wakeup.service';
import { environment } from '../../../environments/environment';

// Global, injected by https://accounts.google.com/gsi/client when present.
declare const google: any;

type ServerStatus = 'checking' | 'online' | 'offline';

const RETRY_DELAY_MS = 5_000;
const MAX_RETRIES = 6;

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cardEl') cardEl?: ElementRef<HTMLElement>;
  @ViewChild('particlesCanvas') particlesCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly wakeup = inject(WakeupService);
  private readonly destroyRef = inject(DestroyRef);

  // ── form state ──────────────────────────────────────────────────────
  email = '';
  senha = '';
  readonly carregando    = signal(false);
  readonly googleLoading = signal(false);
  readonly showPassword  = signal(false);
  readonly capsLockOn    = signal(false);
  readonly errorMessage  = signal('');
  readonly serverStatus  = signal<ServerStatus>('checking');

  readonly googleEnabled = !!environment.googleClientId;

  private retryTimeouts: ReturnType<typeof setTimeout>[] = [];
  private animFrameId: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private cardHandlers: { move?: (e: MouseEvent) => void; leave?: () => void } = {};
  private retryCount = 0;

  // ── lifecycle ───────────────────────────────────────────────────────

  ngOnInit() {
    this.checkServer();
  }

  ngAfterViewInit() {
    this.initParticles();
    this.initGoogleButton();
    this.attachCardTilt();
  }

  ngOnDestroy() {
    this.retryTimeouts.forEach(t => clearTimeout(t));
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    this.detachCardTilt();
  }

  // ── derived ─────────────────────────────────────────────────────────

  get formBlocked(): boolean {
    return this.serverStatus() === 'checking';
  }

  // ── actions ─────────────────────────────────────────────────────────

  onSubmit() {
    if (this.carregando() || this.formBlocked || !this.email || !this.senha) return;
    this.carregando.set(true);
    this.errorMessage.set('');

    this.auth.login(this.email, this.senha).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        if (err.status === 400 || err.status === 401) {
          this.errorMessage.set('Email ou senha incorretos.');
        } else if (err.status === 0) {
          this.errorMessage.set('Servidor indisponível. Aguarde e tente novamente.');
          this.serverStatus.set('offline');
          if (this.retryCount < MAX_RETRIES) this.scheduleRetry();
        } else if (err.status === 423) {
          this.errorMessage.set('Conta bloqueada por excesso de tentativas. Aguarde alguns minutos.');
        } else {
          this.errorMessage.set('Erro inesperado. Tente novamente.');
        }
        this.carregando.set(false);
      }
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onPasswordKey(ev: KeyboardEvent) {
    // Keep the caps-lock indicator in sync. Some browsers don't expose getModifierState
    // on certain key events; guard the call.
    const state = typeof ev.getModifierState === 'function' && ev.getModifierState('CapsLock');
    this.capsLockOn.set(!!state);
  }

  handleGoogleCredential(idToken: string) {
    this.googleLoading.set(true);
    this.errorMessage.set('');
    this.auth.loginWithGoogle(idToken).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMessage.set('Falha no login com Google. Tente novamente.');
        this.googleLoading.set(false);
      }
    });
  }

  // ── server warm-up ──────────────────────────────────────────────────

  private checkServer() {
    this.wakeup.ping().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.serverStatus.set(res !== null ? 'online' : 'offline');
        if (this.serverStatus() === 'offline' && this.retryCount < MAX_RETRIES) {
          this.scheduleRetry();
        }
      },
      error: () => {
        this.serverStatus.set('offline');
        if (this.retryCount < MAX_RETRIES) this.scheduleRetry();
      }
    });
  }

  private scheduleRetry() {
    this.retryCount++;
    const id = setTimeout(() => {
      this.serverStatus.set('checking');
      this.checkServer();
    }, RETRY_DELAY_MS);
    this.retryTimeouts.push(id);
  }

  // ── Google Sign-In ──────────────────────────────────────────────────

  private initGoogleButton() {
    if (!this.googleEnabled || typeof google === 'undefined') return;
    const host = document.getElementById('google-btn');
    if (!host) return;
    try {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (resp: { credential: string }) => this.handleGoogleCredential(resp.credential)
      });
      google.accounts.id.renderButton(host, {
        theme: 'filled_black',
        size: 'large',
        width: 360,
        text: 'signin_with'
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Google Sign-In initialization failed:', err);
    }
  }

  // ── decorative particles canvas ─────────────────────────────────────

  private initParticles() {
    const canvas = this.particlesCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    this.resizeHandler = setSize;
    window.addEventListener('resize', setSize);

    interface Particle {
      x: number; y: number; z: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }
    const particles: Particle[] = [];
    const count = Math.min(110, Math.floor((canvas.width * canvas.height) / 16_000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 3 + 0.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.35 + 0.08),
        size: Math.random() * 1.4 + 0.3,
        opacity: Math.random() * 0.5 + 0.15,
        color: Math.random() > 0.5 ? '139,92,246' : '124,58,237'
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;
        p.opacity += (Math.random() - 0.5) * 0.01;
        p.opacity = Math.max(0.05, Math.min(0.7, p.opacity));

        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const size = p.size * p.z;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        g.addColorStop(0, `rgba(${p.color},${p.opacity})`);
        g.addColorStop(1, `rgba(${p.color},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      // Connect close pairs with thin lines for a constellation effect.
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139,92,246,${0.07 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      this.animFrameId = requestAnimationFrame(animate);
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  // ── subtle 3D tilt on hover ─────────────────────────────────────────

  private attachCardTilt() {
    const card = this.cardEl?.nativeElement;
    if (!card) return;
    this.cardHandlers.move = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateZ(8px)`;
      card.style.transition = '';
    };
    this.cardHandlers.leave = () => {
      card.style.transform = 'perspective(1200px) rotateY(0) rotateX(0) translateZ(0)';
      card.style.transition = 'transform 500ms var(--ease-out, ease)';
    };
    card.addEventListener('mousemove', this.cardHandlers.move);
    card.addEventListener('mouseleave', this.cardHandlers.leave);
  }

  private detachCardTilt() {
    const card = this.cardEl?.nativeElement;
    if (!card) return;
    if (this.cardHandlers.move)  card.removeEventListener('mousemove', this.cardHandlers.move);
    if (this.cardHandlers.leave) card.removeEventListener('mouseleave', this.cardHandlers.leave);
  }
}
