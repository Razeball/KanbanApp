import { Component, Input, Output, EventEmitter, inject, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card as CardModel } from '../../models/card';
import { CardService } from '../../services/card/card';
import { MarkdownService } from '../../services/markdown/markdown';

@Component({
  selector: 'app-card-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './card-modal.html',
  styleUrl: './card-modal.css'
})
export class CardModal implements OnInit {
  @Input() isOpen = false;
  @Input() cardData: CardModel | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<CardModel>();
  @ViewChild('descriptionTextarea') descriptionTextarea!: ElementRef<HTMLTextAreaElement>;

  private cardService = inject(CardService);
  private markdownService = inject(MarkdownService);
  private cdr = inject(ChangeDetectorRef);

  editedTitle = '';
  editedDescription = '';
  isLoading = false;
  showPreview = true;

  ngOnInit() {
    if (this.cardData) {
      this.editedTitle = this.cardData.title || '';
      this.editedDescription = this.cardData.description || '';
    }
    this.showPreview = true;
  }

  get renderedDescription(): string {
    if (!this.editedDescription) return '';
    
    if (this.markdownService.hasMarkdownSyntax(this.editedDescription)) {
      return this.markdownService.parseMarkdown(this.editedDescription);
    }
    
    return this.editedDescription.replace(/\n/g, '<br>');
  }

  get hasMarkdownSyntax(): boolean {
    return this.markdownService.hasMarkdownSyntax(this.editedDescription);
  }

  onDescriptionChange() {
    this.cdr.detectChanges();
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
    this.cdr.detectChanges();
  }

  insertMarkdown(before: string, after: string = '', placeholder: string = '') {
    if (this.showPreview) {
      this.showPreview = false;
      this.cdr.detectChanges();
      setTimeout(() => this.doInsertMarkdown(before, after, placeholder), 0);
    } else {
      this.doInsertMarkdown(before, after, placeholder);
    }
  }

  private doInsertMarkdown(before: string, after: string = '', placeholder: string = '') {
    const textarea = this.descriptionTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.editedDescription.substring(start, end);
    
    let insertText = '';
    if (selectedText) {
      insertText = before + selectedText + after;
    } else {
      insertText = before + (placeholder || '') + after;
    }
    
    this.editedDescription = 
      this.editedDescription.substring(0, start) + 
      insertText + 
      this.editedDescription.substring(end);
    
    this.cdr.detectChanges();
    
    setTimeout(() => {
      const newPosition = selectedText ? 
        start + insertText.length : 
        start + before.length;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  insertBold() {
    this.insertMarkdown('**', '**', 'bold text');
  }

  insertItalic() {
    this.insertMarkdown('*', '*', 'italic text');
  }

  insertCode() {
    this.insertMarkdown('`', '`', 'code');
  }

  insertHeader(level: number = 1) {
    const prefix = '#'.repeat(level) + ' ';
    const textarea = this.descriptionTextarea?.nativeElement;
    
    if (this.showPreview) {
      this.showPreview = false;
      this.cdr.detectChanges();
      setTimeout(() => this.doInsertHeader(prefix), 0);
    } else {
      this.doInsertHeader(prefix);
    }
  }

  private doInsertHeader(prefix: string) {
    const textarea = this.descriptionTextarea.nativeElement;
    const start = textarea.selectionStart;
    const lines = this.editedDescription.split('\n');
    const lineStart = this.editedDescription.substring(0, start).lastIndexOf('\n') + 1;
    const lineEnd = this.editedDescription.indexOf('\n', start);
    const currentLineEnd = lineEnd === -1 ? this.editedDescription.length : lineEnd;
    const currentLine = this.editedDescription.substring(lineStart, currentLineEnd);
    
    const headerMatch = currentLine.match(/^#{1,6}\s/);
    let newLine;
    
    if (headerMatch) {
      newLine = prefix + currentLine.substring(headerMatch[0].length);
    } else {
      newLine = prefix + currentLine;
    }
    
    this.editedDescription = 
      this.editedDescription.substring(0, lineStart) + 
      newLine + 
      this.editedDescription.substring(currentLineEnd);
    
    this.cdr.detectChanges();
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = lineStart + newLine.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  insertList() {
    this.insertLinePrefix('- ', 'list item');
  }

  insertOrderedList() {
    this.insertLinePrefix('1. ', 'list item');
  }

  insertQuote() {
    this.insertLinePrefix('> ', 'quote text');
  }

  private insertLinePrefix(prefix: string, placeholder: string) {
    if (this.showPreview) {
      this.showPreview = false;
      this.cdr.detectChanges();
      setTimeout(() => this.doInsertLinePrefix(prefix, placeholder), 0);
    } else {
      this.doInsertLinePrefix(prefix, placeholder);
    }
  }

  private doInsertLinePrefix(prefix: string, placeholder: string) {
    const textarea = this.descriptionTextarea.nativeElement;
    const start = textarea.selectionStart;
    const beforeCursor = this.editedDescription.substring(0, start);
    const afterCursor = this.editedDescription.substring(start);
    
    const atLineStart = start === 0 || this.editedDescription.charAt(start - 1) === '\n';
    
    let insertText = '';
    if (atLineStart) {
      insertText = prefix + placeholder;
    } else {
      insertText = '\n' + prefix + placeholder;
    }
    
    this.editedDescription = beforeCursor + insertText + afterCursor;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  insertLink() {
    this.insertMarkdown('[', '](url)', 'link text');
  }

  insertHorizontalRule() {
    if (this.showPreview) {
      this.showPreview = false;
      this.cdr.detectChanges();
      setTimeout(() => this.doInsertHorizontalRule(), 0);
    } else {
      this.doInsertHorizontalRule();
    }
  }

  private doInsertHorizontalRule() {
    const textarea = this.descriptionTextarea.nativeElement;
    const start = textarea.selectionStart;
    const beforeCursor = this.editedDescription.substring(0, start);
    const afterCursor = this.editedDescription.substring(start);
    
    const insertText = (start === 0 || this.editedDescription.charAt(start - 1) === '\n') ? 
      '---\n' : '\n---\n';
    
    this.editedDescription = beforeCursor + insertText + afterCursor;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
    this.modalClosed.emit();
    this.resetForm();
  }

  private resetForm() {
    this.editedTitle = this.cardData?.title || '';
    this.editedDescription = this.cardData?.description || '';
    this.isLoading = false;
    this.showPreview = true;
  }

  saveCard() {
    if (!this.editedTitle.trim() || !this.cardData?.id) {
      return;
    }

    this.isLoading = true;

    this.cardService.updateCard(
      this.cardData.id, 
      this.editedTitle.trim(), 
      this.editedDescription.trim()
    ).subscribe({
      next: (updatedCard) => {
        const cardToEmit: CardModel = {
          ...this.cardData!,
          title: this.editedTitle.trim(),
          description: this.editedDescription.trim()
        };
        this.cardUpdated.emit(cardToEmit);
        this.closeModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating card:', error);
        alert('Failed to update card. Please try again.');
        this.isLoading = false;
      }
    });
  }
} 