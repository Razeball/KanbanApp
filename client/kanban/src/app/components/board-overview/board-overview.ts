import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../../services/board/board';
import { SocketService } from '../../services/socket/socket';
import { Auth } from '../../services/authorization/auth';
import { Board as BoardModel } from '../../models/board';
import { BehaviorSubject } from 'rxjs';
import { Spinner } from '../spinner/spinner';
import { TitleInputModal } from '../title-input-modal/title-input-modal';

@Component({
  selector: 'app-board-overview',
  imports: [Spinner, TitleInputModal, FormsModule],
  templateUrl: './board-overview.html',
  styleUrl: './board-overview.css'
})
export class BoardOverview implements OnInit {
  private boardService = inject(BoardService);
  private socketService = inject(SocketService);
  private authService = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  boards: BoardModel[] = [];
  isLoading = false;
  error: string | null = null;

  isTitleModalOpen = false;
  titleModalLoading = false;
  
  showJoinModal = false;
  joinShareCode = '';
  joinError: string | null = null;
  isJoining = false;
  currentUser: any = null;
  
  showCreateOrImportModal = false;

  private boardsSubject = new BehaviorSubject<BoardModel[]>([]);

  ngOnInit() {
    this.loadCurrentUser();
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

  private loadCurrentUser() {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  openJoinModal() {
    this.showJoinModal = true;
    this.joinShareCode = '';
    this.joinError = null;
  }

  closeJoinModal() {
    this.showJoinModal = false;
    this.joinShareCode = '';
    this.joinError = null;
  }

  joinBoard() {
    if (!this.joinShareCode.trim()) {
      this.joinError = 'Please enter a share code';
      return;
    }

    this.isJoining = true;
    this.joinError = null;

    this.boardService.joinBoard(this.joinShareCode.trim().toUpperCase()).subscribe({
      next: (response) => {
        this.closeJoinModal();
        this.isJoining = false;
        
        if (response.board) {
          this.socketService.joinBoard(response.board.id, this.joinShareCode.trim().toUpperCase(), this.currentUser);
          this.router.navigate(['/board', response.board.id]);
        }
      },
      error: (error) => {
        this.joinError = error.error?.message || 'Failed to join board';
        this.isJoining = false;
      }
    });
  }

  openCreateOrImportModal() {
    this.showCreateOrImportModal = true;
  }

  closeCreateOrImportModal() {
    this.showCreateOrImportModal = false;
  }

  selectCreateBoard() {
    this.closeCreateOrImportModal();
    this.openCreateBoardModal();
  }

  selectImportBoard() {
    this.closeCreateOrImportModal();
    this.importBoard();
  }

  importBoard() {
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
      alert('No valid lists found in the file. Creating board with title only.');
    }
    
    this.boardService.createBoard(board).subscribe({
      next: (response: any) => {
        const createdBoard = response.newBoard || response;
        this.boards.unshift(createdBoard);
        this.cdr.detectChanges();
        alert(`Successfully imported board: ${board.title}`);
      },
      error: (error) => {
        console.error('Error importing board:', error);
        alert('Error importing board. Please try again.');
      }
    });
  }
} 