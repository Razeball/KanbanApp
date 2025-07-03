import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { BoardOverview } from './components/board-overview/board-overview';
import { Board } from './components/board/board';
import { Documents } from './components/documents/documents';
import { DocumentEditor } from './components/document-editor/document-editor';
import { ProfileComponent } from './components/profile/profile';
import { protectRoutesGuard } from './services/protectroutes/protect-routes-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { 
    path: 'dashboard', 
    component: Dashboard
  },
  { 
    path: 'boards', 
    component: BoardOverview
  },
  { 
    path: 'board/:id', 
    component: Board
  },
  { 
    path: 'documents', 
    component: Documents
  },
  { 
    path: 'document/:id', 
    component: DocumentEditor
  },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: '/dashboard' }
];
