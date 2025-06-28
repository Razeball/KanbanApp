import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Board } from '../../models/board';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private readonly apiUrl = environment.APP_URL;
  private http = inject(HttpClient);

  getBoards() {
    return this.http.get<Board[]>(`${this.apiUrl}/boards`);
  }

  getBoardById(id: string) {
    return this.http.get<Board>(`${this.apiUrl}/boards/${id}`);
  }

  createBoard(board: Board) {
    return this.http.post<Board>(`${this.apiUrl}/boards`, board);
  }
}
