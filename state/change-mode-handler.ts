import { Router, UrlTree } from '@angular/router';
import { isNullOrUndefined, ITrace, ModeData, ModeService } from '@gms-flex/services-common';
import { Observable, Observer, Subscription } from 'rxjs';

import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { IStateService } from '../../common/interfaces/istate.service';
import { MessageParameters } from '../../common/interfaces/message-parameters.model';
import { FrameStore } from '../shared/stores/frame.store';
import { TraceModules } from '../shared/trace/trace-modules';
import { SnapinMessageBroker } from '../snapinmessagebroker/snapinmessagebroker.service';
import { AppStatus } from './app-status.model';
import { NavigateHandler } from './navigate.handler';
import { RoutingHelperService } from './routing-helper.service';

/**
 *
 * @export
 * @class ChangeModeHandler
 */
export class ChangeModeHandler {

  private readonly sub!: Subscription;

  /**
   * Creates an instance of ChangeModeHandler.
   *
   * @param {string} id, Any id the identify the handler; used for tracing.
   * After this time the handler, returns all received results of the snapins, no matter if all snapins replied.
   * @param {TraceService} trace, the trace service
   *
   * @memberOf ChangeModeHandler
   */
  public constructor(
    private readonly id: string, // operation id
    private readonly mode: ModeData,
    private readonly firstSelectionObj: MessageParameters,
    private readonly openingFrameId: string,
    private readonly msgBroker: SnapinMessageBroker,
    private readonly stateService: IStateService,
    private readonly routingHelper: RoutingHelperService,
    private readonly router: Router,
    private readonly modeService: ModeService,
    private readonly trace: ITrace) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the send Preselect and the change of mode.
   *
   * @returns {Observable<boolean>}
   *
   * @memberOf ChangeModeHandler
   */
  public sendSelectionAndChangeMode(): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      this.onSubscription(observer);
      return (): any => this.teardownLogic();
    });
  }

  private onSubscription(observer: Observer<boolean>): void {
    // this method is called when the client subscribes to the observable returned by method 'sendSelectionAndChangeMode()'
    this.trace.info(TraceModules.changeMode, 'subscribe() called: sendSelectionAndChangeMode issued for handlerId=%s', this.id);

    const frame: FrameStore = this.stateService.currentState.getFrameStoreViaId(this.openingFrameId);
    if (this.firstSelectionObj != null && frame != null) {
      // get message channel
      const qParamServiceId = this.setQParamServiceId(frame);
      const primaryChannelId = this.setPrimaryChannelId(frame);

      if (qParamServiceId != null && primaryChannelId != null) {
        const masterId: FullQParamId = new FullQParamId(frame.id,
          qParamServiceId, primaryChannelId);

        this.msgBroker.sendMessageFromQParamService(masterId, this.firstSelectionObj.types,
          this.firstSelectionObj.messageBody,
          true, this.firstSelectionObj.qParam, false, null, false, true).subscribe((res: boolean) => {
          if (res === true) {
            this.navigateToMode(frame, observer);
          } else {
            this.pushToClientAndDispose(observer, false);
          }
        });
      } else {
        this.pushToClientAndDispose(observer, false);
      }
    } else {
      if (frame) {
        this.navigateToMode(frame, observer);
      }
    }

  }

  private setQParamServiceId(frame: FrameStore): any {
    if (!isNullOrUndefined(frame.frameConfig.qParamServices) &&
        frame.frameConfig.qParamServices.length > 0) {
      return frame.frameConfig.qParamServices[0].id;
    }
  }

  private setPrimaryChannelId(frame: FrameStore): any {
    if (!isNullOrUndefined(frame.frameConfig.qParamServices) &&
        frame.frameConfig.qParamServices.length > 0) {
      return frame.frameConfig.qParamServices[0].primaryChannelId;
    }
  }

  private navigateToMode(frame: FrameStore, observer: Observer<boolean>): void {
    if (frame.selectedViewIdValue) {
      this.trace.debug(TraceModules.changeMode, 'setting processingMessage from onSubscription.');
      this.stateService.appStatus = AppStatus.ProcessingMessage;
      const mainUrlTree: UrlTree = this.routingHelper.getUrlOfCurrentStateAndSpecificLayout(this.stateService.currentState,
        frame.frameConfig, frame.selectedViewIdValue, frame.selectedLayoutIdValue, this.mode);
      const navigateHandler: NavigateHandler = new NavigateHandler('changeMode', mainUrlTree, this.stateService.appStatus, this.router, this.trace);
      navigateHandler.navigate().subscribe((navigateRes: boolean) => {
        if (navigateRes === true) {
          // update mode
          this.stateService.currentState.changeSelectedMode(this.mode);
          this.modeService.setMode(this.mode);
          this.stateService.updatePaneDisplayability(frame);
        }
        this.trace.debug(TraceModules.state, 'NAVIGATE: changeMode completed.');
        this.trace.debug(TraceModules.state, 'setting running from changeMode.');
        this.stateService.appStatus = AppStatus.Running;
        this.pushToClientAndDispose(observer, true);
      });
    }
  }

  private pushToClientAndDispose(observer: Observer<boolean>, result: boolean): void {
    observer.next(result);
    observer.complete();
  }

  private teardownLogic(): void {
    this.trace.info(TraceModules.unsavedData, 'teardownLogic() called for handlerId=%s, disposing all calls, deleting state...', this.id);
    this.dispose();
  }

  private dispose(): void {
    if (this.sub != null) {
      this.sub.unsubscribe();
    }
  }

}
