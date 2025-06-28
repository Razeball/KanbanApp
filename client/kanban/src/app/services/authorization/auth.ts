import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/user';
import { BehaviorSubject, catchError, map, tap } from 'rxjs';
import { of } from 'rxjs';

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
    this.getProfile().subscribe({
      next: (response) => {
        this.authStateSubject.next(response.authenticated);
      },
      error: () => {
        this.authStateSubject.next(false);
      }
    });
  }

  register(user: User) {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }
  
  login(user: User) {
    return this.http.post(`${this.apiUrl}/auth/login`, user, { withCredentials: true }).pipe(
      tap(() => {
        
        this.authStateSubject.next(true);
      })
    );
  }
  
  logout() {
    return this.http.get(`${this.apiUrl}/auth/logout`, { withCredentials: true }).pipe(
      tap(() => {
        
        this.authStateSubject.next(false);
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
}
