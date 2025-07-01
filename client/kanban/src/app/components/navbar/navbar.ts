import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/authorization/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  private authService = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isMobileMenuOpen = false;
  isAuthenticated = false;

  ngOnInit() {
    
    this.authService.isAuthenticated().subscribe(authenticated => {
      this.isAuthenticated = authenticated;
      this.cdr.detectChanges();
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.cdr.detectChanges();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.cdr.detectChanges();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}
