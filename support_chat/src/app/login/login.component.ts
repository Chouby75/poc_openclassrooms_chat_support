import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from '../message.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <h2>Welcome Back</h2>
        <p class="subtitle">Enter your details to access support</p>
        
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" [(ngModel)]="username" placeholder="e.g. user or support" class="api-input">
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" [(ngModel)]="password" placeholder="••••••••" class="api-input">
        </div>

        <button (click)="onLogin()" class="btn-primary">Sign In</button>
        
        <p *ngIf="error" class="error-message">
          <span class="icon">⚠️</span> {{ error }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    h2 { margin: 0 0 0.5rem; color: #333; }
    .subtitle { color: #666; margin-bottom: 2rem; font-size: 0.9rem; }

    .form-group { text-align: left; margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; font-size: 0.9rem; }

    .api-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e1e1;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .api-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-primary {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
    }

    .btn-primary:hover {
      background: #5a6fd1;
      transform: translateY(-1px);
    }

    .error-message {
      margin-top: 1.5rem;
      padding: 0.75rem;
      background-color: #fff2f2;
      color: #d63031;
      border-radius: 6px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private messageService: MessageService, private router: Router) { }

  onLogin() {
    if (!this.username || !this.password) return;

    const auth = 'Basic ' + btoa(this.username + ':' + this.password);

    this.messageService.login(auth).subscribe({
      next: () => {
        sessionStorage.setItem('chatAuth', auth);
        sessionStorage.setItem('chatUser', this.username);
        this.router.navigate(['/chat']);
      },
      error: () => this.error = 'Invalid credentials'
    });
  }
}
