import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { List } from '../../models/list';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  constructor(private http: HttpClient) { }
  private apiUrl = environment.APP_URL;

  createList(list: List) {
    return this.http.post<List>(`${this.apiUrl}/list/create`, list, { withCredentials: true });
  }

  updateList(listId: string, title: string) {
    return this.http.put<List>(`${this.apiUrl}/list/${listId}`, { title }, { withCredentials: true });
  }

  deleteList(id: string) {
    return this.http.delete(`${this.apiUrl}/list/${id}`, { withCredentials: true });
  }
}
