import { Component, EventEmitter, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { UnsavedDataDialogResult } from './unsaved-dialog.model';

@Component({
  selector: 'hfw-unsaved-dialog',
  templateUrl: './unsaved-dialog.component.html',
  styleUrl: './unsaved-dialog.component.scss',
  standalone: false
})
export class UnsavedDialogComponent {
  public title!: string;
  public loading!: boolean;
  public header = '';
  public body = '';
  public yes = '';
  public no = '';

  @Output() public readonly action: EventEmitter<any> = new EventEmitter<any>();

  constructor(public bsModalRef: BsModalRef) {
  }
  public onYes(): void {
    this.action.emit(UnsavedDataDialogResult.Yes);
    this.loading = true;
  }

  public onCancel(): void {
    this.action.emit(UnsavedDataDialogResult.Cancel);
    this.bsModalRef.hide();
  }

  public onNo(): void {
    this.action.emit(UnsavedDataDialogResult.No);
    this.bsModalRef.hide();
  }

}
