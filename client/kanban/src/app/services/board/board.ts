import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Board } from '../../models/board';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private readonly apiUrl = environment.APP_URL;
  private http = inject(HttpClient);

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.apiUrl}/board/all`, { withCredentials: true });
  }

  getBoardById(id: string): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}/board/${id}`, { withCredentials: true });
  }

  createBoard(board: Board): Observable<Board> {
    return this.http.post<Board>(`${this.apiUrl}/board/create`, board, { withCredentials: true });
  }

  updateBoard(id: string, title: string): Observable<Board> {
    return this.http.put<Board>(`${this.apiUrl}/board/update/${id}`, { title }, { withCredentials: true });
  }

  deleteBoard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/board/${id}`, { withCredentials: true });
  }
}
