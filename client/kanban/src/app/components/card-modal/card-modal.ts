import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card as CardModel } from '../../models/card';
import { CardService } from '../../services/card/card';

@Component({
  selector: 'app-card-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './card-modal.html',
  styleUrl: './card-modal.css'
})
export class CardModal implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() cardData: CardModel | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<CardModel>();

  private cardService = inject(CardService);

  editedTitle = '';
  editedDescription = '';
  isLoading = false;

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges() {
    this.resetForm();
  }

  private resetForm() {
    if (this.cardData) {
      this.editedTitle = this.cardData.title;
      this.editedDescription = this.cardData.description || '';
    }
  }

  closeModal() {
    this.modalClosed.emit();
  }

  saveCard() {
    if (!this.cardData || !this.editedTitle.trim()) return;

    this.isLoading = true;
    
    this.cardService.updateCard(
      this.cardData.id!,
      this.editedTitle.trim(),
      this.editedDescription.trim()
    ).subscribe({
      next: (updatedCard) => {
        this.isLoading = false;
        this.cardUpdated.emit(updatedCard);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error updating card:', error);
        this.isLoading = false;
        alert('Failed to update card. Please try again.');
      }
    });
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
} 