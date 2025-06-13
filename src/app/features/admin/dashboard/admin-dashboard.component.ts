import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard-container">
      <header class="admin-header">
        <h1>Admin Dashboard</h1>
        <div class="user-info">
          <span>Welcome, {{ authService.currentUser()?.name }}</span>
          <button (click)="logout()" class="logout-btn">Logout</button>
        </div>
      </header>

      <main class="admin-content">
        <div class="welcome-card">
          <h2>Welcome to the Admin Dashboard</h2>
          <p>From here you can manage exams, questions, and review results</p>
        </div>
        
        <div class="admin-grid">
          <div class="admin-card">
            <h3>Exam Management</h3>
            <p>Create, edit, and delete exams</p>
            <button class="action-btn">Manage Exams</button>
          </div>

          <div class="admin-card">
            <h3>Question Management</h3>
            <p>Add and edit exam questions</p>
            <button class="action-btn">Manage Questions</button>
          </div>

          <div class="admin-card">
            <h3>Results & Reports</h3>
            <p>Review student results and reports</p>
            <button class="action-btn">View Results</button>
          </div>

          <div class="admin-card">
            <h3>User Management</h3>
            <p>Manage student and admin accounts</p>
            <button class="action-btn">Manage Users</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-dashboard-container {
      min-height: 100vh;
      background: #f7fafc;
      direction: ltr;
    }
    
    .admin-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .admin-header h1 {
      margin: 0;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logout-btn {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .logout-btn:hover {
      background: rgba(255,255,255,0.3);
    }
    
    .admin-content {
      padding: 30px;
    }
    
    .welcome-card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
    }
    
    .admin-card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .admin-card h3 {
      color: #2d3748;
      margin-bottom: 15px;
    }
    
    .admin-card p {
      color: #718096;
      margin-bottom: 20px;
    }
    
    .action-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s;
    }
    
    .action-btn:hover {
      transform: translateY(-2px);
    }
  `]
})
export class AdminDashboardComponent {
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
