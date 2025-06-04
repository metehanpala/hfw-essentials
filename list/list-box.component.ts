import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

import { ClickListEventArgs, ListItem } from './data.model';

@Component({
  selector: 'hfw-list-box',
  templateUrl: './list-box.component.html',
  standalone: false
})
export class ListBoxComponent {

  @Input() public enableCheckbox = true;
  @Input() public enableOptionbox = false;
  @Input() public listItems: ListItem[] = [];
  @Output() public readonly itemChecked: EventEmitter<ListItem> = new EventEmitter<ListItem>();
  @HostBinding('class.list') public guardList = true;
  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.page-scroll') public guardScroll = true;
  public readonly trackByIndex = (index: number): number => index;

  public onItemClicked(event: ClickListEventArgs): void {
    this.selectAllItems(false);
    event.target.selected = true;
    this.toggleChecked(event.target);
    this.itemChecked.next(event.target);
  }

  private selectAllItems(select: boolean): void {
    this.listItems.forEach(item => item.selected = select);
  }

  private setAllItems(value: boolean): void {
    this.listItems.forEach(item => item.checked = value);
  }

  private toggleChecked(item: ListItem): void {
    if (this.enableCheckbox == true) {
      if (item.checked == true) {
        item.checked = false;
      } else {
        item.checked = true;
      }
    } else if ((this.enableOptionbox == true) && (item.checked == false)) {
      this.setAllItems(false);
      item.checked = true;
    }
  }
}
