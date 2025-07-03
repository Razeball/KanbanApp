import { Injectable } from '@angular/core';
import { Document } from '../../models/document';
import { Board } from '../../models/board';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly CARD_COMPLETION_KEY = 'prodoku_card_completion';
  private readonly DOCUMENTS_KEY = 'prodoku_documents';
  private readonly BOARDS_KEY = 'prodoku_boards';

  
  getCardCompletionStates(): Record<string, boolean> {
    try {
      const stored = localStorage.getItem(this.CARD_COMPLETION_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading card completion states from localStorage:', error);
      return {};
    }
  }

 
  getCardCompletionState(cardId: string): boolean {
    const states = this.getCardCompletionStates();
    return states[cardId] || false;
  }

  
  setCardCompletionState(cardId: string, completed: boolean): void {
    try {
      const states = this.getCardCompletionStates();
      
      if (completed) {
        states[cardId] = true;
      } else {
        delete states[cardId]; 
      }
      
      localStorage.setItem(this.CARD_COMPLETION_KEY, JSON.stringify(states));
    } catch (error) {
      console.error('Error saving card completion state to localStorage:', error);
    }
  }

  
  removeCardCompletionState(cardId: string): void {
    try {
      const states = this.getCardCompletionStates();
      delete states[cardId];
      localStorage.setItem(this.CARD_COMPLETION_KEY, JSON.stringify(states));
    } catch (error) {
      console.error('Error removing card completion state from localStorage:', error);
    }
  }


  clearAllCompletionStates(): void {
    try {
      localStorage.removeItem(this.CARD_COMPLETION_KEY);
    } catch (error) {
      console.error('Error clearing card completion states from localStorage:', error);
    }
  }

  
  getDocuments(): Document[] {
    try {
      const stored = localStorage.getItem(this.DOCUMENTS_KEY);
      const documents = stored ? JSON.parse(stored) : [];
      
      documents.forEach((doc: any) => {
        doc.createdAt = new Date(doc.createdAt);
        doc.updatedAt = new Date(doc.updatedAt);
      });
      return documents;
    } catch (error) {
      console.error('Error reading documents from localStorage:', error);
      return [];
    }
  }

  saveDocuments(documents: Document[]): void {
    try {
      localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents));
    } catch (error) {
      console.error('Error saving documents to localStorage:', error);
    }
  }

  getDocument(id: string): Document | null {
    const documents = this.getDocuments();
    return documents.find(doc => doc.id === id) || null;
  }

  addDocument(document: Document): Document[] {
    const documents = this.getDocuments();
    documents.push(document);
    this.saveDocuments(documents);
    return documents;
  }

  updateDocument(id: string, updates: Partial<Document>): Document[] {
    const documents = this.getDocuments();
    const index = documents.findIndex(doc => doc.id === id);
    
    if (index !== -1) {
      documents[index] = { ...documents[index], ...updates, updatedAt: new Date() };
      this.saveDocuments(documents);
    }
    return documents;
  }

  deleteDocument(id: string): Document[] {
    const documents = this.getDocuments();
    const filtered = documents.filter(doc => doc.id !== id);
    this.saveDocuments(filtered);
    return filtered;
  }


  getBoards(): Board[] {
    try {
      const stored = localStorage.getItem(this.BOARDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading boards from localStorage:', error);
      return [];
    }
  }

  saveBoards(boards: Board[]): void {
    try {
      localStorage.setItem(this.BOARDS_KEY, JSON.stringify(boards));
    } catch (error) {
      console.error('Error saving boards to localStorage:', error);
    }
  }

  getBoard(id: string): Board | null {
    const boards = this.getBoards();
    return boards.find(board => board.id === id) || null;
  }

  addBoard(board: Board): Board[] {
    const boards = this.getBoards();
    boards.push(board);
    this.saveBoards(boards);
    return boards;
  }

  updateBoard(id: string, updates: Partial<Board>): Board[] {
    const boards = this.getBoards();
    const index = boards.findIndex(board => board.id === id);
    
    if (index !== -1) {
      boards[index] = { ...boards[index], ...updates };
      this.saveBoards(boards);
    }
    return boards;
  }

  createListInBoard(boardId: string, title: string): any {
    const boards = this.getBoards();
    const boardIndex = boards.findIndex(board => board.id === boardId);
    
    if (boardIndex !== -1) {
      const newList = {
        id: 'list_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
        title: title,
        boardId: boardId,
        Cards: []
      };
      
      if (!boards[boardIndex].Lists) {
        boards[boardIndex].Lists = [];
      }
      boards[boardIndex].Lists.push(newList);
      this.saveBoards(boards);
      return newList;
    }
    return null;
  }

  createCardInList(listId: string, title: string): any {
    const boards = this.getBoards();
    
    for (let board of boards) {
      if (board.Lists) {
        const listIndex = board.Lists.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
          const newCard = {
            id: 'card_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
            title: title,
            description: '',
            listId: listId,
            order: board.Lists[listIndex].Cards?.length || 0
          };
          
          if (!board.Lists[listIndex].Cards) {
            board.Lists[listIndex].Cards = [];
          }
          board.Lists[listIndex].Cards.push(newCard);
          this.saveBoards(boards);
          return newCard;
        }
      }
    }
    return null;
  }

  updateCardInList(cardId: string, updates: any): any {
    const boards = this.getBoards();
    
    for (let board of boards) {
      if (board.Lists) {
        for (let list of board.Lists) {
          if (list.Cards) {
            const cardIndex = list.Cards.findIndex(card => card.id === cardId);
            if (cardIndex !== -1) {
              list.Cards[cardIndex] = { ...list.Cards[cardIndex], ...updates };
              this.saveBoards(boards);
              return list.Cards[cardIndex];
            }
          }
        }
      }
    }
    return null;
  }

  deleteCardFromList(cardId: string): boolean {
    const boards = this.getBoards();
    
    for (let board of boards) {
      if (board.Lists) {
        for (let list of board.Lists) {
          if (list.Cards) {
            const cardIndex = list.Cards.findIndex(card => card.id === cardId);
            if (cardIndex !== -1) {
              list.Cards.splice(cardIndex, 1);
              this.saveBoards(boards);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  moveCardBetweenLists(cardId: string, targetListId: string, newOrder: number): boolean {
    const boards = this.getBoards();
    let cardToMove = null;
    
    for (let board of boards) {
      if (board.Lists) {
        for (let list of board.Lists) {
          if (list.Cards) {
            const cardIndex = list.Cards.findIndex(card => card.id === cardId);
            if (cardIndex !== -1) {
              cardToMove = list.Cards.splice(cardIndex, 1)[0];
              break;
            }
          }
        }
        if (cardToMove) break;
      }
    }
    
    if (cardToMove) {
      for (let board of boards) {
        if (board.Lists) {
          const targetList = board.Lists.find(list => list.id === targetListId);
          if (targetList) {
            if (!targetList.Cards) {
              targetList.Cards = [];
            }
            cardToMove.listId = targetListId;
            cardToMove.order = newOrder;
            targetList.Cards.splice(newOrder, 0, cardToMove);
            this.saveBoards(boards);
            return true;
          }
        }
      }
    }
    return false;
  }

  deleteBoard(id: string): Board[] {
    const boards = this.getBoards();
    const filtered = boards.filter(board => board.id !== id);
    this.saveBoards(filtered);
    return filtered;
  }

  
  clearAllLocalData(): void {
    try {
      localStorage.removeItem(this.DOCUMENTS_KEY);
      localStorage.removeItem(this.BOARDS_KEY);
      localStorage.removeItem(this.CARD_COMPLETION_KEY);
    } catch (error) {
      console.error('Error clearing local storage data:', error);
    }
  }

  clearAllData(): void {
    localStorage.removeItem(this.DOCUMENTS_KEY);
    localStorage.removeItem(this.BOARDS_KEY);
  }
} 