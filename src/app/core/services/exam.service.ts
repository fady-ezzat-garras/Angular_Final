import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Exam, ExamAttempt, ExamAnswer, StartExamResponse } from '../models/exam.models';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: string;
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
   * Save a single answer during exam
   */
  saveAnswer(attemptId: number, answer: ExamAnswer): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.API_BASE_URL}/attempts/${attemptId}/answer`, answer)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Submit exam with all answers
   */
  submitExam(attemptId: number, answers: ExamAnswer[]): Observable<ExamAttempt> {
    return this.http.post<ApiResponse<ExamAttempt>>(`${this.API_BASE_URL}/attempts/${attemptId}/submit`, {
      answers: answers
    }).pipe(
      map(response => response.data!)
    );
  }

  /**
   * Get attempt details
   */
  getAttemptDetails(attemptId: number): Observable<ExamAttempt> {
    return this.http.get<ApiResponse<ExamAttempt>>(`${this.API_BASE_URL}/attempts/${attemptId}`)
      .pipe(
        map(response => response.data!)
      );
  }

  /**
   * Submit answers for an exam attempt (legacy method)
   */
  submitExamAttempt(attemptId: number, answers: ExamAnswer[]): Observable<ExamAttempt> {
    return this.submitExam(attemptId, answers);
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

