import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/authorization/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  authService = inject(Auth);
  router = inject(Router);
  form: FormGroup = new FormGroup({
    login: new FormControl('', [Validators.required]),
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
    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        console.log(err.error.details);
      },
    });
  }
}
