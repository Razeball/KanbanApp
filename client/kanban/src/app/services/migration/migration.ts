import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DocumentService } from '../document/document';
import { BoardService } from '../board/board';
import { Auth } from '../authorization/auth';
import { LocalStorageService } from '../local-storage/local-storage';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Document } from '../../models/document';
import { Board } from '../../models/board';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  private readonly apiUrl = environment.APP_URL;
  private documentService = inject(DocumentService);
  private boardService = inject(BoardService);
  private localStorageService = inject(LocalStorageService);
  private auth = inject(Auth);
  private http = inject(HttpClient);

  migrateAllLocalDataToServer(): Observable<{ documentsSuccess: boolean; boardsSuccess: boolean }> {
    if (!this.auth.getCurrentAuthState()) {
      return of({ documentsSuccess: false, boardsSuccess: false });
    }

    return forkJoin({
      documentsSuccess: this.migrateLocalDocumentsToServer(),
      boardsSuccess: this.migrateLocalBoardsToServer()
    }).pipe(
      map(result => {
        if (result.documentsSuccess && result.boardsSuccess) {
          console.log('All local data successfully migrated to server');
        } else {
          console.warn('Some local data failed to migrate:', result);
        }
        return result;
      }),
      catchError(error => {
        console.error('Error during migration:', error);
        return of({ documentsSuccess: false, boardsSuccess: false });
      })
    );
  }

  migrateServerDataToLocal(): Observable<{ documentsSuccess: boolean; boardsSuccess: boolean }> {
    if (!this.auth.getCurrentAuthState()) {
      return of({ documentsSuccess: false, boardsSuccess: false });
    }

    return forkJoin({
      documentsSuccess: this.migrateServerDocumentsToLocal(),
      boardsSuccess: this.migrateServerBoardsToLocal()
    }).pipe(
      map(result => {
        if (result.documentsSuccess && result.boardsSuccess) {
          console.log('All server data successfully migrated to local storage');
        } else {
          console.warn('Some server data failed to migrate:', result);
        }
        return result;
      }),
      catchError(error => {
        console.error('Error during server to local migration:', error);
        return of({ documentsSuccess: false, boardsSuccess: false });
      })
    );
  }

  private migrateLocalDocumentsToServer(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      setTimeout(() => {
        this.performDocumentMigration().subscribe(observer);
      }, 200); 
    });
  }

  private performDocumentMigration(): Observable<boolean> {
    const localDocuments = this.localStorageService.getDocuments();
    const trulyLocalDocuments = localDocuments.filter(doc => doc.id?.startsWith('doc_'));
    const serverDocumentsModifiedLocally = localDocuments.filter(doc => !doc.id?.startsWith('doc_') && doc.id);
    
    if (trulyLocalDocuments.length === 0 && serverDocumentsModifiedLocally.length === 0) {
      return of(true);
    }

    return this.http.get<Document[]>(`${this.apiUrl}/document`, { withCredentials: true }).pipe(
      switchMap(serverDocuments => {
        const serverDocIds = serverDocuments.map(doc => doc.id);
        
        const newDocuments = trulyLocalDocuments.filter(doc => !serverDocIds.includes(doc.id));
        const existingLocalDocuments = trulyLocalDocuments.filter(doc => serverDocIds.includes(doc.id));
        const existingServerDocuments = serverDocumentsModifiedLocally.filter(doc => serverDocIds.includes(doc.id));
        
        const migrations: Observable<any>[] = [];
        
        newDocuments.forEach(doc => {
          migrations.push(
            this.http.post<Document>(`${this.apiUrl}/document`, {
              id: doc.id, 
              title: doc.title,
              content: doc.content,
              tags: doc.tags || []
            }, { withCredentials: true }).pipe(
              catchError(error => {
                console.error(`Failed to create new document ${doc.id}:`, error);
                return of(null);
              })
            )
          );
        });
        
        existingLocalDocuments.forEach(doc => {
          migrations.push(
            this.http.put<Document>(`${this.apiUrl}/document/overwrite/${doc.id}`, {
              title: doc.title,
              content: doc.content,
              tags: doc.tags || []
            }, { withCredentials: true }).pipe(
              catchError(error => {
                console.error(`Failed to overwrite document ${doc.id}, trying create:`, error);
                return this.http.post<Document>(`${this.apiUrl}/document`, {
                  id: doc.id,
                  title: doc.title,
                  content: doc.content,
                  tags: doc.tags || []
                }, { withCredentials: true }).pipe(
                  catchError(createError => {
                    console.error(`Failed to create document ${doc.id}:`, createError);
                    return of(null);
                  })
                );
              })
            )
          );
        });

        existingServerDocuments.forEach(doc => {
          migrations.push(
            this.http.put<Document>(`${this.apiUrl}/document/overwrite/${doc.id}`, {
              title: doc.title,
              content: doc.content,
              tags: doc.tags || []
            }, { withCredentials: true }).pipe(
              catchError(error => {
                console.error(`Failed to overwrite server document ${doc.id}:`, error);
                return of(null);
              })
            )
          );
        });

        if (migrations.length === 0) {
          return of(true);
        }

        return forkJoin(migrations).pipe(
          map(results => {
            const successCount = results.filter(result => result !== null).length;
            const remainingDocuments = localDocuments.filter(doc => !doc.id?.startsWith('doc_'));
            this.localStorageService.saveDocuments(remainingDocuments);
            return successCount > 0; 
          })
        );
      }),
      catchError(error => {
        console.error('Error migrating local documents to server:', error);
        return of(false);
      })
    );
  }

  private migrateLocalBoardsToServer(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      setTimeout(() => {
        this.performBoardMigration().subscribe(observer);
      }, 200); 
    });
  }

  private performBoardMigration(): Observable<boolean> {
    const localBoards = this.localStorageService.getBoards();
    const trulyLocalBoards = localBoards.filter(board => board.id?.startsWith('board_'));
    const serverBoardsModifiedLocally = localBoards.filter(board => !board.id?.startsWith('board_') && board.id);
    
    if (trulyLocalBoards.length === 0 && serverBoardsModifiedLocally.length === 0) {
      return of(true);
    }

    return this.http.get<Board[]>(`${this.apiUrl}/board/all`, { withCredentials: true }).pipe(
      switchMap(serverBoards => {
        const serverBoardIds = serverBoards.map(board => board.id);
        
        const newBoards = trulyLocalBoards.filter(board => !serverBoardIds.includes(board.id));
        const existingLocalBoards = trulyLocalBoards.filter(board => serverBoardIds.includes(board.id));
        const existingServerBoards = serverBoardsModifiedLocally.filter(board => serverBoardIds.includes(board.id));
        
        const migrations: Observable<any>[] = [];
        
        newBoards.forEach(board => {
          migrations.push(
            this.http.post<Board>(`${this.apiUrl}/board/create-complete`, {
              id: board.id, 
              title: board.title,
              Lists: board.Lists || []
            }, { withCredentials: true }).pipe(
              catchError(error => {
                console.error(`Failed to create new board ${board.id}:`, error);
                return of(null);
              })
            )
          );
        });
        
        existingLocalBoards.forEach(board => {
          migrations.push(
            this.http.put<Board>(`${this.apiUrl}/board/overwrite/${board.id}`, {
              title: board.title,
              Lists: board.Lists || []
            }, { withCredentials: true }).pipe(
              catchError(error => {
                console.error(`Failed to overwrite board ${board.id}, trying create-complete:`, error);
                return this.http.post<Board>(`${this.apiUrl}/board/create-complete`, {
                  id: board.id,
                  title: board.title,
                  Lists: board.Lists || []
                }, { withCredentials: true }).pipe(
                  catchError(createError => {
                    console.error(`Failed to create board ${board.id}:`, createError);
                    return of(null);
                  })
                );
              })
            )
          );
        });

        existingServerBoards.forEach(board => {
          migrations.push(
            this.http.put<Board>(`${this.apiUrl}/board/overwrite/${board.id}`, {
              title: board.title,
              Lists: board.Lists || []
            }, { withCredentials: true }).pipe(
              catchError(error => {
                console.error(`Failed to overwrite server board ${board.id}:`, error);
                return of(null);
              })
            )
          );
        });

        if (migrations.length === 0) {
          return of(true);
        }

        return forkJoin(migrations).pipe(
          map(results => {
            const successCount = results.filter(result => result !== null).length;
            const remainingBoards = localBoards.filter(board => !board.id?.startsWith('board_'));
            this.localStorageService.saveBoards(remainingBoards);
            return successCount > 0; 
          })
        );
      }),
      catchError(error => {
        console.error('Error migrating local boards to server:', error);
        return of(false);
      })
    );
  }

  private migrateServerDocumentsToLocal(): Observable<boolean> {
    return this.http.get<Document[]>(`${this.apiUrl}/document`, { withCredentials: true }).pipe(
      map(serverDocuments => {
        const existingLocalDocuments = this.localStorageService.getDocuments();
        
        serverDocuments.forEach(serverDoc => {
          const localDoc: Document = {
            ...serverDoc,
            createdAt: new Date(serverDoc.createdAt!),
            updatedAt: new Date(serverDoc.updatedAt!)
          };
          
          const existingIndex = existingLocalDocuments.findIndex(doc => doc.id === serverDoc.id);
          if (existingIndex >= 0) {
            existingLocalDocuments[existingIndex] = localDoc;
          } else {
            existingLocalDocuments.push(localDoc);
          }
        });
        
        this.localStorageService.saveDocuments(existingLocalDocuments);
        return true;
      }),
      catchError(error => {
        console.error('Error migrating server documents to local:', error);
        return of(false);
      })
    );
  }

  private migrateServerBoardsToLocal(): Observable<boolean> {
    return this.http.get<Board[]>(`${this.apiUrl}/board/all`, { withCredentials: true }).pipe(
      switchMap(serverBoards => {
        if (serverBoards.length === 0) return of(true);

        const boardDetailObservables = serverBoards.map(serverBoard => 
          this.http.get<Board>(`${this.apiUrl}/board/${serverBoard.id}`, { withCredentials: true }).pipe(
            catchError(error => {
              console.error(`Error fetching board ${serverBoard.id} details from server:`, error);
              return of(null);
            })
          )
        );

        return forkJoin(boardDetailObservables).pipe(
          map(detailedBoards => {
            const existingLocalBoards = this.localStorageService.getBoards();
            
            detailedBoards.forEach(serverBoard => {
              if (serverBoard) {
                const existingIndex = existingLocalBoards.findIndex(board => board.id === serverBoard.id);
                if (existingIndex >= 0) {
                  existingLocalBoards[existingIndex] = serverBoard;
                } else {
                  existingLocalBoards.push(serverBoard);
                }
              }
            });
            
            this.localStorageService.saveBoards(existingLocalBoards);
            return true;
          })
        );
      }),
      catchError(error => {
        console.error('Error migrating server boards to local:', error);
        return of(false);
      })
    );
  }

  hasLocalDataToMigrate(): boolean {
    const localDocuments = this.localStorageService.getDocuments();
    const localBoards = this.localStorageService.getBoards();
    
    const hasLocalDocuments = localDocuments.some(doc => doc.id?.startsWith('doc_'));
    const hasLocalBoards = localBoards.some(board => board.id?.startsWith('board_'));
    
    return hasLocalDocuments || hasLocalBoards;
  }

  hasServerDataToMigrate(): boolean {
    return this.auth.getCurrentAuthState();
  }
} 