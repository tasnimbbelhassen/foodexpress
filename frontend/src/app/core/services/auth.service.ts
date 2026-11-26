import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from '../api';

// Structure des informations d'un utilisateur
export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: 'client' | 'restaurateur' | 'admin';
}

// Structure de la réponse renvoyée après l'authentification
interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Injection des services HTTP et de navigation
  private http = inject(HttpClient);
  private router = inject(Router);

  // Gestion réactive de l'utilisateur connecté
  private _user = signal<User | null>(this.readUser());
  user = this._user.asReadonly();
  isLoggedIn = computed(() => !!this._user());

  // Récupération du token stocké
  get token(): string | null {
    return localStorage.getItem('token');
  }

  // Récupération de l'utilisateur depuis le localStorage
  private readUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }

  // Enregistrement du token et des informations utilisateur
  private save(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._user.set(res.user);
  }

  // Inscription d'un nouvel utilisateur
  register(data: any) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, data).pipe(tap((r) => this.save(r)));
  }

  // Connexion d'un utilisateur
  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }).pipe(tap((r) => this.save(r)));
  }

  // Déconnexion : suppression du token et des données locales
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  // Récupération du profil de l'utilisateur connecté
  getProfile() {
    return this.http.get<User>(`${API_URL}/users/me`);
  }

  // Mise à jour des informations du profil
  updateProfile(data: { nom: string; prenom: string; telephone: string }) {
    return this.http.put<User>(`${API_URL}/users/me`, data).pipe(
      tap((u) => {
        localStorage.setItem('user', JSON.stringify(u));
        this._user.set(u);
      })
    );
  }

  // Modification du mot de passe
  updatePassword(data: { ancienPassword: string; nouveauPassword: string; confirmation: string }) {
    return this.http.put<{ message: string }>(`${API_URL}/users/me/password`, data);
  }
}