import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly CARD_COMPLETION_KEY = 'prodoku_card_completion';

  
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
} 