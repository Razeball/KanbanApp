import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../services/authorization/auth';
import { MigrationService } from '../../services/migration/migration';
//I don't know why the migration fail sometimes
@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit, OnDestroy {
  authService = inject(Auth);
  router = inject(Router);
  migrationService = inject(MigrationService);
  
  private migrationListener?: (event: Event) => void;
  
  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required]),
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
    if (this.form.valid) {
      this.authService.register(this.form.value).subscribe({
        next: (res) => {
          console.log('Registration successful:', res);
          setTimeout(() => {
            this.handleDataMigration();
          }, 500);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Registration error:', err);
        }
      });
    }
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
