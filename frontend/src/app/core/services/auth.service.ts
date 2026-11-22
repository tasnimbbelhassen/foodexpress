import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from '../api';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: 'client' | 'restaurateur' | 'admin';
}
interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(this.readUser());
  user = this._user.asReadonly();
  isLoggedIn = computed(() => !!this._user());

  get token(): string | null {
    return localStorage.getItem('token');
  }

  private readUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }

  private save(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._user.set(res.user);
  }

  register(data: any) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, data).pipe(tap((r) => this.save(r)));
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }).pipe(tap((r) => this.save(r)));
  }

  // JWT stateless : se déconnecter = supprimer le token côté client
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getProfile() {
    return this.http.get<User>(`${API_URL}/users/me`);
  }

  updateProfile(data: { nom: string; prenom: string; telephone: string }) {
    return this.http.put<User>(`${API_URL}/users/me`, data).pipe(
      tap((u) => {
        localStorage.setItem('user', JSON.stringify(u));
        this._user.set(u);
      })
    );
  }

  updatePassword(data: { ancienPassword: string; nouveauPassword: string; confirmation: string }) {
    return this.http.put<{ message: string }>(`${API_URL}/users/me/password`, data);
  }
}