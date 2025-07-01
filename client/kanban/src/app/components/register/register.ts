import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../services/authorization/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  authService = inject(Auth);
  router = inject(Router);
  
  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  ngOnInit() {

    this.authService.isAuthenticated().subscribe({
      next: (isAuth) => {
        if (isAuth) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {

      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.authService.register(this.form.value).subscribe({
        next: (res) => {
          console.log('Registration successful:', res);
          
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Registration error:', err);
        }
      });
    }
  }
}
