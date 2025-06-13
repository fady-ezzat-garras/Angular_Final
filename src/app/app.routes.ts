/*
import { Routes } from '@angular/router';
import { authGuard, adminGuard, studentGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Auth routes (accessible only to guests)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Student dashboard (accessible only to authenticated students)
  {
    path: 'dashboard',
    canActivate: [studentGuard],
    loadComponent: () => import('./features/student/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Admin panel (accessible only to authenticated admins)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
*/
import { Routes } from '@angular/router';
import { authGuard, adminGuard, studentGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Auth routes (accessible only to guests)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Student dashboard (accessible only to authenticated students)
  {
    path: 'dashboard',
    canActivate: [studentGuard],
    loadComponent: () => import('./features/student/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Student exam routes
  {
    path: 'exam/:id/details',
    canActivate: [studentGuard],
    loadComponent: () => import('./features/student/exam-details/exam-details.component').then(m => m.ExamDetailsComponent)
  },
  {
    path: 'exam/:examId/attempt/:attemptId',
    canActivate: [studentGuard],
    loadComponent: () => import('./features/student/exam-taking/exam-taking.component').then(m => m.ExamTakingComponent)
  },
  {
    path: 'exam/result/:attemptId',
    canActivate: [studentGuard],
    loadComponent: () => import('./features/student/exam-result/exam-result.component').then(m => m.ExamResultComponent)
  },
  {
    path: 'results',
    canActivate: [studentGuard],
    loadComponent: () => import('./features/student/results/results.component').then(m => m.ResultsComponent)
  },

  // Admin panel (accessible only to authenticated admins)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
