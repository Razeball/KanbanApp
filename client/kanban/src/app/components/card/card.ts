import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Card as CardModel } from '../../models/card';
import { CardService } from '../../services/card/card';
import { CardModal } from '../card-modal/card-modal';

@Component({
  selector: 'app-card',
  imports: [CardModal],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, OnDestroy {
  @Input() cardData: CardModel | null = null;
  @Input() cardTitle: string = 'Card'; 
  @Output() cardUpdated = new EventEmitter<void>();

  private cardService = inject(CardService);

  isModalOpen = false;
  isMenuOpen = false;

  ngOnInit() {
 
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
   
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  get displayTitle(): string {
    return this.cardData?.title || this.cardTitle;
  }

  get displayDescription(): string | undefined {
    return this.cardData?.description;
  }

  get cardId(): string | undefined {
    return this.cardData?.id;
  }

  openCardModal() {
    this.isModalOpen = true;
    this.isMenuOpen = false;
  }

  closeCardModal() {
    this.isModalOpen = false;
  }

  onCardModalUpdated(updatedCard: CardModel) {
 
    if (this.cardData) {
      this.cardData.title = updatedCard.title;
      this.cardData.description = updatedCard.description;
    }
    this.cardUpdated.emit();
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  deleteCard(event: Event) {
    event.stopPropagation();
    
    if (!this.cardData?.id) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${this.displayTitle}"?`);
    if (!confirmDelete) return;

    this.cardService.deleteCard(this.cardData.id).subscribe({
      next: () => {
        this.cardUpdated.emit();
        this.isMenuOpen = false;
      },
      error: (error) => {
        console.error('Error deleting card:', error);
        alert('Failed to delete card. Please try again.');
      }
    });
  }


  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.card-menu-container')) {
      this.isMenuOpen = false;
    }
  }

  onCardInteraction() {
    this.cardUpdated.emit();
  }
}
