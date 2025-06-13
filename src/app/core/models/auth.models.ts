export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'student' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: { [key: string]: string[] };
  status?: number;
}
