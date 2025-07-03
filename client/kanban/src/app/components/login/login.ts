import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/authorization/auth';
import { Router, RouterLink } from '@angular/router';
import { MigrationService } from '../../services/migration/migration';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {
  authService = inject(Auth);
  router = inject(Router);
  migrationService = inject(MigrationService);
  
  private migrationListener?: (event: Event) => void;
  
  form: FormGroup = new FormGroup({
    login: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  ngOnInit() {
    
    this.migrationListener = (event: Event) => {
      this.handleDataMigration();
    };
    window.addEventListener('triggerDataMigration', this.migrationListener);
   
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

  ngOnDestroy() {
    if (this.migrationListener) {
      window.removeEventListener('triggerDataMigration', this.migrationListener);
    }
  }
 
  onSubmit() {
    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.handleDataMigration();
        }, 500);
        this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        console.log(err.error.details);
      },
    });
  }

  private handleDataMigration() {
    
    if (this.migrationService.hasLocalDataToMigrate()) {
      console.log('Migrating local data to server...');
      this.migrationService.migrateAllLocalDataToServer().subscribe({
        next: (result) => {
          if (result.documentsSuccess && result.boardsSuccess) {
            console.log('All local data successfully migrated to server');
          } else {
            console.warn('Some local data failed to migrate:', result);
          }
        },
        error: (error) => {
          console.error('Error during data migration:', error);
        }
      });
    }
  }
}
