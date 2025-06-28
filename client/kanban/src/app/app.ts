import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Login } from './components/login/login';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Login],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'kanban';
}
