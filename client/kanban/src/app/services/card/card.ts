import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Card } from '../../models/card';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private http = inject(HttpClient);
  private apiUrl = environment.APP_URL;


  createCard(listId: string, title: string): Observable<Card> {
    return this.http.post<Card>(`${this.apiUrl}/card/create/${listId}`, 
      { title }, 
      { withCredentials: true }
    );
  }

 
  updateCard(cardId: string, title: string, description?: string): Observable<Card> {
    return this.http.put<Card>(`${this.apiUrl}/card/update/${cardId}`, 
      { title, description }, 
      { withCredentials: true }
    );
  }

 
  deleteCard(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/card/delete/${cardId}`, { 
      withCredentials: true 
    });
  }

  moveCard(cardId: string, listId: string, order: number) {
    return this.http.put<Card>(`${this.apiUrl}/card/move/${cardId}`, { listId, order }, { withCredentials: true });
  }
}
