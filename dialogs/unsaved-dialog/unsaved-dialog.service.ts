import { Injectable, NgZone } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Observable, Observer } from 'rxjs';

import { TraceModules } from '../../shared/trace-modules';
import { UnsavedDialogComponent } from './unsaved-dialog.component';
import { Config, UnsavedDataDialogResult } from './unsaved-dialog.model';
@Injectable({
  providedIn: 'root'
})
export class UnsaveDialogService {

  private bsModalRef!: BsModalRef;

  private readonly config: Config = {
    backdrop: true,
    ignoreBackdropClick: true,
    keyboard: true
  };

  constructor(private readonly modalService: BsModalService,
    private readonly traceService: TraceService,
    private readonly ngZone: NgZone) {
  }

  public showDialog(snapInName: string, customStrings?: object): Observable<UnsavedDataDialogResult> {
    this.traceService.info(TraceModules.unsavedData, 'UnsaveDialogService showDialog called.');
    return new Observable((observer: Observer<UnsavedDataDialogResult>) => {
      this.ngZone.run(() => {
        this.onSubscription(observer, snapInName, customStrings);
      });
    });
  }

  public closeDialog(): void {
    this.ngZone.run(() => {
      if (this.bsModalRef) {
        this.bsModalRef.hide();
      }
    });
  }

  private onSubscription(observer: Observer<UnsavedDataDialogResult>, snapInName: string, customStrings?: any): void {
    this.ngZone.run(() => {
      if (customStrings) {
        this.traceService.info(TraceModules.unsavedData, 'UnsaveDialogService showDialog error %s. Replying UnsavedDataDialogResult.no.');
      }
      this.bsModalRef = this.modalService.show(UnsavedDialogComponent, this.config);
      if (this.bsModalRef) {
        if (customStrings) {
          this.bsModalRef.content.header = customStrings.header;
          this.bsModalRef.content.body = customStrings.body;
          this.bsModalRef.content.yes = customStrings.yes;
          this.bsModalRef.content.no = customStrings.no;
        }
        this.bsModalRef.content.title = snapInName;
        this.bsModalRef.content.action.subscribe((result: UnsavedDataDialogResult) => {
          this.traceService.info(TraceModules.unsavedData, 'UnsaveDialogService showDialog replying %s.', result);
          observer.next(result);
          observer.complete();
        }, (error: Error) => {
          this.traceService.info(TraceModules.unsavedData, 'UnsaveDialogService showDialog error %s. Replying UnsavedDataDialogResult.no.', error);
          observer.next(UnsavedDataDialogResult.No);
          observer.complete();
        });
      }
    });
  }
}
