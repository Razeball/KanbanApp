import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Auth } from '../authorization/auth';
import { inject, Injectable } from '@angular/core';
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
