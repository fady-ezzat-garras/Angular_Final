import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Signals for component state
  readonly isLoading = this.authService.isLoading;
  readonly errorMessage = signal<string>('');
  readonly showPassword = signal<boolean>(false);

  // Form setup
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Getters for form controls
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage.set('');
      
      const credentials: LoginRequest = {
        email: this.email?.value,
        password: this.password?.value
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          // Get return URL from query params or default to dashboard
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.getDefaultRoute();
          this.router.navigate([returnUrl]);
        },
        error: (error: HttpErrorResponse) => {
          this.handleLoginError(error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  private getDefaultRoute(): string {
    const user = this.authService.currentUser();
    return user?.role === 'admin' ? '/admin' : '/dashboard';
  }

  private handleLoginError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.errorMessage.set('Invalid email or password');
    } else if (error.status === 422) {
      // Validation errors
      const errors = error.error?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0] as string[];
        this.errorMessage.set(firstError[0]);
      } else {
        this.errorMessage.set('Invalid data');
      }
    } else if (error.status === 0) {
      this.errorMessage.set('Connection error to server');
    } else {
      this.errorMessage.set('An unexpected error occurred, please try again');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Password'} is required`;
      }
      if (field.errors['email']) {
        return 'Invalid email format';
      }
      if (field.errors['minlength']) {
        return 'Password must be at least 6 characters';
      }
    }
    return '';
  }
}
