import { Component, Input } from '@angular/core';

@Component({
  selector: 'hfw-error-dialog',
  templateUrl: './error-dialog.component.html',
  standalone: false
})

export class ErrorDialogComponent {

  @Input() public currentErrorMessage!: string;

  @Input() public currentErrorTitle!: string;

  /*
   * Handles initialization after directive's data-bound properties have been initialized
   */

}
