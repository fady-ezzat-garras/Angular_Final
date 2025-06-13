import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar-container">
      <div class="sidebar-header">
        <h2>Student Panel</h2>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <a routerLink="/dashboard" routerLinkActive="active">
              <i class="icon">🏠</i>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a routerLink="/results" routerLinkActive="active">
              <i class="icon">📊</i>
              <span>My Results</span>
            </a>
          </li>
          <li>
            <a (click)="logout()">
              <i class="icon">🚪</i>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  `,
  styles: [`
    .sidebar-container {
      width: 250px;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
    }
    .sidebar-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    .sidebar-header h2 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
    }
    .sidebar-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .sidebar-nav li {
      margin-bottom: 10px;
    }
    .sidebar-nav a {
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
      padding: 12px 15px;
      border-radius: 8px;
      transition: all 0.3s ease;
      font-size: 1.1rem;
      font-weight: 500;
    }
    .sidebar-nav a:hover {
      background: rgba(255,255,255,0.2);
      transform: translateX(5px);
    }
    .sidebar-nav a.active {
      background: rgba(255,255,255,0.3);
      font-weight: 600;
    }
    .sidebar-nav .icon {
      margin-right: 15px;
      font-size: 1.4rem;
    }
  `]
})
export class StudentSidebarComponent {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Force logout even if API call fails
        this.authService.forceLogout();
      },
      error: () => {
        // Force logout even if API call fails
        this.authService.forceLogout();
      }
    });
  }
}

