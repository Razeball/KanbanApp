import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { List } from '../list/list';
import { Spinner } from '../spinner/spinner';
import { TitleInputModal } from '../title-input-modal/title-input-modal';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { BoardService } from '../../services/board/board';
import { ListService } from '../../services/list/list';
import { Board as BoardModel } from '../../models/board';
import { List as ListModel } from '../../models/list';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-board',
  imports: [List, Spinner, TitleInputModal, ConfirmationModal],
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


  isTitleModalOpen = false;
  titleModalLoading = false;
  titleModalType: 'board' | 'list' = 'board';
  
  isConfirmModalOpen = false;
  confirmModalLoading = false;
  confirmAction: 'delete-board' | null = null;
  
 
  boardDeleteFirstConfirm = false;

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

  openEditBoardTitleModal(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.titleModalType = 'board';
    this.isTitleModalOpen = true;
    this.isBoardMenuOpen = false;
    this.cdr.detectChanges();
  }

  openCreateListModal() {
    this.titleModalType = 'list';
    this.isTitleModalOpen = true;
    this.cdr.detectChanges();
  }

  onTitleModalClosed() {
    this.isTitleModalOpen = false;
    this.titleModalLoading = false;
    this.cdr.detectChanges();
  }

  onTitleSubmitted(title: string) {
    if (this.titleModalType === 'board') {
      this.updateBoardTitle(title);
    } else if (this.titleModalType === 'list') {
      this.createListWithTitle(title);
    }
  }

  private updateBoardTitle(title: string) {
    if (!this.boardData?.id) return;

    this.titleModalLoading = true;
    this.boardService.updateBoard(this.boardData.id, title).subscribe({
      next: (updatedBoard) => {
        if (this.boardData) {
          this.boardData.title = updatedBoard.title;
        }
        this.onTitleModalClosed();
      },
      error: (error) => {
        console.error('Error updating board:', error);
        alert('Failed to update board title. Please try again.');
        this.onTitleModalClosed();
      }
    });
  }

  private createListWithTitle(title: string) {
    if (!this.boardId) return;

    this.titleModalLoading = true;
    this.listService.createList(this.boardId, title).subscribe({
      next: (list) => {
        this.boardLists.push(list);
        this.onTitleModalClosed();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error creating list:', error);
        alert('Failed to create list. Please try again.');
        this.onTitleModalClosed();
      }
    });
  }

  openDeleteBoardModal(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    this.boardDeleteFirstConfirm = false;
    this.confirmAction = 'delete-board';
    this.isConfirmModalOpen = true;
    this.isBoardMenuOpen = false;
    this.cdr.detectChanges();
  }

  onConfirmModalClosed() {
    this.isConfirmModalOpen = false;
    this.confirmModalLoading = false;
    this.confirmAction = null;
    this.boardDeleteFirstConfirm = false;
    this.cdr.detectChanges();
  }

  onConfirmModalConfirmed() {
    if (this.confirmAction === 'delete-board') {
      this.handleBoardDeleteConfirmation();
    }
  }

  onConfirmModalCancelled() {
    this.onConfirmModalClosed();
  }

  private handleBoardDeleteConfirmation() {
    if (!this.boardData?.id || !this.boardData?.title) return;

    const listCount = this.boardLists.length;

  
    if (!this.boardDeleteFirstConfirm && listCount > 0) {
      this.boardDeleteFirstConfirm = true;
      this.cdr.detectChanges();
      return;
    }


    this.confirmModalLoading = true;
    this.boardService.deleteBoard(this.boardData.id).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error deleting board:', error);
        alert('Failed to delete board. Please try again.');
        this.onConfirmModalClosed();
      }
    });
  }


  get titleModalTitle(): string {
    if (this.titleModalType === 'board') {
      return 'Edit Board Title';
    }
    return 'Create New List';
  }

  get titleModalPlaceholder(): string {
    if (this.titleModalType === 'board') {
      return 'Enter board title...';
    }
    return 'Enter list title...';
  }

  get titleModalCurrentValue(): string {
    if (this.titleModalType === 'board') {
      return this.boardData?.title || '';
    }
    return '';
  }

  get confirmModalTitle(): string {
    if (this.confirmAction === 'delete-board') {
      return this.boardDeleteFirstConfirm ? 'Final Warning' : 'Delete Board';
    }
    return 'Confirm Action';
  }

  get confirmModalMessage(): string {
    if (this.confirmAction === 'delete-board') {
      const listCount = this.boardLists.length;
      
      if (!this.boardDeleteFirstConfirm) {
        return `Are you sure you want to delete "${this.boardData?.title}"?`;
      } else {
        const listWord = listCount === 1 ? 'list' : 'lists';
        return `⚠️ WARNING: This action cannot be undone!\n\nYou are about to delete a board with ${listCount} ${listWord} and all their cards. All content will be permanently lost.\n\nAre you absolutely sure you want to proceed?`;
      }
    }
    return 'Are you sure you want to proceed?';
  }

  get confirmModalIsWarning(): boolean {
    return this.confirmAction === 'delete-board' && this.boardDeleteFirstConfirm;
  }

  get confirmModalConfirmText(): string {
    if (this.confirmAction === 'delete-board') {
      return this.boardDeleteFirstConfirm ? 'Delete Permanently' : 'Continue';
    }
    return 'Confirm';
  }


  createList() {
    this.openCreateListModal();
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
