import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

import { ClickListEventArgs, ListItem } from './data.model';

@Component({
  selector: 'hfw-list-box-item',
  templateUrl: './list-box-item.component.html',
  standalone: false
})
export class ListBoxItemComponent {
  protected value = new FormControl<boolean>(false);
  private static idCounter = 0;
  protected id = `__list-box-item-${ListBoxItemComponent.idCounter++}`;

  @Input() public listItem!: ListItem;
  @Input() public enableCheckbox = true;
  @Input() public enableOptionbox = true;
  @Output() public readonly itemClicked: EventEmitter<ClickListEventArgs> = new EventEmitter<ClickListEventArgs>();

  public onItemClicked(): void {
    this.itemClicked.next(new ClickListEventArgs(this.listItem, null));
  }
}
