import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

/**
 * This component provides two buttons to navigate in two 'directions (left /right, previous, next).
 * Use a flex container for its parent.
 */
@Component({
  selector: 'hfw-panel-navigation',
  templateUrl: './panel-navigation.component.html',
  styleUrl: './panel-navigation.component.scss',
  standalone: false
})
export class PanelNavigationComponent {

  @HostBinding('class.hfw-flex-container-column')
  public flexContainer = true;

  @HostBinding('class.hfw-flex-item-grow')
  public flexItem = true;

  @Input()
  public disableAnimation = false;

  @Input()
  public hideBtns = false;

  @Output()
  public readonly leftBtnClicked: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  @Output()
  public readonly rightBtnClicked: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  public onClickBtnLeft(event: MouseEvent): void {
    this.leftBtnClicked.emit(event);
  }

  public onClickBtnRight(event: MouseEvent): void {
    this.rightBtnClicked.emit(event);
  }
}
