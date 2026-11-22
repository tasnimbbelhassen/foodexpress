import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../api';

export interface Dish {
  _id: string;
  nom: string;
  description: string;
  prix: number;
  image: string;
  disponible: boolean;
  categorie: string;
  restaurant: string;
}

// Résultat de GET /api/dishes : restaurant et catégorie sont "populés"
export interface DishSearchItem extends Omit<Dish, 'categorie' | 'restaurant'> {
  categorie: { _id: string; nom: string };
  restaurant: { _id: string; nom: string; typeCuisine: string; isOpen: boolean };
}
export interface DishPage {
  data: DishSearchItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DishForm {
  nom: string;
  description: string;
  prix: number | null;
  image: string;
  disponible: boolean;
  categorie: string;
}

@Injectable({ providedIn: 'root' })
export class DishService {
  private http = inject(HttpClient);

  search(params: Record<string, string | number | boolean>) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== false && v !== null && v !== undefined) p = p.set(k, String(v));
    });
    return this.http.get<DishPage>(`${API_URL}/dishes`, { params: p });
  }

  create(data: DishForm) {
    return this.http.post<Dish>(`${API_URL}/dishes`, data);
  }

  update(id: string, data: Partial<DishForm>) {
    return this.http.put<Dish>(`${API_URL}/dishes/${id}`, data);
  }

  setAvailability(id: string, disponible: boolean) {
    return this.http.patch<Dish>(`${API_URL}/dishes/${id}/disponibilite`, { disponible });
  }

  remove(id: string) {
    return this.http.delete<{ message: string }>(`${API_URL}/dishes/${id}`);
  }
}
