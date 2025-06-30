import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Board } from '../../models/board';
import { BoardService } from '../../services/board/board';

@Component({
  selector: 'app-board-overview',
  imports: [],
  templateUrl: './board-overview.html',
  styleUrl: './board-overview.css'
})
export class BoardOverview implements OnInit {
  private boardService = inject(BoardService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  boards: Board[] = [];
  isLoading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadBoards();
  }

  loadBoards() {
    this.isLoading = true;
    this.error = null;
    this.boards = [];
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
    
    this.boardService.getBoards().subscribe({
      next: (boards) => {
        setTimeout(() => {
          this.boards = boards;
          this.isLoading = false;
          this.error = null;
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading boards:', error);
        setTimeout(() => {
          this.error = 'Failed to load boards. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }, 0);
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
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creating board:', error);
          alert('Failed to create board. Please try again.');
        }
      });
    }
  }

  openBoard(boardId: string) {
    this.router.navigate(['/board', boardId]);
  }

  retryLoadBoards() {
    this.loadBoards();
  }
} 