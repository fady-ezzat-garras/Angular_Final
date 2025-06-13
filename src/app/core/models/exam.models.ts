import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { StudentSidebarComponent } from './features/student/student-sidebar/student-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    StudentSidebarComponent
  ],
  template: `
    <div class="app-container">
      <app-student-sidebar *ngIf="authService.isStudent()"></app-student-sidebar>
      <div class="main-content" [class.expanded]="!authService.isStudent()">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex-grow: 1;
      margin-left: 250px; /* Adjust based on sidebar width */
      transition: margin-left 0.3s ease;
    }

    .main-content.expanded {
      margin-left: 0;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .app-container {
        flex-direction: column;
      }

      app-student-sidebar {
        position: relative;
        width: 100%;
        height: auto;
        box-shadow: none;
      }

      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent {
  readonly authService = inject(AuthService);
}


