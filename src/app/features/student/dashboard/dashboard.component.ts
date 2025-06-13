import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ExamService } from '../../../core/services/exam.service';
import { Exam, ExamAttempt } from '../../../core/models/exam.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <!-- Main Content -->
      <main class="dashboard-content">
        <!-- Statistics Cards -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-card available-exams">
              <div class="stat-icon">📝</div>
              <div class="stat-info">
                <h3>Available Exams</h3>
                <div class="stat-number">{{ availableExams().length }}</div>
                <p class="stat-description">New exams waiting for you</p>
              </div>
            </div>

            <div class="stat-card completed-exams">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <h3>Completed Exams</h3>
                <div class="stat-number">{{ completedAttempts().length }}</div>
                <p class="stat-description">Exams completed</p>
              </div>
            </div>

            <div class="stat-card average-score">
              <div class="stat-icon">📊</div>
              <div class="stat-info">
                <h3>Average Score</h3>
                <div class="stat-number">{{ averageScore() }}%</div>
                <p class="stat-description">Overall average</p>
              </div>
            </div>

            <div class="stat-card pending-results">
              <div class="stat-icon">⏳</div>
              <div class="stat-info">
                <h3>Pending Results</h3>
                <div class="stat-number">{{ pendingResults() }}</div>
                <p class="stat-description">Awaiting grading</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Available Exams Section -->
        <div class="section">
          <div class="section-header">
            <h2>Available Exams</h2>
            <button (click)="refreshExams()" class="refresh-btn" [disabled]="isLoading()">
              <i class="icon">🔄</i>
              Refresh
            </button>
          </div>

          <div class="exams-grid" *ngIf="availableExams().length > 0; else noExams">
            <div class="exam-card" *ngFor="let exam of availableExams()">
              <div class="exam-header">
                <h3>{{ exam.title }}</h3>
                <span class="exam-duration">{{ exam.duration }} minutes</span>
              </div>
              <div class="exam-body">
                <p class="exam-description">{{ exam.description || 'No description available' }}</p>
                <div class="exam-meta">
                  <span class="question-count">
                    <i class="icon">❓</i>
                    {{ exam.questions_count || 0 }} questions
                  </span>
                  <span class="exam-type">
                    <i class="icon">📋</i>
                    General Exam
                  </span>
                </div>
              </div>
              <div class="exam-actions">
                <button
                  (click)="startExam(exam)"
                  class="start-exam-btn"
                  [disabled]="isLoading()">
                  Start Exam
                </button>
                <button
                  (click)="viewExamDetails(exam)"
                  class="view-details-btn">
                  View Details
                </button>
              </div>
            </div>
          </div>

          <ng-template #noExams>
            <div class="empty-state">
              <div class="empty-icon">📚</div>
              <h3>No Exams Available</h3>
              <p>New exams will be added soon</p>
            </div>
          </ng-template>
        </div>

        <!-- Recent Results Section -->
        <div class="section">
          <div class="section-header">
            <h2>Recent Results</h2>
            <button (click)="viewAllResults()" class="view-all-btn">
              View All
            </button>
          </div>

          <div class="results-list" *ngIf="recentAttempts().length > 0; else noResults">
            <div class="result-item" *ngFor="let attempt of recentAttempts()">
              <div class="result-info">
                <h4>{{ attempt.exam?.title }}</h4>
                <p class="result-date">{{ formatDate(attempt.created_at) }}</p>
              </div>
              <div class="result-score" [ngClass]="getScoreClass(attempt.score || null)">
                <span class="score-value">{{ attempt.score || 'Pending' }}%</span>
                <span class="score-status">{{ getScoreStatus(attempt.score || null) }}</span>
              </div>
            </div>
          </div>

          <ng-template #noResults>
            <div class="empty-state">
              <div class="empty-icon">📈</div>
              <h3>No Results Yet</h3>
              <p>Start your first exam to see results here</p>
            </div>
          </ng-template>
        </div>
      </main>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading()">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%); /* Lighter background */
      direction: ltr; /* Changed to LTR */
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Removed dashboard-header styles as it's now in app.component.ts */

    .dashboard-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .stats-section {
      margin-bottom: 40px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: white; /* Icons should be white on colored background */
    }

    .available-exams .stat-icon { background: linear-gradient(135deg, #4299e1, #3182ce); }
    .completed-exams .stat-icon { background: linear-gradient(135deg, #48bb78, #38a169); }
    .average-score .stat-icon { background: linear-gradient(135deg, #ed8936, #dd6b20); }
    .pending-results .stat-icon { background: linear-gradient(135deg, #9f7aea, #805ad5); }

    .stat-info h3 {
      margin: 0 0 8px 0;
      color: #2d3748;
      font-size: 1rem;
      font-weight: 600;
    }

    .stat-number {
      font-size: 2.2rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 5px;
    }

    .stat-description {
      margin: 0;
      color: #718096;
      font-size: 0.85rem;
    }

    .section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
    }

    .section-header h2 {
      margin: 0;
      color: #2d3748;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .refresh-btn, .view-all-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .refresh-btn:hover, .view-all-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .exams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .exam-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .exam-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .exam-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .exam-header h3 {
      margin: 0;
      color: #2d3748;
      font-size: 1.2rem;
      font-weight: 600;
      flex: 1;
    }

    .exam-duration {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .exam-description {
      color: #718096;
      margin-bottom: 15px;
      line-height: 1.5;
    }

    .exam-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
    }

    .exam-meta span {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #718096;
      font-size: 0.9rem;
    }

    .exam-actions {
      display: flex;
      gap: 10px;
    }

    .start-exam-btn {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      flex: 1;
      transition: all 0.3s ease;
    }

    .start-exam-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    }

    .start-exam-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .view-details-btn {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .view-details-btn:hover {
      background: #667eea;
      color: white;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .result-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: #f7fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .result-info h4 {
      margin: 0 0 5px 0;
      color: #2d3748;
      font-weight: 600;
    }

    .result-date {
      margin: 0;
      color: #718096;
      font-size: 0.9rem;
    }

    .result-score {
      text-align: center;
    }

    .score-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .score-status {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .result-score.excellent .score-value { color: #38a169; }
    .result-score.good .score-value { color: #3182ce; }
    .result-score.average .score-value { color: #dd6b20; }
    .result-score.poor .score-value { color: #e53e3e; }
    .result-score.pending .score-value { color: #805ad5; }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #718096;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #4a5568;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-spinner {
      background: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .icon {
      font-style: normal;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        flex-direction: column;
        text-align: center;
      }

      .exams-grid {
        grid-template-columns: 1fr;
      }

      .exam-actions {
        flex-direction: column;
      }

      .result-item {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);

  // Signals for reactive state
  readonly isLoading = signal(false);
  readonly availableExams = signal<Exam[]>([]);
  readonly examAttempts = signal<ExamAttempt[]>([]);

  // Computed signals
  readonly completedAttempts = computed(() =>
    this.examAttempts().filter((attempt: ExamAttempt) => attempt.score !== null)
  );

  readonly recentAttempts = computed(() =>
    this.examAttempts()
      .sort((a: ExamAttempt, b: ExamAttempt) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  );

  readonly averageScore = computed(() => {
    const completed = this.completedAttempts();
    if (completed.length === 0) return 0;

    const total = completed.reduce((sum: number, attempt: ExamAttempt) => sum + (attempt.score || 0), 0);
    return Math.round(total / completed.length);
  });

  readonly pendingResults = computed(() =>
    this.examAttempts().filter((attempt: ExamAttempt) => attempt.score === null).length
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    // Load available exams
    this.examService.getExams().subscribe({
      next: (exams) => {
        this.availableExams.set(exams);
      },
      error: (error) => {
        console.error('Error loading exams:', error);
      }
    });

    // Load exam attempts
    this.examService.getResults().subscribe({
      next: (attempts) => {
        this.examAttempts.set(attempts);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading results:', error);
        this.isLoading.set(false);
      }
    });
  }

  refreshExams(): void {
    this.loadDashboardData();
  }

  startExam(exam: Exam): void {
    if (confirm(`Are you sure you want to start the exam "${exam.title}"?`)) {
      this.isLoading.set(true);

      this.examService.startExam(exam.id).subscribe({
        next: (attempt) => {
          this.router.navigate(['/exam', exam.id, 'attempt', attempt.id]);
        },
        error: (error) => {
          console.error('Error starting exam:', error);
          alert('An error occurred while starting the exam. Please try again.');
          this.isLoading.set(false);
        }
      });
    }
  }

  viewExamDetails(exam: Exam): void {
    this.router.navigate(['/exam', exam.id, 'details']);
  }

  viewAllResults(): void {
    this.router.navigate(['/results']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScoreClass(score: number | null): string {
    if (score === null) return 'pending';
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }

  getScoreStatus(score: number | null): string {
    if (score === null) return 'Pending';
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  }

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

