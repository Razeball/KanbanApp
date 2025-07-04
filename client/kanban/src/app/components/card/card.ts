import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Card as CardModel } from '../../models/card';
import { CardService } from '../../services/card/card';
import { LocalStorageService } from '../../services/local-storage/local-storage';
import { MarkdownService } from '../../services/markdown/markdown';
import { CardModal } from '../card-modal/card-modal';
import { SocketService } from '../../services/socket/socket';

@Component({
  selector: 'app-card',
  imports: [CardModal],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, OnDestroy {
  @Input() cardData: CardModel | null = null;
  @Input() cardTitle: string = 'Card'; 
  @Input() boardId: string | null = null;
  @Input() isCollaborationEnabled: boolean = false;
  @Output() cardUpdated = new EventEmitter<void>();

  private cardService = inject(CardService);
  private localStorageService = inject(LocalStorageService);
  private markdownService = inject(MarkdownService);
  private socketService = inject(SocketService);
  private cdr = inject(ChangeDetectorRef);

  isModalOpen = false;
  isMenuOpen = false;
  isDragging = false;
  isCompleted = false;
  private documentClickListener?: (event: Event) => void;

  ngOnInit() {
    this.setupDocumentClickListener();
    this.loadCompletionState();
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

  private loadCompletionState() {
    if (this.cardData?.id) {
      this.isCompleted = this.localStorageService.getCardCompletionState(this.cardData.id);
      this.cdr.detectChanges();
    }
  }

  get displayTitle(): string {
    return this.cardData?.title || this.cardTitle;
  }

  get displayDescription(): string | undefined {
    return this.cardData?.description;
  }

  get renderedDescription(): string {
    const description = this.displayDescription;
    if (!description) return '';
    

    if (this.markdownService.hasMarkdownSyntax(description)) {
      return this.markdownService.parseMarkdown(description);
    }
    
  
    return description.replace(/\n/g, '<br>');
  }

  get hasMarkdownDescription(): boolean {
    const description = this.displayDescription;
    return description ? this.markdownService.hasMarkdownSyntax(description) : false;
  }

  get cardId(): string | undefined {
    return this.cardData?.id;
  }

  onCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const completed = checkbox.checked;
    
    if (this.cardData?.id) {
      this.isCompleted = completed;
      this.localStorageService.setCardCompletionState(this.cardData.id, completed);
      this.cdr.detectChanges();
    }
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
      if (this.boardId) {
        this.socketService.emitCardUpdated(this.boardId, this.cardData);
      }
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

    const cardId = this.cardData.id;
    this.cardService.deleteCard(cardId).subscribe({
      next: (success) => {
        if (success) {
        if (cardId) {
          this.localStorageService.removeCardCompletionState(cardId);
          if (this.boardId) {
            this.socketService.emitCardDeleted(this.boardId, cardId);
          }
        }
        this.cardUpdated.emit();
        } else {
          alert('Failed to delete card. Please try again.');
        }
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
