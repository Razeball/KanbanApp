import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private generateId(): string {
    return 'notif_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  show(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId();
    const newNotification: Notification = { ...notification, id };
    
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    if (!notification.persistent) {
      setTimeout(() => {
        this.dismiss(id);
      }, 8000);
    }

    return id;
  }

  dismiss(id: string) {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  dismissAll() {
    this.notificationsSubject.next([]);
  }

  showLoginReminder(router: any) {
   
    const reminderDisabled = localStorage.getItem('loginReminderDisabled');
    if (reminderDisabled === 'true') {
      return;
    }

    const hasShownRecently = localStorage.getItem('loginReminderShown');
    const now = Date.now();
    
    
    if (hasShownRecently && (now - parseInt(hasShownRecently)) < 300000) {
      return;
    }

    this.show({
      type: 'info',
      title: 'Save Your Work Permanently',
      message: 'Your work is saved locally. Sign in to sync across devices and ensure your data is never lost.',
      actions: [
        {
          label: 'Sign In',
          action: () => router.navigate(['/login']),
          primary: true
        },
        {
          label: 'Register',
          action: () => router.navigate(['/register'])
        },
        {
          label: 'Maybe Later',
          action: () => {
            localStorage.setItem('loginReminderShown', now.toString());
          }
        },
        {
          label: 'Don\'t remind again',
          action: () => {
            localStorage.setItem('loginReminderDisabled', 'true');
            localStorage.setItem('loginReminderShown', now.toString());
          }
        }
      ],
      persistent: true
    });
  }

  resetLoginReminderPreference() {
    localStorage.removeItem('loginReminderDisabled');
    localStorage.removeItem('loginReminderShown');
  }
} 