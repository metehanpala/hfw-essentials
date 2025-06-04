import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { interval, Subscription } from 'rxjs';

import { TimeoutDialogResult } from './timeout-dialog.model';

export const DIALOG_TIMEOUT = 60;
@Component({
  selector: 'hfw-timeout-dialog',
  templateUrl: './timeout-dialog.component.html',
  styleUrl: './timeout-dialog.component.scss',
  standalone: false
})

export class TimeoutDialogComponent implements OnInit {

  public timeLeft: number = DIALOG_TIMEOUT;
  @Output() public readonly action: EventEmitter<any> = new EventEmitter<any>();

  private readonly interval: any;
  private sub!: Subscription;

  constructor(public bsModalRef: BsModalRef) {}

  public onYes(): void {
    this.sub.unsubscribe();
    this.action.emit(TimeoutDialogResult.Yes);
    this.refreshTimeOut();
    this.bsModalRef.hide();
  }

  public onNo(): void {
    this.sub.unsubscribe();
    this.action.emit(TimeoutDialogResult.No);
    this.bsModalRef.hide();
  }

  public ngOnInit(): void {
    this.startTimer();
  }

  private startTimer(): void {
    const source = interval(1000);
    this.sub = source.subscribe((_value: any) => this.checkTimerExired());
  }

  private checkTimerExired(): void {
    if (this.timeLeft > 0) {
      this.timeLeft--;
    } else {
      this.sub.unsubscribe();
      this.action.emit(TimeoutDialogResult.Nothing);
      this.bsModalRef.hide();
    }
  }

  private refreshTimeOut(): void {
    this.timeLeft = DIALOG_TIMEOUT;
    clearTimeout(this.interval);
  }

}
