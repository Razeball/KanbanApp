import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification/notification';
import { Subscription } from 'rxjs';
//decided to do this like this because laziness
@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div 
        *ngFor="let notification of notifications" 
        class="notification"
        [ngClass]="'notification-' + notification.type"
      >
        <div class="notification-content">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <p class="notification-message">{{ notification.message }}</p>
          
          <div class="notification-actions" *ngIf="notification.actions">
            <button 
              *ngFor="let action of notification.actions"
              (click)="executeAction(action.action, notification.id)"
              [ngClass]="action.primary ? 'btn-primary' : 'btn-secondary'"
              class="notification-btn"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
        
        <button 
          class="notification-close"
          (click)="dismiss(notification.id)"
          *ngIf="!notification.persistent || !notification.actions"
        >
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 400px;
    }

    .notification {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 12px;
      border-left: 4px solid #3b82f6;
      display: flex;
      animation: slideIn 0.3s ease-out;
    }

    .notification-info { border-left-color: #3b82f6; }
    .notification-success { border-left-color: #10b981; }
    .notification-warning { border-left-color: #f59e0b; }
    .notification-error { border-left-color: #ef4444; }

    .notification-content {
      flex: 1;
      padding: 16px;
    }

    .notification-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .notification-message {
      margin: 0 0 12px 0;
      color: #6b7280;
      line-height: 1.5;
    }

    .notification-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .notification-btn {
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      background: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
    }

    .notification-close {
      padding: 8px 12px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #9ca3af;
      line-height: 1;
    }

    .notification-close:hover {
      color: #4b5563;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  
  notifications: Notification[] = [];
  private subscription?: Subscription;

  ngOnInit() {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => this.notifications = notifications
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  dismiss(id: string) {
    this.notificationService.dismiss(id);
  }

  executeAction(action: () => void, notificationId: string) {
    action();
    this.dismiss(notificationId);
  }
} 