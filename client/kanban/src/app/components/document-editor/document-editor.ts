import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document/document';
import { MarkdownService } from '../../services/markdown/markdown';
import { Document } from '../../models/document';

@Component({
  selector: 'app-document-editor',
  imports: [FormsModule],
  templateUrl: './document-editor.html',
  styleUrl: './document-editor.css'
})
export class DocumentEditor implements OnInit {
  @ViewChild('contentTextarea') contentTextarea!: ElementRef<HTMLTextAreaElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private markdownService = inject(MarkdownService);
  private cdr = inject(ChangeDetectorRef);

  document: Document | null = null;
  isLoading = true;
  isEditing = false;
  showPreview = false;
  isSaving = false;
  lastSaved: Date | null = null;
  isDropdownOpen = false;
  

  private autoSaveInterval: any;
  hasUnsavedChanges = false;

  ngOnInit() {
    const documentId = this.route.snapshot.paramMap.get('id');
    if (documentId) {
      this.loadDocument(documentId);
      this.setupAutoSave();
    } else {
      this.router.navigate(['/documents']);
    }
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.hasUnsavedChanges && this.document) {
      this.saveDocument();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isDropdownOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.closeDropdown();
      }
    }
  }

  private loadDocument(id: string) {
    const doc = this.documentService.getDocument(id);
    if (doc) {
      this.document = { ...doc };
      this.isLoading = false;
      this.cdr.detectChanges();
    } else {

      this.router.navigate(['/documents']);
    }
  }

  private setupAutoSave() {
 
    this.autoSaveInterval = setInterval(() => {
      if (this.hasUnsavedChanges && this.document) {
        this.saveDocument();
      }
    }, 30000);
  }

  onContentChange() {
    this.hasUnsavedChanges = true;
    this.cdr.detectChanges();
  }

  onTitleChange() {
    this.hasUnsavedChanges = true;
    this.cdr.detectChanges();
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
    this.cdr.detectChanges();
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing && this.showPreview) {
      this.showPreview = false;
    }
    this.cdr.detectChanges();
  }

  saveDocument() {
    if (!this.document || this.isSaving) return;

    this.isSaving = true;
    
    const updated = this.documentService.updateDocument(this.document.id, {
      title: this.document.title,
      content: this.document.content
    });

    if (updated) {
      this.document = updated;
      this.hasUnsavedChanges = false;
      this.lastSaved = new Date();
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    this.cdr.detectChanges();
  }

  closeDropdown() {
    this.isDropdownOpen = false;
    this.cdr.detectChanges();
  }

  exportDocument() {
    if (this.document) {
      this.documentService.exportDocument(this.document.id);
    }
    this.closeDropdown();
  }

  deleteDocument() {
    if (!this.document) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${this.document.title}"? This action cannot be undone.`);
    if (confirmed) {
      this.documentService.deleteDocument(this.document.id);
      this.router.navigate(['/documents']);
    }
    this.closeDropdown();
  }

  goBack() {
    if (this.hasUnsavedChanges) {
      const save = confirm('You have unsaved changes. Do you want to save before leaving?');
      if (save) {
        this.saveDocument();
      }
    }
    this.router.navigate(['/documents']);
  }

  get renderedContent(): string {
    if (!this.document?.content) return '';
    
    if (this.markdownService.hasMarkdownSyntax(this.document.content)) {
      return this.markdownService.parseMarkdown(this.document.content);
    }
    
    return this.document.content.replace(/\n/g, '<br>');
  }

  get hasMarkdownSyntax(): boolean {
    return this.document ? this.markdownService.hasMarkdownSyntax(this.document.content) : false;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }


  insertMarkdown(before: string, after: string = '', placeholder: string = '') {
    if (!this.isEditing) return;
    
    const textarea = this.contentTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.document!.content.substring(start, end);
    
    let insertText = '';
    if (selectedText) {
      insertText = before + selectedText + after;
    } else {
      insertText = before + (placeholder || '') + after;
    }
    
    this.document!.content = 
      this.document!.content.substring(0, start) + 
      insertText + 
      this.document!.content.substring(end);
    
    this.onContentChange();
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
    this.insertLineContent(prefix, 'header text');
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

  insertLink() {
    this.insertMarkdown('[', '](url)', 'link text');
  }

  insertHorizontalRule() {
    this.insertLineContent('---', '');
  }

  private insertLineContent(content: string, placeholder: string) {
    if (!this.isEditing || !this.document) return;

    const textarea = this.contentTextarea.nativeElement;
    const start = textarea.selectionStart;
    const beforeCursor = this.document.content.substring(0, start);
    const afterCursor = this.document.content.substring(start);
    
    const atLineStart = start === 0 || this.document.content.charAt(start - 1) === '\n';
    
    let insertText = '';
    if (atLineStart) {
      insertText = content + (placeholder ? ' ' + placeholder : '');
    } else {
      insertText = '\n' + content + (placeholder ? ' ' + placeholder : '');
    }
    
    this.document.content = beforeCursor + insertText + afterCursor;
    this.onContentChange();
    this.cdr.detectChanges();
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  private insertLinePrefix(prefix: string, placeholder: string) {
    if (!this.isEditing || !this.document) return;

    const textarea = this.contentTextarea.nativeElement;
    const start = textarea.selectionStart;
    const beforeCursor = this.document.content.substring(0, start);
    const afterCursor = this.document.content.substring(start);
    
    const atLineStart = start === 0 || this.document.content.charAt(start - 1) === '\n';
    
    let insertText = '';
    if (atLineStart) {
      insertText = prefix + placeholder;
    } else {
      insertText = '\n' + prefix + placeholder;
    }
    
    this.document.content = beforeCursor + insertText + afterCursor;
    this.onContentChange();
    this.cdr.detectChanges();
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }
} 