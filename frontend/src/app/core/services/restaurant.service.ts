import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from '../api';

export interface Restaurant {
  _id: string;
  nom: string;
  description: string;
  adresse: string;
  typeCuisine: string;
  image: string;
  fraisLivraison: number;
  horaires: string;
  isOpen: boolean;
}
export interface RestaurantPage {
  data: Restaurant[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);

  // null = pas de restaurant (ou pas encore chargé)
  myRestaurant = signal<Restaurant | null>(null);

  getAll(params: Record<string, string | number | boolean>) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== false && v !== null && v !== undefined) p = p.set(k, String(v));
    });
    return this.http.get<RestaurantPage>(`${API_URL}/restaurants`, { params: p });
  }

  create(data: Partial<Restaurant>) {
    return this.http
      .post<Restaurant>(`${API_URL}/restaurants`, data)
      .pipe(tap((r) => this.myRestaurant.set(r)));
  }

  getMine() {
    return this.http
      .get<Restaurant | null>(`${API_URL}/restaurants/mine`)
      .pipe(tap((r) => this.myRestaurant.set(r)));
  }
}