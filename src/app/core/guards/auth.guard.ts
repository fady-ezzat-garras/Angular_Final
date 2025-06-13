import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page with return url
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    // User is authenticated but not admin
    router.navigate(['/dashboard']);
  } else {
    // User is not authenticated
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }
  return false;
};

export const studentGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isStudent()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    // User is authenticated but not student
    router.navigate(['/admin']);
  } else {
    // User is not authenticated
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }
  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // User is already authenticated, redirect based on role
  if (authService.isAdmin()) {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};
