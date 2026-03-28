import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notify = inject(NotificationService);

  email = '';
  senha = '';
  carregando = false;
  backendPronto = false;
  tentativas = 0;
  errorMessage = '';

  ngOnInit() {
    this.acordarBackend();
  }

  ngAfterViewInit() {
    this.initParticles();
    const card = document.querySelector('.card') as HTMLElement;
    if (!card) return;
    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(10px)`;
      card.style.transition = '';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)';
      card.style.transition = 'transform 0.5s ease';
    });
  }

  initParticles() {
    const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 3 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1),
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.6 + 0.1,
        color: Math.random() > 0.5 ? '139,92,246' : '124,58,237'
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;
        p.opacity += (Math.random() - 0.5) * 0.01;
        p.opacity = Math.max(0.05, Math.min(0.7, p.opacity));

        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const size = p.size * p.z;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        gradient.addColorStop(0, `rgba(${p.color},${p.opacity})`);
        gradient.addColorStop(1, `rgba(${p.color},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  acordarBackend() {
    this.http.get('https://cmms-backend-8y7h.onrender.com/ping', { responseType: 'text' })
      .subscribe({
        next: () => { this.backendPronto = true; },
        error: (err) => {
          if (err.status >= 200 && err.status < 500) {
            this.backendPronto = true;
          } else if (this.tentativas < 8) {
            this.tentativas++;
            setTimeout(() => this.acordarBackend(), 5000);
          } else {
            this.backendPronto = true;
          }
        }
      });
  }

  onSubmit() {
    if (this.carregando || !this.email || !this.senha) return;
    this.carregando = true;
    this.errorMessage = '';
    this.authService.login(this.email, this.senha).subscribe({
      next: (response: any) => {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        if (error.status === 400 || error.status === 401) {
          this.errorMessage = 'Email ou senha incorretos.';
        } else if (error.status === 0) {
          this.errorMessage = 'Servidor indisponível. Tente em instantes.';
        } else {
          this.errorMessage = 'Erro inesperado. Tente novamente.';
        }
        this.carregando = false;
      }
    });
  }
}
