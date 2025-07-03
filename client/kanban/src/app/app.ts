import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { NotificationComponent } from './components/notification/notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'kanban';
}
