import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/user';
import { catchError, map } from 'rxjs';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = environment.APP_URL;
  private http = inject(HttpClient);

  register(user: User) {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }
  login(user: User) {
    return this.http.post(`${this.apiUrl}/auth/login`, user, { withCredentials: true });
  }
  logout() {
    return this.http.get(`${this.apiUrl}/auth/logout`, { withCredentials: true });
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
}
