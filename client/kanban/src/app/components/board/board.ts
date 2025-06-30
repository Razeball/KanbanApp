import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { List } from '../list/list';
import { BoardService } from '../../services/board/board';
import { ListService } from '../../services/list/list';
import { Board as BoardModel } from '../../models/board';
import { List as ListModel } from '../../models/list';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-board',
  imports: [List],
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class Board implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private listService = inject(ListService);
  private cdr = inject(ChangeDetectorRef);
  
  boardData: BoardModel | null = null;
  boardLists: ListModel[] = [];
  isLoading = false;
  error: string | null = null;
  boardId: string | null = null;

  private boardDataSubject = new BehaviorSubject<BoardModel | null>(null);
  private listsSubject = new BehaviorSubject<ListModel[]>([]);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.boardId = params['id'];
      if (this.boardId) {
        this.loadBoard();
      }
    });
  }

  loadBoard() {
    if (!this.boardId) return;
    
    this.isLoading = true;
    this.error = null;
    this.boardData = null;
    this.boardLists = [];
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
    
    this.boardService.getBoardById(this.boardId).subscribe({
      next: (board) => {
        setTimeout(() => {
          this.boardData = board;
          this.boardLists = board.Lists || [];
          this.isLoading = false;
          this.error = null;
          
          this.boardDataSubject.next(board);
          this.listsSubject.next(this.boardLists);
          
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading board:', error);
        setTimeout(() => {
          this.error = 'Failed to load board. Please try again.';
          this.isLoading = false;
          this.boardData = null;
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  createList() {
    const title = prompt('Enter list title:');
    if (title && this.boardId) {
      const newList: ListModel = {
        title: title,
        boardId: this.boardId
      };
      
      this.listService.createList(newList).subscribe({
        next: (list) => {
          this.boardLists.push(list);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creating list:', error);
          alert('Failed to create list. Please try again.');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  refreshBoard() {
    if (this.boardId) {
      this.loadBoard();
    }
  }

  trackByListId(index: number, list: ListModel): string {
    return list.id || index.toString();
  }
}
