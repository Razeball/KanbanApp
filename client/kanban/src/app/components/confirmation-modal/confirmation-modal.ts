import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  imports: [],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.css'
})
export class ConfirmationModal {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() isWarning = false;
  @Input() isLoading = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  closeModal() {
    this.modalClosed.emit();
  }

  confirm() {
    this.confirmed.emit();
  }

  cancel() {
    this.cancelled.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
} 