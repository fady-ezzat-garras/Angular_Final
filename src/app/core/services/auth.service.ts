import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse 
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  private readonly API_BASE_URL = 'http://15.237.157.109:9090/api';
  private readonly TOKEN_KEY = 'exam_auth_token';
  private readonly USER_KEY = 'exam_user_data';

  // Signals for reactive state management
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);
  
  // Computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isStudent = computed(() => this.currentUserSignal()?.role === 'student');

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeAuth(): void {
    const token = this.getStoredToken();
    const userData = this.getStoredUser();
    
    if (token && userData) {
      this.currentUserSignal.set(userData);
    }
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/login`, credentials)
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(error => this.handleAuthError(error)),
        tap(() => this.isLoadingSignal.set(false))
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/register`, userData)
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(error => this.handleAuthError(error)),
        tap(() => this.isLoadingSignal.set(false))
      );
  }

  /**
   * Get current user data from API
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.API_BASE_URL}/me`)
      .pipe(
        map(response => response.data!),
        tap(user => {
          this.currentUserSignal.set(user);
          this.storeUser(user);
        }),
        catchError(error => this.handleAuthError(error))
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_BASE_URL}/logout`, {})
      .pipe(
        tap(() => {
          this.handleLogout();
        }),
        catchError(() => {
          // Even if API call fails, clear local data
          this.handleLogout();
          return throwError(() => new Error('Logout failed'));
        })
      );
  }

  /**
   * Force logout (clear local data without API call)
   */
  forceLogout(): void {
    this.handleLogout();
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return this.getStoredToken();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: 'admin' | 'student'): boolean {
    return this.currentUserSignal()?.role === role;
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponse): void {
    this.storeToken(response.token);
    this.storeUser(response.user);
    this.currentUserSignal.set(response.user);
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    this.isLoadingSignal.set(false);
    
    if (error.status === 401) {
      this.handleLogout();
    }
    
    return throwError(() => error);
  }

  /**
   * Handle logout process
   */
  private handleLogout(): void {
    this.clearStorage();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Storage methods
   */
  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
