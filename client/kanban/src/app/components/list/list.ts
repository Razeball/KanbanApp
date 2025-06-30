import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject } from '@angular/core';
import { Card } from '../card/card';
import { List as ListModel } from '../../models/list';
import { Card as CardModel } from '../../models/card';
import { CardService } from '../../services/card/card';

@Component({
  selector: 'app-list',
  imports: [Card],
  templateUrl: './list.html',
  styleUrl: './list.css'
})
export class List implements OnInit, OnChanges {
  @Input() listData: ListModel | null = null;
  @Input() listTitle: string = 'List';
  @Output() listUpdated = new EventEmitter<void>();

  private cardService = inject(CardService);
  
  listCards: CardModel[] = [];

  ngOnInit() {
    this.updateListData();
  }

  ngOnChanges() {
    this.updateListData();
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

  onCardUpdated() {
    this.listUpdated.emit();
  }

  trackByCardId(index: number, card: CardModel): string {
    return card.id || index.toString();
  }
}
