import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, of, catchError, map, forkJoin } from 'rxjs';
import { Document } from '../../models/document';
import { Auth } from '../authorization/auth';
import { LocalStorageService } from '../local-storage/local-storage';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../notification/notification';
import { Router } from '@angular/router';
//This would be better if I divide it, too lazy for that
@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly apiUrl = environment.APP_URL;
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private localStorageService = inject(LocalStorageService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  public documents$ = this.documentsSubject.asObservable();

  constructor() {
    this.auth.authState$.subscribe(isAuthenticated => {
      setTimeout(() => {
        this.loadDocuments();
      }, 100);
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'serverStorageEnabled') {
        setTimeout(() => {
          this.loadDocuments();
        }, 100);
      }
    });

    window.addEventListener('storagePreferenceChanged', () => {
      setTimeout(() => {
        this.loadDocuments();
      }, 100);
    });
  }

  private loadDocuments(): void {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      
      this.http.get<Document[]>(`${this.apiUrl}/document`, { withCredentials: true })
        .pipe(
          catchError(error => {
            console.error('Error loading documents from server:', error);
            return of([]);
          })
        )
        .subscribe(documents => {
          documents.forEach(doc => {
            if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
            if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
          });
          this.documentsSubject.next(documents);
        });
    } else {
      
      const documents = this.localStorageService.getDocuments();
      this.documentsSubject.next(documents);
    }
  }

  getDocuments(): Observable<Document[]> {
    return this.documents$;
  }

  getDocument(id: string): Observable<Document | null> {
    const isAuthenticated = this.auth.getCurrentAuthState();
    const serverStorageEnabled = localStorage.getItem('serverStorageEnabled');
    const useServer = isAuthenticated && serverStorageEnabled !== 'false';
    
    if (useServer) {
      return this.http.get<Document>(`${this.apiUrl}/document/${id}`, { withCredentials: true })
        .pipe(
          map(doc => {
            if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
            if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
            return doc;
          }),
          catchError(error => {
            console.error(`Error fetching document ${id} from server:`, error);
            const localDocument = this.localStorageService.getDocument(id);
            return of(localDocument);
          })
        );
    } else {
      const document = this.localStorageService.getDocument(id);
      return of(document);
    }
  }

  createDocument(titleOrDocument: string | Document, content: string = '', tags: string[] = []): Observable<Document> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    
    let documentData: {title: string, content: string, tags: string[]};
    if (typeof titleOrDocument === 'string') {
      documentData = {
        title: titleOrDocument.trim(),
        content: content,
        tags: tags
      };
    } else {
      documentData = {
        title: titleOrDocument.title.trim(),
        content: titleOrDocument.content,
        tags: titleOrDocument.tags || []
      };
    }
    
    if (useServer) {
      return this.http.post<Document>(`${this.apiUrl}/document`, documentData, { withCredentials: true })
        .pipe(
          map(doc => {
            if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
            if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
            this.loadDocuments(); 
            return doc;
          }),
          catchError(error => {
            console.error('Error creating document on server:', error);
            throw error;
          })
        );
    } else {
      const newDocument: Document = {
        id: this.generateId(),
        title: documentData.title,
        content: documentData.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: documentData.tags
      };
      
      this.localStorageService.addDocument(newDocument);
      const documents = this.localStorageService.getDocuments();
      this.documentsSubject.next(documents);
      
      this.showLoginReminderIfNeeded();
      return of(newDocument);
    }
  }

  updateDocument(id: string, updates: Partial<Document>): Observable<Document | null> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.put<Document>(`${this.apiUrl}/document/${id}`, updates, { withCredentials: true })
        .pipe(
          map(doc => {
            if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
            if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
            this.loadDocuments(); 
            return doc;
          }),
          catchError(error => {
            console.error('Error updating document on server:', error);
            return of(null);
          })
        );
    } else {
      this.localStorageService.updateDocument(id, updates);
      const documents = this.localStorageService.getDocuments();
      this.documentsSubject.next(documents);
      const updatedDocument = documents.find(doc => doc.id === id) || null;
      return of(updatedDocument);
    }
  }

  deleteDocument(id: string): Observable<boolean> {
    const useServer = this.auth.getCurrentAuthState() && localStorage.getItem('serverStorageEnabled') !== 'false';
    if (useServer) {
      return this.http.delete(`${this.apiUrl}/document/${id}`, { withCredentials: true })
        .pipe(
          map(() => {
            this.loadDocuments(); 
            return true;
          }),
          catchError(error => {
            console.error('Error deleting document on server:', error);
            return of(false);
          })
        );
    } else {
      this.localStorageService.deleteDocument(id);
      const documents = this.localStorageService.getDocuments();
      this.documentsSubject.next(documents);
      return of(true);
    }
  }

  exportDocument(id: string): void {
    this.getDocument(id).subscribe(document => {
      if (!document) return;

      const content = `# ${document.title}\n\n${document.content}`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = `${this.sanitizeFilename(document.title)}.md`;
      link.click();
      
      window.URL.revokeObjectURL(url);
    });
  }

  importDocument(file: File): Promise<Document> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const title = this.extractTitleFromMarkdown(content) || file.name.replace('.md', '');
          const cleanContent = this.removeExtractedTitle(content);
          
          this.createDocument(title, cleanContent).subscribe({
            next: (newDocument) => resolve(newDocument),
            error: (error) => reject(error)
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  exportAllDocuments(): void {
    this.documents$.subscribe(documents => {
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
    });
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

  migrateLocalDocumentsToServer(): Observable<boolean> {
    if (!this.auth.getCurrentAuthState()) {
      return of(false);
    }

    const localDocuments = this.localStorageService.getDocuments();
    if (localDocuments.length === 0) {
      return of(true);
    }

    const migrations = localDocuments.map(doc => 
      this.http.post<Document>(`${this.apiUrl}/document`, {
        title: doc.title,
        content: doc.content,
        tags: doc.tags
      }, { withCredentials: true })
    );

    return forkJoin(migrations).pipe(
      map(() => {
        this.localStorageService.saveDocuments([]);
        this.loadDocuments(); 
        return true;
      }),
      catchError(error => {
        console.error('Error during migration:', error);
        return of(false);
      })
    );
  }

  private showLoginReminderIfNeeded() {
    const documentsCount = this.localStorageService.getDocuments().length;
    if (documentsCount >= 2) {
      setTimeout(() => {
        this.notificationService.showLoginReminder(this.router);
      }, 1000);
    }
  }
} 