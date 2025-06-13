import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Student Dashboard</h1>
        <div class="user-info">
          <span>Welcome, {{ authService.currentUser()?.name }}</span>
          <button (click)="logout()" class="logout-btn">Logout</button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="welcome-card">
          <h2>Welcome to the Exam System</h2>
          <p>From here you can access all available exams</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Available Exams</h3>
            <div class="stat-number">5</div>
          </div>

          <div class="stat-card">
            <h3>Completed Exams</h3>
            <div class="stat-number">2</div>
          </div>

          <div class="stat-card">
            <h3>Results</h3>
            <div class="stat-number">85%</div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f7fafc;
      direction: ltr;
    }
    
    .dashboard-header {
      background: white;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .dashboard-header h1 {
      margin: 0;
      color: #2d3748;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logout-btn {
      background: #e53e3e;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .dashboard-content {
      padding: 30px;
    }
    
    .welcome-card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .stat-number {
      font-size: 2.5rem;
      font-weight: bold;
      color: #667eea;
      margin-top: 10px;
    }
  `]
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Force logout even if API call fails
        this.authService.forceLogout();
      }
    });
  }
}
