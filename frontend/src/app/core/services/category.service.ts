import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api';

export interface Category {
  _id: string;
  nom: string;
  description: string;
  restaurant: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getByRestaurant(restaurantId: string) {
    return this.http.get<Category[]>(`${API_URL}/categories`, { params: { restaurant: restaurantId } });
  }

  // Le restaurant est déduit du compte connecté côté serveur
  create(data: { nom: string; description?: string }) {
    return this.http.post<Category>(`${API_URL}/categories`, data);
  }

  update(id: string, data: { nom: string; description?: string }) {
    return this.http.put<Category>(`${API_URL}/categories/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<{ message: string }>(`${API_URL}/categories/${id}`);
  }
}
