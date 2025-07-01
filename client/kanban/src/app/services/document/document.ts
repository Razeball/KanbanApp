import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Document } from '../../models/document';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly DOCUMENTS_KEY = 'prodoku_documents';
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  public documents$ = this.documentsSubject.asObservable();

  constructor() {
    this.loadDocuments();
  }

 
  private loadDocuments(): void {
    try {
      const stored = localStorage.getItem(this.DOCUMENTS_KEY);
      const documents = stored ? JSON.parse(stored) : [];
      
      documents.forEach((doc: any) => {
        doc.createdAt = new Date(doc.createdAt);
        doc.updatedAt = new Date(doc.updatedAt);
      });
      this.documentsSubject.next(documents);
    } catch (error) {
      console.error('Error loading documents from localStorage:', error);
      this.documentsSubject.next([]);
    }
  }


  private saveDocuments(documents: Document[]): void {
    try {
      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents));
      this.documentsSubject.next(documents);
    } catch (error) {
      console.error('Error saving documents to localStorage:', error);
    }
  }


  getDocuments(): Observable<Document[]> {
    return this.documents$;
  }


  getDocument(id: string): Document | null {
    const documents = this.documentsSubject.value;
    return documents.find(doc => doc.id === id) || null;
  }


  createDocument(title: string, content: string = '', tags: string[] = []): Document {
    const newDocument: Document = {
      id: this.generateId(),
      title: title.trim(),
      content: content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: tags
    };

    const documents = [...this.documentsSubject.value, newDocument];
    this.saveDocuments(documents);
    return newDocument;
  }


  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const documents = this.documentsSubject.value;
    const index = documents.findIndex(doc => doc.id === id);
    
    if (index === -1) return null;

    const updatedDocument = {
      ...documents[index],
      ...updates,
      updatedAt: new Date()
    };

    documents[index] = updatedDocument;
    this.saveDocuments(documents);
    return updatedDocument;
  }


  deleteDocument(id: string): boolean {
    const documents = this.documentsSubject.value;
    const filtered = documents.filter(doc => doc.id !== id);
    
    if (filtered.length === documents.length) return false;
    
    this.saveDocuments(filtered);
    return true;
  }


  exportDocument(id: string): void {
    const document = this.getDocument(id);
    if (!document) return;

    const content = `# ${document.title}\n\n${document.content}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    
    const link = globalThis.document.createElement('a');
    link.href = url;
    link.download = `${this.sanitizeFilename(document.title)}.md`;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }


  importDocument(file: File): Promise<Document> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const title = this.extractTitleFromMarkdown(content) || file.name.replace('.md', '');
          const cleanContent = this.removeExtractedTitle(content);
          
          const newDocument = this.createDocument(title, cleanContent);
          resolve(newDocument);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }


  exportAllDocuments(): void {
    const documents = this.documentsSubject.value;
    if (documents.length === 0) return;


    let combinedContent = '# All Documents\n\n';
    
    documents.forEach((doc, index) => {
      combinedContent += `## ${doc.title}\n\n`;
      combinedContent += `${doc.content}\n\n`;
      if (index < documents.length - 1) {
        combinedContent += '---\n\n';
      }
    });

    const blob = new Blob([combinedContent], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    
    const link = globalThis.document.createElement('a');
    link.href = url;
    link.download = 'all-documents.md';
    link.click();
    
    window.URL.revokeObjectURL(url);
  }


  private generateId(): string {
    return 'doc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  private extractTitleFromMarkdown(content: string): string | null {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine?.startsWith('# ')) {
      return firstLine.substring(2).trim();
    }
    
    return null;
  }

  private removeExtractedTitle(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine?.startsWith('# ')) {
    
      let startIndex = 1;
      while (startIndex < lines.length && lines[startIndex].trim() === '') {
        startIndex++;
      }
      return lines.slice(startIndex).join('\n');
    }
    
    return content;
  }

 
  searchDocuments(query: string): Document[] {
    if (!query.trim()) return this.documentsSubject.value;
    
    const searchTerm = query.toLowerCase();
    return this.documentsSubject.value.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.content.toLowerCase().includes(searchTerm) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
} 