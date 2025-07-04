import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Board } from '../../models/board';
import { Observable, of, catchError, map, BehaviorSubject } from 'rxjs';
import { Auth } from '../authorization/auth';
import { LocalStorageService } from '../local-storage/local-storage';
import { NotificationService } from '../notification/notification';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private readonly apiUrl = environment.APP_URL;
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private localStorageService = inject(LocalStorageService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  private boardsSubject = new BehaviorSubject<Board[]>([]);
  public boards$ = this.boardsSubject.asObservable();

  constructor() {
    this.auth.authState$.subscribe(isAuthenticated => {
      setTimeout(() => {
        this.loadBoards();
      }, 100);
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'serverStorageEnabled') {
        setTimeout(() => {
          this.loadBoards();
        }, 100);
      }
    });

    window.addEventListener('storagePreferenceChanged', () => {
      setTimeout(() => {
        this.loadBoards();
      }, 100);
    });
  }

  private loadBoards(): void {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      
      this.http.get<Board[]>(`${this.apiUrl}/board/all`, { withCredentials: true })
        .pipe(
          catchError(error => {
            console.error('Error loading boards from server:', error);
            return of([]);
          })
        )
        .subscribe(boards => {
          this.boardsSubject.next(boards);
        });
    } else {
      const boards = this.localStorageService.getBoards();
      this.boardsSubject.next(boards);
    }
  }

  getBoards(): Observable<Board[]> {
    return this.boards$;
  }

  getBoardById(id: string): Observable<Board | null> {
    const isAuthenticated = this.auth.getCurrentAuthState();
    const serverStorageEnabled = localStorage.getItem('serverStorageEnabled');
    const useServer = isAuthenticated && serverStorageEnabled !== 'false';
    
    
    const requestOptions = isAuthenticated ? { withCredentials: true } : {};
    
    return this.http.get<Board>(`${this.apiUrl}/board/${id}`, requestOptions)
      .pipe(
        catchError(error => {
          console.error(`Error fetching board ${id} from server:`, error);
          
          
          if (useServer) {
            const localBoard = this.localStorageService.getBoard(id);
            return of(localBoard);
          }
          
         
          return of(null);
        })
      );
  }

  createBoard(board: Board): Observable<Board> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      const hasLists = board.Lists && board.Lists.length > 0;
      const endpoint = hasLists ? 'create-complete' : 'create';
      
      return this.http.post<Board>(`${this.apiUrl}/board/${endpoint}`, board, { withCredentials: true })
        .pipe(
          map(newBoard => {
            this.loadBoards(); 
            return newBoard;
          }),
          catchError(error => {
            console.error('Error creating board on server:', error);
            throw error;
          })
        );
    } else {
      const newBoard: Board = {
        id: this.generateId(),
        title: board.title,
        Lists: board.Lists || []
      };
      
      this.localStorageService.addBoard(newBoard);
      const boards = this.localStorageService.getBoards();
      this.boardsSubject.next(boards);
      
      this.showLoginReminderIfNeeded();
      return of(newBoard);
    }
  }

  updateBoard(id: string, title: string): Observable<Board | null> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.put<Board>(`${this.apiUrl}/board/update/${id}`, { title }, { withCredentials: true })
        .pipe(
          map(updatedBoard => {
            this.loadBoards(); 
            return updatedBoard;
          }),
          catchError(error => {
            console.error('Error updating board on server:', error);
            return of(null);
          })
        );
    } else {
      this.localStorageService.updateBoard(id, { title });
      const boards = this.localStorageService.getBoards();
      this.boardsSubject.next(boards);
      const updatedBoard = boards.find(board => board.id === id) || null;
      return of(updatedBoard);
    }
  }

  deleteBoard(id: string): Observable<boolean> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.delete<void>(`${this.apiUrl}/board/${id}`, { withCredentials: true })
        .pipe(
          map(() => {
            this.loadBoards(); 
            return true;
          }),
          catchError(error => {
            console.error('Error deleting board on server:', error);
            return of(false);
          })
        );
    } else {
      this.localStorageService.deleteBoard(id);
      const boards = this.localStorageService.getBoards();
      this.boardsSubject.next(boards);
      return of(true);
    }
  }

  private generateId(): string {
    return 'board_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  
  migrateLocalBoardsToServer(): Observable<boolean> {
    if (!this.auth.getCurrentAuthState()) {
      return of(false);
    }

    const localBoards = this.localStorageService.getBoards();
    if (localBoards.length === 0) {
      return of(true);
    }

    
    const migrations = localBoards.map(board => 
      this.http.post<Board>(`${this.apiUrl}/board/create`, {
        title: board.title
      }, { withCredentials: true })
    );

    
    return new Observable<boolean>(observer => {
      let completed = 0;
      let hasError = false;

      if (migrations.length === 0) {
        observer.next(true);
        observer.complete();
        return;
      }

      migrations.forEach(migration => {
        migration.subscribe({
          next: () => {
            completed++;
            if (completed === migrations.length && !hasError) {
              this.localStorageService.saveBoards([]);
              this.loadBoards(); 
              observer.next(true);
              observer.complete();
            }
          },
          error: (error) => {
            console.error('Error migrating board:', error);
            hasError = true;
            observer.next(false);
            observer.complete();
          }
        });
      });
    });
  }

  private showLoginReminderIfNeeded() {
    const boardsCount = this.localStorageService.getBoards().length;
    const documentsCount = this.localStorageService.getDocuments().length;
    const totalItems = boardsCount + documentsCount;
    
    if (totalItems >= 3) {
      setTimeout(() => {
        this.notificationService.showLoginReminder(this.router);
      }, 1000);
    }
  }

  toggleCollaboration(boardId: string, endpoint: string): Observable<any> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    
    if (!useServer) {
      return of({ 
        message: 'Collaboration is only available when using server storage',
        shareCode: null 
      });
    }
    
    return this.http.post<any>(`${this.apiUrl}/board/${endpoint}/${boardId}`, {}, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error toggling collaboration:', error);
          throw error;
        })
      );
  }

  generateNewShareCode(boardId: string): Observable<any> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    
    if (!useServer) {
      return of({ 
        message: 'Share codes are only available when using server storage',
        shareCode: null 
      });
    }
    
    return this.http.post<any>(`${this.apiUrl}/board/generate-code/${boardId}`, {}, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error generating new share code:', error);
          throw error;
        })
      );
  }

  joinBoard(shareCode: string): Observable<any> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    
    if (!useServer) {
      return of({ 
        message: 'Joining boards is only available when using server storage',
        success: false 
      });
    }
    
    return this.http.post<any>(`${this.apiUrl}/board/join`, { shareCode }, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error joining board:', error);
          throw error;
        })
      );
  }

  getBoardByShareCode(shareCode: string): Observable<Board | null> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    
    if (!useServer) {
      return of(null);
    }
    
    return this.http.get<Board>(`${this.apiUrl}/board/share/${shareCode}`)
      .pipe(
        catchError(error => {
          console.error('Error getting board by share code:', error);
          return of(null);
        })
      );
  }
}
