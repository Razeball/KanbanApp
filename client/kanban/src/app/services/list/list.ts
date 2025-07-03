import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { List } from '../../models/list';
import { Auth } from '../authorization/auth';
import { LocalStorageService } from '../local-storage/local-storage';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private localStorageService = inject(LocalStorageService);
  private apiUrl = environment.APP_URL;

  constructor() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'serverStorageEnabled') {
        console.log('Storage preference changed, list service will adapt');
      }
    });
    
    setTimeout(() => {
    }, 100);
  }

  createList(boardId: string, title: string): Observable<List> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.post<List>(`${this.apiUrl}/list/create/${boardId}`, 
        { title }, 
        { withCredentials: true }
      ).pipe(
        catchError(error => {
          console.error('Error creating list on server:', error);
          throw error;
        })
      );
    } else {
      const newList = this.localStorageService.createListInBoard(boardId, title);
      return of(newList);
    }
  }

  updateList(listId: string, title: string): Observable<List | null> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.put<List>(`${this.apiUrl}/list/update/${listId}`, 
        { title }, 
        { withCredentials: true }
      ).pipe(
        catchError(error => {
          console.error('Error updating list on server:', error);
          return of(null);
        })
      );
    } else {
      const boards = this.localStorageService.getBoards();
      let updatedList = null;
      
      for (let board of boards) {
        if (board.Lists) {
          const listIndex = board.Lists.findIndex(list => list.id === listId);
          if (listIndex !== -1) {
            board.Lists[listIndex].title = title;
            updatedList = board.Lists[listIndex];
            break;
          }
        }
      }
      
      if (updatedList) {
        this.localStorageService.saveBoards(boards);
      }
      
      return of(updatedList);
    }
  }
 //A lot of check so it not get duplicated
  deleteList(listId: string): Observable<boolean> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.delete<void>(`${this.apiUrl}/list/delete/${listId}`, { 
        withCredentials: true 
      }).pipe(
        map(() => true),
        catchError(error => {
          console.error('Error deleting list on server:', error);
          return of(false);
        })
      );
    } else {
      const boards = this.localStorageService.getBoards();
      let deleted = false;
      
      for (let board of boards) {
        if (board.Lists) {
          const listIndex = board.Lists.findIndex(list => list.id === listId);
          if (listIndex !== -1) {
            board.Lists.splice(listIndex, 1);
            deleted = true;
            break;
          }
        }
      }
      
      if (deleted) {
        this.localStorageService.saveBoards(boards);
      }
      
      return of(deleted);
    }
  }
}
