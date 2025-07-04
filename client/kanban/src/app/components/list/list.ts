import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Card } from '../card/card';
import { TitleInputModal } from '../title-input-modal/title-input-modal';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { List as ListModel } from '../../models/list';
import { Card as CardModel } from '../../models/card';
import { CardService } from '../../services/card/card';
import { ListService } from '../../services/list/list';
import { SocketService } from '../../services/socket/socket';

@Component({
  selector: 'app-list',
  imports: [Card, TitleInputModal, ConfirmationModal],
  templateUrl: './list.html',
  styleUrl: './list.css'
})
export class List implements OnInit, OnChanges, OnDestroy {
  @Input() listData: ListModel | null = null;
  @Input() listTitle: string = 'List';
  @Input() boardId: string | null = null;
  @Input() isCollaborationEnabled: boolean = false;
  @Output() listUpdated = new EventEmitter<void>();

  private cardService = inject(CardService);
  private listService = inject(ListService);
  private socketService = inject(SocketService);
  private cdr = inject(ChangeDetectorRef);
  
  listCards: CardModel[] = [];
  isMenuOpen = false;
  isDragOver = false;
  private documentClickListener?: (event: Event) => void;


  isTitleModalOpen = false;
  titleModalLoading = false;
  titleModalType: 'list' | 'card' = 'list';
  
  isConfirmModalOpen = false;
  confirmModalLoading = false;
  confirmAction: 'delete-list' | null = null;

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
        next: (success) => {
          if (success) {
            if (this.boardId && this.listId) {
              this.socketService.emitCardMoved(this.boardId, cardId, sourceListId, this.listId, newOrder);
            }
            this.listUpdated.emit();
          } else {
            alert('Failed to move card. Please try again.');
          }
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

  openCreateCardModal() {
    this.titleModalType = 'card';
    this.isTitleModalOpen = true;
    this.cdr.detectChanges();
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.detectChanges();
  }

  openEditListModal(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.titleModalType = 'list';
    this.isTitleModalOpen = true;
    this.isMenuOpen = false;
    this.cdr.detectChanges();
  }

  openDeleteListModal(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.confirmAction = 'delete-list';
    this.isConfirmModalOpen = true;
    this.isMenuOpen = false;
    this.cdr.detectChanges();
  }

  onTitleModalClosed() {
    this.isTitleModalOpen = false;
    this.titleModalLoading = false;
    this.cdr.detectChanges();
  }

  onTitleSubmitted(title: string) {
    if (this.titleModalType === 'list') {
      this.updateListTitle(title);
    } else if (this.titleModalType === 'card') {
      this.createCardWithTitle(title);
    }
  }

  private updateListTitle(title: string) {
    if (!this.listData?.id) return;

    this.titleModalLoading = true;
    this.listService.updateList(this.listData.id, title).subscribe({
      next: (updatedList) => {
        if (this.listData && updatedList) {
          this.listData.title = updatedList.title;
          if (this.boardId) {
            this.socketService.emitListUpdated(this.boardId, this.listData);
          }
        }
        this.listUpdated.emit();
        this.onTitleModalClosed();
      },
      error: (error) => {
        console.error('Error updating list:', error);
        alert('Failed to update list. Please try again.');
        this.onTitleModalClosed();
      }
    });
  }

  private createCardWithTitle(title: string) {
    if (!this.listId) return;

    this.titleModalLoading = true;
    this.cardService.createCard(this.listId, title).subscribe({
      next: (card) => {
        this.listCards.push(card);
        if (this.boardId) {
          this.socketService.emitCardCreated(this.boardId, card);
        }
        this.listUpdated.emit();
        this.onTitleModalClosed();
      },
      error: (error) => {
        console.error('Error creating card:', error);
        alert('Failed to create card. Please try again.');
        this.onTitleModalClosed();
      }
    });
  }

  onConfirmModalClosed() {
    this.isConfirmModalOpen = false;
    this.confirmModalLoading = false;
    this.confirmAction = null;
    this.cdr.detectChanges();
  }

  onConfirmModalConfirmed() {
    if (this.confirmAction === 'delete-list') {
      this.handleDeleteList();
    }
  }

  onConfirmModalCancelled() {
    this.onConfirmModalClosed();
  }

  private handleDeleteList() {
    if (!this.listData?.id) return;

    const listId = this.listData.id;
    this.confirmModalLoading = true;
    this.listService.deleteList(listId).subscribe({
      next: () => {
        if (this.boardId) {
          this.socketService.emitListDeleted(this.boardId, listId);
        }
        this.listUpdated.emit();
        this.onConfirmModalClosed();
      },
      error: (error) => {
        console.error('Error deleting list:', error);
        alert('Failed to delete list. Please try again.');
        this.onConfirmModalClosed();
      }
    });
  }

  
  get titleModalTitle(): string {
    if (this.titleModalType === 'list') {
      return 'Edit List Title';
    }
    return 'Create New Card';
  }

  get titleModalPlaceholder(): string {
    if (this.titleModalType === 'list') {
      return 'Enter list title...';
    }
    return 'Enter card title...';
  }

  get titleModalCurrentValue(): string {
    if (this.titleModalType === 'list') {
      return this.listData?.title || '';
    }
    return '';
  }

  get confirmModalTitle(): string {
    if (this.confirmAction === 'delete-list') {
      return 'Delete List';
    }
    return 'Confirm Action';
  }

  get confirmModalMessage(): string {
    if (this.confirmAction === 'delete-list') {
      return `Are you sure you want to delete "${this.displayTitle}" and all its cards?`;
    }
    return 'Are you sure you want to proceed?';
  }

  get confirmModalIsWarning(): boolean {
    return this.confirmAction === 'delete-list';
  }

  get confirmModalConfirmText(): string {
    if (this.confirmAction === 'delete-list') {
      return 'Delete List';
    }
    return 'Confirm';
  }


  createCard() {
    this.openCreateCardModal();
  }

  onCardUpdated() {
    this.listUpdated.emit();
  }

  trackByCardId(index: number, card: CardModel): string {
    return card.id || index.toString();
  }
}
