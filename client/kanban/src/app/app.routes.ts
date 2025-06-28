import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { protectRoutesGuard } from './services/protectroutes/protect-routes-guard';
import { Board } from './components/board/board';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [protectRoutesGuard] },
  { path: 'board', component: Board, canActivate: [protectRoutesGuard] },
];
