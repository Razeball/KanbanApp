import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { List } from '../list/list';
import { BoardService } from '../../services/board/board';
import { ListService } from '../../services/list/list';
import { Board as BoardModel } from '../../models/board';
import { List as ListModel } from '../../models/list';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-board',
  imports: [List],
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class Board implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private listService = inject(ListService);
  private cdr = inject(ChangeDetectorRef);
  
  boardData: BoardModel | null = null;
  boardLists: ListModel[] = [];
  isLoading = false;
  error: string | null = null;
  boardId: string | null = null;
  isBoardMenuOpen = false;
  private documentClickListener?: (event: Event) => void;

  private boardDataSubject = new BehaviorSubject<BoardModel | null>(null);
  private listsSubject = new BehaviorSubject<ListModel[]>([]);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.boardId = params['id'];
      if (this.boardId) {
        this.loadBoard();
      }
    });
    this.setupDocumentClickListener();
  }

  ngOnDestroy() {
    this.removeDocumentClickListener();
  }

  private setupDocumentClickListener() {
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (this.isBoardMenuOpen && !target.closest('.board-menu-container')) {
        this.isBoardMenuOpen = false;
        this.cdr.detectChanges();
      }
    };
    
    document.addEventListener('click', this.documentClickListener, true);
  }

  private removeDocumentClickListener() {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener, true);
      this.documentClickListener = undefined;
    }
  }

  loadBoard() {
    if (!this.boardId) return;
    
    this.isLoading = true;
    this.error = null;
    this.boardData = null;
    this.boardLists = [];
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
    
    this.boardService.getBoardById(this.boardId).subscribe({
      next: (board) => {
        setTimeout(() => {
          this.boardData = board;
          this.boardLists = board.Lists || [];
          this.isLoading = false;
          this.error = null;
          
          this.boardDataSubject.next(board);
          this.listsSubject.next(this.boardLists);
          
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading board:', error);
        setTimeout(() => {
          this.error = 'Failed to load board. Please try again.';
          this.isLoading = false;
          this.boardData = null;
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  toggleBoardMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isBoardMenuOpen = !this.isBoardMenuOpen;
    this.cdr.detectChanges();
  }

  editBoardTitle(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (!this.boardData?.id || !this.boardData?.title) return;

    const newTitle = prompt('Enter new board title:', this.boardData.title);
    if (newTitle && newTitle.trim() && newTitle !== this.boardData.title) {
      this.boardService.updateBoard(this.boardData.id, newTitle.trim()).subscribe({
        next: (updatedBoard) => {
          if (this.boardData) {
            this.boardData.title = updatedBoard.title;
          }
          this.isBoardMenuOpen = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating board:', error);
          alert('Failed to update board title. Please try again.');
          this.isBoardMenuOpen = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.isBoardMenuOpen = false;
      this.cdr.detectChanges();
    }
  }

  deleteBoard(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (!this.boardData?.id || !this.boardData?.title) return;

    const listCount = this.boardLists.length;
    

    const firstWarning = listCount === 0 
      ? `Are you sure you want to delete "${this.boardData.title}"?`
      : `Are you sure you want to delete "${this.boardData.title}"?`;
    
    const firstConfirm = confirm(firstWarning);
    if (!firstConfirm) {
      this.isBoardMenuOpen = false;
      this.cdr.detectChanges();
      return;
    }


    if (listCount > 0) {
      const listWord = listCount === 1 ? 'list' : 'lists';
      const secondWarning = `⚠️ WARNING: This action cannot be undone!\n\nYou are about to delete a board with ${listCount} ${listWord} and all their cards. All content will be permanently lost.\n\nAre you absolutely sure you want to proceed?`;
      
      const secondConfirm = confirm(secondWarning);
      if (!secondConfirm) {
        this.isBoardMenuOpen = false;
        this.cdr.detectChanges();
        return;
      }
    }


    this.boardService.deleteBoard(this.boardData.id).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error deleting board:', error);
        alert('Failed to delete board. Please try again.');
        this.isBoardMenuOpen = false;
        this.cdr.detectChanges();
      }
    });
  }

  createList() {
    const title = prompt('Enter list title:');
    if (title && this.boardId) {
      this.listService.createList(this.boardId, title).subscribe({
        next: (list) => {
          this.boardLists.push(list);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creating list:', error);
          alert('Failed to create list. Please try again.');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  refreshBoard() {
    if (this.boardId) {
      this.loadBoard();
    }
  }

  trackByListId(index: number, list: ListModel): string {
    return list.id || index.toString();
  }
}
