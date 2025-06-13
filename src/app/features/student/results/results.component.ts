import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { ExamAttempt } from '../../../core/models/exam.models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="results-container">
      <!-- Header -->
      <header class="page-header">
        <button (click)="goBack()" class="back-btn">
          <i class="icon">←</i>
          Back
        </button>
        <h1>All Results</h1>
      </header>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>Loading results...</p>
      </div>

      <!-- Results Content -->
      <div class="results-content" *ngIf="!isLoading()">
        <!-- Statistics Summary -->
        <div class="stats-summary">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <h3>Total Exams</h3>
              <div class="stat-number">{{ totalAttempts() }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <h3>Completed Exams</h3>
              <div class="stat-number">{{ completedAttempts().length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <h3>Average Score</h3>
              <div class="stat-number">{{ averageScore() }}%</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-info">
              <h3>Highest Score</h3>
              <div class="stat-number">{{ highestScore() }}%</div>
            </div>
          </div>
        </div>

        <!-- Filter Options -->
        <div class="filter-section">
          <div class="filter-buttons">
            <button
              (click)="setFilter('all')"
              class="filter-btn"
              [ngClass]="{ 'active': currentFilter() === 'all' }">
              All Results
            </button>
            <button
              (click)="setFilter('completed')"
              class="filter-btn"
              [ngClass]="{ 'active': currentFilter() === 'completed' }">
              Completed
            </button>
            <button
              (click)="setFilter('pending')"
              class="filter-btn"
              [ngClass]="{ 'active': currentFilter() === 'pending' }">
              Pending
            </button>
          </div>
        </div>

        <!-- Results List -->
        <div class="results-list" *ngIf="filteredAttempts().length > 0; else noResults">
          <div class="result-card" *ngFor="let attempt of filteredAttempts()">
            <div class="result-header">
              <h3>{{ attempt.exam?.title }}</h3>
              <span class="result-date">{{ formatDate(attempt.created_at) }}</span>
            </div>

            <div class="result-body">
              <div class="result-info">
                <div class="info-item">
                  <span class="info-label">Start Date:</span>
                  <span class="info-value">{{ formatDate(attempt.started_at) }}</span>
                </div>
                <div class="info-item" *ngIf="attempt.submitted_at">
                  <span class="info-label">End Date:</span>
                  <span class="info-value">{{ formatDate(attempt.submitted_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Duration:</span>
                  <span class="info-value">{{ calculateDuration(attempt) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Number of Questions:</span>
                  <span class="info-value">{{ attempt.exam?.questions?.length || 0 }} questions</span>
                </div>
              </div>

              <div class="result-score">
                <div class="score-display" [ngClass]="getScoreClass(attempt.score || null)">
                  <span class="score-value" *ngIf="attempt.score !== null">{{ attempt.score }}%</span>
                  <span class="score-value pending" *ngIf="attempt.score === null">Pending</span>
                  <span class="score-status">{{ getScoreStatus(attempt.score || null) }}</span>
                </div>

                <div class="score-visual" *ngIf="attempt.score !== null">
                  <div class="score-bar">
                    <div class="score-fill" [style.width.%]="attempt.score" [ngClass]="getScoreClass(attempt.score || null)"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <button (click)="viewResult(attempt)" class="action-btn view-btn">
                <i class="icon">👁️</i>
                View Details
              </button>
              <button (click)="retakeExam(attempt)" class="action-btn retake-btn" *ngIf="canRetakeExam(attempt)">
                <i class="icon">🔄</i>
                Retake Exam
              </button>
            </div>
          </div>
        </div>

        <ng-template #noResults>
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No Results</h3>
            <p *ngIf="currentFilter() === 'all'">You haven't taken any exams yet</p>
            <p *ngIf="currentFilter() === 'completed'">No completed exams</p>
            <p *ngIf="currentFilter() === 'pending'">No pending exams</p>
            <button (click)="goToDashboard()" class="action-btn primary">
              Start a New Exam
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .results-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%); /* Lighter background */
      direction: ltr; /* Changed to LTR */
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .page-header {
      background: white;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .back-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .page-header h1 {
      margin: 0;
      color: #2d3748;
      font-size: 1.8rem;
      font-weight: 700;
    }

    .results-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 25px;
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
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 12px;
      color: white; /* Icons should be white on colored background */
    }

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
    }

    .filter-section {
      background: white;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .filter-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 10px 20px;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      color: #4a5568;
    }

    .filter-btn:hover {
      border-color: #667eea;
      color: #667eea;
    }

    .filter-btn.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-color: #667eea;
      color: white;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .result-card {
      background: white;
      border-radius: 16px;
      padding: 25px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .result-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .result-header h3 {
      margin: 0;
      color: #2d3748;
      font-size: 1.3rem;
      font-weight: 700;
      flex: 1;
      min-width: 200px;
    }

    .result-date {
      color: #718096;
      font-size: 0.9rem;
      background: #f7fafc;
      padding: 5px 12px;
      border-radius: 15px;
      border: 1px solid #e2e8f0;
    }

    .result-body {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 30px;
      margin-bottom: 20px;
      align-items: center;
    }

    .result-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #718096;
      font-weight: 500;
      min-width: 120px;
    }

    .info-value {
      color: #2d3748;
      font-weight: 600;
    }

    .result-score {
      text-align: center;
      min-width: 150px;
    }

    .score-display {
      margin-bottom: 15px;
    }

    .score-value {
      display: block;
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 5px;
    }

    .score-value.pending {
      font-size: 1.5rem;
      color: #9f7aea;
    }

    .score-display.excellent .score-value { color: #38a169; }
    .score-display.good .score-value { color: #3182ce; }
    .score-display.average .score-value { color: #dd6b20; }
    .score-display.poor .score-value { color: #e53e3e; }

    .score-status {
      font-size: 0.9rem;
      font-weight: 600;
      color: #4a5568;
    }

    .score-visual {
      width: 100%;
    }

    .score-bar {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      transition: width 0.5s ease;
    }

    .score-fill.excellent { background: linear-gradient(135deg, #48bb78, #38a169); }
    .score-fill.good { background: linear-gradient(135deg, #4299e1, #3182ce); }
    .score-fill.average { background: linear-gradient(135deg, #ed8936, #dd6b20); }
    .score-fill.poor { background: linear-gradient(135deg, #e53e3e, #c53030); }

    .result-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .view-btn {
      background: linear-gradient(135deg, #4299e1, #3182ce);
      color: white;
    }

    .retake-btn {
      background: linear-gradient(135deg, #ed8936, #dd6b20);
      color: white;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 12px 24px;
      font-size: 1rem;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      opacity: 0.7;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #2d3748;
      font-size: 1.5rem;
    }

    .empty-state p {
      margin: 0 0 30px 0;
      color: #718096;
      font-size: 1.1rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      color: #4a5568; /* Changed text color for lighter background */
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #e2e8f0;
      border-top: 5px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .icon {
      font-style: normal;
    }

    @media (max-width: 768px) {
      .stats-summary {
        grid-template-columns: 1fr;
      }

      .result-body {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .result-score {
        text-align: left; /* Changed to left for LTR */
      }

      .result-actions {
        justify-content: flex-start; /* Changed to flex-start for LTR */
      }

      .filter-buttons {
        justify-content: center;
      }

      .result-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ResultsComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly examAttempts = signal<ExamAttempt[]>([]);
  readonly currentFilter = signal<'all' | 'completed' | 'pending'>('all');

  readonly totalAttempts = computed(() => this.examAttempts().length);

  readonly completedAttempts = computed(() =>
    this.examAttempts().filter(attempt => attempt.score !== null)
  );

  readonly pendingAttempts = computed(() =>
    this.examAttempts().filter(attempt => attempt.score === null)
  );

  readonly averageScore = computed(() => {
    const completed = this.completedAttempts();
    if (completed.length === 0) return 0;

    const total = completed.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    return Math.round(total / completed.length);
  });

  readonly highestScore = computed(() => {
    const completed = this.completedAttempts();
    if (completed.length === 0) return 0;

    return Math.max(...completed.map(attempt => attempt.score || 0));
  });

  readonly filteredAttempts = computed(() => {
    const filter = this.currentFilter();
    const attempts = this.examAttempts();

    switch (filter) {
      case 'completed':
        return this.completedAttempts();
      case 'pending':
        return this.pendingAttempts();
      case 'all':
      default:
        return attempts;
    }
  });

  ngOnInit(): void {
    this.loadResults();
  }

  private loadResults(): void {
    this.isLoading.set(true);
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

  setFilter(filter: 'all' | 'completed' | 'pending'): void {
    this.currentFilter.set(filter);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateDuration(attempt: ExamAttempt): string {
    if (!attempt.started_at || !attempt.submitted_at) return 'N/A';

    const start = new Date(attempt.started_at).getTime();
    const end = new Date(attempt.submitted_at).getTime();
    const diffSeconds = Math.round((end - start) / 1000);

    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;

    return `${minutes}m ${seconds}s`;
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

  viewResult(attempt: ExamAttempt): void {
    if (attempt.id) {
      this.router.navigate(['/exam/result', attempt.id]);
    }
  }

  canRetakeExam(attempt: ExamAttempt): boolean {
    // Example logic: allow retake if score is below 70 and exam is completed
    return attempt.score !== null && attempt.score !== undefined && attempt.score < 70;
  }

  retakeExam(attempt: ExamAttempt): void {
    if (attempt.exam?.id && confirm(`Are you sure you want to retake "${attempt.exam.title}"?`)) {
      this.examService.startExam(attempt.exam.id).subscribe({
        next: (newAttempt) => {
          this.router.navigate(['/exam', attempt.exam?.id, 'attempt', newAttempt.id]);
        },
        error: (error) => {
          console.error('Error retaking exam:', error);
          alert('An error occurred while trying to retake the exam. Please try again.');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

