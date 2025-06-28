import { Component } from '@angular/core';
import { Board } from '../board/board';

@Component({
  selector: 'app-dashboard',
  imports: [Board],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

}
