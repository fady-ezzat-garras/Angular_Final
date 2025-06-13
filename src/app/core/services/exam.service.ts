import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: string;
}

export interface Exam {
  id: number;
  title: string;
  description?: string;
  duration: number; // in minutes
  questions_count?: number;
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface Question {
  id: number;
  exam_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  points: number;
  created_at: string;
  updated_at: string;
  choices?: Choice[];
}

export interface Choice {
  id: number;
  question_id: number;
  choice_text: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamAttempt {
  id: number;
  exam_id: number;
  user_id: number;
  started_at: string;
  submitted_at?: string;
  score?: number;
  answers?: ExamAnswer[];
  created_at: string;
  updated_at: string;
  exam?: Exam;
}

export interface ExamAnswer {
  question_id: number;
  selected_choice_id?: number;
  answer_text?: string;
}

export interface StartExamResponse {
  exam_attempt: ExamAttempt;
  exam: Exam;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = 'http://15.237.157.109:9090/api';

  /**
   * Get all available exams for the current user
   */
  getExams(): Observable<Exam[]> {
    return this.http.get<ApiResponse<Exam[]>>(`${this.API_BASE_URL}/exams`)
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Get a specific exam with questions and choices
   */
  getExam(examId: number): Observable<Exam> {
    return this.http.get<ApiResponse<Exam>>(`${this.API_BASE_URL}/exams/${examId}`)
      .pipe(
        map(response => response.data!)
      );
  }

  /**
   * Start an exam attempt
   */
  startExam(examId: number): Observable<ExamAttempt> {
    return this.http.post<ApiResponse<StartExamResponse>>(`${this.API_BASE_URL}/exams/${examId}/start`, {})
      .pipe(
        map(response => response.data!.exam_attempt)
      );
  }

  /**
   * Submit answers for an exam attempt
   */
  submitExamAttempt(attemptId: number, answers: ExamAnswer[]): Observable<ExamAttempt> {
    return this.http.post<ApiResponse<ExamAttempt>>(`${this.API_BASE_URL}/attempts/${attemptId}/submit`, {
      answers: answers
    }).pipe(
      map(response => response.data!)
    );
  }

  /**
   * Get current user's exam attempts (results)
   */
  getResults(): Observable<ExamAttempt[]> {
    return this.http.get<ApiResponse<ExamAttempt[]>>(`${this.API_BASE_URL}/results`)
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Get all attempts for a specific exam (admin only)
   */
  getExamResults(examId: number): Observable<ExamAttempt[]> {
    return this.http.get<ApiResponse<ExamAttempt[]>>(`${this.API_BASE_URL}/exams/${examId}/results`)
      .pipe(
        map(response => response.data || [])
      );
  }
}

