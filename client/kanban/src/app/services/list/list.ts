import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { List } from '../../models/list';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  private http = inject(HttpClient);
  private apiUrl = environment.APP_URL;

  
  createList(boardId: string, title: string): Observable<List> {
    return this.http.post<List>(`${this.apiUrl}/list/create/${boardId}`, 
      { title }, 
      { withCredentials: true }
    );
  }


  updateList(listId: string, title: string): Observable<List> {
    return this.http.put<List>(`${this.apiUrl}/list/update/${listId}`, 
      { title }, 
      { withCredentials: true }
    );
  }


  deleteList(listId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/list/delete/${listId}`, { 
      withCredentials: true 
    });
  }
}
