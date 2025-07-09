import { Component, Input } from '@angular/core';

@Component({
  selector: 'hfw-minimum-size-dialog',
  templateUrl: './minimum-size-dialog.component.html',
  standalone: false
})

export class MinimumSizeDialogComponent {

  @Input() public currentErrorMessage!: string;

  @Input() public currentErrorTitle!: string;

  /*
   * Handles initialization after directive's data-bound properties have been initialized.
   */

}
