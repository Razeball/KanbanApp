import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { BoardService } from '../../services/board/board';
import { DocumentService } from '../../services/document/document';
import { List } from '../../models/list';
import { Board } from '../../models/board';
import { Document } from '../../models/document';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private boardService = inject(BoardService);
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  boardStats = {
    total: 0,
    active: 0,
    totalCards: 0
  };

  documentStats = {
    total: 0,
    recent: 0,
    totalWords: 0
  };

  recentActivity: Array<{
    type: 'board' | 'document';
    id: string;
    title: string;
    timestamp: Date;
    action: string;
  }> = [];

  ngOnInit() {
    this.loadStats();
    this.loadRecentActivity();
  }

  private loadStats() {
   
    this.boardService.getBoards().subscribe(boards => {
      this.boardStats.total = boards.length;
      this.boardStats.active = boards.length; 
      
      let totalCards = 0;
      boards.forEach(board => {
        if (board.Lists) {
          board.Lists.forEach((list: List) => {
            if (list.Cards) {
              totalCards += list.Cards.length;
            }
          });
        }
      });
      this.boardStats.totalCards = totalCards;
      
      this.updateBoardElements();
      this.cdr.detectChanges();
    });

    
    this.documentService.getDocuments().subscribe(documents => {
      this.documentStats.total = documents.length;
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      this.documentStats.recent = documents.filter(doc => 
        new Date(doc.updatedAt) > weekAgo
      ).length;
   
      let totalWords = 0;
      documents.forEach(doc => {
        const words = doc.content.split(/\s+/).filter(word => word.length > 0);
        totalWords += words.length;
      });
      this.documentStats.totalWords = totalWords;
      
      this.updateDocumentElements();
      this.cdr.detectChanges();
    });
  }

  private loadRecentActivity() {
    const activity: Array<{
      type: 'board' | 'document';
      id: string;
      title: string;
      timestamp: Date;
      action: string;
    }> = [];

    
    try {
      const recentDocIds = localStorage.getItem('prodoku_recent_documents');
      if (recentDocIds) {
        const docIds = JSON.parse(recentDocIds);
        this.documentService.getDocuments().subscribe(documents => {
          docIds.slice(0, 3).forEach((id: string) => {
            const doc = documents.find(d => d.id === id);
            if (doc) {
              activity.push({
                type: 'document',
                id: doc.id,
                title: doc.title,
                timestamp: new Date(doc.updatedAt),
                action: 'Edited document'
              });
            }
          });
          
       
          this.boardService.getBoards().subscribe(boards => {
            const recentBoards = boards.slice(0, 2);
            
            recentBoards.forEach(board => {
              if (board.id) {
                activity.push({
                  type: 'board',
                  id: board.id,
                  title: board.title,
                  timestamp: new Date(), 
                  action: 'Board activity'
                });
              }
            });
            
        
            this.recentActivity = activity
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .slice(0, 5);
              
            this.updateRecentActivityDisplay();
            this.cdr.detectChanges();
          });
        });
      } else {
       
        this.boardService.getBoards().subscribe(boards => {
          const recentBoards = boards.slice(0, 5);
          
          this.recentActivity = recentBoards
            .filter(board => board.id)
            .map(board => ({
              type: 'board' as const,
              id: board.id!,
              title: board.title,
              timestamp: new Date(),
              action: 'Board activity'
            }));
          
          this.updateRecentActivityDisplay();
          this.cdr.detectChanges();
        });
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  private updateRecentActivityDisplay() {
    const container = globalThis.document.getElementById('recent-activity');
    if (!container) return;

    if (this.recentActivity.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <p>No recent activity</p>
          <p class="text-sm mt-1">Start by creating a board or document</p>
        </div>
      `;
      return;
    }

    const activityHTML = this.recentActivity.map(item => {
      const icon = item.type === 'document' 
        ? `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
           </svg>`
        : `<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
           </svg>`;
      
      const timeAgo = this.getTimeAgo(item.timestamp);
      const route = item.type === 'document' ? `/document/${item.id}` : `/board/${item.id}`;
      
      return `
        <div class="flex items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer" onclick="window.location.href='${route}'">
          <div class="flex-shrink-0 mr-3">
            ${icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white truncate">${this.escapeHtml(item.title)}</div>
            <div class="text-xs text-gray-400">${item.action} • ${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="space-y-3">${activityHTML}</div>`;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  private escapeHtml(text: string): string {
    const div = globalThis.document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private updateBoardElements() {
    const boardCountEl = globalThis.document.getElementById('board-count');
    const activeBoardsEl = globalThis.document.getElementById('active-boards');
    const totalCardsEl = globalThis.document.getElementById('total-cards');
    
    if (boardCountEl) boardCountEl.textContent = this.boardStats.total.toString();
    if (activeBoardsEl) activeBoardsEl.textContent = this.boardStats.active.toString();
    if (totalCardsEl) totalCardsEl.textContent = this.boardStats.totalCards.toString();
  }

  private updateDocumentElements() {
    const documentCountEl = globalThis.document.getElementById('document-count');
    const recentDocsEl = globalThis.document.getElementById('recent-docs');
    const totalWordsEl = globalThis.document.getElementById('total-words');
    
    if (documentCountEl) documentCountEl.textContent = this.documentStats.total.toString();
    if (recentDocsEl) recentDocsEl.textContent = this.documentStats.recent.toString();
    if (totalWordsEl) totalWordsEl.textContent = this.documentStats.totalWords.toString();
  }

  openDocument(id: string) {
    this.router.navigate(['/document', id]);
  }

  openBoard(id: string) {
    this.router.navigate(['/board', id]);
  }
}
