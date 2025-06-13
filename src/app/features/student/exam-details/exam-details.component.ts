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
      <!-- Header -->
      <header class="page-header">
        <button (click)="goBack()" class="back-btn">
          <i class="icon">←</i>
          العودة
        </button>
        <h1>تفاصيل الامتحان</h1>
      </header>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>جاري تحميل تفاصيل الامتحان...</p>
      </div>

      <!-- Exam Details -->
      <div class="exam-details-content" *ngIf="!isLoading() && exam()">
        <div class="exam-info-card">
          <div class="exam-header">
            <h2>{{ exam()?.title }}</h2>
            <div class="exam-badges">
              <span class="duration-badge">{{ exam()?.duration }} دقيقة</span>
              <span class="questions-badge">{{ exam()?.questions?.length || 0 }} سؤال</span>
            </div>
          </div>

          <div class="exam-description" *ngIf="exam()?.description">
            <h3>وصف الامتحان</h3>
            <p>{{ exam()?.description }}</p>
          </div>

          <div class="exam-stats">
            <div class="stat-item">
              <span class="stat-label">مدة الامتحان:</span>
              <span class="stat-value">{{ exam()?.duration }} دقيقة</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">عدد الأسئلة:</span>
              <span class="stat-value">{{ exam()?.questions?.length || 0 }} سؤال</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">إجمالي النقاط:</span>
              <span class="stat-value">{{ totalPoints() }} نقطة</span>
            </div>
          </div>

          <div class="exam-actions">
            <button (click)="startExam()" class="start-exam-btn" [disabled]="isStarting()">
              <i class="icon" *ngIf="!isStarting()">🚀</i>
              <div class="mini-spinner" *ngIf="isStarting()"></div>
              {{ isStarting() ? 'جاري البدء...' : 'بدء الامتحان' }}
            </button>
          </div>
        </div>

        <!-- Questions Preview -->
        <div class="questions-preview" *ngIf="exam()?.questions && exam()?.questions!.length > 0">
          <h3>معاينة الأسئلة</h3>
          <div class="questions-list">
            <div class="question-item" *ngFor="let question of exam()?.questions; let i = index">
              <div class="question-header">
                <span class="question-number">السؤال {{ i + 1 }}</span>
                <span class="question-points">{{ question.points }} نقطة</span>
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
                  <span class="choice-letter">أ</span>
                  <span class="choice-text">صحيح</span>
                </div>
                <div class="choice-item">
                  <span class="choice-letter">ب</span>
                  <span class="choice-text">خطأ</span>
                </div>
              </div>

              <!-- Essay Preview -->
              <div class="essay-preview" *ngIf="question.question_type === 'essay'">
                <p class="essay-note">سؤال مقالي - يتطلب إجابة مكتوبة</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="exam-instructions">
          <h3>تعليمات الامتحان</h3>
          <ul>
            <li>تأكد من اتصالك بالإنترنت قبل بدء الامتحان</li>
            <li>لديك {{ exam()?.duration }} دقيقة لإكمال الامتحان</li>
            <li>لا يمكنك العودة للأسئلة السابقة بعد الانتقال للسؤال التالي</li>
            <li>تأكد من حفظ إجاباتك قبل انتهاء الوقت</li>
            <li>سيتم إرسال الامتحان تلقائياً عند انتهاء الوقت المحدد</li>
          </ul>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="!isLoading() && !exam()">
        <div class="error-icon">⚠️</div>
        <h3>لم يتم العثور على الامتحان</h3>
        <p>الامتحان المطلوب غير متاح أو تم حذفه</p>
        <button (click)="goBack()" class="back-btn">العودة للوحة التحكم</button>
      </div>
    </div>
  `,
  styles: [`
    .exam-details-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      direction: rtl;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .page-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
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

    .exam-details-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .exam-info-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
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
      border-right: 4px solid #667eea;
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
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
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
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
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
      padding-right: 20px;
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
      color: white;
    }

    .spinner, .mini-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
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

    if (confirm(`هل أنت متأكد من بدء امتحان "${examData.title}"؟\n\nلن تتمكن من العودة بعد البدء.`)) {
      this.isStarting.set(true);

      this.examService.startExam(examData.id).subscribe({
        next: (attempt) => {
          this.router.navigate(['/exam', examData.id, 'attempt', attempt.id]);
        },
        error: (error) => {
          console.error('Error starting exam:', error);
          alert('حدث خطأ أثناء بدء الامتحان. يرجى المحاولة مرة أخرى.');
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
      case 'multiple_choice': return 'اختيار متعدد';
      case 'true_false': return 'صح أم خطأ';
      case 'essay': return 'مقالي';
      default: return type;
    }
  }

  getQuestionTypeClass(type: string): string {
    return type.replace('_', '-');
  }

  getChoiceLetter(index: number): string {
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
    return letters[index] || String(index + 1);
  }
}

