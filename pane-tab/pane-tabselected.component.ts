import { Component, Input } from '@angular/core';

@Component({
  selector: 'hfw-pane-tab-item',
  template: '',
  standalone: false
})
/**
 * This class represents a tab selector.
 */
export class PaneTabSelectedComponent {
  /*
   * Set the tab's title.
   */
  @Input() public tabTitle!: string;

  /*
   * Set the tab's id.
   */
  @Input() public tabId!: string;

  /*
   * Indicates if the tab is active.
   */
  @Input() public active = false;

  @Input() public customClass!: string;

  @Input() public isEmptyTabItem = false;

  @Input() public hidden = false;
}
