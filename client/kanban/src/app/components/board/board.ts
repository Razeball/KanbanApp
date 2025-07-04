import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { List } from '../list/list';
import { Spinner } from '../spinner/spinner';
import { TitleInputModal } from '../title-input-modal/title-input-modal';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { CollaborationComponent } from '../collaboration/collaboration';
import { BoardService } from '../../services/board/board';
import { ListService } from '../../services/list/list';
import { SocketService } from '../../services/socket/socket';
import { Auth } from '../../services/authorization/auth';
import { Board as BoardModel } from '../../models/board';
import { List as ListModel } from '../../models/list';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-board',
  imports: [List, Spinner, TitleInputModal, ConfirmationModal, CollaborationComponent],
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class Board implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private listService = inject(ListService);
  private socketService = inject(SocketService);
  private authService = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  
  boardData: BoardModel | null = null;
  boardLists: ListModel[] = [];
  isLoading = false;
  error: string | null = null;
  boardId: string | null = null;
  isBoardMenuOpen = false;
  currentUser: any = null;
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
  private socketSubscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadCurrentUser();
    this.route.params.subscribe(params => {
      this.boardId = params['id'];
      if (this.boardId) {
        this.loadBoard();
      }
    });
    this.setupDocumentClickListener();
    this.setupStorageListener();
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    this.removeDocumentClickListener();
    this.removeStorageListener();
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    if (this.boardId && this.boardData?.isCollaborationEnabled) {
      if (this.isOwner) {
        this.socketService.emitCollaborationMessage(this.boardId, `${this.currentUser?.username || 'Board creator'} left the board`);
      }
      this.socketService.leaveBoard(this.boardId);
    }
  }

  private loadCurrentUser() {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  get isOwner(): boolean {
    return this.currentUser && this.boardData && this.currentUser.id === this.boardData.userId;
  }

  get canManageCollaboration(): boolean {
    return this.isOwner && this.authService.getCurrentAuthState();
  }

  get canParticipateInCollaboration(): boolean {
    return this.boardData?.isCollaborationEnabled || false;
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

  private setupStorageListener() {
    window.addEventListener('storagePreferenceChanged', () => {
      if (this.boardId) {
        setTimeout(() => {
          this.loadBoard();
        }, 1000); 
      }
    });
  }

  private removeStorageListener() {
  }

  private setupSocketListeners() {
    this.socketSubscriptions.push(
      this.socketService.listUpdates$.subscribe(event => {
        if (event.list) {
          const existingIndex = this.boardLists.findIndex(l => l.id === event.list.id);
          if (existingIndex >= 0) {
            this.boardLists[existingIndex] = event.list;
          } else {
            this.boardLists.push(event.list);
          }
          this.cdr.detectChanges();
        } else if (event.listId) {
          this.boardLists = this.boardLists.filter(l => l.id !== event.listId);
          this.cdr.detectChanges();
        }
      })
    );

    this.socketSubscriptions.push(
      this.socketService.cardUpdates$.subscribe(event => {
        if (event.card) {
          const list = this.boardLists.find(l => l.id === event.card.listId);
          if (list) {
            const existingIndex = list.Cards?.findIndex(c => c.id === event.card.id) ?? -1;
            if (existingIndex >= 0) {
              list.Cards![existingIndex] = event.card;
            } else {
              if (!list.Cards) list.Cards = [];
              list.Cards.push(event.card);
            }
            this.cdr.detectChanges();
          }
                } else if (event.cardId && event.fromListId && event.toListId) {
           
            const fromList = this.boardLists.find(l => l.id === event.fromListId);
            const toList = this.boardLists.find(l => l.id === event.toListId);
            
            if (fromList && toList && fromList.Cards) {
              const cardIndex = fromList.Cards.findIndex(c => c.id === event.cardId);
              if (cardIndex >= 0) {
                const card = { ...fromList.Cards[cardIndex] };
                fromList.Cards.splice(cardIndex, 1);
                
                if (!toList.Cards) toList.Cards = [];
                card.listId = event.toListId!;
                if (event.newOrder !== undefined) {
                  toList.Cards.splice(event.newOrder, 0, card);
                } else {
                  toList.Cards.push(card);
                }
              }
            }
            this.cdr.detectChanges();
        } else if (event.cardId) {
          this.boardLists.forEach(list => {
            if (list.Cards) {
              list.Cards = list.Cards.filter(c => c.id !== event.cardId);
            }
          });
          this.cdr.detectChanges();
        }
      })
    );

    this.socketSubscriptions.push(
      this.socketService.boardUpdates$.subscribe(event => {
        if (event.board && this.boardData) {
          this.boardData.title = event.board.title;
          this.cdr.detectChanges();
        }
      })
    );

    this.socketSubscriptions.push(
      this.socketService.collaborationMessages$.subscribe(message => {
        if (!this.isOwner) {
          this.showNotification(message);
        }
      })
    );
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
          if (board) {
            this.boardData = board;
            this.boardLists = board.Lists || [];
            this.isLoading = false;
            this.error = null;
            
            this.boardDataSubject.next(board);
            this.listsSubject.next(this.boardLists);
            
            setTimeout(() => {
              if (board.isCollaborationEnabled && board.shareCode) {
                this.socketService.joinBoard(this.boardId!, board.shareCode!, this.currentUser);
              } else {
                this.socketService.connect();
              }
            }, 200);
          } else {
            this.error = 'Board not found';
            this.isLoading = false;
          }
          
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
        if (this.boardData && updatedBoard) {
          this.boardData.title = updatedBoard.title;
          if (this.boardId) {
            this.socketService.emitBoardUpdate(this.boardId, this.boardData);
          }
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
        if (this.boardId) {
          this.socketService.emitListCreated(this.boardId, list);
        }
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
        this.router.navigate(['/boards']);
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
    this.router.navigate(['/boards']);
  }

  refreshBoard() {
    if (this.boardId) {
      this.loadBoard();
    }
  }

  trackByListId(index: number, list: ListModel): string {
    return list.id || index.toString();
  }

  onBoardUpdated(updatedBoard: any) {
    this.boardData = updatedBoard;
    this.boardLists = updatedBoard.Lists || [];
    this.cdr.detectChanges();
  }

  onCollaborationToggled(enabled: boolean) {
    if (this.boardData) {
      this.boardData.isCollaborationEnabled = enabled;
    }
  }

  exportBoard(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (!this.boardData) {
      alert('No board data to export');
      return;
    }
    
    const boardToExport = {
      ...this.boardData,
      Lists: this.boardLists
    };
    
    const markdownContent = this.convertBoardToMarkdown(boardToExport);
    const filename = `${this.boardData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}.md`;
    this.downloadMarkdownFile(markdownContent, filename);
    
    this.isBoardMenuOpen = false;
    this.cdr.detectChanges();
  }

  importBoard(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          this.parseMarkdownAndImportBoard(content);
        } catch (error) {
          alert('Error importing board: Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
    
    this.isBoardMenuOpen = false;
    this.cdr.detectChanges();
  }

  private convertBoardToMarkdown(board: any): string {
    let markdown = `# ${board.title}\n\n`;
    
    if (board.Lists && board.Lists.length > 0) {
      board.Lists.forEach((list: any, listIndex: number) => {
        markdown += `## ${list.title}\n\n`;
        
        if (list.Cards && list.Cards.length > 0) {
          list.Cards.forEach((card: any) => {
            markdown += `- **${card.title}**\n`;
            if (card.description) {
              const descriptionLines = card.description.split('\n');
              descriptionLines.forEach((line: string) => {
                markdown += `  ${line}\n`;
              });
            }
            markdown += '\n';
          });
        } else {
          markdown += '_No cards in this list_\n\n';
        }
        
        if (listIndex < board.Lists.length - 1) {
          markdown += '\n';
        }
      });
    } else {
      markdown += '_This board has no lists_\n\n';
    }
    
    markdown += `\n---\n\n*Exported from KanBan Board on ${new Date().toLocaleString()}*\n`;
    
    return markdown;
  }

  private parseMarkdownAndImportBoard(content: string) {
    const lines = content.split('\n');
    const boardTitle = lines[0].replace(/^# /, '').trim();
    
    if (!boardTitle || boardTitle === 'KanBan Board') {
      alert('No valid board title found in file');
      return;
    }
    
    const board = {
      title: boardTitle,
      Lists: [] as any[]
    };
    
    let currentList: any = null;
    let currentCard: any = null;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ') && !trimmedLine.includes('---')) {
        if (currentCard && currentList) {
          currentList.Cards.push(currentCard);
          currentCard = null;
        }
        if (currentList) {
          board.Lists.push(currentList);
        }
        
        const listTitle = trimmedLine.substring(3).trim();
        if (listTitle && listTitle !== '_This board has no lists_') {
          currentList = {
            title: listTitle,
            Cards: []
          };
        }
      } else if (trimmedLine.startsWith('- **') && trimmedLine.endsWith('**')) {
        if (currentCard && currentList) {
          currentList.Cards.push(currentCard);
        }
        
        const cardTitle = trimmedLine.substring(4, trimmedLine.length - 2).trim();
        if (cardTitle && currentList) {
          currentCard = {
            title: cardTitle,
            description: ''
          };
        }
      } else if (trimmedLine.startsWith('  ') && currentCard) {
        const descriptionLine = line.substring(2);
        if (currentCard.description) {
          currentCard.description += '\n' + descriptionLine;
        } else {
          currentCard.description = descriptionLine;
        }
      } else if (trimmedLine === '---' || trimmedLine.startsWith('*Exported from')) {
        break;
      }
    }
    
    if (currentCard && currentList) {
      currentList.Cards.push(currentCard);
    }
    if (currentList) {
      board.Lists.push(currentList);
    }
    
    if (board.Lists.length === 0) {
      alert('No valid lists found in the file');
      return;
    }
    
    this.boardService.createBoard(board).subscribe({
      next: (newBoard) => {
        alert(`Successfully imported board: ${board.title}`);
        this.router.navigate(['/boards']);
      },
      error: (error) => {
        console.error('Error importing board:', error);
        alert('Error importing board. Please try again.');
      }
    });
  }

  private downloadMarkdownFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private showNotification(message: string) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}
