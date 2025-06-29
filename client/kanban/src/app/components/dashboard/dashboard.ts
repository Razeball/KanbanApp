import { Component } from '@angular/core';
import { BoardOverview } from '../board-overview/board-overview';

@Component({
  selector: 'app-dashboard',
  imports: [BoardOverview],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

}
