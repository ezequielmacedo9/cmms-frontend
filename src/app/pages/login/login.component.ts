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

  email: string = '';
  senha: string = '';
  carregando = false;
  backendPronto = false;
  tentativas = 0;

  ngOnInit() {
    this.acordarBackend();
  }

  acordarBackend() {
  this.http.post('https://cmms-backend-8y7h.onrender.com/api/auth/login',
    { email: '', senha: '' }, { responseType: 'text' })
    .subscribe({
      next: () => { this.backendPronto = true; },
      error: (err) => {
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          this.backendPronto = true;
        } else if (this.tentativas < 5) {
          this.tentativas++;
          setTimeout(() => this.acordarBackend(), 4000);
        } else {
          this.backendPronto = true;
        }
      }
    });
}

  onSubmit() {
    if (this.carregando) return;
    this.carregando = true;
    this.authService.login(this.email, this.senha).subscribe({
      next: (response: any) => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.carregando = false;
        alert('Email ou senha inválidos');
      }
    });
  }
}