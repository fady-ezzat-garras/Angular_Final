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
