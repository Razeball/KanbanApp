import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document/document';
import { Document } from '../../models/document';
import { TitleInputModal } from '../title-input-modal/title-input-modal';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-documents',
  imports: [TitleInputModal, ConfirmationModal, FormsModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit {
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  documents: Document[] = [];
  isLoading = true;
  searchQuery = '';
  filteredDocuments: Document[] = [];
  recentDocuments: Document[] = [];
  
 
  openDropdownId: string | null = null;

  isCreateModalOpen = false;
  isDeleteModalOpen = false;
  selectedDocument: Document | null = null;
  

  isImporting = false;

  ngOnInit() {
    this.loadDocuments();
    this.loadRecentActivity();
  }

  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown-container');
    if (!dropdown) {
      this.openDropdownId = null;
      this.cdr.detectChanges();
    }
  }

  private loadDocuments() {
    this.documentService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        this.filterDocuments();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadRecentActivity() {
    
    const recentIds = this.getRecentDocumentIds();
    this.recentDocuments = recentIds
      .map(id => this.documents.find(doc => doc.id === id))
      .filter(doc => doc !== undefined) as Document[];
  }

  private getRecentDocumentIds(): string[] {
    try {
      const recent = localStorage.getItem('prodoku_recent_documents');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  }

  private addToRecentActivity(documentId: string) {
    let recentIds = this.getRecentDocumentIds();
    recentIds = recentIds.filter(id => id !== documentId);
    recentIds.unshift(documentId);
    recentIds = recentIds.slice(0, 5); 
    localStorage.setItem('prodoku_recent_documents', JSON.stringify(recentIds));
    this.loadRecentActivity();
  }

  toggleDropdown(documentId: string, event: Event) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === documentId ? null : documentId;
    this.cdr.detectChanges();
  }

  isDropdownOpen(documentId: string): boolean {
    return this.openDropdownId === documentId;
  }

  filterDocuments() {
    if (!this.searchQuery.trim()) {
      this.filteredDocuments = [...this.documents];
    } else {
      this.filteredDocuments = this.documentService.searchDocuments(this.searchQuery);
    }
  }

  onSearchChange() {
    this.filterDocuments();
    this.cdr.detectChanges();
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    this.cdr.detectChanges();
  }

  onCreateDocument(title: string) {
    if (title.trim()) {
      const newDocument = this.documentService.createDocument(title.trim());
      this.router.navigate(['/document', newDocument.id]);
    }
    this.closeCreateModal();
  }

  openDocument(document: Document) {
    this.addToRecentActivity(document.id);
    this.router.navigate(['/document', document.id]);
  }

  confirmDeleteDocument(document: Document, event: Event) {
    event.stopPropagation();
    this.selectedDocument = document;
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.selectedDocument = null;
    this.cdr.detectChanges();
  }

  deleteDocument() {
    if (this.selectedDocument) {
      this.documentService.deleteDocument(this.selectedDocument.id);
      this.closeDeleteModal();
    }
  }

  exportDocument(document: Document, event: Event) {
    event.stopPropagation();
    this.documentService.exportDocument(document.id);
  }

  exportAllDocuments() {
    this.documentService.exportAllDocuments();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && (file.type === 'text/markdown' || file.name.endsWith('.md'))) {
      this.isImporting = true;
      this.cdr.detectChanges();
      
      this.documentService.importDocument(file).then(
        (document) => {
          this.isImporting = false;
          this.cdr.detectChanges();
    
          input.value = '';
        
          this.router.navigate(['/document', document.id]);
        }
      ).catch(
        (error) => {
          console.error('Error importing document:', error);
          alert('Failed to import document. Please try again.');
          this.isImporting = false;
          this.cdr.detectChanges();
          input.value = '';
        }
      );
    } else {
      alert('Please select a valid Markdown file (.md)');
      if (input) input.value = '';
    }
  }

  triggerFileInput() {
    const fileInput = globalThis.document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
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

  getDocumentPreview(content: string): string {
 
    let preview = content
      .replace(/#{1,6}\s/g, '') 
      .replace(/\*\*(.*?)\*\*/g, '$1') 
      .replace(/\*(.*?)\*/g, '$1') 
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
      .replace(/>/g, '') 
      .replace(/[-*+]\s/g, '') 
      .replace(/\d+\.\s/g, '') 
      .trim();
    
    return preview.length > 150 ? preview.substring(0, 150) + '...' : preview;
  }

  get deleteMessage(): string {
    return `Are you sure you want to delete "${this.selectedDocument?.title || ''}"? This action cannot be undone.`;
  }
} 