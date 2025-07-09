import { TraceService } from '@gms-flex/services-common';
import { concat, Observable, Observer, Subscription } from 'rxjs';

import { SnapInBase } from '../../common/snapin-base';
import { UnsavedDataReason } from '../../common/unsaved-data';
import { TraceModules } from '../shared/trace/trace-modules';

/**
 * Handles the invocation of the 'unsavedData' call for the corresponding snapins and returned the results to the client.
 *
 * @export
 * @class UnsavedDataHandler
 */
export class UnsavedDataHandler {

  private currentEvaluatedIndex!: number;

  private sub!: Subscription;

  /**
   * Creates an instance of UnsavedDataHandler.
   *
   * @param {string} id, Any id the identify the handler; used for tracing.
   * @param {string} reason, the reason
   * @param {number} timeout, a timeout in millisecond.
   * After this time the handler, returns all received results of the snapins, no matter if all snapins replied.
   * @param {TraceService} trace, the trace service
   *
   * @memberOf UnsavedDataHandler
   */
  public constructor(
    private readonly id: string, // operation id
    private readonly reason: UnsavedDataReason,
    private readonly sniPerId: { id: string; instance: SnapInBase }[],
    private readonly trace: TraceService) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the 'UnsavedData' call for the corresponding snapins.
   *
   * @returns {Observable<boolean>}
   *
   * @memberOf UnsavedDatanHandler
   */
  public chekUnsavedDataForAllSnapins(): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      this.onSubscription(observer);
      return (): any => this.teardownLogic();
    });
  }

  private onSubscription(observer: Observer<boolean>): void {
    // this method is called when the client subscribes to the observable returned by method 'chekUnsavedDataForAllSnapins()'
    this.trace.info(TraceModules.unsavedData, 'subscribe() called: unsavedData issued for handlerId=%s', this.id);
    if (this.trace.isDebugEnabled(TraceModules.unsavedData) === true) {
      let snapIds = '';
      this.sniPerId.forEach(sni => {
        snapIds += sni.id + '\n';
      });
      this.trace.debug(TraceModules.unsavedData, 'subscribe(): unsavedData evaluation to be done for snapins:\n%s', snapIds);
    }

    const observables: Observable<boolean>[] = [];
    this.sniPerId.forEach((sni: { id: string; instance: SnapInBase }) => {
      observables.push(sni.instance.onUnsavedDataCheck(this.reason));
    });

    this.currentEvaluatedIndex = 0;
    this.sub = concat(...observables)
      .subscribe((res: boolean) => {
        this.onUnsavedDataCheckResult(res, observer);
        this.currentEvaluatedIndex++;
      });
  }

  private onUnsavedDataCheckResult(result: boolean, observer: Observer<boolean>): void {
    this.trace.info(TraceModules.unsavedData, 'onUnsavedDataCheckResult() called for:\nhandlerId=%s, snapin=%s, result=%s',
      this.id, this.sniPerId[this.currentEvaluatedIndex].id, result);

    if (result === false) {
      this.trace.info(TraceModules.unsavedData,
        'onUnsavedDataCheckResult(): %s snapin replies: false. The %s operation will be aborted.', this.sniPerId[this.currentEvaluatedIndex].id, this.id);
      this.pushToClientAndDispose(observer, false);
    } else {
      if (this.checkDone() === true) {
        this.trace.info(TraceModules.unsavedData,
          'onUnsavedDataCheckResult(): all calls returned for handlerId=%s, pushing received replies to client, disposing all calls, deleting state...',
          this.id);
        this.pushToClientAndDispose(observer, true);
      }
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

  private checkDone(): boolean {
    return (this.currentEvaluatedIndex === this.sniPerId.length - 1) ? true : false;
  }
}
