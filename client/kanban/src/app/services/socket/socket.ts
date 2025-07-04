import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Collaborator {
  id: string;
  username: string;
  isAuthenticated: boolean;
  joinedAt?: string;
}

export interface BoardEvent {
  boardId: string;
  board?: any;
  list?: any;
  card?: any;
  listId?: string;
  cardId?: string;
  fromListId?: string;
  toListId?: string;
  newOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = environment.APP_URL;
  
  private collaboratorsSubject = new BehaviorSubject<Collaborator[]>([]);
  private boardUpdatesSubject = new Subject<BoardEvent>();
  private listUpdatesSubject = new Subject<BoardEvent>();
  private cardUpdatesSubject = new Subject<BoardEvent>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<string>();
  private collaborationMessagesSubject = new Subject<string>();

  collaborators$ = this.collaboratorsSubject.asObservable();
  boardUpdates$ = this.boardUpdatesSubject.asObservable();
  listUpdates$ = this.listUpdatesSubject.asObservable();
  cardUpdates$ = this.cardUpdatesSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();
  errors$ = this.errorSubject.asObservable();
  collaborationMessages$ = this.collaborationMessagesSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connectionStatusSubject.next(false);
      this.collaboratorsSubject.next([]);
    });

    this.socket.on('join-success', (data: { boardId: string, collaborators: Collaborator[] }) => {
      console.log('Successfully joined board:', data.boardId);
      this.collaboratorsSubject.next(data.collaborators);
    });

    this.socket.on('join-error', (data: { message: string }) => {
      console.error('Join error:', data.message);
      this.errorSubject.next(data.message);
    });

    this.socket.on('user-joined', (data: { user: Collaborator, collaborators: Collaborator[] }) => {
      console.log('User joined:', data.user.username);
      this.collaboratorsSubject.next(data.collaborators);
    });

    this.socket.on('user-left', (data: { user: Collaborator, collaborators: Collaborator[] }) => {
      console.log('User left:', data.user.username);
      this.collaboratorsSubject.next(data.collaborators);
    });

    this.socket.on('board-updated', (data: { board: any }) => {
      this.boardUpdatesSubject.next({ boardId: '', board: data.board });
    });

    this.socket.on('list-created', (data: { list: any }) => {
      this.listUpdatesSubject.next({ boardId: '', list: data.list });
    });

    this.socket.on('list-updated', (data: { list: any }) => {
      this.listUpdatesSubject.next({ boardId: '', list: data.list });
    });

    this.socket.on('list-deleted', (data: { listId: string }) => {
      this.listUpdatesSubject.next({ boardId: '', listId: data.listId });
    });

    this.socket.on('card-created', (data: { card: any }) => {
      this.cardUpdatesSubject.next({ boardId: '', card: data.card });
    });

    this.socket.on('card-updated', (data: { card: any }) => {
      this.cardUpdatesSubject.next({ boardId: '', card: data.card });
    });

    this.socket.on('card-deleted', (data: { cardId: string }) => {
      this.cardUpdatesSubject.next({ boardId: '', cardId: data.cardId });
    });

    this.socket.on('card-moved', (data: { cardId: string, fromListId: string, toListId: string, newOrder: number }) => {
      this.cardUpdatesSubject.next({ 
        boardId: '', 
        cardId: data.cardId, 
        fromListId: data.fromListId, 
        toListId: data.toListId, 
        newOrder: data.newOrder 
      });
    });

    this.socket.on('collaboration-message', (data: { message: string }) => {
      this.collaborationMessagesSubject.next(data.message);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatusSubject.next(false);
      this.collaboratorsSubject.next([]);
    }
  }

  joinBoard(boardId: string, shareCode: string, user?: { username: string, id: string }): void {
    if (!this.socket?.connected) {
      this.connect();
    }

    setTimeout(() => {
      this.socket?.emit('join-board', { boardId, shareCode, user });
    }, 100);
  }

  leaveBoard(boardId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-board', { boardId });
    }
  }

  emitBoardUpdate(boardId: string, board: any): void {
    if (this.socket?.connected) {
      this.socket.emit('board-updated', { boardId, board });
    }
  }

  emitListCreated(boardId: string, list: any): void {
    if (this.socket?.connected) {
      this.socket.emit('list-created', { boardId, list });
    }
  }

  emitListUpdated(boardId: string, list: any): void {
    if (this.socket?.connected) {
      this.socket.emit('list-updated', { boardId, list });
    }
  }

  emitListDeleted(boardId: string, listId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('list-deleted', { boardId, listId });
    }
  }

  emitCardCreated(boardId: string, card: any): void {
    if (this.socket?.connected) {
      this.socket.emit('card-created', { boardId, card });
    }
  }

  emitCardUpdated(boardId: string, card: any): void {
    if (this.socket?.connected) {
      this.socket.emit('card-updated', { boardId, card });
    }
  }

  emitCardDeleted(boardId: string, cardId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('card-deleted', { boardId, cardId });
    }
  }

  emitCardMoved(boardId: string, cardId: string, fromListId: string, toListId: string, newOrder: number): void {
    if (this.socket?.connected) {
      this.socket.emit('card-moved', { boardId, cardId, fromListId, toListId, newOrder });
    }
  }

  emitCollaborationMessage(boardId: string, message: string): void {
    if (this.socket?.connected) {
      this.socket.emit('collaboration-message', { boardId, message });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCollaborators(): Collaborator[] {
    return this.collaboratorsSubject.value;
  }
} 