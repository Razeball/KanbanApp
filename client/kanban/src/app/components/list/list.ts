import { Component, Input } from '@angular/core';
import { Card } from '../card/card';

@Component({
  selector: 'app-list',
  imports: [Card],
  templateUrl: './list.html',
  styleUrl: './list.css'
})
export class List {
  @Input() listTitle: string = 'List';
}
