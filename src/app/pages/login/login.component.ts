import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,                  // ← Importante: marque como standalone!
  imports: [                         // ← Aqui está o segredo: importe os módulos que você usa
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']  // ou .scss se for SCSS
})
export class LoginComponent {

  username: string = '';
  password: string = '';

  onSubmit() {
    console.log('Tentativa de login:', this.username, this.password);
    // Aqui depois vamos chamar o authService.login()
  }

}