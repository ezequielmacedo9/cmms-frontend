import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('CMMS Industrial Suite');
  private apiUrl = 'https://cmms-backend-8y7h.onrender.com';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.keepAlive();
    setInterval(() => this.keepAlive(), 8 * 60 * 1000); // a cada 8 min
  }

  private keepAlive() {
    this.http.get(`${this.apiUrl}/api/maquinas`, { responseType: 'text' })
      .subscribe({ error: () => {} });
  }
}