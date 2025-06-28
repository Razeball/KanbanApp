import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/authorization/auth';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  constructor(private authService: Auth, private router: Router) {}
  isAuthenticated: boolean = false;
  private authSubscription?: Subscription;
  
  ngOnInit() {
    
    this.authSubscription = this.authService.authState$.subscribe((authenticated) => {
      this.isAuthenticated = authenticated;
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy() {
    
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
