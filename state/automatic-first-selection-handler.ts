import { ITrace } from '@gms-flex/services-common';
import { Observable, Observer, Subscription } from 'rxjs';

import { FullQParamId } from '../../common/fullsnapinid/full-qparam-id.model';
import { MessageParameters } from '../../common/interfaces/message-parameters.model';
import { QParamStore } from '../shared/stores/qparam-store';
import { TraceModules } from '../shared/trace/trace-modules';
import { SnapinMessageBroker } from '../snapinmessagebroker/snapinmessagebroker.service';

/**
 *
 * @export
 * @class AutomaticFirstSelectionHandler
 */
export class AutomaticFirstSelectionHandler {

  private readonly sub!: Subscription;

  /**
   * Creates an instance of AutomaticFirstSelectionHandler.
   *
   * @param {string} id, Any id the identify the handler; used for tracing.
   * @param {TraceService} trace, the trace service
   *
   * @memberOf AutomaticFirstSelectionHandler
   */
  public constructor(
    private readonly id: string, // operation id
    private readonly qParamStore: QParamStore | null,
    private readonly msgBroker: SnapinMessageBroker,
    private readonly trace: ITrace) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the sending of the first automatic selection.
   *
   * @returns {Observable<boolean>}
   *
   * @memberOf AutomaticFirstSelectionHandler
   */
  public sendAutomaticFirstSelection(): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      this.onSubscription(observer);
      return (): any => this.teardownLogic();
    });
  }

  /**
   * Returns an observable. Subscribing to it invokes the sending of the first automatic selection using the specified parameter.
   *
   * @returns {Observable<boolean>}
   *
   * @memberOf AutomaticFirstSelectionHandler
   */
  public sendDeeplinkAutomaticFirstSelection(param: string, paramValue: string): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      this.onDeeplinkSubscription(param, paramValue, observer);
      return (): any => this.teardownLogic();
    });
  }

  private onSubscription(observer: Observer<boolean>): void {
    // this method is called when the client subscribes to the observable returned by method 'sendAutomaticFirstSelection()'
    this.trace.debug(TraceModules.state, 'subscribe() called: sendAutomaticFirstSelection issued for handlerId=%s', this.id);

    if (this.qParamStore?.qParamService != null) {
      this.qParamStore.qParamService.getFirstAutomaticSelection(this.qParamStore.frameId).subscribe((msg: MessageParameters) => {
        if (msg != null) {
          this.trace.debug(TraceModules.state, 'sending message for first automatic selection .handlerId=%s', this.id);
          const fullId: FullQParamId | null = FullQParamId.createFrom(msg.qParam.name);
          this.msgBroker.sendMessageFromQParamService(fullId, msg.types, msg.messageBody, true, msg.qParam,
            false, null, false, true).subscribe((res: boolean) => {
            this.trace.debug(TraceModules.state, 'sendMessage() completed. result=%s .handlerId=%s', res, this.id);
            this.pushToClientAndDispose(observer, true);
          });
        } else {
          this.trace.debug(TraceModules.state, 'getFirstAutomaticSelection() returns null .handlerId=%s', this.id);
          this.pushToClientAndDispose(observer, true);
        }
      });
    } else {
      this.trace.debug(TraceModules.state, 'qParam service not configured .handlerId=%s', this.id);
      this.pushToClientAndDispose(observer, true);
    }
  }

  private onDeeplinkSubscription(param: string, paramValue: string, observer: Observer<boolean>): void {
    // this method is called when the client subscribes to the observable returned by method 'sendDeeplinkAutomaticFirstSelection()'
    this.trace.debug(TraceModules.state, 'subscribe() called: sendDeeplinkAutomaticFirstSelection issued for handlerId=%s', this.id);
    if (this.qParamStore?.qParamService != null) {
      this.qParamStore.qParamService.getMessageParameters(param, paramValue).subscribe((msg: MessageParameters) => {
        if (msg != null) {
          this.trace.debug(TraceModules.state, 'sending message for deeplink first automatic selection .handlerId=%s', this.id);
          // = new FullQParamId(this.qParamStore.frameId, this.qParamStore.config.id, msg.qParam.name);
          const fullId: FullQParamId | null = FullQParamId.createFrom(msg!.qParam!.name!);
          this.msgBroker.sendMessageFromQParamService(fullId, msg.types, msg.messageBody, true, msg.qParam,
            false, null, false, true).subscribe((res: boolean) => {
            this.trace.debug(TraceModules.state, 'sendMessage() completed. result=%s .handlerId=%s', res, this.id);
            this.pushToClientAndDispose(observer, true);
          });
        } else {
          this.trace.debug(TraceModules.state, 'getMessageParameters() returns null .handlerId=%s', this.id);
          this.pushToClientAndDispose(observer, true);
        }
      });
    } else {
      this.trace.debug(TraceModules.state, 'qParam service not configured .handlerId=%s', this.id);
      this.pushToClientAndDispose(observer, true);
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
