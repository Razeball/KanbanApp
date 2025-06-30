import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  isModalOpen = false;
  isMenuOpen = false;
  isDragging = false;
  private documentClickListener?: (event: Event) => void;

  ngOnInit() {
    this.setupDocumentClickListener();
  }

  ngOnDestroy() {
    this.removeDocumentClickListener();
  }

  private setupDocumentClickListener() {
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (this.isMenuOpen && !target.closest('.card-menu-container')) {
        this.isMenuOpen = false;
        this.cdr.detectChanges();
      }
    };
    
    document.addEventListener('click', this.documentClickListener, true);
  }

  private removeDocumentClickListener() {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener, true);
      this.documentClickListener = undefined;
    }
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

 
  onDragStart(event: DragEvent) {
    if (!this.cardData?.id) return;
    
    this.isDragging = true;
    this.isMenuOpen = false; 
    
  
    event.dataTransfer?.setData('text/plain', JSON.stringify({
      cardId: this.cardData.id,
      sourceListId: this.cardData.listId,
      title: this.cardData.title
    }));
    
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    
 
    (event.currentTarget as HTMLElement)?.classList.add('dragging');
    this.cdr.detectChanges();
  }

  onDragEnd(event: DragEvent) {
    this.isDragging = false;
    (event.currentTarget as HTMLElement)?.classList.remove('dragging');
    this.cdr.detectChanges();
  }

  openCardModal() {
    this.isModalOpen = true;
    this.isMenuOpen = false;
    this.cdr.detectChanges();
  }

  closeCardModal() {
    this.isModalOpen = false;
    this.cdr.detectChanges();
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
    event.preventDefault();
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.detectChanges();
  }

  deleteCard(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (!this.cardData?.id) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${this.displayTitle}"?`);
    if (!confirmDelete) {
      this.isMenuOpen = false;
      this.cdr.detectChanges();
      return;
    }

    this.cardService.deleteCard(this.cardData.id).subscribe({
      next: () => {
        this.cardUpdated.emit();
        this.isMenuOpen = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting card:', error);
        alert('Failed to delete card. Please try again.');
        this.isMenuOpen = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCardInteraction() {
    this.cardUpdated.emit();
  }
}
