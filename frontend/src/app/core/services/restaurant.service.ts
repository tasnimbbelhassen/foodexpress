import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from '../api';
import { Category } from './category.service';
import { Dish } from './dish.service';

// Structure d'un restaurant
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

// Structure des résultats paginés
export interface RestaurantPage {
  data: Restaurant[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Catégorie du menu avec ses plats
export interface MenuCategory extends Category {
  dishes: Dish[];
}

// Structure du menu d'un restaurant
export interface Menu {
  restaurant: Restaurant;
  categories: MenuCategory[];
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);

  // Restaurant du restaurateur connecté
  myRestaurant = signal<Restaurant | null>(null);

  // Récupération de la liste des restaurants avec filtres et pagination
  getAll(params: Record<string, string | number | boolean>) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== false && v !== null && v !== undefined) p = p.set(k, String(v));
    });
    return this.http.get<RestaurantPage>(`${API_URL}/restaurants`, { params: p });
  }

  // Création d'un restaurant et mise à jour du signal
  create(data: Partial<Restaurant>) {
    return this.http
      .post<Restaurant>(`${API_URL}/restaurants`, data)
      .pipe(tap((r) => this.myRestaurant.set(r)));
  }

  // Récupération du restaurant du restaurateur connecté
  getMine() {
    return this.http
      .get<Restaurant | null>(`${API_URL}/restaurants/mine`)
      .pipe(tap((r) => this.myRestaurant.set(r)));
  }

  // Récupération d'un restaurant par son identifiant
  getById(id: string) {
    return this.http.get<Restaurant>(`${API_URL}/restaurants/${id}`);
  }

  // Récupération du menu public : restaurant, catégories et plats
  getMenu(id: string) {
    return this.http.get<Menu>(`${API_URL}/restaurants/${id}/menu`);
  }

  // Modification d'un restaurant et actualisation du signal s'il s'agit du sien
  update(id: string, data: Partial<Restaurant>) {
    return this.http.put<Restaurant>(`${API_URL}/restaurants/${id}`, data).pipe(
      tap((r) => {
        if (this.myRestaurant()?._id === r._id) this.myRestaurant.set(r);
      })
    );
  }
}