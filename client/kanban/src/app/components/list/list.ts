import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Card } from '../card/card';
import { List as ListModel } from '../../models/list';
import { Card as CardModel } from '../../models/card';
import { CardService } from '../../services/card/card';
import { ListService } from '../../services/list/list';

@Component({
  selector: 'app-list',
  imports: [Card],
  templateUrl: './list.html',
  styleUrl: './list.css'
})
export class List implements OnInit, OnChanges, OnDestroy {
  @Input() listData: ListModel | null = null;
  @Input() listTitle: string = 'List';
  @Output() listUpdated = new EventEmitter<void>();

  private cardService = inject(CardService);
  private listService = inject(ListService);
  private cdr = inject(ChangeDetectorRef);
  
  listCards: CardModel[] = [];
  isMenuOpen = false;
  isDragOver = false;
  private documentClickListener?: (event: Event) => void;

  ngOnInit() {
    this.updateListData();
    this.setupDocumentClickListener();
  }

  ngOnChanges() {
    this.updateListData();
  }

  ngOnDestroy() {
    this.removeDocumentClickListener();
  }

  private setupDocumentClickListener() {
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (this.isMenuOpen && !target.closest('.list-menu-container')) {
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

  private updateListData() {
    if (this.listData) {
      this.listCards = this.listData.Cards || [];
    }
  }

  get displayTitle(): string {
    return this.listData?.title || this.listTitle;
  }

  get listId(): string | undefined {
    return this.listData?.id;
  }


  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    if (!this.isDragOver) {
      this.isDragOver = true;
      this.cdr.detectChanges();
    }
  }

  onDragLeave(event: DragEvent) {
  
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.isDragOver = false;
      this.cdr.detectChanges();
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const dragData = event.dataTransfer?.getData('text/plain');
    if (!dragData || !this.listId) return;
    
    try {
      const cardData = JSON.parse(dragData);
      const { cardId, sourceListId } = cardData;
      
 
      if (sourceListId === this.listId) {
        this.cdr.detectChanges();
        return;
      }
      
    
      const newOrder = this.listCards.length;
      
    
      this.cardService.moveCard(cardId, this.listId, newOrder).subscribe({
        next: (response) => {
          
          this.listUpdated.emit();
        },
        error: (error) => {
          console.error('Error moving card:', error);
          alert('Failed to move card. Please try again.');
        }
      });
      
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
    
    this.cdr.detectChanges();
  }

  createCard() {
    const title = prompt('Enter card title:');
    if (title && this.listId) {
      this.cardService.createCard(this.listId, title).subscribe({
        next: (card) => {
          this.listCards.push(card);
          this.listUpdated.emit(); 
        },
        error: (error) => {
          console.error('Error creating card:', error);
          alert('Failed to create card. Please try again.');
        }
      });
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.detectChanges();
  }

  editList(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (!this.listData?.id) return;

    const newTitle = prompt('Enter new list title:', this.displayTitle);
    if (newTitle && newTitle.trim() && newTitle !== this.displayTitle) {
      this.listService.updateList(this.listData.id, newTitle.trim()).subscribe({
        next: (updatedList) => {
          if (this.listData) {
            this.listData.title = updatedList.title;
          }
          this.listUpdated.emit();
          this.isMenuOpen = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating list:', error);
          alert('Failed to update list. Please try again.');
          this.isMenuOpen = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.isMenuOpen = false;
      this.cdr.detectChanges();
    }
  }

  deleteList(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (!this.listData?.id) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${this.displayTitle}" and all its cards?`);
    if (!confirmDelete) {
      this.isMenuOpen = false;
      this.cdr.detectChanges();
      return;
    }

    this.listService.deleteList(this.listData.id).subscribe({
      next: () => {
        this.listUpdated.emit();
        this.isMenuOpen = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting list:', error);
        alert('Failed to delete list. Please try again.');
        this.isMenuOpen = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCardUpdated() {
    this.listUpdated.emit();
  }

  trackByCardId(index: number, card: CardModel): string {
    return card.id || index.toString();
  }
}
