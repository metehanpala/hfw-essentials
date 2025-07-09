import { Injectable, NgZone, Optional } from '@angular/core';
import { ErrorDisplayItem,
  ErrorDisplayMode,
  ErrorDisplayState,
  ErrorNotificationServiceBase,
  TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

import { ErrorDialogComponent } from '../dialogs/error-dialog/error-dialog.component';
import { MinimumSizeDialogComponent } from '../dialogs/minimum-size-dialog/minimum-size-dialog.component';
import { TraceModules } from '../shared/trace/trace-modules';

/**
 * This service provides utility methods for managing errors.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorManagerService {

  public bsModalRef!: BsModalRef | null;
  public sizeErrorModalRef!: BsModalRef | null;
  private currentErrorId!: number | null;
  private errorItems: ErrorDisplayItem[] = [];
  private messageSub!: Subscription;
  private titleSub!: Subscription;
  private minSizeSub!: Subscription;
  private windowResizeBinding: any;

  public constructor(private readonly trace: TraceService,
    private readonly translateService: TranslateService,
    private readonly modalService: BsModalService,
    private readonly ngZone: NgZone,
    @Optional() private readonly errorService: ErrorNotificationServiceBase) {
  }

  public init(): void {
    if (this.errorService != null) {
      this.errorService.errorChanged.subscribe(
        (errorItem: ErrorDisplayItem) => { this.onErrorChanged(errorItem); });
    }
  }

  public activateBrowserSizeDetection(): void {
    this.showHideSizeError(window.innerWidth);

    this.ngZone.runOutsideAngular(() => {
      this.windowResizeBinding = this.onResize.bind(this);
      window.addEventListener('resize', this.windowResizeBinding, { passive: false, capture: true });
    });
  }

  public stopBrowserSizeDetection(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.sizeErrorModalRef != null) {
        if (this.minSizeSub != null) {
          this.minSizeSub.unsubscribe();
        }
        this.sizeErrorModalRef.hide();
        this.sizeErrorModalRef = null;
      }
      window.removeEventListener('resize', this.windowResizeBinding, { capture: true });
    });
  }

  public onResize(event: any): void {
    this.showHideSizeError(event.target.innerWidth);
  }

  public showHideSizeError(actualSize: number): void {
    if (actualSize < 360) {
      if (this.sizeErrorModalRef == null) {
        this.ngZone.run(() => {
          this.minSizeSub = this.modalService.onShow.subscribe(() => {
            // THIS CODE IS TEMPORARY AND NEEDS TO BE REMOVED AFTER FIRST MARKET PACKAGE RELEASE
            // AS LONG WITH THE MINIMUM SIZE DIALOG MANAGEMENT.
            const element: any = document.getElementsByTagName('bs-modal-backdrop')[0];
            element.style.opacity = 1.0;
          });
          this.sizeErrorModalRef = this.modalService.show(MinimumSizeDialogComponent, {
            keyboard: false,
            ignoreBackdropClick: true });

        });
      }
    } else {
      if (this.sizeErrorModalRef != null) {
        this.ngZone.run(() => {
          if (this.minSizeSub != null) {
            this.minSizeSub.unsubscribe();
          }
          this.sizeErrorModalRef!.hide();
          this.sizeErrorModalRef = null;
        });
      }
    }
  }

  private onErrorChanged(item: ErrorDisplayItem): void {
    this.trace.info(TraceModules.errorManager, 'onErrorChanged():\n%s', item.getTrace());
    const index: number = this.errorItems.findIndex((err: ErrorDisplayItem) => err.id === item.id);
    if (index < 0) {
      this.errorItems.push(item);
    }
    switch (item.state) {
      case ErrorDisplayState.Active:
        this.errorItems[index] = item;
        this.activateError(item);
        break;
      case ErrorDisplayState.Deleted:
        this.errorItems.splice(index, 1);
        this.activateError(item);
        break;
      case ErrorDisplayState.Inactive:
        this.errorItems[index] = item;
        this.inactivateError(item);
        break;
      default:
        // code...
        break;
    }
  }

  private activateError(item: ErrorDisplayItem): void {
    this.trace.info(TraceModules.errorManager, 'activateError() called:\n%s', item.getTrace());

    if (item.mode === ErrorDisplayMode.Modal && this.currentErrorId == null) {

      this.trace.info(TraceModules.errorManager, 'activateError(), show modal dialog!');

      this.currentErrorId = item.id;

      this.bsModalRef = this.modalService.show(ErrorDialogComponent, {
        keyboard: false,
        ignoreBackdropClick: true });

      this.titleSub = item.getTitle(this.translateService).subscribe((res: string) => {
        if (this.bsModalRef) {
          this.bsModalRef.content.currentErrorTitle = res;
        }
      });
      this.messageSub = item.getMessage(this.translateService).subscribe((res: string) => {
        this.bsModalRef!.content.currentErrorMessage = res;
      });
    } else {
      this.trace.info(TraceModules.errorManager, 'activateError(), no id match, no action required');
    }
  }

  private inactivateError(item: ErrorDisplayItem): void {
    this.trace.info(TraceModules.errorManager, 'inactivateError() called:\n%s', (item as any).getTrace());

    if (this.currentErrorId === item.id) {
      if (item.mode === ErrorDisplayMode.Modal && this.bsModalRef != null) {
        this.trace.info(TraceModules.errorManager, 'inactivateError(), hide modal dialog!');
        this.bsModalRef.hide();
      } else {
        this.trace.info(TraceModules.errorManager, 'inactivateError(), modal dialog already hidden!');
      }

      if (this.titleSub != null) {
        this.titleSub.unsubscribe();
      }
      if (this.messageSub != null) {
        this.messageSub.unsubscribe();
      }
      this.currentErrorId = null;
      this.bsModalRef = null;
    } else {
      this.trace.info(TraceModules.errorManager, 'inactivateError(), no id match, no action required');
    }
  }

}
