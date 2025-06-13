import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Signals for component state
  readonly isLoading = this.authService.isLoading;
  readonly errorMessage = signal<string>('');
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  // Form setup
  readonly registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    password_confirmation: ['', [Validators.required]],
    role: ['student', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  // Getters for form controls
  get name() { return this.registerForm.get('name'); }
  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get passwordConfirmation() { return this.registerForm.get('password_confirmation'); }
  get role() { return this.registerForm.get('role'); }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.errorMessage.set('');
      
      const userData: RegisterRequest = {
        name: this.name?.value,
        username: this.username?.value,
        email: this.email?.value,
        password: this.password?.value,
        password_confirmation: this.passwordConfirmation?.value,
        role: this.role?.value
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          // Redirect based on user role
          const redirectUrl = response.user.role === 'admin' ? '/admin' : '/dashboard';
          this.router.navigate([redirectUrl]);
        },
        error: (error: HttpErrorResponse) => {
          this.handleRegisterError(error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(show => !show);
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private handleRegisterError(error: HttpErrorResponse): void {
    if (error.status === 422) {
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
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return this.getRequiredErrorMessage(fieldName);
      }
      if (field.errors['email']) {
        return 'Invalid email format';
      }
      if (field.errors['minlength']) {
        return this.getMinLengthErrorMessage(fieldName, field.errors['minlength'].requiredLength);
      }
      if (field.errors['pattern']) {
        return 'Username must contain only letters and numbers';
      }
    }

    // Check for password mismatch
    if (fieldName === 'password_confirmation' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  private getRequiredErrorMessage(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      name: 'Name',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      password_confirmation: 'Password confirmation',
      role: 'User type'
    };
    return `${fieldNames[fieldName]} is required`;
  }

  private getMinLengthErrorMessage(fieldName: string, requiredLength: number): string {
    const fieldNames: { [key: string]: string } = {
      name: 'Name',
      username: 'Username',
      password: 'Password'
    };
    return `${fieldNames[fieldName]} must be at least ${requiredLength} characters`;
  }
}
