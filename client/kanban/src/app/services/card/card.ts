import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Card } from '../../models/card';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  constructor(private http: HttpClient) { }
  private apiUrl = environment.APP_URL;

  createCard(card: Card) {
    return this.http.post<Card>(`${this.apiUrl}/card/create`, card, { withCredentials: true });
  }

  updateCard(cardId: string, title: string, description: string) {
    return this.http.put<Card>(`${this.apiUrl}/card/${cardId}`, { title, description }, { withCredentials: true });
  }

  moveCard(cardId: string, listId: string, order: number) {
    return this.http.put<Card>(`${this.apiUrl}/card/${cardId}/move`, { listId, order }, { withCredentials: true });
  }

  deleteCard(id: string) {
    return this.http.delete(`${this.apiUrl}/card/${id}`, { withCredentials: true });
  }
}
