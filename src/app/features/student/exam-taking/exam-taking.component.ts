import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { Exam, Question, ExamAttempt, ExamAnswer } from '../../../core/models/exam.models';

@Component({
  selector: 'app-exam-taking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exam-taking-container">
      <!-- Header with Timer -->
      <header class="exam-header">
        <div class="exam-info">
          <h1>{{ exam()?.title }}</h1>
          <p>السؤال {{ currentQuestionIndex() + 1 }} من {{ totalQuestions() }}</p>
        </div>
        <div class="timer" [ngClass]="getTimerClass()">
          <i class="icon">⏰</i>
          <span>{{ formatTime(timeRemaining()) }}</span>
        </div>
      </header>

      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
        </div>
        <span class="progress-text">{{ progressPercentage() }}% مكتمل</span>
      </div>

      <!-- Question Content -->
      <main class="question-content" *ngIf="currentQuestion()">
        <div class="question-card">
          <div class="question-header">
            <span class="question-number">السؤال {{ currentQuestionIndex() + 1 }}</span>
            <span class="question-points">{{ currentQuestion()?.points }} نقطة</span>
            <span class="question-type" [ngClass]="getQuestionTypeClass(currentQuestion()?.question_type || '')">
              {{ getQuestionTypeLabel(currentQuestion()?.question_type || '') }}
            </span>
          </div>

          <div class="question-text">
            {{ currentQuestion()?.question_text }}
          </div>

          <!-- Multiple Choice Questions -->
          <div class="answer-section" *ngIf="currentQuestion()?.question_type === 'multiple_choice'">
            <div class="choices-list">
              <label
                class="choice-option"
                *ngFor="let choice of currentQuestion()?.choices; let i = index"
                [ngClass]="{ 'selected': selectedChoiceId() === choice.id }">
                <input
                  type="radio"
                  [name]="'question_' + currentQuestion()?.id"
                  [value]="choice.id"
                  [(ngModel)]="selectedChoiceId"
                  (change)="onChoiceSelected(choice.id)">
                <span class="choice-letter">{{ getChoiceLetter(i) }}</span>
                <span class="choice-text">{{ choice.choice_text }}</span>
              </label>
            </div>
          </div>

          <!-- True/False Questions -->
          <div class="answer-section" *ngIf="currentQuestion()?.question_type === 'true_false'">
            <div class="choices-list">
              <label class="choice-option" [ngClass]="{ 'selected': selectedTrueFalse() === true }">
                <input
                  type="radio"
                  [name]="'question_' + currentQuestion()?.id"
                  [value]="true"
                  [(ngModel)]="selectedTrueFalse"
                  (change)="onTrueFalseSelected(true)">
                <span class="choice-letter">أ</span>
                <span class="choice-text">صحيح</span>
              </label>
              <label class="choice-option" [ngClass]="{ 'selected': selectedTrueFalse() === false }">
                <input
                  type="radio"
                  [name]="'question_' + currentQuestion()?.id"
                  [value]="false"
                  [(ngModel)]="selectedTrueFalse"
                  (change)="onTrueFalseSelected(false)">
                <span class="choice-letter">ب</span>
                <span class="choice-text">خطأ</span>
              </label>
            </div>
          </div>

          <!-- Essay Questions -->
          <div class="answer-section" *ngIf="currentQuestion()?.question_type === 'essay'">
            <div class="essay-input">
              <textarea
                [(ngModel)]="essayAnswer"
                (ngModelChange)="onEssayAnswerChanged($event)"
                placeholder="اكتب إجابتك هنا..."
                rows="8"
                class="essay-textarea"></textarea>
              <div class="character-count">
                عدد الأحرف: {{ essayAnswer().length }}
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
          <button
            (click)="previousQuestion()"
            class="nav-btn prev-btn"
            [disabled]="currentQuestionIndex() === 0">
            <i class="icon">←</i>
            السؤال السابق
          </button>

          <button
            (click)="nextQuestion()"
            class="nav-btn next-btn"
            [disabled]="!isCurrentQuestionAnswered()"
            *ngIf="!isLastQuestion()">
            السؤال التالي
            <i class="icon">→</i>
          </button>

          <button
            (click)="submitExam()"
            class="nav-btn submit-btn"
            [disabled]="!canSubmitExam() || isSubmitting()"
            *ngIf="isLastQuestion()">
            <div class="mini-spinner" *ngIf="isSubmitting()"></div>
            <i class="icon" *ngIf="!isSubmitting()">✓</i>
            {{ isSubmitting() ? 'جاري الإرسال...' : 'إنهاء الامتحان' }}
          </button>
        </div>

        <!-- Question Navigation -->
        <div class="question-navigation">
          <h4>الانتقال السريع للأسئلة</h4>
          <div class="question-grid">
            <button
              *ngFor="let question of exam()?.questions; let i = index"
              (click)="goToQuestion(i)"
              class="question-nav-btn"
              [ngClass]="{
                'current': i === currentQuestionIndex(),
                'answered': isQuestionAnswered(i),
                'unanswered': !isQuestionAnswered(i)
              }">
              {{ i + 1 }}
            </button>
          </div>
        </div>
      </main>

      <!-- Time Warning Modal -->
      <div class="modal-overlay" *ngIf="showTimeWarning()">
        <div class="modal-content">
          <div class="warning-icon">⚠️</div>
          <h3>تحذير: الوقت ينفد!</h3>
          <p>تبقى أقل من 5 دقائق على انتهاء الامتحان</p>
          <button (click)="dismissTimeWarning()" class="modal-btn">فهمت</button>
        </div>
      </div>

      <!-- Submit Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showSubmitConfirmation()">
        <div class="modal-content">
          <h3>تأكيد إنهاء الامتحان</h3>
          <p>هل أنت متأكد من إنهاء الامتحان؟</p>
          <div class="unanswered-warning" *ngIf="unansweredQuestions().length > 0">
            <p class="warning-text">
              لديك {{ unansweredQuestions().length }} أسئلة غير مجابة:
            </p>
            <ul class="unanswered-list">
              <li *ngFor="let questionNum of unansweredQuestions()">
                السؤال {{ questionNum }}
              </li>
            </ul>
          </div>
          <div class="modal-actions">
            <button (click)="confirmSubmit()" class="modal-btn confirm-btn">
              نعم، إنهاء الامتحان
            </button>
            <button (click)="cancelSubmit()" class="modal-btn cancel-btn">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exam-taking-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      direction: rtl;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .exam-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .exam-info h1 {
      margin: 0 0 5px 0;
      color: #2d3748;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .exam-info p {
      margin: 0;
      color: #718096;
      font-size: 0.9rem;
    }

    .timer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 1.2rem;
      font-weight: 700;
      transition: all 0.3s ease;
    }

    .timer.normal {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
    }

    .timer.warning {
      background: linear-gradient(135deg, #ed8936, #dd6b20);
      color: white;
      animation: pulse 2s infinite;
    }

    .timer.critical {
      background: linear-gradient(135deg, #e53e3e, #c53030);
      color: white;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .progress-container {
      background: rgba(255, 255, 255, 0.9);
      padding: 15px 20px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    }

    .progress-text {
      color: #4a5568;
      font-weight: 600;
      font-size: 0.9rem;
      min-width: 80px;
    }

    .question-content {
      max-width: 900px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    .question-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .question-number {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
    }

    .question-points {
      background: #f7fafc;
      color: #4a5568;
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 0.9rem;
      font-weight: 500;
      border: 1px solid #e2e8f0;
    }

    .question-type {
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 0.9rem;
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
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 25px;
      font-weight: 500;
    }

    .answer-section {
      margin-bottom: 20px;
    }

    .choices-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .choice-option {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .choice-option:hover {
      background: #edf2f7;
      border-color: #cbd5e0;
    }

    .choice-option.selected {
      background: #e6fffa;
      border-color: #4db6ac;
      box-shadow: 0 0 0 3px rgba(77, 182, 172, 0.1);
    }

    .choice-option input[type="radio"] {
      display: none;
    }

    .choice-letter {
      background: #667eea;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }

    .choice-option.selected .choice-letter {
      background: #4db6ac;
    }

    .choice-text {
      color: #2d3748;
      font-size: 1.1rem;
      flex: 1;
    }

    .essay-input {
      position: relative;
    }

    .essay-textarea {
      width: 100%;
      padding: 15px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      line-height: 1.6;
      resize: vertical;
      min-height: 200px;
      font-family: inherit;
      transition: border-color 0.3s ease;
    }

    .essay-textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .character-count {
      position: absolute;
      bottom: 10px;
      left: 15px;
      color: #718096;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.9);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 30px;
    }

    .nav-btn {
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
      min-width: 150px;
      justify-content: center;
    }

    .prev-btn {
      background: linear-gradient(135deg, #718096, #4a5568);
      color: white;
    }

    .next-btn {
      background: linear-gradient(135deg, #4299e1, #3182ce);
      color: white;
    }

    .submit-btn {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
    }

    .nav-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .question-navigation {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 25px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .question-navigation h4 {
      margin: 0 0 15px 0;
      color: #2d3748;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .question-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
      gap: 10px;
    }

    .question-nav-btn {
      width: 50px;
      height: 50px;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .question-nav-btn.current {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-color: #667eea;
    }

    .question-nav-btn.answered {
      background: #48bb78;
      color: white;
      border-color: #48bb78;
    }

    .question-nav-btn.unanswered {
      background: white;
      color: #718096;
      border-color: #e2e8f0;
    }

    .question-nav-btn:hover {
      transform: scale(1.05);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .warning-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }

    .modal-content h3 {
      margin: 0 0 15px 0;
      color: #2d3748;
      font-size: 1.3rem;
    }

    .modal-content p {
      margin: 0 0 20px 0;
      color: #4a5568;
      line-height: 1.5;
    }

    .unanswered-warning {
      background: #fff5f5;
      border: 1px solid #fed7d7;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      text-align: right;
    }

    .warning-text {
      color: #c53030;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .unanswered-list {
      margin: 0;
      padding-right: 20px;
      color: #e53e3e;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .modal-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .confirm-btn {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
    }

    .cancel-btn {
      background: linear-gradient(135deg, #e53e3e, #c53030);
      color: white;
    }

    .modal-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .mini-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
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
        gap: 15px;
        text-align: center;
      }

      .progress-container {
        flex-direction: column;
        gap: 10px;
      }

      .question-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .navigation-buttons {
        flex-direction: column;
      }

      .nav-btn {
        width: 100%;
      }

      .question-grid {
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      }

      .question-nav-btn {
        width: 40px;
        height: 40px;
      }
    }
  `]
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals for reactive state
  readonly exam = signal<Exam | null>(null);
  readonly examAttempt = signal<ExamAttempt | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly timeRemaining = signal(0);
  readonly isSubmitting = signal(false);
  readonly showTimeWarning = signal(false);
  readonly showSubmitConfirmation = signal(false);

  // Answer signals
  readonly selectedChoiceId = signal<number | null>(null);
  readonly selectedTrueFalse = signal<boolean | null>(null);
  readonly essayAnswer = signal('');

  // Answers storage
  private answers = new Map<number, ExamAnswer>();
  private timer: any;
  private timeWarningShown = false;

  // Computed signals
  readonly currentQuestion = computed(() => {
    const examData = this.exam();
    const index = this.currentQuestionIndex();
    return examData?.questions?.[index] || null;
  });

  readonly totalQuestions = computed(() => this.exam()?.questions?.length || 0);

  readonly progressPercentage = computed(() => {
    const total = this.totalQuestions();
    const current = this.currentQuestionIndex() + 1;
    return total > 0 ? Math.round((current / total) * 100) : 0;
  });

  readonly isLastQuestion = computed(() =>
    this.currentQuestionIndex() === this.totalQuestions() - 1
  );

  readonly unansweredQuestions = computed(() => {
    const total = this.totalQuestions();
    const unanswered: number[] = [];

    for (let i = 0; i < total; i++) {
      if (!this.isQuestionAnswered(i)) {
        unanswered.push(i + 1);
      }
    }

    return unanswered;
  });

  ngOnInit(): void {
    const examId = Number(this.route.snapshot.paramMap.get('examId'));
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));

    if (examId && attemptId) {
      this.loadExamData(examId, attemptId);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private loadExamData(examId: number, attemptId: number): void {
    this.examService.getExam(examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.initializeTimer(exam.duration);
        this.loadCurrentAnswers();
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private initializeTimer(durationMinutes: number): void {
    const totalSeconds = durationMinutes * 60;
    this.timeRemaining.set(totalSeconds);

    this.timer = setInterval(() => {
      const remaining = this.timeRemaining() - 1;
      this.timeRemaining.set(remaining);

      // Show warning at 5 minutes
      if (remaining === 300 && !this.timeWarningShown) {
        this.showTimeWarning.set(true);
        this.timeWarningShown = true;
      }

      // Auto-submit when time runs out
      if (remaining <= 0) {
        this.autoSubmitExam();
      }
    }, 1000);
  }

  private loadCurrentAnswers(): void {
    // Load any existing answers for this question
    this.updateCurrentAnswerDisplay();
  }

  private updateCurrentAnswerDisplay(): void {
    const question = this.currentQuestion();
    if (!question) return;

    const answer = this.answers.get(question.id);
    if (answer) {
      if (question.question_type === 'multiple_choice') {
        this.selectedChoiceId.set(answer.selected_choice_id || null);
      } else if (question.question_type === 'true_false') {
        this.selectedTrueFalse.set(answer.selected_choice_id === 1 ? true : false);
      } else if (question.question_type === 'essay') {
        this.essayAnswer.set(answer.answer_text || '');
      }
    } else {
      // Reset form for new question
      this.selectedChoiceId.set(null);
      this.selectedTrueFalse.set(null);
      this.essayAnswer.set('');
    }
  }

  onChoiceSelected(choiceId: number): void {
    const question = this.currentQuestion();
    if (!question) return;

    this.answers.set(question.id, {
      question_id: question.id,
      selected_choice_id: choiceId
    });
  }

  onTrueFalseSelected(value: boolean): void {
    const question = this.currentQuestion();
    if (!question) return;

    this.answers.set(question.id, {
      question_id: question.id,
      selected_choice_id: value ? 1 : 0
    });
  }

  onEssayAnswerChanged(text: string): void {
    const question = this.currentQuestion();
    if (!question) return;

    this.answers.set(question.id, {
      question_id: question.id,
      answer_text: text
    });
  }

  isCurrentQuestionAnswered(): boolean {
    const question = this.currentQuestion();
    if (!question) return false;

    return this.answers.has(question.id);
  }

  isQuestionAnswered(index: number): boolean {
    const examData = this.exam();
    if (!examData?.questions) return false;

    const question = examData.questions[index];
    return this.answers.has(question.id);
  }

  canSubmitExam(): boolean {
    // Allow submission even with unanswered questions
    return true;
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex() < this.totalQuestions() - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
      this.updateCurrentAnswerDisplay();
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
      this.updateCurrentAnswerDisplay();
    }
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.totalQuestions()) {
      this.currentQuestionIndex.set(index);
      this.updateCurrentAnswerDisplay();
    }
  }

  submitExam(): void {
    this.showSubmitConfirmation.set(true);
  }

  confirmSubmit(): void {
    this.showSubmitConfirmation.set(false);
    this.performSubmit();
  }

  cancelSubmit(): void {
    this.showSubmitConfirmation.set(false);
  }

  private performSubmit(): void {
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));
    if (!attemptId) return;

    this.isSubmitting.set(true);

    const answersArray = Array.from(this.answers.values());

    this.examService.submitExamAttempt(attemptId, answersArray).subscribe({
      next: (result) => {
        if (this.timer) {
          clearInterval(this.timer);
        }
        this.router.navigate(['/exam', 'result', result.id]);
      },
      error: (error) => {
        console.error('Error submitting exam:', error);
        alert('حدث خطأ أثناء إرسال الامتحان. يرجى المحاولة مرة أخرى.');
        this.isSubmitting.set(false);
      }
    });
  }

  private autoSubmitExam(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    alert('انتهى الوقت المحدد للامتحان. سيتم إرسال إجاباتك تلقائياً.');
    this.performSubmit();
  }

  dismissTimeWarning(): void {
    this.showTimeWarning.set(false);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimerClass(): string {
    const remaining = this.timeRemaining();
    if (remaining <= 300) return 'critical'; // 5 minutes
    if (remaining <= 600) return 'warning';  // 10 minutes
    return 'normal';
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

