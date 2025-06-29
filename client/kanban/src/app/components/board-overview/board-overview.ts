import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Board } from '../../models/board';
import { BoardService } from '../../services/board/board';

@Component({
  selector: 'app-board-overview',
  imports: [CommonModule],
  templateUrl: './board-overview.html',
  styleUrl: './board-overview.css'
})
export class BoardOverview implements OnInit {
  private boardService = inject(BoardService);
  private router = inject(Router);
  
  boards: Board[] = [];
  isLoading = false;

  ngOnInit() {
    this.loadBoards();
  }

  loadBoards() {
    this.isLoading = true;
    this.boardService.getBoards().subscribe({
      next: (boards) => {
        this.boards = boards;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading boards:', error);
        this.isLoading = false;
      }
    });
  }

  createNewBoard() {
    const title = prompt('Enter board title:');
    if (title) {
      const newBoard: Board = {
        title: title,
        userId: '' 
      };
      
      this.boardService.createBoard(newBoard).subscribe({
        next: (board) => {
          this.boards.push(board);
        },
        error: (error) => {
          console.error('Error creating board:', error);
        }
      });
    }
  }

  openBoard(boardId: string) {
    this.router.navigate(['/board', boardId]);
  }
} 