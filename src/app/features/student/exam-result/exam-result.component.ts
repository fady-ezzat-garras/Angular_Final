import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { ExamAttempt } from '../../../core/models/exam.models';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="result-container">
      <!-- Header -->
      <header class="result-header">
        <div class="header-content">
          <h1>نتيجة الامتحان</h1>
          <p class="header-subtitle">تم إكمال الامتحان بنجاح</p>
        </div>
      </header>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>جاري تحميل النتيجة...</p>
      </div>

      <!-- Result Content -->
      <div class="result-content" *ngIf="!isLoading() && examAttempt()">
        <!-- Score Card -->
        <div class="score-card" [ngClass]="getScoreClass(examAttempt()?.score)">
          <div class="score-icon">{{ getScoreIcon(examAttempt()?.score) }}</div>
          <div class="score-info">
            <h2>{{ examAttempt()?.exam?.title }}</h2>
            <div class="score-display">
              <span class="score-value" *ngIf="examAttempt()?.score !== null">
                {{ examAttempt()?.score }}%
              </span>
              <span class="score-value pending" *ngIf="examAttempt()?.score === null">
                معلق
              </span>
              <span class="score-status">{{ getScoreStatus(examAttempt()?.score) }}</span>
            </div>
          </div>
        </div>

        <!-- Exam Details -->
        <div class="details-section">
          <h3>تفاصيل الامتحان</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">تاريخ البدء:</span>
              <span class="detail-value">{{ formatDate(examAttempt()?.started_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">تاريخ الانتهاء:</span>
              <span class="detail-value">{{ formatDate(examAttempt()?.submitted_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">مدة الامتحان:</span>
              <span class="detail-value">{{ calculateDuration() }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">عدد الأسئلة:</span>
              <span class="detail-value">{{ examAttempt()?.exam?.questions?.length || 0 }} سؤال</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الأسئلة المجابة:</span>
              <span class="detail-value">{{ answeredQuestions() }} سؤال</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">معدل الإجابة:</span>
              <span class="detail-value">{{ answerRate() }}%</span>
            </div>
          </div>
        </div>

        <!-- Performance Analysis -->
        <div class="analysis-section" *ngIf="examAttempt()?.score !== null">
          <h3>تحليل الأداء</h3>
          <div class="performance-chart">
            <div class="performance-bar">
              <div class="performance-fill" [style.width.%]="examAttempt()?.score"></div>
            </div>
            <div class="performance-labels">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div class="performance-feedback">
            <div class="feedback-item" [ngClass]="getFeedbackClass(examAttempt()?.score)">
              <div class="feedback-icon">{{ getFeedbackIcon(examAttempt()?.score) }}</div>
              <div class="feedback-text">
                <h4>{{ getFeedbackTitle(examAttempt()?.score) }}</h4>
                <p>{{ getFeedbackMessage(examAttempt()?.score) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Result Message -->
        <div class="pending-section" *ngIf="examAttempt()?.score === null">
          <div class="pending-icon">⏳</div>
          <h3>النتيجة قيد المراجعة</h3>
          <p>تم استلام إجاباتك بنجاح. سيتم مراجعة الامتحان وإعلان النتيجة قريباً.</p>
          <div class="pending-note">
            <p><strong>ملاحظة:</strong> قد تستغرق عملية التصحيح بعض الوقت خاصة للأسئلة المقالية.</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          <button (click)="goToDashboard()" class="action-btn primary">
            <i class="icon">🏠</i>
            العودة للوحة التحكم
          </button>
          <button (click)="viewAllResults()" class="action-btn secondary">
            <i class="icon">📊</i>
            عرض جميع النتائج
          </button>
          <button (click)="retakeExam()" class="action-btn tertiary" *ngIf="canRetakeExam()">
            <i class="icon">🔄</i>
            إعادة الامتحان
          </button>
        </div>

        <!-- Tips Section -->
        <div class="tips-section">
          <h3>نصائح للتحسين</h3>
          <div class="tips-list">
            <div class="tip-item" *ngFor="let tip of getImprovementTips()">
              <div class="tip-icon">💡</div>
              <p>{{ tip }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="!isLoading() && !examAttempt()">
        <div class="error-icon">⚠️</div>
        <h3>لم يتم العثور على النتيجة</h3>
        <p>النتيجة المطلوبة غير متاحة أو تم حذفها</p>
        <button (click)="goToDashboard()" class="action-btn primary">العودة للوحة التحكم</button>
      </div>
    </div>
  `,
  styles: [`
    .result-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      direction: rtl;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .result-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 30px 20px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .header-content h1 {
      margin: 0 0 10px 0;
      color: #2d3748;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .header-subtitle {
      margin: 0;
      color: #718096;
      font-size: 1.1rem;
    }

    .result-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .score-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      gap: 30px;
      text-align: center;
    }

    .score-card.excellent {
      background: linear-gradient(135deg, rgba(72, 187, 120, 0.1), rgba(56, 161, 105, 0.1));
      border-color: #48bb78;
    }

    .score-card.good {
      background: linear-gradient(135deg, rgba(66, 153, 225, 0.1), rgba(49, 130, 206, 0.1));
      border-color: #4299e1;
    }

    .score-card.average {
      background: linear-gradient(135deg, rgba(237, 137, 54, 0.1), rgba(221, 107, 32, 0.1));
      border-color: #ed8936;
    }

    .score-card.poor {
      background: linear-gradient(135deg, rgba(229, 62, 62, 0.1), rgba(197, 48, 48, 0.1));
      border-color: #e53e3e;
    }

    .score-card.pending {
      background: linear-gradient(135deg, rgba(159, 122, 234, 0.1), rgba(128, 90, 213, 0.1));
      border-color: #9f7aea;
    }

    .score-icon {
      font-size: 4rem;
      margin-bottom: 10px;
    }

    .score-info {
      flex: 1;
    }

    .score-info h2 {
      margin: 0 0 20px 0;
      color: #2d3748;
      font-size: 1.8rem;
      font-weight: 700;
    }

    .score-display {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .score-value {
      font-size: 4rem;
      font-weight: 800;
      line-height: 1;
    }

    .score-value.pending {
      font-size: 2.5rem;
      color: #9f7aea;
    }

    .score-card.excellent .score-value { color: #38a169; }
    .score-card.good .score-value { color: #3182ce; }
    .score-card.average .score-value { color: #dd6b20; }
    .score-card.poor .score-value { color: #e53e3e; }

    .score-status {
      font-size: 1.2rem;
      font-weight: 600;
      color: #4a5568;
    }

    .details-section, .analysis-section, .pending-section, .tips-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .details-section h3, .analysis-section h3, .tips-section h3 {
      margin: 0 0 25px 0;
      color: #2d3748;
      font-size: 1.5rem;
      font-weight: 700;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f7fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .detail-label {
      color: #718096;
      font-weight: 500;
    }

    .detail-value {
      color: #2d3748;
      font-weight: 700;
    }

    .performance-chart {
      margin-bottom: 25px;
    }

    .performance-bar {
      height: 20px;
      background: #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .performance-fill {
      height: 100%;
      background: linear-gradient(135deg, #48bb78, #38a169);
      transition: width 1s ease;
    }

    .performance-labels {
      display: flex;
      justify-content: space-between;
      color: #718096;
      font-size: 0.9rem;
    }

    .performance-feedback {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .feedback-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid;
    }

    .feedback-item.excellent {
      background: rgba(72, 187, 120, 0.1);
      border-color: #48bb78;
    }

    .feedback-item.good {
      background: rgba(66, 153, 225, 0.1);
      border-color: #4299e1;
    }

    .feedback-item.average {
      background: rgba(237, 137, 54, 0.1);
      border-color: #ed8936;
    }

    .feedback-item.poor {
      background: rgba(229, 62, 62, 0.1);
      border-color: #e53e3e;
    }

    .feedback-icon {
      font-size: 2.5rem;
    }

    .feedback-text h4 {
      margin: 0 0 8px 0;
      color: #2d3748;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .feedback-text p {
      margin: 0;
      color: #4a5568;
      line-height: 1.5;
    }

    .pending-section {
      text-align: center;
      padding: 50px 30px;
    }

    .pending-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .pending-section h3 {
      margin: 0 0 15px 0;
      color: #2d3748;
      font-size: 1.8rem;
      border: none;
      padding: 0;
    }

    .pending-section p {
      margin: 0 0 20px 0;
      color: #4a5568;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .pending-note {
      background: #fff5f5;
      border: 1px solid #fed7d7;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }

    .pending-note p {
      margin: 0;
      color: #c53030;
      font-size: 0.9rem;
    }

    .actions-section {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 30px;
    }

    .action-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      min-width: 180px;
      justify-content: center;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .action-btn.secondary {
      background: linear-gradient(135deg, #4299e1, #3182ce);
      color: white;
    }

    .action-btn.tertiary {
      background: linear-gradient(135deg, #ed8936, #dd6b20);
      color: white;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .tips-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 15px;
      background: #f7fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .tip-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .tip-item p {
      margin: 0;
      color: #4a5568;
      line-height: 1.5;
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

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.3);
      border-top: 5px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
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
      .score-card {
        flex-direction: column;
        text-align: center;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .actions-section {
        flex-direction: column;
        align-items: center;
      }

      .action-btn {
        width: 100%;
        max-width: 300px;
      }

      .feedback-item {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ExamResultComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(true);
  readonly examAttempt = signal<ExamAttempt | null>(null);

  readonly answeredQuestions = computed(() => {
    const attempt = this.examAttempt();
    return attempt?.answers?.length || 0;
  });

  readonly answerRate = computed(() => {
    const attempt = this.examAttempt();
    const total = attempt?.exam?.questions?.length || 0;
    const answered = this.answeredQuestions();
    return total > 0 ? Math.round((answered / total) * 100) : 0;
  });

  ngOnInit(): void {
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));
    if (attemptId) {
      this.loadExamResult(attemptId);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private loadExamResult(attemptId: number): void {
    // Since we don't have a direct API to get a single attempt,
    // we'll get all results and find the matching one
    this.examService.getResults().subscribe({
      next: (attempts) => {
        const attempt = attempts.find(a => a.id === attemptId);
        if (attempt) {
          this.examAttempt.set(attempt);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading exam result:', error);
        this.isLoading.set(false);
      }
    });
  }

  calculateDuration(): string {
    const attempt = this.examAttempt();
    if (!attempt?.started_at || !attempt?.submitted_at) {
      return 'غير محدد';
    }

    const start = new Date(attempt.started_at);
    const end = new Date(attempt.submitted_at);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'غير محدد';

    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScoreClass(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'pending';
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }

  getScoreIcon(score: number | null | undefined): string {
    if (score === null || score === undefined) return '⏳';
    if (score >= 90) return '🏆';
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    return '📚';
  }

  getScoreStatus(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'في انتظار التصحيح';
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 60) return 'جيد';
    return 'يحتاج تحسين';
  }

  getFeedbackClass(score: number | null | undefined): string {
    return this.getScoreClass(score);
  }

  getFeedbackIcon(score: number | null | undefined): string {
    return this.getScoreIcon(score);
  }

  getFeedbackTitle(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'نتيجة معلقة';
    if (score >= 90) return 'أداء ممتاز!';
    if (score >= 80) return 'أداء جيد جداً!';
    if (score >= 60) return 'أداء جيد';
    return 'يمكن التحسين';
  }

  getFeedbackMessage(score: number | null | undefined): string {
    if (score === null || score === undefined) {
      return 'تم استلام إجاباتك وسيتم مراجعتها قريباً.';
    }
    if (score >= 90) {
      return 'تهانينا! لقد حققت نتيجة ممتازة. استمر في هذا الأداء المتميز.';
    }
    if (score >= 80) {
      return 'أداء جيد جداً! أنت على الطريق الصحيح. حاول المراجعة أكثر للوصول للامتياز.';
    }
    if (score >= 60) {
      return 'أداء جيد، لكن يمكنك تحسينه. راجع المواد مرة أخرى وحاول حل المزيد من التمارين.';
    }
    return 'تحتاج لمزيد من المراجعة والتحضير. لا تيأس واستمر في المحاولة.';
  }

  getImprovementTips(): string[] {
    const score = this.examAttempt()?.score;

    if (score === null || score === undefined) {
      return [
        'راجع إجاباتك مع المواد الدراسية',
        'استعد للامتحانات القادمة بشكل أفضل',
        'اطلب المساعدة من المدرسين عند الحاجة'
      ];
    }

    if (score >= 90) {
      return [
        'حافظ على مستوى التحضير العالي',
        'ساعد زملاءك في المراجعة',
        'ركز على المواد الأخرى للحفاظ على التفوق'
      ];
    }

    if (score >= 80) {
      return [
        'راجع الأجزاء التي أخطأت فيها',
        'حل المزيد من الأسئلة التطبيقية',
        'اطلب توضيحات إضافية للمفاهيم الصعبة'
      ];
    }

    if (score >= 60) {
      return [
        'خصص وقتاً أكثر للمراجعة',
        'اعمل على فهم المفاهيم الأساسية',
        'حل أسئلة سابقة ومارس أكثر',
        'انضم لمجموعات الدراسة'
      ];
    }

    return [
      'ابدأ بمراجعة شاملة للمنهج',
      'اطلب مساعدة إضافية من المدرسين',
      'خصص وقتاً يومياً للدراسة',
      'ركز على فهم المفاهيم قبل الحفظ',
      'حل أسئلة بسيطة أولاً ثم تدرج للصعب'
    ];
  }

  canRetakeExam(): boolean {
    // This would depend on the exam settings
    // For now, we'll return false as most exams don't allow retakes
    return false;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  viewAllResults(): void {
    this.router.navigate(['/results']);
  }

  retakeExam(): void {
    const examId = this.examAttempt()?.exam_id;
    if (examId) {
      this.router.navigate(['/exam', examId, 'details']);
    }
  }
}

