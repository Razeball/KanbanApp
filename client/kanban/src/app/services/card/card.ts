import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Card } from '../../models/card';
import { Observable, of, catchError, map } from 'rxjs';
import { Auth } from '../authorization/auth';
import { LocalStorageService } from '../local-storage/local-storage';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private localStorageService = inject(LocalStorageService);
  private apiUrl = environment.APP_URL;

  constructor() {
    setTimeout(() => {
    }, 100);
  }

  createCard(listId: string, title: string): Observable<Card> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.post<Card>(`${this.apiUrl}/card/create/${listId}`, 
        { title }, 
        { withCredentials: true }
      ).pipe(
        catchError(error => {
          console.error('Error creating card on server:', error);
          throw error;
        })
      );
    } else {
      const newCard = this.localStorageService.createCardInList(listId, title);
      return of(newCard);
    }
  }

  updateCard(cardId: string, title: string, description?: string): Observable<Card | null> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.put<Card>(`${this.apiUrl}/card/update/${cardId}`, 
        { title, description }, 
        { withCredentials: true }
      ).pipe(
        catchError(error => {
          console.error('Error updating card on server:', error);
          return of(null);
        })
      );
    } else {
      const updatedCard = this.localStorageService.updateCardInList(cardId, { title, description });
      return of(updatedCard);
    }
  }

  deleteCard(cardId: string): Observable<boolean> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.delete<void>(`${this.apiUrl}/card/delete/${cardId}`, { 
        withCredentials: true 
      }).pipe(
        map(() => true),
        catchError(error => {
          console.error('Error deleting card on server:', error);
          return of(false);
        })
      );
    } else {
      const deleted = this.localStorageService.deleteCardFromList(cardId);
      return of(deleted);
    }
  }

  moveCard(cardId: string, newListId: string, newOrder: number): Observable<boolean> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.put<any>(`${this.apiUrl}/card/move/${cardId}`, 
        { newListId, newOrder }, 
        { withCredentials: true }
      ).pipe(
        map(() => true),
        catchError(error => {
          console.error('Error moving card on server:', error);
          return of(false);
        })
      );
    } else {
      const moved = this.localStorageService.moveCardBetweenLists(cardId, newListId, newOrder);
      return of(moved);
    }
  }
}
