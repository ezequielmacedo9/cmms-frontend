import { Component, inject, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notify = inject(NotificationService);

  email = '';
  senha = '';
  carregando = false;
  backendPronto = false;
  tentativas = 0;

  ngOnInit() {
    this.acordarBackend();
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
    this.authService.login(this.email, this.senha).subscribe({
      next: (response: any) => {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.carregando = false;
        this.notify.error('Email ou senha inválidos');
      }
    });
  }
}
