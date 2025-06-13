import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { Exam } from '../../../core/models/exam.models';

@Component({
  selector: 'app-exam-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="exam-details-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>Loading exam details...</p>
      </div>

      <!-- Exam Details -->
      <div class="exam-details-content" *ngIf="!isLoading() && exam()">
        <div class="exam-info-card">
          <div class="exam-header">
            <h2>{{ exam()?.title }}</h2>
            <div class="exam-badges">
              <span class="duration-badge">{{ exam()?.duration }} minutes</span>
              <span class="questions-badge">{{ exam()?.questions?.length || 0 }} questions</span>
            </div>
          </div>

          <div class="exam-description" *ngIf="exam()?.description">
            <h3>Exam Description</h3>
            <p>{{ exam()?.description }}</p>
          </div>

          <div class="exam-stats">
            <div class="stat-item">
              <span class="stat-label">Duration:</span>
              <span class="stat-value">{{ exam()?.duration }} minutes</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Number of Questions:</span>
              <span class="stat-value">{{ exam()?.questions?.length || 0 }} questions</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Points:</span>
              <span class="stat-value">{{ totalPoints() }} points</span>
            </div>
          </div>

          <div class="exam-actions">
            <button (click)="startExam()" class="start-exam-btn" [disabled]="isStarting()">
              <i class="icon" *ngIf="!isStarting()">🚀</i>
              <div class="mini-spinner" *ngIf="isStarting()"></div>
              {{ isStarting() ? 'Starting...' : 'Start Exam' }}
            </button>
          </div>
        </div>

        <!-- Questions Preview -->
        <div class="questions-preview" *ngIf="exam()?.questions && exam()?.questions!.length > 0">
          <h3>Questions Preview</h3>
          <div class="questions-list">
            <div class="question-item" *ngFor="let question of exam()?.questions; let i = index">
              <div class="question-header">
                <span class="question-number">Question {{ i + 1 }}</span>
                <span class="question-points">{{ question.points }} points</span>
                <span class="question-type" [ngClass]="getQuestionTypeClass(question.question_type)">
                  {{ getQuestionTypeLabel(question.question_type) }}
                </span>
              </div>
              <div class="question-text">{{ question.question_text }}</div>

              <!-- Multiple Choice Preview -->
              <div class="choices-preview" *ngIf="question.question_type === 'multiple_choice' && question.choices">
                <div class="choice-item" *ngFor="let choice of question.choices; let j = index">
                  <span class="choice-letter">{{ getChoiceLetter(j) }}</span>
                  <span class="choice-text">{{ choice.choice_text }}</span>
                </div>
              </div>

              <!-- True/False Preview -->
              <div class="choices-preview" *ngIf="question.question_type === 'true_false'">
                <div class="choice-item">
                  <span class="choice-letter">A</span>
                  <span class="choice-text">True</span>
                </div>
                <div class="choice-item">
                  <span class="choice-letter">B</span>
                  <span class="choice-text">False</span>
                </div>
              </div>

              <!-- Essay Preview -->
              <div class="essay-preview" *ngIf="question.question_type === 'essay'">
                <p class="essay-note">Essay question - requires written answer</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="exam-instructions">
          <h3>Exam Instructions</h3>
          <ul>
            <li>Ensure you are connected to the internet before starting the exam.</li>
            <li>You have {{ exam()?.duration }} minutes to complete the exam.</li>
            <li>You cannot go back to previous questions after moving to the next.</li>
            <li>Make sure to save your answers before time runs out.</li>
            <li>The exam will be submitted automatically when the time limit expires.</li>
          </ul>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="!isLoading() && !exam()">
        <div class="error-icon">⚠️</div>
        <h3>Exam Not Found</h3>
        <p>The requested exam is not available or has been deleted.</p>
        <button (click)="goBack()" class="back-btn">Back to Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .exam-details-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
      direction: ltr;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Removed page-header styles as it's now in app.component.ts */

    .exam-details-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .exam-info-card {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .exam-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .exam-header h2 {
      margin: 0;
      color: #2d3748;
      font-size: 2rem;
      font-weight: 700;
      flex: 1;
      min-width: 300px;
    }

    .exam-badges {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .duration-badge, .questions-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .duration-badge {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
    }

    .questions-badge {
      background: linear-gradient(135deg, #4299e1, #3182ce);
      color: white;
    }

    .exam-description {
      margin-bottom: 25px;
      padding: 20px;
      background: #f7fafc;
      border-radius: 12px;
      border-left: 4px solid #667eea; /* Changed to border-left for LTR */
    }

    .exam-description h3 {
      margin: 0 0 10px 0;
      color: #2d3748;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .exam-description p {
      margin: 0;
      color: #4a5568;
      line-height: 1.6;
    }

    .exam-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .stat-label {
      color: #718096;
      font-weight: 500;
    }

    .stat-value {
      color: #2d3748;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .exam-actions {
      text-align: center;
    }

    .start-exam-btn {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      min-width: 200px;
      justify-content: center;
    }

    .start-exam-btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(72, 187, 120, 0.3);
    }

    .start-exam-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .questions-preview {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .questions-preview h3 {
      margin: 0 0 25px 0;
      color: #2d3748;
      font-size: 1.5rem;
      font-weight: 700;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }

    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .question-item {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .question-number {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .question-points {
      background: #f7fafc;
      color: #4a5568;
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid #e2e8f0;
    }

    .question-type {
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .question-type.multiple-choice {
      background: #e6fffa;
      color: #00695c;
      border: 1px solid #4db6ac;
    }

    .question-type.true-false {
      background: #fff3e0;
      color: #e65100;
      border: 1px solid #ff9800;
    }

    .question-type.essay {
      background: #f3e5f5;
      color: #4a148c;
      border: 1px solid #9c27b0;
    }

    .question-text {
      color: #2d3748;
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 15px;
      font-weight: 500;
    }

    .choices-preview {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .choice-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .choice-letter {
      background: #667eea;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .choice-text {
      color: #4a5568;
      flex: 1;
    }

    .essay-preview {
      padding: 15px;
      background: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .essay-note {
      margin: 0;
      color: #718096;
      font-style: italic;
      text-align: center;
    }

    .exam-instructions {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .exam-instructions h3 {
      margin: 0 0 20px 0;
      color: #2d3748;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .exam-instructions ul {
      margin: 0;
      padding-left: 20px; /* Changed to padding-left for LTR */
      color: #4a5568;
      line-height: 1.8;
    }

    .exam-instructions li {
      margin-bottom: 8px;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      color: #4a5568; /* Changed text color for lighter background */
    }

    .spinner, .mini-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    .mini-spinner {
      width: 20px;
      height: 20px;
      border-width: 2px;
      margin: 0;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .error-state h3 {
      margin: 0 0 10px 0;
      font-size: 1.5rem;
    }

    .error-state p {
      margin: 0 0 20px 0;
      opacity: 0.8;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .icon {
      font-style: normal;
    }

    @media (max-width: 768px) {
      .exam-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .exam-header h2 {
        min-width: auto;
        font-size: 1.5rem;
      }

      .exam-stats {
        grid-template-columns: 1fr;
      }

      .question-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .start-exam-btn {
        width: 100%;
      }
    }
  `]
})
export class ExamDetailsComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(true);
  readonly isStarting = signal(false);
  readonly exam = signal<Exam | null>(null);

  readonly totalPoints = computed(() => {
    const examData = this.exam();
    if (!examData?.questions) return 0;
    return examData.questions.reduce((total, question) => total + question.points, 0);
  });

  ngOnInit(): void {
    const examId = Number(this.route.snapshot.paramMap.get('id'));
    if (examId) {
      this.loadExamDetails(examId);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private loadExamDetails(examId: number): void {
    this.examService.getExam(examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading exam details:', error);
        this.isLoading.set(false);
      }
    });
  }

  startExam(): void {
    const examData = this.exam();
    if (!examData) return;

    if (confirm(`Are you sure you want to start the exam "${examData.title}"?\n\nYou will not be able to go back after starting.`)) {
      this.isStarting.set(true);

      this.examService.startExam(examData.id).subscribe({
        next: (attempt) => {
          this.router.navigate(['/exam', examData.id, 'attempt', attempt.id]);
        },
        error: (error) => {
          console.error('Error starting exam:', error);
          alert('An error occurred while starting the exam. Please try again.');
          this.isStarting.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'essay': return 'Essay';
      default: return type;
    }
  }

  getQuestionTypeClass(type: string): string {
    return type.replace('_', '-');
  }

  getChoiceLetter(index: number): string {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    return letters[index] || String(index + 1);
  }
}

