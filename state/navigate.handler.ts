import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { ITrace } from '@gms-flex/services-common';
import { Observable, Observer } from 'rxjs';

import { TraceModules } from '../shared/trace/trace-modules';
import { AppStatus } from './app-status.model';

/**
 * Handles the invocation of router navigate method.
 *
 * @export
 * @class NavigateHandler
 */
export class NavigateHandler {

  /**
   * Creates an instance of NavigateHandler.
   *
   * @param {string} id, Any id the identify the handler; used for tracing.
   * @param {UrlTree} urlTree
   * @param {AppStatus} appStatus
   * @param {Router} router
   * @param {TraceService} trace, the trace service
   *
   * @memberOf NavigateHandler
   */
  public constructor(
    private readonly id: string, // operation id
    private readonly urlTree: UrlTree,
    private readonly appStatus: AppStatus,
    private readonly router: Router,
    private readonly trace: ITrace) {
  }

  /**
   * Returns an observable. Subscribing to it invokes the 'Navigate' call.
   *
   * @returns {Observable<boolean>}
   *
   * @memberOf NavigatenHandler
   */
  public navigate(skipLocationChange = false): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      this.onSubscription(observer, skipLocationChange);
      return (): any => this.teardownLogic();
    });
  }

  private onSubscription(observer: Observer<boolean>, skipLocationChange = false): void {
    // this method is called when the client subscribes to the observable returned by method 'navigate()'
    this.trace.info(TraceModules.navigate, 'navigate() %s \n appStatus: %s \n url: %s', this.id, this.appStatus, this.urlTree.toString());

    const navigationExtras: NavigationExtras = skipLocationChange != null ? { skipLocationChange } : {};

    this.router.navigateByUrl(this.urlTree, navigationExtras)
      .then((result: boolean) => {
        this.trace.debug(TraceModules.navigate, 'navigate() %s completed. \nresult: %s', this.id, result);
        this.pushToClientAndDispose(observer, result);
      });
  }

  private pushToClientAndDispose(observer: Observer<boolean>, result: boolean): void {
    observer.next(result);
    observer.complete();
  }

  private teardownLogic(): void {
    this.trace.info(TraceModules.navigate, 'teardownLogic() called for handlerId=%s, disposing all calls, deleting state...', this.id);
    this.dispose();
  }

  private dispose(): void {
    //
  }
}
