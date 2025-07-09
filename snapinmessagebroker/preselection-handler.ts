import { TraceService } from '@gms-flex/services-common';
import { Observable, Observer, of, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

import { FullSnapInId } from '../../common/fullsnapinid/fullsnapinid.model';
import { SnapInStore } from '../shared/stores/snapin.store';
import { TraceModules } from '../shared/trace/trace-modules';

interface PreselectionStore {
  sniRepliesPerId: Map<string, SnapInStore>;
  preselectedSniPerId: Map<string, SnapInStore>;
  subscriptions: Subscription[];
}

/**
 * Handles the invocation of the 'preselection' call for the corresponding snapins and returned the results to the client.
 *
 * @export
 * @class PreselectionHandler
 */
export class PreselectionHandler {

  /**
   * Creates an instance of PreselectionHandler.
   *
   * @param {string} id, Any id the identify the handler; used for tracing.
   * @param {SnapInStore[]} snis, the snapins the call 'preselect' for.
   * @param {string} messageType, the messageType
   * @param {string} message, the message
   * @param {number} timeout, a timeout in millisecond.
   * After this time the handler, returns all received results of the snapins, no matter if all snapins replied.
   * @param {TraceService} trace, the trace service
   *
   * @memberOf PreselectionHandler
   */
  public constructor(
    private readonly id: string,
    private readonly sniPerId: Map<string, SnapInStore>,
    private readonly messageTypes: string[],
    private readonly message: any,
    private readonly timeout: number,
    private readonly trace: TraceService) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the 'preselection' call for the corresponding snapins.
   *
   * @returns {Observable<SnapInStore[]>}
   *
   * @memberOf PreselectionHandler
   */
  public preselectAllSnapins(): Observable<SnapInStore[]> {
    const preselectionStore: PreselectionStore = {
      sniRepliesPerId: new Map<string, SnapInStore>(),
      preselectedSniPerId: new Map<string, SnapInStore>(),
      subscriptions: []
    };

    return new Observable((observer: Observer<SnapInStore[]>) => {
      this.onSubscription(observer, preselectionStore);
      return (): any => this.teardownLogic(preselectionStore);
    });
  }

  private onSubscription(observer: Observer<SnapInStore[]>, preselectionStore: PreselectionStore): void {
    // this method is called when the client subscribes to the observable returned by method 'preselectAllSnapins()'

    this.trace.info(TraceModules.preselection, 'subscribe() called: preselection issued for handlerId=%s', this.id);
    if (this.trace.isDebugEnabled(TraceModules.preselection) === true) {
      let snapIds = '';
      this.sniPerId.forEach((_sni, key) => {
        snapIds = `${snapIds}\n${key}`;
      });
      this.trace.debug(TraceModules.preselection, 'subscribe(): preselection evaluation to be done for snapins:%s', snapIds);
    }

    preselectionStore.subscriptions.push(of(true).pipe(delay(this.timeout)).subscribe(() => this.onTimeout(observer, preselectionStore)));

    this.sniPerId.forEach(sni => {
      if (sni.preselectionService != null) {
        preselectionStore.subscriptions.push(sni.preselectionService.receivePreSelection(this.messageTypes, this.message, sni.fullSnapInId)?.subscribe(
          (result => this.onPreselectionResult(sni.fullSnapInId, result, observer, preselectionStore))
        ));
      } else {
        this.onPreselectionResult(sni.fullSnapInId, true, observer, preselectionStore);
      }
    });
  }

  private onPreselectionResult(sniId: FullSnapInId, result: boolean, observer: Observer<SnapInStore[]>, preselectionStore: PreselectionStore): void {
    const fullSniId: string = sniId.fullId();
    this.trace.info(TraceModules.preselection, 'onPreselectionResult() called for:\nhandlerId=%s, snapin=%s, result=%s', this.id, fullSniId, result);
    if (this.sniPerId?.get(fullSniId) != undefined) {
      if (result === true) {
        preselectionStore.preselectedSniPerId.set(fullSniId, this.sniPerId.get(fullSniId)!);
      }

      preselectionStore.sniRepliesPerId.set(fullSniId, this.sniPerId.get(fullSniId)!);
    }
    if (this.checkDone(preselectionStore.sniRepliesPerId) === true) {
      this.trace.info(TraceModules.preselection,
        'onPreselectionResult(): all calls returned for handlerId=%s, pushing received replies to client, disposing all calls, deleting state...', this.id);
      this.pushToClientAndDispose(observer, preselectionStore);
    }
  }

  private onTimeout(observer: Observer<SnapInStore[]>, preselectionStore: PreselectionStore): void {
    // the available results are pushed to the client, the call is intentionally marked as completed (and not as an error)
    this.trace.error(TraceModules.preselection,
      'onTimeout() called for handlerId=%s, pushing received replies to client, disposing all calls, deleting state...', this.id);
    this.pushToClientAndDispose(observer, preselectionStore);
  }

  private pushToClientAndDispose(observer: Observer<SnapInStore[]>, preselectionStore: PreselectionStore): void {
    const preselectedSnis: SnapInStore[] = [];
    preselectionStore.preselectedSniPerId.forEach(sni => {
      preselectedSnis.push(sni);
    });

    observer.next(preselectedSnis);
    observer.complete();
  }

  private teardownLogic(preselectionStore: PreselectionStore): void {
    this.trace.info(TraceModules.preselection, 'teardownLogic() called for handlerId=%s, disposing all calls, deleting state...', this.id);
    this.dispose(preselectionStore);
  }

  private dispose(preselectionStore: PreselectionStore): void {
    preselectionStore.preselectedSniPerId.clear();
    preselectionStore.sniRepliesPerId.clear();
    preselectionStore.subscriptions.forEach(sub => {
      if (sub !== undefined) {
        sub.unsubscribe();
      }
    });
    preselectionStore.subscriptions = [];
  }

  private checkDone(repliedSniPerId: Map<string, SnapInStore>): boolean {
    return (repliedSniPerId.size === this.sniPerId.size) ? true : false;
  }
}
