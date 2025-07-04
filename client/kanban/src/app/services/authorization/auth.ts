import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/user';
import { BehaviorSubject, catchError, map, tap } from 'rxjs';
import { of } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = environment.APP_URL;
  private http = inject(HttpClient);
  
 
  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    this.http.get<{authenticated: boolean}>(`${this.apiUrl}/auth/profile`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.authStateSubject.next(response.authenticated);
        },
        error: () => {
          this.authStateSubject.next(false);
        }
      });
  }

  register(user: User) {
    return this.http.post(`${this.apiUrl}/auth/register`, user).pipe(
      tap(() => {
        this.triggerDataMigration();
      })
    );
  }
  
  login(user: User) {
    return this.http.post(`${this.apiUrl}/auth/login`, user, { withCredentials: true }).pipe(
      tap(() => {
        this.authStateSubject.next(true);
        this.triggerDataMigration();
      })
    );
  }
  
  logout(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/logout`, { withCredentials: true }).pipe(
      tap(() => {
        this.authStateSubject.next(false);
      }),
      catchError(error => {
        console.error('Logout error:', error);
        this.authStateSubject.next(false);
        return of(null);
      })
    );
  }
  
  getProfile() {
    return this.http.get<{authenticated: boolean}>(`${this.apiUrl}/auth/profile`, { withCredentials: true });
  }

  isAuthenticated() {
    let authenticated = false;
    return this.getProfile().pipe(
      map(response => {
         authenticated = response.authenticated;
         return authenticated;
      }),
      catchError(() => {
        authenticated = false;
        return of(authenticated);
      })  
    );
  }

  
  getCurrentAuthState(): boolean {
    return this.authStateSubject.value;
  }

  private triggerDataMigration() {
    setTimeout(() => {
      try {
        const hasLocalDocuments = localStorage.getItem('prodoku_documents') !== null;
        const hasLocalBoards = localStorage.getItem('prodoku_boards') !== null;
        
        if (hasLocalDocuments || hasLocalBoards) {
          const migrationEvent = new CustomEvent('triggerDataMigration', {
            detail: { timestamp: Date.now() }
          });
          window.dispatchEvent(migrationEvent);
          console.log('Migration event dispatched');
        }
      } catch (error) {
        console.error('Error checking for local data:', error);
      }
    }, 1000);
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error fetching current user:', error);
          return of(null);
        })
      );
  }
}
