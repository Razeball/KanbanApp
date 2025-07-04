import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../../services/board/board';
import { SocketService, Collaborator } from '../../services/socket/socket';
import { Auth } from '../../services/authorization/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-collaboration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collaboration.html',
  styleUrl: './collaboration.css'
})
export class CollaborationComponent implements OnInit, OnDestroy {
  @Input() boardId: string = '';
  @Input() boardData: any = null;
  @Output() boardUpdated = new EventEmitter<any>();
  @Output() collaborationToggled = new EventEmitter<boolean>();

  private boardService = inject(BoardService);
  private socketService = inject(SocketService);
  private authService = inject(Auth);

  isCollaborationEnabled = false;
  shareCode: string = '';
  collaborators: Collaborator[] = [];
  isLoading = false;
  error: string | null = null;
  showShareModal = false;
  currentUser: any = null;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadCurrentUser();
    this.initializeBoardData();
    this.setupSocketSubscriptions();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.boardId) {
      this.socketService.leaveBoard(this.boardId);
    }
  }

  private loadCurrentUser() {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      
      if (this.isCollaborationEnabled && this.boardId && this.shareCode) {
        setTimeout(() => {
          this.socketService.joinBoard(this.boardId, this.shareCode, this.currentUser);
        }, 100);
      }
    });
  }

  private initializeBoardData() {
    if (this.boardData) {
      this.isCollaborationEnabled = this.boardData.isCollaborationEnabled || false;
      this.shareCode = this.boardData.shareCode || '';
      
      if (this.isCollaborationEnabled && this.boardId) {
        setTimeout(() => {
          this.socketService.joinBoard(this.boardId, this.shareCode, this.currentUser);
        }, 100);
      }
    }
  }

  private setupSocketSubscriptions() {
    this.subscriptions.push(
      this.socketService.collaborators$.subscribe(collaborators => {
        this.collaborators = collaborators;
      })
    );

    this.subscriptions.push(
      this.socketService.errors$.subscribe(error => {
        this.error = error;
        setTimeout(() => this.error = null, 5000);
      })
    );

    this.subscriptions.push(
      this.socketService.connectionStatus$.subscribe(connected => {
        console.log('Socket connection status:', connected);
      })
    );

    this.subscriptions.push(
      this.socketService.boardUpdates$.subscribe(event => {
        if (event.board && this.boardData) {
          this.boardData.isCollaborationEnabled = event.board.isCollaborationEnabled;
          this.boardData.shareCode = event.board.shareCode;
          this.boardData.collaborators = event.board.collaborators;
          this.isCollaborationEnabled = event.board.isCollaborationEnabled || false;
          this.shareCode = event.board.shareCode || '';
          
          this.boardUpdated.emit(this.boardData);
        }
      })
    );
  }

  toggleCollaboration() {
    if (!this.boardId || !this.isUserAuthenticated()) {
      this.error = 'You must be logged in to enable collaboration';
      setTimeout(() => this.error = null, 5000);
      return;
    }

    this.isLoading = true;
    this.error = null;

    const action = this.isCollaborationEnabled ? 'disable' : 'enable';
    const endpoint = `${action}-collaboration`;

    this.boardService.toggleCollaboration(this.boardId, endpoint).subscribe({
      next: (response) => {
        const wasEnabled = this.isCollaborationEnabled;
        this.isCollaborationEnabled = !this.isCollaborationEnabled;
        this.shareCode = response.shareCode || '';
        
        if (this.isCollaborationEnabled && this.shareCode) {
          this.socketService.joinBoard(this.boardId, this.shareCode, this.currentUser);
          this.socketService.emitCollaborationMessage(this.boardId, `${this.currentUser?.username || 'Board creator'} enabled collaboration`);
        } else {
          if (wasEnabled) {
            this.socketService.emitCollaborationMessage(this.boardId, `${this.currentUser?.username || 'Board creator'} disabled collaboration`);
          }
          this.socketService.leaveBoard(this.boardId);
          this.collaborators = [];
        }
        
        this.collaborationToggled.emit(this.isCollaborationEnabled);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to toggle collaboration';
        this.isLoading = false;
      }
    });
  }

  generateNewShareCode() {
    if (!this.boardId) return;

    this.isLoading = true;
    this.error = null;

    this.boardService.generateNewShareCode(this.boardId).subscribe({
      next: (response) => {
        this.shareCode = response.shareCode;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to generate new share code';
        this.isLoading = false;
      }
    });
  }

  openShareModal() {
    this.showShareModal = true;
  }

  closeShareModal() {
    this.showShareModal = false;
  }



  copyShareCode() {
    navigator.clipboard.writeText(this.shareCode).then(() => {
      alert('Share code copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy share code');
    });
  }



  get collaboratorCount(): number {
    return this.collaborators.length;
  }

  get maxCollaborators(): number {
    return 3;
  }

  get canAddCollaborators(): boolean {
    return this.collaboratorCount < this.maxCollaborators;
  }

  getCollaboratorDisplayName(collaborator: Collaborator): string {
    if (!collaborator.isAuthenticated) {
      return 'Anonymous';
    }
    return collaborator.username;
  }

  getCollaboratorInitials(collaborator: Collaborator): string {
    if (!collaborator.isAuthenticated) {
      return 'A';
    }
    return collaborator.username.charAt(0).toUpperCase();
  }

  private isUserAuthenticated(): boolean {
    return this.currentUser && this.currentUser.username;
  }
} 