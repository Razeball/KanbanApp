import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BoardService } from '../../services/board/board';
import { Board as BoardModel } from '../../models/board';
import { BehaviorSubject } from 'rxjs';
import { Spinner } from '../spinner/spinner';
import { TitleInputModal } from '../title-input-modal/title-input-modal';

@Component({
  selector: 'app-board-overview',
  imports: [Spinner, TitleInputModal],
  templateUrl: './board-overview.html',
  styleUrl: './board-overview.css'
})
export class BoardOverview implements OnInit {
  private boardService = inject(BoardService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  boards: BoardModel[] = [];
  isLoading = false;
  error: string | null = null;


  isTitleModalOpen = false;
  titleModalLoading = false;

  private boardsSubject = new BehaviorSubject<BoardModel[]>([]);

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
          this.boardsSubject.next(boards);
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading boards:', error);
        setTimeout(() => {
          this.error = 'Failed to load boards. Please try again.';
          this.isLoading = false;
          this.boards = [];
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  openCreateBoardModal() {
    this.isTitleModalOpen = true;
    this.cdr.detectChanges();
  }

  onTitleModalClosed() {
    this.isTitleModalOpen = false;
    this.titleModalLoading = false;
    this.cdr.detectChanges();
  }

  onTitleSubmitted(title: string) {
    this.createBoardWithTitle(title);
  }

  private createBoardWithTitle(title: string) {
    this.titleModalLoading = true;
    
    const newBoard: BoardModel = { title };
    
    this.boardService.createBoard(newBoard).subscribe({
      next: (response: any) => {
    
        const createdBoard = response.newBoard || response;
        this.boards.unshift(createdBoard);
        this.onTitleModalClosed();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error creating board:', error);
        alert('Failed to create board. Please try again.');
        this.onTitleModalClosed();
      }
    });
  }

  navigateToBoard(boardId: string) {
    this.router.navigate(['/board', boardId]);
  }

  getGradientClass(index: number): string {
    const gradients = [
      'from-blue-500 to-blue-700',
      'from-green-500 to-green-700',
      'from-purple-500 to-purple-700',
      'from-red-500 to-red-700',
      'from-yellow-500 to-yellow-700',
      'from-indigo-500 to-indigo-700',
      'from-pink-500 to-pink-700',
      'from-teal-500 to-teal-700'
    ];
    return gradients[index % gradients.length];
  }


  createBoard() {
    this.openCreateBoardModal();
  }

  trackByBoardId(index: number, board: BoardModel): string {
    return board.id || index.toString();
  }
} 