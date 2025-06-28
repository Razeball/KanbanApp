import { CanActivate, Router } from '@angular/router';
import { Auth } from '../authorization/auth';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class protectRoutesGuard implements CanActivate {
  constructor(private authService: Auth, private router: Router) {}
  canActivate(): Observable<boolean> {
  return this.authService.isAuthenticated().pipe(tap(authenticated => {
    if (!authenticated) {
      this.router.navigate(['/login']);
    }
    })
  );
}
}
