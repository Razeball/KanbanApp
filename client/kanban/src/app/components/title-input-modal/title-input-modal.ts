import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-title-input-modal',
  imports: [FormsModule],
  templateUrl: './title-input-modal.html',
  styleUrl: './title-input-modal.css'
})
export class TitleInputModal implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() title = 'Enter Title';
  @Input() placeholder = 'Enter title...';
  @Input() currentValue = '';
  @Input() isLoading = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() titleSubmitted = new EventEmitter<string>();

  inputValue = '';

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges() {
    this.resetForm();
  }

  private resetForm() {
    this.inputValue = this.currentValue;
  }

  closeModal() {
    this.modalClosed.emit();
  }

  submitTitle() {
    if (this.inputValue.trim()) {
      this.titleSubmitted.emit(this.inputValue.trim());
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitTitle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
    }
  }
} 