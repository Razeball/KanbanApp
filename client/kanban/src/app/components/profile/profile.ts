import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/authorization/auth';
import { DocumentService } from '../../services/document/document';
import { BoardService } from '../../services/board/board';
import { MigrationService } from '../../services/migration/migration';
import { NotificationService } from '../../services/notification/notification';
import { LocalStorageService } from '../../services/local-storage/local-storage';
import { User } from '../../models/user';
//headache
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private boardService = inject(BoardService);
  private migrationService = inject(MigrationService);
  private notificationService = inject(NotificationService);
  private localStorageService = inject(LocalStorageService);

  user: User | null = null;
  isLoadingUser = true;
  serverStorageEnabled = true;
  isSyncing = false;
  
  localDocumentsCount = 0;
  localBoardsCount = 0;
  serverDocumentsCount = 0;
  serverBoardsCount = 0;
  
  loginRemindersEnabled = true;

  ngOnInit() {
    this.loadStoragePreference();
    this.loadDataCounts();
    this.loadNotificationPreferences();
    
    this.auth.authState$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadUserProfile();
      } else {
        this.user = null;
        this.isLoadingUser = false;
      }
    });
    
    this.loadUserProfile();
  }

  private checkAuthAndLoadProfile() {
 
  }

  private loadUserProfile() {
    this.isLoadingUser = true;
    
    if (!this.auth.getCurrentAuthState()) {
      this.user = null;
      this.isLoadingUser = false;
      return;
    }
    
    this.auth.getCurrentUser().subscribe({
      next: (user: any) => {
        this.user = user ? { ...user } : null;
        this.isLoadingUser = false;
      },
      error: (error: any) => {
        console.error('Error loading user profile:', error);
        this.user = null;
        this.isLoadingUser = false;
      }
    });
  }

  private loadDataCounts() {
    this.localDocumentsCount = this.localStorageService.getDocuments().length;
    this.localBoardsCount = this.localStorageService.getBoards().length;

    if (this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false') {
      this.documentService.getDocuments().subscribe(docs => {
        this.serverDocumentsCount = docs.length;
      });
      
      this.boardService.getBoards().subscribe(boards => {
        this.serverBoardsCount = boards.length;
      });
    } else {
      this.serverDocumentsCount = 0;
      this.serverBoardsCount = 0;
    }
  }

  private loadStoragePreference() {
    const preference = localStorage.getItem('serverStorageEnabled');
    if (preference === null) {
      this.serverStorageEnabled = this.auth.getCurrentAuthState();
    } else {
      this.serverStorageEnabled = preference === 'true';
    }
  }

  private saveStoragePreference() {
    localStorage.setItem('serverStorageEnabled', this.serverStorageEnabled.toString());
  }

  onStorageSettingChange() {
    const oldPreference = this.serverStorageEnabled;
    
    localStorage.setItem('serverStorageEnabled', this.serverStorageEnabled.toString());

    if (this.serverStorageEnabled !== oldPreference) {
      this.isSyncing = true;

      if (this.serverStorageEnabled) {
        this.migrationService.migrateAllLocalDataToServer().subscribe({
          next: (result) => {
            this.isSyncing = false;
          
            this.dispatchStorageChangeEvent();
          
            this.loadDataCounts();
          },
          error: (error) => {
            console.error('Migration failed:', error);
            this.isSyncing = false;
            
            this.dispatchStorageChangeEvent();
          }
        });
      } else {
        this.migrationService.migrateServerDataToLocal().subscribe({
          next: (result) => {
            this.isSyncing = false;
          
            this.dispatchStorageChangeEvent();
          
            this.loadDataCounts();
          },
          error: (error) => {
            console.error('Migration failed:', error);
            this.isSyncing = false;
            
            this.dispatchStorageChangeEvent();
          }
        });
      }
    }
  }

  private dispatchStorageChangeEvent() {
    window.dispatchEvent(new CustomEvent('storagePreferenceChanged', {
      detail: { enabled: this.serverStorageEnabled }
    }));
  }

  clearLocalData() {
    this.notificationService.show({
      type: 'warning',
      title: 'Clear Local Data',
      message: 'Are you sure you want to clear all local data? This action cannot be undone.',
      actions: [
        {
          label: 'Yes, Clear Data',
          action: () => {
            this.localStorageService.clearAllData();
            this.loadDataCounts();
            this.notificationService.show({
              type: 'success',
              title: 'Data Cleared',
              message: 'All local data has been cleared.'
            });
          },
          primary: false
        },
        {
          label: 'Cancel',
          action: () => {},
          primary: true
        }
      ],
      persistent: true
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  private loadNotificationPreferences() {
   
    const reminderDisabled = localStorage.getItem('loginReminderDisabled');
    this.loginRemindersEnabled = reminderDisabled !== 'true';
  }

  onLoginReminderToggle() {
    if (this.loginRemindersEnabled) {
     
      this.notificationService.resetLoginReminderPreference();
    } else {
     
      localStorage.setItem('loginReminderDisabled', 'true');
    }
  }

  ngOnDestroy() {
   
  }
} 