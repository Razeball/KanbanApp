import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { List } from '../list/list';
import { BoardService } from '../../services/board/board';
import { Board as BoardModel } from '../../models/board';

@Component({
  selector: 'app-board',
  imports: [List, CommonModule],
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class Board implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  
  boardData: BoardModel | null = null;
  isLoading = false;
  boardId: string | null = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.boardId = params['id'];
      if (this.boardId) {
        this.loadBoard();
      }
    });
  }

  loadBoard() {
    if (!this.boardId) return;
    
    this.isLoading = true;
    this.boardService.getBoardById(this.boardId).subscribe({
      next: (board) => {
        this.boardData = board;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading board:', error);
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
