import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { BoardOverview } from './components/board-overview/board-overview';
import { Board } from './components/board/board';
import { Documents } from './components/documents/documents';
import { DocumentEditor } from './components/document-editor/document-editor';
import { protectRoutesGuard } from './services/protectroutes/protect-routes-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [protectRoutesGuard] 
  },
  { 
    path: 'boards', 
    component: BoardOverview, 
    canActivate: [protectRoutesGuard] 
  },
  { 
    path: 'board/:id', 
    component: Board, 
    canActivate: [protectRoutesGuard] 
  },
  { 
    path: 'documents', 
    component: Documents, 
    canActivate: [protectRoutesGuard] 
  },
  { 
    path: 'document/:id', 
    component: DocumentEditor, 
    canActivate: [protectRoutesGuard] 
  },
  { path: '**', redirectTo: '/dashboard' }
];
