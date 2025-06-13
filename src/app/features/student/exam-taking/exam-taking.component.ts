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
          <p>Question {{ currentQuestionIndex() + 1 }} of {{ totalQuestions() }}</p>
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
        <span class="progress-text">{{ progressPercentage() }}% Completed</span>
      </div>

      <!-- Question Content -->
      <main class="question-content" *ngIf="currentQuestion()">
        <div class="question-card">
          <div class="question-header">
            <span class="question-number">Question {{ currentQuestionIndex() + 1 }}</span>
            <span class="question-points">{{ currentQuestion()?.points }} points</span>
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
                <span class="choice-letter">A</span>
                <span class="choice-text">True</span>
              </label>
              <label class="choice-option" [ngClass]="{ 'selected': selectedTrueFalse() === false }">
                <input
                  type="radio"
                  [name]="'question_' + currentQuestion()?.id"
                  [value]="false"
                  [(ngModel)]="selectedTrueFalse"
                  (change)="onTrueFalseSelected(false)">
                <span class="choice-letter">B</span>
                <span class="choice-text">False</span>
              </label>
            </div>
          </div>

          <!-- Essay Questions -->
          <div class="answer-section" *ngIf="currentQuestion()?.question_type === 'essay'">
            <div class="essay-input">
              <textarea
                [(ngModel)]="essayAnswer"
                (ngModelChange)="onEssayAnswerChanged($event)"
                placeholder="Write your answer here..."
                rows="8"
                class="essay-textarea"></textarea>
              <div class="character-count">
                Characters: {{ essayAnswer().length }}
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
            Previous Question
          </button>

          <button
            (click)="nextQuestion()"
            class="nav-btn next-btn"
            [disabled]="!isCurrentQuestionAnswered()"
            *ngIf="!isLastQuestion()">
            Next Question
            <i class="icon">→</i>
          </button>

          <button
            (click)="submitExam()"
            class="nav-btn submit-btn"
            [disabled]="!canSubmitExam() || isSubmitting()"
            *ngIf="isLastQuestion()">
            <div class="mini-spinner" *ngIf="isSubmitting()"></div>
            <i class="icon" *ngIf="!isSubmitting()">✓</i>
            {{ isSubmitting() ? 'Submitting...' : 'End Exam' }}
          </button>
        </div>

        <!-- Question Navigation -->
        <div class="question-navigation">
          <h4>Quick Question Navigation</h4>
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
          <h3>Warning: Time is running out!</h3>
          <p>Less than 5 minutes remaining for the exam.</p>
          <button (click)="dismissTimeWarning()" class="modal-btn">Understood</button>
        </div>
      </div>

      <!-- Submit Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showSubmitConfirmation()">
        <div class="modal-content">
          <h3>Confirm Exam Submission</h3>
          <p>Are you sure you want to end the exam?</p>
          <div class="unanswered-warning" *ngIf="unansweredQuestions().length > 0">
            <p class="warning-text">
              You have {{ unansweredQuestions().length }} unanswered questions:
            </p>
            <ul class="unanswered-list">
              <li *ngFor="let questionNum of unansweredQuestions()">
                Question {{ questionNum }}
              </li>
            </ul>
          </div>
          <div class="modal-actions">
            <button (click)="confirmSubmit()" class="modal-btn confirm-btn">
              Yes, End Exam
            </button>
            <button (click)="cancelSubmit()" class="modal-btn cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exam-taking-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%); /* Lighter background */
      direction: ltr; /* Changed to LTR */
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .exam-header {
      background: white;
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
      background: white;
      padding: 15px 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
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
      background: white;
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
      right: 15px; /* Changed to right for LTR */
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
      background: white;
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
      margin-bottom: 20px;
      color: #4a5568;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 15px;
    }

    .modal-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .modal-btn.confirm-btn {
      background: linear-gradient(135deg, #e53e3e, #c53030);
      color: white;
    }

    .modal-btn.cancel-btn {
      background: #e2e8f0;
      color: #4a5568;
    }

    .modal-btn:hover {
      transform: translateY(-2px);
    }

    .unanswered-warning {
      background: #fff3e0;
      border: 1px solid #ff9800;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .unanswered-warning .warning-text {
      color: #e65100;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .unanswered-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .unanswered-list li {
      background: #ff9800;
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 0.9rem;
    }

    .icon {
      font-style: normal;
    }

    @media (max-width: 768px) {
      .exam-header {
        flex-direction: column;
        gap: 15px;
      }

      .navigation-buttons {
        flex-direction: column;
      }

      .nav-btn {
        width: 100%;
      }
    }
  `]
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly exam = signal<Exam | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly timeRemaining = signal(0);
  readonly selectedChoiceId = signal<number | null>(null);
  readonly selectedTrueFalse = signal<boolean | null>(null);
  readonly essayAnswer = signal<string>('');
  readonly answers = signal<ExamAnswer[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly showTimeWarning = signal(false);
  readonly showSubmitConfirmation = signal(false);

  private timerInterval: any;
  private examAttemptId: number | null = null;

  readonly totalQuestions = computed(() => this.exam()?.questions?.length || 0);
  readonly progressPercentage = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return ((this.currentQuestionIndex() + 1) / total) * 100;
  });

  readonly isLastQuestion = computed(() => this.currentQuestionIndex() === this.totalQuestions() - 1);

  readonly unansweredQuestions = computed(() => {
    const questions = this.exam()?.questions || [];
    const answeredQuestionIds = new Set(this.answers().map(ans => ans.question_id));
    const unanswered: number[] = [];
    questions.forEach((q, index) => {
      if (!answeredQuestionIds.has(q.id)) {
        unanswered.push(index + 1);
      }
    });
    return unanswered;
  });

  ngOnInit(): void {
    const examId = Number(this.route.snapshot.paramMap.get('examId'));
    this.examAttemptId = Number(this.route.snapshot.paramMap.get('attemptId'));

    if (examId && this.examAttemptId) {
      this.loadExam(examId);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private loadExam(examId: number): void {
    this.examService.getExam(examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.timeRemaining.set(exam.duration * 60); // Convert minutes to seconds
        this.isLoading.set(false);
        this.startTimer();
        this.loadExistingAnswers();
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        alert('Failed to load exam. Please try again.');
        this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      }
    });
  }

  private loadExistingAnswers(): void {
    if (this.examAttemptId) {
      this.examService.getAttemptDetails(this.examAttemptId).subscribe({
        next: (attempt) => {
          if (attempt.answers) {
            this.answers.set(attempt.answers);
            this.updateCurrentQuestionAnswer();
          }
        },
        error: (error) => {
          console.error('Error loading existing answers:', error);
        }
      });
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining.update(val => val - 1);
      if (this.timeRemaining() <= 300 && !this.showTimeWarning()) { // 5 minutes warning
        this.showTimeWarning.set(true);
      }
      if (this.timeRemaining() <= 0) {
        this.submitExam(true); // Auto-submit
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimerClass(): string {
    const remaining = this.timeRemaining();
    if (remaining <= 60) return 'critical'; // 1 minute
    if (remaining <= 300) return 'warning'; // 5 minutes
    return 'normal';
  }

  goToQuestion(index: number): void {
    this.saveCurrentAnswer();
    this.currentQuestionIndex.set(index);
    this.updateCurrentQuestionAnswer();
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.saveCurrentAnswer();
      this.currentQuestionIndex.update(val => val - 1);
      this.updateCurrentQuestionAnswer();
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex() < this.totalQuestions() - 1) {
      this.saveCurrentAnswer();
      this.currentQuestionIndex.update(val => val + 1);
      this.updateCurrentQuestionAnswer();
    }
  }

  private saveCurrentAnswer(): void {
    const currentQ = this.currentQuestion();
    if (!currentQ || !this.examAttemptId) return;

    let answerValue: any = null;
    if (currentQ.question_type === 'multiple_choice') {
      answerValue = this.selectedChoiceId();
    } else if (currentQ.question_type === 'true_false') {
      answerValue = this.selectedTrueFalse();
    } else if (currentQ.question_type === 'essay') {
      answerValue = this.essayAnswer();
    }

    if (answerValue !== null && answerValue !== '') {
      const existingAnswerIndex = this.answers().findIndex(ans => ans.question_id === currentQ.id);
      const newAnswer: ExamAnswer = {
        question_id: currentQ.id,
        answer_value: answerValue
      };

      if (existingAnswerIndex > -1) {
        this.answers.update(answers => {
          const updatedAnswers = [...answers];
          updatedAnswers[existingAnswerIndex] = newAnswer;
          return updatedAnswers;
        });
      } else {
        this.answers.update(answers => [...answers, newAnswer]);
      }

      // Auto-save to backend
      this.examService.saveAnswer(this.examAttemptId, newAnswer).subscribe({
        next: (response) => {
          // console.log('Answer saved:', response);
        },
        error: (error) => {
          console.error('Error saving answer:', error);
        }
      });
    }
  }

  private updateCurrentQuestionAnswer(): void {
    const currentQ = this.currentQuestion();
    if (!currentQ) return;

    const existingAnswer = this.answers().find(ans => ans.question_id === currentQ.id);

    if (currentQ.question_type === 'multiple_choice') {
      this.selectedChoiceId.set(existingAnswer?.answer_value || null);
      this.selectedTrueFalse.set(null);
      this.essayAnswer.set('');
    } else if (currentQ.question_type === 'true_false') {
      this.selectedTrueFalse.set(existingAnswer?.answer_value === 'true' ? true : (existingAnswer?.answer_value === 'false' ? false : null));
      this.selectedChoiceId.set(null);
      this.essayAnswer.set('');
    } else if (currentQ.question_type === 'essay') {
      this.essayAnswer.set(existingAnswer?.answer_value || '');
      this.selectedChoiceId.set(null);
      this.selectedTrueFalse.set(null);
    }
  }

  onChoiceSelected(choiceId: number): void {
    this.selectedChoiceId.set(choiceId);
  }

  onTrueFalseSelected(value: boolean): void {
    this.selectedTrueFalse.set(value);
  }

  onEssayAnswerChanged(value: string): void {
    this.essayAnswer.set(value);
  }

  currentQuestion = computed(() => {
    const examData = this.exam();
    const index = this.currentQuestionIndex();
    return examData?.questions ? examData.questions[index] : null;
  });

  isCurrentQuestionAnswered(): boolean {
    const currentQ = this.currentQuestion();
    if (!currentQ) return false;

    const existingAnswer = this.answers().find(ans => ans.question_id === currentQ.id);
    return !!existingAnswer && existingAnswer.answer_value !== null && existingAnswer.answer_value !== '';
  }

  isQuestionAnswered(index: number): boolean {
    const question = this.exam()?.questions?.[index];
    if (!question) return false;
    const existingAnswer = this.answers().find(ans => ans.question_id === question.id);
    return !!existingAnswer && existingAnswer.answer_value !== null && existingAnswer.answer_value !== '';
  }

  canSubmitExam(): boolean {
    return this.unansweredQuestions().length === 0;
  }

  submitExam(autoSubmit: boolean = false): void {
    this.saveCurrentAnswer(); // Save the last question's answer

    if (!autoSubmit && this.unansweredQuestions().length > 0) {
      this.showSubmitConfirmation.set(true);
      return;
    }

    if (confirm(autoSubmit ? 'Time is up! Submitting your exam.' : 'Are you sure you want to submit the exam?')) {
      this.confirmSubmit();
    }
  }

  confirmSubmit(): void {
    if (!this.examAttemptId) return;

    this.isSubmitting.set(true);
    this.showSubmitConfirmation.set(false);
    clearInterval(this.timerInterval);

    this.examService.submitExam(this.examAttemptId, this.answers()).subscribe({
      next: (result) => {
        alert('Exam submitted successfully!');
        this.router.navigate(['/exam/result', this.examAttemptId]);
      },
      error: (error) => {
        console.error('Error submitting exam:', error);
        alert('An error occurred while submitting the exam. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  cancelSubmit(): void {
    this.showSubmitConfirmation.set(false);
  }

  dismissTimeWarning(): void {
    this.showTimeWarning.set(false);
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

